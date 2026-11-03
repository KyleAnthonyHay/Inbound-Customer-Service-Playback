import { mutation, query, internalMutation, internalQuery, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator, paginationResultValidator } from "convex/server";
import schema from "./schema";
import { archiveCall, archivePanelBatch, restoreCall, deleteArchivedCall, deleteCallLogBatch, isDeletedCall } from "./lib/callHistory";
import { assistantSpeakingAfter, isLiveStatus, REMOTE_STALE_MS, storedStatusOf, type StoredCallStatus } from "../src/lib/tools/callState";
import { queueAnalytics } from "./callAnalytics";

/**
 * Call history for the activity panel's "Past calls" list. Rows are written by Vapi's
 * assistant-level server messages (status-update, final transcripts, end-of-call-report)
 * posted to {CONVEX_SITE_URL}/vapi/events, so browser, websocket-harness and phone calls all land here.
 */

const channelOf = (t?: string): "browser" | "phone" | "harness" | "unknown" => {
  if (!t) return "unknown";
  if (t === "webCall") return "browser";
  if (t.includes("Phone")) return "phone";
  if (t.includes("websocket") || t.includes("Websocket")) return "harness";
  return "unknown";
};

/** Find-or-create the call row (shared with the tool webhook, which may fire before status-update). */
export async function ensureCall(
  ctx: MutationCtx,
  callId: string,
  patch?: { channel?: string; startedAt?: number; callerNumber?: string; status?: StoredCallStatus }
) {
  if (await isDeletedCall(ctx, callId)) throw Error("Call history was permanently deleted");
  const existing = await ctx.db.query("calls").withIndex("by_callId", (q) => q.eq("callId", callId)).unique();
  if (existing) {
    if (patch?.channel && existing.channel === "unknown") await ctx.db.patch(existing._id, { channel: channelOf(patch.channel) });
    if (patch?.startedAt && patch.startedAt < existing.startedAt) await ctx.db.patch(existing._id, { startedAt: patch.startedAt });
    if (patch?.callerNumber && !existing.callerNumber) await ctx.db.patch(existing._id, { callerNumber: patch.callerNumber });
    return existing._id;
  }
  return ctx.db.insert("calls", {
    callId,
    channel: channelOf(patch?.channel),
    callerNumber: patch?.callerNumber,
    status: patch?.status ?? "in-progress",
    startedAt: patch?.startedAt ?? Date.now(),
    toolCount: 0,
    transcriptCount: 0,
  });
}

export const statusUpdate = mutation({
  args: { callId: v.string(), status: v.string(), callType: v.optional(v.string()), endedReason: v.optional(v.string()), startedAt: v.optional(v.string()), callerNumber: v.optional(v.string()) },
  handler: async (ctx, a) => {
    const next = storedStatusOf(a.status);
    const id = await ensureCall(ctx, a.callId, {
      channel: a.callType, startedAt: a.startedAt ? Date.parse(a.startedAt) : undefined, callerNumber: a.callerNumber,
      status: next ?? undefined,
    });
    const row = (await ctx.db.get(id))!;
    if (next === "ended") await ctx.db.patch(id, { status: "ended", endedAt: Date.now(), endedReason: a.endedReason, assistantSpeaking: false });
    // ringing -> in-progress only moves forward; an ended row never reopens.
    else if (next === "in-progress" && row.status === "ringing") await ctx.db.patch(id, { status: "in-progress" });
    if (next === "ended") await queueAnalytics(ctx, a.callId);
    return { ok: true };
  },
});

export const appendTranscript = mutation({
  args: { callId: v.string(), role: v.union(v.literal("user"), v.literal("assistant")), text: v.string(), callType: v.optional(v.string()) },
  handler: async (ctx, a) => {
    const text = a.text.trim();
    if (!text) return { ok: false };
    const id = await ensureCall(ctx, a.callId, { channel: a.callType });
    await ctx.db.insert("transcripts", { callId: a.callId, at: Date.now(), role: a.role, text });
    const call = (await ctx.db.get(id))!;
    const patch: { transcriptCount: number; title?: string } = { transcriptCount: call.transcriptCount + 1 };
    if (!call.title && a.role === "user") patch.title = text.length > 90 ? text.slice(0, 87) + "…" : text;
    await ctx.db.patch(id, patch);
    return { ok: true };
  },
});

