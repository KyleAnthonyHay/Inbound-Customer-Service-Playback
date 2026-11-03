import { matchesScenarioIntent, outcome, SCENARIOS, type CallReview } from "./callMetrics";

export const EVALUATION_DEFINITION_VERSION = "curated-manual-voice-v1";
export const EVALUATION_DEFINITIONS = {
  intentAccuracy: "Calls matching the independently assigned scenario's accepted intent combination / all selected calls. Script 6 accepts compatibility primary, or routing primary with compatibility secondary.",
  containment: "Caller-confirmed resolution of all substantive requests with no requested or completed human escalation / all selected calls. Abandonment is not containment.",
  resolution: "Calls with all substantive requests resolved or an accepted supported information answer / all selected calls. A callback or transfer alone is not resolution. Unknown outcomes remain in the denominator.",
  resolutionAmongNoEscalation: "Resolved calls with no human escalation / calls with no requested or completed human escalation. This conditional rate uses its own denominator, not the full cohort.",
  evidence: "Model-inferred post-call labels checked against role-play dialogue and tool results. Scripted caller success is not physical-device telemetry; closing quality is separate. Browser voice calls are not telephone trials.",
};

export type EvaluationCall = {
  callId: string; scenarioId?: string; status: string; channel: string; startedAt: number; endedAt?: number;
  endedReason?: string; review?: CallReview; reviewSource?: "native-post-call" | "reviewed-preview";
};
export function rate(numerator: number, denominator: number) {
  return { numerator, denominator, percent: denominator ? numerator / denominator * 100 : null };
}

/** An explicit fixed cohort, never the dashboard's moving history window. */
export function calculateEvaluationRun(input: EvaluationCall[]) {
  if (input.length !== SCENARIOS.length) throw Error("Select exactly one call for each curated scenario");
  if (new Set(input.map(c => c.callId)).size !== input.length) throw Error("Duplicate call in evaluation cohort");
  const seen = new Set<string>();
  const calls = input.map(c => {
    const scenario = SCENARIOS.find(s => s.id === c.scenarioId);
    if (!scenario || seen.has(scenario.id)) throw Error("Missing, unknown or duplicate scenario label");
    seen.add(scenario.id);
    if (c.status !== "ended" || !["browser", "phone"].includes(c.channel) || c.callId.startsWith("text-poc-"))
      throw Error("Evaluation cohort requires completed manual voice calls");
    if (!c.review) throw Error("All selected calls need a post-call review before snapshotting");
    const result = outcome(c.review);
    return {
      callId: c.callId, scenarioId: scenario.id, channel: c.channel as "browser" | "phone", startedAt: c.startedAt,
      ...(c.endedAt !== undefined ? { endedAt: c.endedAt } : {}), ...(c.endedReason ? { endedReason: c.endedReason } : {}),
      ...(c.reviewSource ? { reviewSource: c.reviewSource } : {}), expectedPrimary: scenario.intent,
      intentMatch: matchesScenarioIntent(scenario, c.review), primaryIntentMatch: scenario.intent === c.review.primaryIntent,
      review: c.review, resolved: result.resolved, contained: result.contained, noHumanEscalation: c.review.escalation === "none",
    };
  }).sort((a, b) => SCENARIOS.findIndex(s => s.id === a.scenarioId) - SCENARIOS.findIndex(s => s.id === b.scenarioId));
  const count = (predicate: (c: typeof calls[number]) => boolean) => calls.filter(predicate).length;
  const counts = {
    total: calls.length, reviewed: calls.length, intentMatches: count(c => c.intentMatch), primaryOnlyMatches: count(c => c.primaryIntentMatch),
    resolved: count(c => c.resolved === true), contained: count(c => c.contained === true),
    noHumanEscalation: count(c => c.noHumanEscalation), escalated: count(c => !c.noHumanEscalation),
    callbacks: count(c => c.review.escalation === "callback"), handoffs: count(c => c.review.escalation === "handoff"),
    unknownResolution: count(c => c.resolved === null),
  };
  return {
    definitionVersion: EVALUATION_DEFINITION_VERSION, definitions: EVALUATION_DEFINITIONS, modality: "voice" as const,
    sourceStartAt: Math.min(...calls.map(c => c.startedAt)), sourceEndAt: Math.max(...calls.map(c => c.endedAt ?? c.startedAt)),
    channels: [...new Set(calls.map(c => c.channel))], counts,
    metrics: {
      intentAccuracy: rate(counts.intentMatches, counts.total), primaryOnlyIntentAccuracy: rate(counts.primaryOnlyMatches, counts.total),
      containment: rate(counts.contained, counts.total), resolution: rate(counts.resolved, counts.total),
      resolutionAmongNoEscalation: rate(count(c => c.resolved === true && c.noHumanEscalation), counts.noHumanEscalation),
    }, calls,
  };
}
