import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

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
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("callEvents", { ...args, at: Date.now() });
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
