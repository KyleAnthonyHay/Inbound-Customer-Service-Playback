import { ConvexError, v } from "convex/values";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { DEV_SITE } from "./lib/callAdmission";
import { demoCandidate, demoPanel, demoSetFields } from "./lib/demoCallValidators";
import { DEMO_SET_KEY, INITIAL_DEMO_SNAPSHOT, demoPanelData, isSelectableDemoCall, replaceDemoEntry, validateDemoEntries } from "../src/lib/demoCalls";
import { SCENARIOS } from "../src/lib/callMetrics";

const development = () => process.env.CONVEX_SITE_URL === DEV_SITE;
function requireDevelopment() { if (!development()) throw new ConvexError("Demo call selection is available on development only."); }

/** Idempotent admin initialization from the exact original ten; never reset later edits. */
export const initialize = internalMutation({
  args: {}, returns: v.object({ created: v.boolean(), selected: v.number() }),
  handler: async ctx => {
    requireDevelopment();
    const existing = await ctx.db.query("demoCallSets").withIndex("by_key", q => q.eq("key", DEMO_SET_KEY)).unique();
    if (existing) return { created: false, selected: existing.entries.length };
    const snapshot = await ctx.db.query("evaluationRuns").withIndex("by_key", q => q.eq("key", INITIAL_DEMO_SNAPSHOT)).unique();
    if (!snapshot) throw new ConvexError("The original demo evaluation snapshot is missing.");
    const entries = snapshot.calls.map(c => ({ scenarioId: c.scenarioId, callId: c.callId }));
    validateDemoEntries(entries);
    const now = Date.now();
    await ctx.db.insert("demoCallSets", { key: DEMO_SET_KEY, title: "Demo calls", sourceSnapshotKey: snapshot.key, entries, createdAt: now, updatedAt: now });
    return { created: true, selected: entries.length };
  },
});

export const get = query({
  args: {}, returns: v.union(v.null(), demoPanel),
  handler: async ctx => {
    const set = await ctx.db.query("demoCallSets").withIndex("by_key", q => q.eq("key", DEMO_SET_KEY)).unique();
    if (!set) return null;
    const calls = await Promise.all(set.entries.map(e => ctx.db.query("calls").withIndex("by_callId", q => q.eq("callId", e.callId)).unique()));
    return { title: set.title, sourceSnapshotKey: set.sourceSnapshotKey, updatedAt: set.updatedAt, editable: development(), ...demoPanelData(set.entries, calls.filter(c => c !== null)) };
  },
});

export const candidates = query({
  args: { scenarioId: v.string() }, returns: v.array(demoCandidate),
  handler: async (ctx, args) => {
    if (!development() || !SCENARIOS.some(s => s.id === args.scenarioId)) return [];
    const set = await ctx.db.query("demoCallSets").withIndex("by_key", q => q.eq("key", DEMO_SET_KEY)).unique();
    const selected = new Set(set?.entries.map(e => e.callId));
    const rows = await ctx.db.query("calls").withIndex("by_scenarioId_startedAt", q => q.eq("scenarioId", args.scenarioId)).order("desc").take(100);
    // Eligibility never depends on a positive score: failed outcomes may be selected too.
    return rows.filter(c => !selected.has(c.callId) && isSelectableDemoCall(c, args.scenarioId))
      .map(c => ({ callId: c.callId, ...(c.title ? { title: c.title } : {}), startedAt: c.startedAt, channel: c.channel }));
  },
});

export const replace = mutation({
  args: { scenarioId: v.string(), callId: v.string() }, returns: v.null(),
  handler: async (ctx, args) => {
    requireDevelopment();
    const set = await ctx.db.query("demoCallSets").withIndex("by_key", q => q.eq("key", DEMO_SET_KEY)).unique();
    if (!set) throw new ConvexError("The demo selection has not been initialized.");
    const call = await ctx.db.query("calls").withIndex("by_callId", q => q.eq("callId", args.callId)).unique();
    if (!call) throw new ConvexError("This call is no longer available. Choose another call.");
    let entries;
    try { entries = replaceDemoEntry(set.entries, args.scenarioId, call); }
    catch (error) { throw new ConvexError(error instanceof Error ? error.message : "Choose another reviewed call."); }
    await ctx.db.patch(set._id, { entries, updatedAt: Date.now() });
    return null;
  },
});

