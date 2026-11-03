import { v } from "convex/values";
import { internalAction, internalMutation, internalQuery, mutation, query, type MutationCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import { DEV_SITE } from "./lib/callAdmission";
import { callMeasurements, callReview } from "./lib/callMetricValidators";
import { matchesScenarioIntent, measureCall, outcome, reviewFromOutputs, SCENARIOS, type ArtifactMessage } from "../src/lib/callMetrics";

const UUID = /^[0-9a-f]{8}-[0-9a-f-]{27}$/i;
/** Fetching an existing artifact does not launch inference, a new call or a backfill. */
export async function queueAnalytics(ctx: MutationCtx, callId: string) {
  if (process.env.CONVEX_SITE_URL !== DEV_SITE || !UUID.test(callId)) return;
  const row = await ctx.db.query("calls").withIndex("by_callId", q => q.eq("callId", callId)).unique();
  if (!row || row.analyticsQueuedAt) return;
  await ctx.db.patch(row._id, { analyticsQueuedAt: Date.now(), analyticsState: "pending" });
  await ctx.scheduler.runAfter(10_000, internal.callAnalytics.capture, { callId, attempt: 0 });
}

export const context = internalQuery({
  args: { callId: v.string() }, returns: v.union(v.null(), v.object({ status: v.string(), hasReview: v.boolean() })),
  handler: async (ctx, { callId }) => {
    const row = await ctx.db.query("calls").withIndex("by_callId", q => q.eq("callId", callId)).unique();
    return row ? { status: row.status, hasReview: !!row.review } : null;
  },
});

export const save = internalMutation({
  args: { callId: v.string(), measurements: v.optional(callMeasurements), review: v.optional(callReview), reviewSource: v.optional(v.union(v.literal("native-post-call"), v.literal("reviewed-preview"))), final: v.boolean(), error: v.optional(v.string()) }, returns: v.null(),
  handler: async (ctx, a) => {
    const row = await ctx.db.query("calls").withIndex("by_callId", q => q.eq("callId", a.callId)).unique();
    if (!row) return null;
    // Tool logs independently verify escalations. Duplicate webhook events count once.
    const events = await ctx.db.query("callEvents").withIndex("by_call", q => q.eq("callId", a.callId)).take(2001);
    const ends = [...new Map(events.filter(e => e.kind === "tool-end").map(e => [e.toolCallId ?? e._id, e])).values()];
    const durations = ends.flatMap(e => typeof e.durationMs === "number" && e.durationMs >= 0 ? [e.durationMs] : []);
    let review = a.review ?? row.review;
    if (review) {
      let verified: "handoff" | "callback" | undefined;
      for (const event of ends) {
        if (event.status !== "succeeded" || !event.output) continue;
        try {
          const output = JSON.parse(event.output);
          if (output.ok === true && event.tool === "initiate_handoff") verified = "handoff";
          if (output.ok === true && output.bookingId && event.tool === "reserve_callback") verified = "callback";
        } catch { /* Truncated results cannot verify success. */ }
      }
      review = { ...review, ...(verified ? { escalation: verified } : ["handoff", "callback"].includes(review.escalation) ? { escalation: "requested" as const } : {}) };
    }
    const measurements = a.measurements ?? row.measurements;
    await ctx.db.patch(row._id, {
      ...(a.measurements ? { measurements: a.measurements } : {}), ...(review ? { review } : {}),
      ...(review ? { reviewSource: a.reviewSource ?? (a.review ? "native-post-call" as const : row.reviewSource ?? "native-post-call" as const) } : {}),
      analyticsState: measurements && review ? "complete" : a.final ? measurements || review ? "partial" : "error" : "pending",
      analyticsUpdatedAt: Date.now(), analyticsError: a.error,
      ...(events.length <= 2000 ? { toolFailureCount: ends.filter(e => e.status === "failed").length, toolLatencySamples: durations.length,
        toolLatencyAverageMs: durations.length ? durations.reduce((x, y) => x + y, 0) / durations.length : undefined }
        : { toolFailureCount: undefined, toolLatencySamples: undefined, toolLatencyAverageMs: undefined }),
    });
    return null;
  },
});

export const capture = internalAction({
  args: { callId: v.string(), attempt: v.number() }, returns: v.null(),
  handler: async (ctx, { callId, attempt }) => {
    if (process.env.CONVEX_SITE_URL !== DEV_SITE || !UUID.test(callId)) return null;
    const context = await ctx.runQuery(internal.callAnalytics.context, { callId });
    if (!context || context.status !== "ended") return null;
    let complete = false;
    try {
      const key = process.env.VAPI_PRIVATE_KEY, assistantId = process.env.DEV_VAPI_ASSISTANT_ID;
      if (!key || !assistantId) throw Error("Development analytics credentials unavailable");
      const r = await fetch(`https://api.vapi.ai/call/${callId}`, { headers: { Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(15_000) });
      if (!r.ok) throw Error(`Artifact fetch HTTP ${r.status}`);
      // Never log or persist the full record: assistant snapshots can contain webhook credentials.
      const call = await r.json() as { assistantId?: string; status?: string; startedAt?: string; endedAt?: string; cost?: number; usageComplete?: boolean; artifact?: { messages?: ArtifactMessage[]; structuredOutputs?: unknown } };
      if (call.assistantId !== assistantId) throw Error("Call does not belong to the development assistant");
      if (call.status !== "ended") throw Error("Call artifact is not final yet");
      const measurements = call.artifact?.messages?.length ? measureCall(call) : undefined;
      const review = reviewFromOutputs(call.artifact?.structuredOutputs) ?? undefined;
      complete = !!measurements && (!!review || context.hasReview);
      await ctx.runMutation(internal.callAnalytics.save, { callId, ...(measurements ? { measurements } : {}), ...(review ? { review } : {}), final: attempt >= 4,
        ...(!complete && attempt >= 4 ? { error: "Post-call review or timed messages unavailable from Vapi" } : {}) });
    } catch (error) {
      // Only our bounded messages are exposed. Fetch/vendor bodies are never returned.
      const safe = error instanceof Error && /^(Artifact fetch HTTP|Development analytics|Call (does|artifact))/.test(error.message) ? error.message : "Artifact fetch unavailable";
      await ctx.runMutation(internal.callAnalytics.save, { callId, final: attempt >= 4, error: safe });
    }
    if (!complete && attempt < 4) await ctx.scheduler.runAfter([15_000, 30_000, 60_000, 120_000][attempt], internal.callAnalytics.capture, { callId, attempt: attempt + 1 });
    return null;
  },
});

/** Scenario ground truth is an explicit human selection; never derived from predicted intent. */
export const assignScenario = mutation({
  args: { callId: v.string(), scenarioId: v.union(v.string(), v.null()) }, returns: v.null(),
  handler: async (ctx, a) => {
    if (a.scenarioId !== null && !SCENARIOS.some(s => s.id === a.scenarioId)) throw Error("Unknown test scenario");
    const row = await ctx.db.query("calls").withIndex("by_callId", q => q.eq("callId", a.callId)).unique();
    if (!row) throw Error("Call not found");
    await ctx.db.patch(row._id, { scenarioId: a.scenarioId ?? undefined });
    return null;
  },
});

/** Explicit bounded dashboard window includes archived calls; pagination retains full history. */
export const overview = query({
  args: {}, returns: v.object({ window: v.number(), completed: v.number(), evaluated: v.number(), labeled: v.number(), correct: v.number(), resolved: v.number(), contained: v.number(), unknownResolution: v.number(), channels: v.array(v.object({ channel: v.string(), evaluated: v.number(), resolved: v.number(), contained: v.number() })) }),
  handler: async ctx => {
    // Only calls still in the panel; archived calls are excluded from the quality overview.
    const calls = await ctx.db.query("calls").withIndex("by_archivedAt_startedAt", q => q.eq("archivedAt", undefined)).order("desc").take(200);
    const completed = calls.filter(c => c.status === "ended");
    const evaluated = completed.filter(c => c.review);
    const labeled = evaluated.filter(c => SCENARIOS.some(s => s.id === c.scenarioId));
    return { window: calls.length, completed: completed.length, evaluated: evaluated.length, labeled: labeled.length,
      correct: labeled.filter(c => matchesScenarioIntent(SCENARIOS.find(s => s.id === c.scenarioId)!, c.review!)).length,
      resolved: evaluated.filter(c => outcome(c.review!).resolved === true).length, contained: evaluated.filter(c => outcome(c.review!).contained === true).length,
      unknownResolution: evaluated.filter(c => outcome(c.review!).resolved === null).length,
      channels: ["phone", "browser", "harness", "unknown"].map(channel => { const rows = evaluated.filter(c => c.channel === channel); return { channel, evaluated: rows.length, resolved: rows.filter(c => outcome(c.review!).resolved === true).length, contained: rows.filter(c => outcome(c.review!).contained === true).length }; }),
    };
  },
});