export const endOfCallReport = mutation({
  args: {
    callId: v.string(),
    callType: v.optional(v.string()),
    endedReason: v.optional(v.string()),
    summary: v.optional(v.string()),
    durationSeconds: v.optional(v.number()),
    startedAt: v.optional(v.string()),
    endedAt: v.optional(v.string()),
    callerNumber: v.optional(v.string()),
    messages: v.optional(v.array(v.object({ role: v.union(v.literal("user"), v.literal("assistant")), text: v.string(), at: v.number() }))),
  },
  handler: async (ctx, a) => {
    const id = await ensureCall(ctx, a.callId, { channel: a.callType, startedAt: a.startedAt ? Date.parse(a.startedAt) : undefined, callerNumber: a.callerNumber });
    const call = (await ctx.db.get(id))!;
    let transcriptCount = call.transcriptCount;
    let title = call.title;
    if (transcriptCount === 0 && a.messages?.length) {
      const base = call.startedAt;
      for (const m of a.messages) {
        const text = m.text.trim();
        if (!text) continue;
        await ctx.db.insert("transcripts", { callId: a.callId, at: m.at > 1e12 ? m.at : base + m.at, role: m.role, text });
        transcriptCount++;
        if (!title && m.role === "user") title = text.length > 90 ? text.slice(0, 87) + "…" : text;
      }
    }
    await ctx.db.patch(id, {
      status: "ended",
      assistantSpeaking: false,
      endedAt: a.endedAt ? Date.parse(a.endedAt) : Date.now(),
      endedReason: a.endedReason,
      summary: a.summary,
      durationSeconds: a.durationSeconds,
      transcriptCount,
      title,
    });
    await queueAnalytics(ctx, a.callId);
    return { ok: true };
  },
});

/**
 * speech-update: someone is talking, so the call is in progress (creating the row if the tool
 * webhook hasn't yet) and the assistant's speaking state is recorded for the web phone.
 */
export const touch = mutation({
  args: {
    callId: v.string(), callType: v.optional(v.string()), callerNumber: v.optional(v.string()),
    role: v.optional(v.string()), speechStatus: v.optional(v.string()),
  },
  handler: async (ctx, a) => {
    const id = await ensureCall(ctx, a.callId, { channel: a.callType, callerNumber: a.callerNumber });
    const row = (await ctx.db.get(id))!;
    const speaking = assistantSpeakingAfter(a.role, a.speechStatus);
    const patch: { status?: "in-progress"; assistantSpeaking?: boolean; assistantStoppedAt?: number; lastUserSpeechAt?: number; callerSpeaking?: boolean; closingInterrupted?: boolean } = {};
    if (a.role === "user" && (a.speechStatus === "started" || a.speechStatus === "stopped")) {
      patch.callerSpeaking = a.speechStatus === "started";
      if (a.speechStatus === "started") {
        if (row.closingRequestedAt !== undefined) patch.closingInterrupted = true;
        else patch.lastUserSpeechAt = Date.now();
      }
    }
    if (speaking === false) patch.assistantStoppedAt = Date.now();
    if (row.status === "ringing") patch.status = "in-progress";
    if (speaking !== undefined && row.status !== "ended" && speaking !== row.assistantSpeaking) patch.assistantSpeaking = speaking;
    if (Object.keys(patch).length) await ctx.db.patch(id, patch);
    return { ok: true };
  },
});

/**
 * conversation-update: Vapi sends the whole running message list each time. Stored lines are
 * append-only and in order, so only the tail beyond what we already have is inserted.
 */
export const syncConversation = mutation({
  args: {
    callId: v.string(),
    callType: v.optional(v.string()),
    messages: v.array(v.object({ role: v.union(v.literal("user"), v.literal("assistant")), text: v.string(), at: v.number() })),
  },
  handler: async (ctx, a) => {
    const id = await ensureCall(ctx, a.callId, { channel: a.callType });
    const call = (await ctx.db.get(id))!;
    const lines = a.messages.filter((m) => m.text.trim());
    if (lines.length <= call.transcriptCount) return { ok: true, added: 0 };
    let title = call.title;
    for (const m of lines.slice(call.transcriptCount)) {
      await ctx.db.insert("transcripts", { callId: a.callId, at: m.at > 1e12 ? m.at : Date.now(), role: m.role, text: m.text.trim() });
      if (!title && m.role === "user") title = m.text.length > 90 ? m.text.slice(0, 87) + "…" : m.text.trim();
    }
    await ctx.db.patch(id, { transcriptCount: lines.length, title });
    return { ok: true, added: lines.length - call.transcriptCount };
  },
});

