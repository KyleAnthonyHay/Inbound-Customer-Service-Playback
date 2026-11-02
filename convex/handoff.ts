import { v } from "convex/values";
import { internalAction, internalMutation, internalQuery } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { endHandoffCall, scheduleHandoffEnd } from "./lib/handoffEnding";

export const scheduleEnd = internalMutation({
  args: { callId: v.string(), callType: v.optional(v.string()), controlUrl: v.string() },
  returns: v.boolean(),
  handler: scheduleHandoffEnd,
});

export const endState = internalQuery({
  args: { callId: v.string() },
  returns: v.union(v.null(), v.object({ status: v.string(), handoffEndScheduledAt: v.optional(v.number()) })),
  handler: async (ctx, args) => {
    const call = await ctx.db.query("calls").withIndex("by_callId", q => q.eq("callId", args.callId)).unique();
    return call ? { status: call.status, ...(call.handoffEndScheduledAt !== undefined ? { handoffEndScheduledAt: call.handoffEndScheduledAt } : {}) } : null;
  },
});

export const endAfterHandoff = internalAction({
  args: { callId: v.string(), controlUrl: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const result = await endHandoffCall(args, {
      getState: () => ctx.runQuery(internal.handoff.endState, { callId: args.callId }),
      publicKey: process.env.VAPI_PUBLIC_KEY,
    });
    if (result.status !== "skipped") await ctx.runMutation(api.callEvents.log, {
      callId: args.callId, kind: "note", source: "internal",
      label: result.status === "accepted" ? "Handoff hang-up fallback accepted" : "Handoff hang-up fallback failed",
      status: result.status === "accepted" ? "succeeded" : "failed",
      detail: result.httpStatus ? `Call control HTTP ${result.httpStatus}; call-status webhook confirms disconnect.` : "Call control unavailable; no automatic retry.",
    });
    return null;
  },
});
