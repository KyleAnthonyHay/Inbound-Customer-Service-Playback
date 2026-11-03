import { v } from "convex/values";
import { intent } from "./callMetricValidators";

export const demoEntry = v.object({ scenarioId: v.string(), callId: v.string() });
export const demoSetFields = { key: v.string(), title: v.string(), sourceSnapshotKey: v.string(), entries: v.array(demoEntry), createdAt: v.number(), updatedAt: v.number() };
const metric = v.object({ numerator: v.number(), denominator: v.number(), percent: v.union(v.number(), v.null()) });
const review = v.object({ primaryIntent: intent, secondaryIntents: v.array(intent), resolution: v.union(v.literal("resolved"), v.literal("unresolved"), v.literal("unknown")), escalation: v.union(v.literal("none"), v.literal("requested"), v.literal("handoff"), v.literal("callback")) });
export const demoPanel = v.object({
  title: v.string(), sourceSnapshotKey: v.string(), updatedAt: v.number(), selectedCallIds: v.array(v.string()),
  counts: v.object({ selected: v.number(), reviewed: v.number(), missing: v.number(), unreviewed: v.number(), labelMismatch: v.number(), intentMatches: v.number(), contained: v.number(), resolved: v.number(), noHumanEscalation: v.number(), unknownResolution: v.number() }),
  metrics: v.object({ intentAccuracy: metric, containment: metric, resolution: metric, resolutionAmongNoEscalation: metric }),
  slots: v.array(v.object({ scenarioId: v.string(), title: v.string(), callId: v.union(v.string(), v.null()), state: v.union(v.literal("empty"), v.literal("missing"), v.literal("label-mismatch"), v.literal("unreviewed"), v.literal("ready")), call: v.union(v.null(), v.object({ callId: v.string(), title: v.optional(v.string()), startedAt: v.number(), channel: v.string(), review: v.union(review, v.null()) })) })),
});
export const demoCandidate = v.object({ callId: v.string(), title: v.optional(v.string()), startedAt: v.number(), channel: v.string() });
