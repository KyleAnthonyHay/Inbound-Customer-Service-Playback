import { mutation, query, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";

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
export async function ensureCall(ctx: MutationCtx, callId: string, patch?: { channel?: string; startedAt?: number }) {
  const existing = await ctx.db.query("calls").withIndex("by_callId", (q) => q.eq("callId", callId)).unique();
  if (existing) {
    if (patch?.channel && existing.channel === "unknown") await ctx.db.patch(existing._id, { channel: channelOf(patch.channel) });
    if (patch?.startedAt && patch.startedAt < existing.startedAt) await ctx.db.patch(existing._id, { startedAt: patch.startedAt });
    return existing._id;
  }
  return ctx.db.insert("calls", {
    callId,
    channel: channelOf(patch?.channel),
    status: "in-progress",
    startedAt: patch?.startedAt ?? Date.now(),
    toolCount: 0,
    transcriptCount: 0,
  });
}

export const statusUpdate = mutation({
  args: { callId: v.string(), status: v.string(), callType: v.optional(v.string()), endedReason: v.optional(v.string()), startedAt: v.optional(v.string()) },
  handler: async (ctx, a) => {
    const id = await ensureCall(ctx, a.callId, { channel: a.callType, startedAt: a.startedAt ? Date.parse(a.startedAt) : undefined });
    if (a.status === "ended") await ctx.db.patch(id, { status: "ended", endedAt: Date.now(), endedReason: a.endedReason });
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
    messages: v.optional(v.array(v.object({ role: v.union(v.literal("user"), v.literal("assistant")), text: v.string(), at: v.number() }))),
  },
  handler: async (ctx, a) => {
    const id = await ensureCall(ctx, a.callId, { channel: a.callType, startedAt: a.startedAt ? Date.parse(a.startedAt) : undefined });
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
      endedAt: a.endedAt ? Date.parse(a.endedAt) : Date.now(),
      endedReason: a.endedReason,
      summary: a.summary,
      durationSeconds: a.durationSeconds,
      transcriptCount,
      title,
    });
    return { ok: true };
  },
});

/** Mark a call as in progress (speech-update), creating the row if the tool webhook hasn't yet. */
export const touch = mutation({
  args: { callId: v.string(), callType: v.optional(v.string()) },
  handler: async (ctx, a) => {
    await ensureCall(ctx, a.callId, { channel: a.callType });
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
  handler: async (ctx, a) => ctx.db.query("calls").withIndex("by_startedAt").order("desc").take(Math.min(a.limit ?? 50, 200)),
});

/**
 * The one call the agent is on right now (newest in-progress, started within 15 min), from any
 * channel. The demo runs a single agent instance, so the website follows this call live.
 */
export const current = query({
  args: {},
  handler: async (ctx) => {
    const recent = await ctx.db.query("calls").withIndex("by_startedAt").order("desc").take(10);
    const cutoff = Date.now() - 15 * 60 * 1000;
    return recent.find((c) => c.status === "in-progress" && c.startedAt > cutoff) ?? null;
  },
});

export const get = query({
  args: { callId: v.string() },
  handler: async (ctx, a) => (a.callId ? ctx.db.query("calls").withIndex("by_callId", (q) => q.eq("callId", a.callId)).unique() : null),
});

export const transcriptByCall = query({
  args: { callId: v.string() },
  handler: async (ctx, a) => (a.callId ? ctx.db.query("transcripts").withIndex("by_call", (q) => q.eq("callId", a.callId)).order("asc").take(500) : []),
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

/** "Clear past calls": removes finished calls, their transcripts and their tool events. A call in progress is kept. */
export const clearAll = mutation({
  args: {},
  handler: async (ctx) => {
    const calls = await ctx.db.query("calls").collect();
    let removed = 0;
    for (const c of calls) {
      if (c.status === "in-progress" && Date.now() - c.startedAt < 15 * 60 * 1000) continue;
      for (const t of await ctx.db.query("transcripts").withIndex("by_call", (q) => q.eq("callId", c.callId)).collect()) await ctx.db.delete(t._id);
      for (const e of await ctx.db.query("callEvents").withIndex("by_call", (q) => q.eq("callId", c.callId)).collect()) await ctx.db.delete(e._id);
      await ctx.db.delete(c._id);
      removed++;
    }
    return { ok: true, removed };
  },
});