/** Newest first. Capped so the sidebar list never grows unbounded; the UI pages within it. */
export const list = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, a) => ctx.db.query("calls").withIndex("by_archivedAt_startedAt", q => q.eq("archivedAt", undefined))
    .order("desc").take(Math.min(Math.max(1, a.limit ?? 50), 200)),
});

/** Permanent saved history includes calls cleared from the working panel. */
export const history = query({
  args: { paginationOpts: paginationOptsValidator },
  returns: paginationResultValidator(v.object({ ...schema.tables.calls.validator.fields, _id: v.id("calls"), _creationTime: v.number() })),
  handler: async (ctx, args) => ctx.db.query("calls").withIndex("by_startedAt").order("desc").paginate(args.paginationOpts),
});

export const archived = query({
  args: { paginationOpts: paginationOptsValidator },
  returns: paginationResultValidator(v.object({ ...schema.tables.calls.validator.fields, _id: v.id("calls"), _creationTime: v.number() })),
  handler: async (ctx, args) => ctx.db.query("calls")
    .withIndex("by_archivedAt_startedAt", q => q.gt("archivedAt", undefined)).order("desc").paginate(args.paginationOpts),
});

export const archive = mutation({
  args: { callId: v.string() },
  returns: v.object({ ok: v.boolean(), archived: v.boolean(), reason: v.optional(v.string()) }),
  handler: (ctx, args) => archiveCall(ctx, args.callId),
});

export const restore = mutation({
  args: { callId: v.string() },
  returns: v.object({ ok: v.boolean(), restored: v.boolean(), reason: v.optional(v.string()) }),
  handler: (ctx, args) => restoreCall(ctx, args.callId),
});

export const deleteArchived = mutation({
  args: { callId: v.string() },
  returns: v.object({ ok: v.boolean(), removed: v.boolean(), reason: v.optional(v.string()) }),
  handler: (ctx, args) => deleteArchivedCall(ctx, args.callId),
});

export const deleteArchivedNextBatch = internalMutation({
  args: { callId: v.string() }, returns: v.null(),
  handler: async (ctx, args) => { await deleteCallLogBatch(ctx, args.callId); return null; },
});

export const isPermanentlyDeleted = internalQuery({
  args: { callId: v.string() }, returns: v.boolean(),
  handler: (ctx, args) => isDeletedCall(ctx, args.callId),
});

/**
 * The one call the agent is on right now (newest ringing or in-progress, started within 15 min),
 * from any channel. The demo runs a single agent instance, so the website follows this call live.
 */
export const current = query({
  args: {},
  handler: async (ctx) => {
    const recent = await ctx.db.query("calls").withIndex("by_startedAt").order("desc").take(10);
    const cutoff = Date.now() - REMOTE_STALE_MS;
    return recent.find((c) => isLiveStatus(c.status) && c.startedAt > cutoff) ?? null;
  },
});

export const get = query({
  args: { callId: v.string() },
  handler: async (ctx, a) => (a.callId ? ctx.db.query("calls").withIndex("by_callId", (q) => q.eq("callId", a.callId)).unique() : null),
});

export const transcriptByCall = query({
  args: { callId: v.string() },
  handler: async (ctx, a) => (a.callId && !await isDeletedCall(ctx, a.callId) ? ctx.db.query("transcripts").withIndex("by_call", (q) => q.eq("callId", a.callId)).order("asc").take(500) : []),
});

/** Remove one call and everything logged for it (cleanup of smoke-test rows). */
export const remove = mutation({
  args: { callId: v.string() },
  handler: async (ctx, a) => {
    const c = await ctx.db.query("calls").withIndex("by_callId", (q) => q.eq("callId", a.callId)).unique();
    for (const t of await ctx.db.query("transcripts").withIndex("by_call", (q) => q.eq("callId", a.callId)).collect()) await ctx.db.delete(t._id);
    for (const e of await ctx.db.query("callEvents").withIndex("by_call", (q) => q.eq("callId", a.callId)).collect()) await ctx.db.delete(e._id);
    if (c) await ctx.db.delete(c._id);
    return { ok: true, removed: !!c };
  },
});

/** Clear the working panel while preserving complete saved history. */
export const clearAll = mutation({
  args: {},
  returns: v.object({ ok: v.boolean(), archived: v.number(), continuing: v.boolean() }),
  handler: ctx => archivePanelBatch(ctx, Date.now()),
});

export const archiveNextBatch = internalMutation({
  args: { before: v.number() }, returns: v.null(),
  handler: async (ctx, args) => { await archivePanelBatch(ctx, args.before); return null; },
});
