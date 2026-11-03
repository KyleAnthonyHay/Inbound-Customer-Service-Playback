import { ConvexError, v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { DEV_SITE } from "./lib/callAdmission";
import { demoCandidate, demoPanel } from "./lib/demoCallValidators";
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
    if (!development()) return null;
    const set = await ctx.db.query("demoCallSets").withIndex("by_key", q => q.eq("key", DEMO_SET_KEY)).unique();
    if (!set) return null;
    const calls = await Promise.all(set.entries.map(e => ctx.db.query("calls").withIndex("by_callId", q => q.eq("callId", e.callId)).unique()));
    return { title: set.title, sourceSnapshotKey: set.sourceSnapshotKey, updatedAt: set.updatedAt, ...demoPanelData(set.entries, calls.filter(c => c !== null)) };
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
