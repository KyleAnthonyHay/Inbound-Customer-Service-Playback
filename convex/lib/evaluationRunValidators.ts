import { v } from "convex/values";
import { callReview, intent } from "./callMetricValidators";

const metric = v.object({ numerator: v.number(), denominator: v.number(), percent: v.union(v.number(), v.null()) });
export const evaluationRunFields = {
  key: v.string(), label: v.string(), createdAt: v.number(), selectionCutoffAt: v.number(), note: v.string(),
  definitionVersion: v.string(), modality: v.literal("voice"), sourceStartAt: v.number(), sourceEndAt: v.number(),
  channels: v.array(v.union(v.literal("browser"), v.literal("phone"))),
  definitions: v.object({ intentAccuracy: v.string(), containment: v.string(), resolution: v.string(), resolutionAmongNoEscalation: v.string(), evidence: v.string() }),
  counts: v.object({ total: v.number(), reviewed: v.number(), intentMatches: v.number(), primaryOnlyMatches: v.number(), resolved: v.number(), contained: v.number(), noHumanEscalation: v.number(), escalated: v.number(), callbacks: v.number(), handoffs: v.number(), unknownResolution: v.number() }),
  metrics: v.object({ intentAccuracy: metric, primaryOnlyIntentAccuracy: metric, containment: metric, resolution: metric, resolutionAmongNoEscalation: metric }),
  calls: v.array(v.object({ callId: v.string(), scenarioId: v.string(), channel: v.union(v.literal("browser"), v.literal("phone")), startedAt: v.number(), endedAt: v.optional(v.number()), endedReason: v.optional(v.string()), reviewSource: v.optional(v.union(v.literal("native-post-call"), v.literal("reviewed-preview"))), expectedPrimary: intent, intentMatch: v.boolean(), primaryIntentMatch: v.boolean(), review: callReview, resolved: v.union(v.boolean(), v.null()), contained: v.union(v.boolean(), v.null()), noHumanEscalation: v.boolean() })),
};
