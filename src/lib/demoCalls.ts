import { matchesScenarioIntent, outcome, SCENARIOS, type CallReview } from "./callMetrics";
import { rate, type EvaluationCall } from "./evaluationRun";

export const DEMO_SET_KEY = "presentation-demo";
export const INITIAL_DEMO_SNAPSHOT = "manual-voice-initial-ten-2026-11-03";
export type DemoEntry = { scenarioId: string; callId: string };

export function validateDemoEntries(entries: DemoEntry[]) {
  if (entries.length > SCENARIOS.length || new Set(entries.map(e => e.scenarioId)).size !== entries.length
    || new Set(entries.map(e => e.callId)).size !== entries.length || entries.some(e => !SCENARIOS.some(s => s.id === e.scenarioId)))
    throw Error("Choose at most one distinct call for each demo scenario.");
}

export function isSelectableDemoCall(call: EvaluationCall, scenarioId: string) {
  return call.scenarioId === scenarioId && call.status === "ended" && ["browser", "phone"].includes(call.channel)
    && !call.callId.startsWith("text-poc-") && !!call.review;
}

/** Selection changes never alter the source call, its label, or its review. */
export function replaceDemoEntry(entries: DemoEntry[], scenarioId: string, call: EvaluationCall) {
  if (!SCENARIOS.some(s => s.id === scenarioId)) throw Error("Choose a known demo scenario.");
  if (!isSelectableDemoCall(call, scenarioId)) throw Error("Choose a completed, reviewed voice call labeled with this scenario.");
  const next = [...entries.filter(e => e.scenarioId !== scenarioId), { scenarioId, callId: call.callId }];
  validateDemoEntries(next);
  return next.sort((a, b) => SCENARIOS.findIndex(s => s.id === a.scenarioId) - SCENARIOS.findIndex(s => s.id === b.scenarioId));
}

/** Metrics include only reviewed selected calls; coverage makes unavailable/pending rows explicit. */
export function demoPanelData(entries: DemoEntry[], sourceCalls: Array<EvaluationCall & { title?: string }>) {
  validateDemoEntries(entries);
  const ready: Array<{ scenarioId: string; review: CallReview }> = [];
  const slots = SCENARIOS.map(s => {
    const entry = entries.find(e => e.scenarioId === s.id);
    const call = entry ? sourceCalls.find(c => c.callId === entry.callId) : undefined;
    const state = !entry ? "empty" as const : !call ? "missing" as const
      : call.scenarioId !== s.id ? "label-mismatch" as const
      : !isSelectableDemoCall(call, s.id) ? "unreviewed" as const : "ready" as const;
    if (state === "ready") ready.push({ scenarioId: s.id, review: call!.review! });
    return {
      scenarioId: s.id, title: s.title, callId: entry?.callId ?? null, state,
      call: call ? {
        callId: call.callId, startedAt: call.startedAt, channel: call.channel,
        ...(call.title ? { title: call.title } : {}),
        review: call.review ? { primaryIntent: call.review.primaryIntent, secondaryIntents: call.review.secondaryIntents, resolution: call.review.resolution, escalation: call.review.escalation } : null,
      } : null,
    };
  });
  const counts = {
    selected: entries.length, reviewed: ready.length,
    missing: slots.filter(s => s.state === "missing").length, unreviewed: slots.filter(s => s.state === "unreviewed").length,
    labelMismatch: slots.filter(s => s.state === "label-mismatch").length,
    intentMatches: ready.filter(c => matchesScenarioIntent(SCENARIOS.find(s => s.id === c.scenarioId)!, c.review)).length,
    contained: ready.filter(c => outcome(c.review).contained === true).length,
    resolved: ready.filter(c => outcome(c.review).resolved === true).length,
    noHumanEscalation: ready.filter(c => c.review.escalation === "none").length,
    unknownResolution: ready.filter(c => c.review.resolution === "unknown").length,
  };
  return { selectedCallIds: entries.map(e => e.callId), slots, counts, metrics: {
    intentAccuracy: rate(counts.intentMatches, counts.reviewed), containment: rate(counts.contained, counts.reviewed),
    resolution: rate(counts.resolved, counts.reviewed),
    resolutionAmongNoEscalation: rate(ready.filter(c => c.review.escalation === "none" && outcome(c.review).resolved === true).length, counts.noHumanEscalation),
  } };
}
