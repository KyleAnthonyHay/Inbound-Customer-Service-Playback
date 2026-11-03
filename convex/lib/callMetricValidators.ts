import { v } from "convex/values";
import { INTENTS } from "../../src/lib/callMetrics";
export const intent = v.union(...INTENTS.map(x => v.literal(x)));
export const callReview = v.object({ primaryIntent: intent, secondaryIntents: v.array(intent),
  resolution: v.union(v.literal("resolved"), v.literal("unresolved"), v.literal("unknown")),
  escalation: v.union(v.literal("none"), v.literal("requested"), v.literal("handoff"), v.literal("callback")), evidence: v.string() });
export const callMeasurements = v.object({ source: v.literal("vapi-artifact"), messageCount: v.number(), userMessageCount: v.number(), assistantMessageCount: v.number(), toolCallCount: v.number(), delegationCount: v.number(),
  responseSamples: v.number(), responseTimeTotalMs: v.number(), responseTimeAverageMs: v.optional(v.number()), responseTimeP50Ms: v.optional(v.number()), responseTimeP95Ms: v.optional(v.number()),
  firstResponseEstimateMs: v.optional(v.number()), greetingDelayEstimateMs: v.optional(v.number()), overlapCount: v.number(), durationSeconds: v.optional(v.number()), costUsd: v.optional(v.number()), usageComplete: v.optional(v.boolean()) });
