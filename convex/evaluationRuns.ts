import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import { DEV_SITE } from "./lib/callAdmission";
import { evaluationRunFields } from "./lib/evaluationRunValidators";
import { calculateEvaluationRun, type EvaluationCall } from "../src/lib/evaluationRun";

/** Admin-only fixed snapshot: never accepts caller-supplied scores or edits calls. */
export const capture = internalMutation({
  args: { key: v.string(), label: v.string(), callIds: v.array(v.string()), selectionCutoffAt: v.number(), note: v.string() },
  returns: v.object({ id: v.id("evaluationRuns"), created: v.boolean() }),
  handler: async (ctx, args) => {
    if (process.env.CONVEX_SITE_URL !== DEV_SITE) throw Error("Evaluation snapshots are development-only");
    if (args.callIds.length !== 10 || new Set(args.callIds).size !== 10) throw Error("Select ten distinct calls");
    const prior = await ctx.db.query("evaluationRuns").withIndex("by_key", q => q.eq("key", args.key)).unique();
    if (prior) {
      if (prior.calls.map(c => c.callId).sort().join() !== [...args.callIds].sort().join()) throw Error("Snapshot key already belongs to a different cohort");
      return { id: prior._id, created: false };
    }
    const rows: EvaluationCall[] = [];
    for (const callId of args.callIds) {
      const row = await ctx.db.query("calls").withIndex("by_callId", q => q.eq("callId", callId)).unique();
      if (!row) throw Error("Selected call does not exist");
      if ((row.endedAt ?? row.startedAt) > args.selectionCutoffAt) throw Error("Call falls after the selection cutoff");
      rows.push(row);
    }
    const result = calculateEvaluationRun(rows);
    const id = await ctx.db.insert("evaluationRuns", { key: args.key, label: args.label, createdAt: Date.now(), selectionCutoffAt: args.selectionCutoffAt, note: args.note, ...result });
    return { id, created: true };
  },
});

export const get = internalQuery({
  args: { key: v.string() },
  returns: v.union(v.null(), v.object({ ...evaluationRunFields, _id: v.id("evaluationRuns"), _creationTime: v.number() })),
  handler: async (ctx, args) => {
    if (process.env.CONVEX_SITE_URL !== DEV_SITE) throw Error("Evaluation snapshots are development-only");
    return ctx.db.query("evaluationRuns").withIndex("by_key", q => q.eq("key", args.key)).unique();
  },
});
