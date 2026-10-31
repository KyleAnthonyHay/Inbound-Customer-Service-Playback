import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ensureCall } from "./calls";

const status = v.union(v.literal("running"), v.literal("succeeded"), v.literal("failed"));
const source = v.union(v.literal("live"), v.literal("simulated"), v.literal("internal"));

export const log = mutation({
  args: {
    callId: v.string(),
    kind: v.union(v.literal("tool-start"), v.literal("tool-end"), v.literal("note")),
    tool: v.optional(v.string()),
    toolCallId: v.optional(v.string()),
    label: v.string(),
    status: v.optional(status),
    durationMs: v.optional(v.number()),
    source,
    detail: v.optional(v.string()),
    args: v.optional(v.string()),
    output: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("callEvents", { ...args, at: Date.now() });
    if (args.kind === "tool-end" && args.callId && args.callId !== "unknown") {
      const callRow = await ctx.db.get(await ensureCall(ctx, args.callId));
      if (callRow) await ctx.db.patch(callRow._id, { toolCount: callRow.toolCount + 1 });
    }
    return id;
  },
});

export const byCall = query({
  args: { callId: v.string() },
  handler: async (ctx, { callId }) => {
    if (!callId) return [];
    return ctx.db
      .query("callEvents")
      .withIndex("by_call", (q) => q.eq("callId", callId))
      .order("asc")
      .take(200);
  },
});
