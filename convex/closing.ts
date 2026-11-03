import { v } from "convex/values";
import { internalAction, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { finishCallWhenReady, isBriefSignoff, requestCallClosing, type ClosingState } from "./lib/callClosing";

export const request = internalMutation({
  args: { callId: v.string(), callType: v.optional(v.string()), controlUrl: v.string() },
  returns: v.boolean(), handler: requestCallClosing,
});

export const state = internalQuery({
  args: { callId: v.string() },
  returns: v.union(v.null(), v.object({ status: v.string(), requestedAt: v.optional(v.number()),
    assistantSpeaking: v.optional(v.boolean()), assistantStoppedAt: v.optional(v.number()),
    lastUserSpeechAt: v.optional(v.number()), farewell: v.string(), callerSpeaking: v.optional(v.boolean()), closingInterrupted: v.optional(v.boolean()) })),
  handler: async (ctx, { callId }): Promise<ClosingState | null> => {
    const call = await ctx.db.query("calls").withIndex("by_callId", q => q.eq("callId", callId)).unique();
    if (!call) return null;
    return { status: call.status, requestedAt: call.closingRequestedAt, assistantSpeaking: call.assistantSpeaking,
      assistantStoppedAt: call.assistantStoppedAt, lastUserSpeechAt: call.lastUserSpeechAt,
      farewell: call.closingFarewell ?? "", callerSpeaking: call.callerSpeaking, closingInterrupted: call.closingInterrupted };
  },
});

/** Signed server finals cover browser calls too, without duplicating UI transcript rows. */
export const observeTranscript = internalMutation({
  args: { callId: v.string(), role: v.union(v.literal("assistant"), v.literal("user")), text: v.string() }, returns: v.null(),
  handler: async (ctx, args) => {
    const call = await ctx.db.query("calls").withIndex("by_callId", q => q.eq("callId", args.callId)).unique();
    if (call?.closingRequestedAt !== undefined && call.status !== "ended") {
      if (args.role === "assistant")
        await ctx.db.patch(call._id, { closingFarewell: `${call.closingFarewell ?? ""} ${args.text}`.slice(-3000) });
      else await ctx.db.patch(call._id, { closingInterrupted: false,
        ...(!isBriefSignoff(args.text) ? { lastUserSpeechAt: Date.now() } : {}) });
    }
    return null;
  },
});

export const check = internalAction({
  args: { callId: v.string(), controlUrl: v.string(), requestedAt: v.number(), attempt: v.number() },
  returns: v.null(),
  handler: async (ctx, args): Promise<null> => {
    const result = await finishCallWhenReady(args, {
      getState: () => ctx.runQuery(internal.closing.state, { callId: args.callId }),
      publicKey: process.env.VAPI_PUBLIC_KEY,
    });
    if (result === "waiting" && args.attempt < 16) {
      await ctx.scheduler.runAfter(1500, internal.closing.check, { ...args, attempt: args.attempt + 1 });
    } else if (result !== "cancelled") {
      await ctx.runMutation(internal.closing.logResult, { callId: args.callId, result });
    }
    return null;
  },
});

export const logResult = internalMutation({
  args: { callId: v.string(), result: v.union(v.literal("waiting"), v.literal("accepted"), v.literal("failed")) },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("callEvents", { callId: args.callId, at: Date.now(), kind: "note", source: "internal",
      label: "Farewell completion check", status: args.result === "accepted" ? "succeeded" : "failed",
      detail: args.result === "accepted" ? "Farewell and speech completion observed; hang-up requested." :
        "Hang-up was not confirmed. No blind hang-up or automatic control retry." });
    return null;
  },
});