export const remove = mutation({
  args: { scenarioId: v.string() }, returns: v.null(),
  handler: async (ctx, args) => {
    requireDevelopment();
    if (!SCENARIOS.some(s => s.id === args.scenarioId)) throw new ConvexError("Choose a known demo scenario.");
    const set = await ctx.db.query("demoCallSets").withIndex("by_key", q => q.eq("key", DEMO_SET_KEY)).unique();
    if (!set) throw new ConvexError("The demo selection has not been initialized.");
    await ctx.db.patch(set._id, { entries: set.entries.filter(e => e.scenarioId !== args.scenarioId), updatedAt: Date.now() });
    return null;
  },
});

/**
 * Copy the selected demo calls from development to production so the read-only
 * Demo calls panel works there too. Export on dev, then import on prod:
 *   npx convex run demoCalls:exportSet > demo-calls.json
 *   npx convex run --prod demoCalls:importSet "$(cat demo-calls.json)"
 */
export const exportSet = internalQuery({
  args: {}, returns: v.any(),
  handler: async ctx => {
    requireDevelopment();
    const set = await ctx.db.query("demoCallSets").withIndex("by_key", q => q.eq("key", DEMO_SET_KEY)).unique();
    if (!set) throw new ConvexError("The demo selection has not been initialized.");
    const strip = (doc: Record<string, unknown>) => Object.fromEntries(Object.entries(doc).filter(([k]) => k !== "_id" && k !== "_creationTime"));
    const calls = [];
    for (const entry of set.entries) {
      const call = await ctx.db.query("calls").withIndex("by_callId", q => q.eq("callId", entry.callId)).unique();
      if (!call) continue;
      const transcripts = await ctx.db.query("transcripts").withIndex("by_call", q => q.eq("callId", entry.callId)).collect();
      const events = await ctx.db.query("callEvents").withIndex("by_call", q => q.eq("callId", entry.callId)).collect();
      calls.push({ call: strip(call), transcripts: transcripts.map(strip), events: events.map(strip) });
    }
    return { set: strip(set), calls };
  },
});

/** Idempotent: replaces each demo call, its transcript and its tool activity, then the selection. */
export const importSet = internalMutation({
  args: { set: v.object(demoSetFields), calls: v.array(v.object({ call: v.any(), transcripts: v.array(v.any()), events: v.array(v.any()) })) },
  returns: v.object({ calls: v.number(), transcripts: v.number(), events: v.number() }),
  handler: async (ctx, args) => {
    if (args.set.key !== DEMO_SET_KEY) throw new ConvexError("Unexpected demo set key.");
    let transcripts = 0, events = 0;
    for (const { call, transcripts: lines, events: activity } of args.calls) {
      const callId: string = call.callId;
      if (!args.set.entries.some(e => e.callId === callId)) throw new ConvexError(`Call ${callId} is not in the demo selection.`);
      const existing = await ctx.db.query("calls").withIndex("by_callId", q => q.eq("callId", callId)).unique();
      if (existing) await ctx.db.replace(existing._id, call);
      else await ctx.db.insert("calls", call);
      for (const row of await ctx.db.query("transcripts").withIndex("by_call", q => q.eq("callId", callId)).collect()) await ctx.db.delete(row._id);
      for (const row of await ctx.db.query("callEvents").withIndex("by_call", q => q.eq("callId", callId)).collect()) await ctx.db.delete(row._id);
      for (const line of lines) { if (line.callId !== callId) throw new ConvexError("Transcript call mismatch."); await ctx.db.insert("transcripts", line); transcripts++; }
      for (const event of activity) { if (event.callId !== callId) throw new ConvexError("Event call mismatch."); await ctx.db.insert("callEvents", event); events++; }
    }
    const existingSet = await ctx.db.query("demoCallSets").withIndex("by_key", q => q.eq("key", DEMO_SET_KEY)).unique();
    if (existingSet) await ctx.db.replace(existingSet._id, args.set);
    else await ctx.db.insert("demoCallSets", args.set);
    return { calls: args.calls.length, transcripts, events };
  },
});
