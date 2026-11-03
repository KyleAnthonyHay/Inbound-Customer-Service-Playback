"use client";

import { useState } from "react";
import type { Doc } from "../../convex/_generated/dataModel";
import { matchesScenarioIntent, outcome, SCENARIOS } from "../lib/callMetrics";

const ms = (value?: number) => value === undefined ? "Unavailable" : `${(value / 1000).toFixed(2)} s`;
const yesNo = (value: boolean | null) => value === null ? "Unknown" : value ? "Yes" : "No";
export function CallMetrics({ call, onScenario }: { call: Doc<"calls">; onScenario: (scenarioId: string | null) => Promise<unknown> }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const m = call.measurements, r = call.review;
  const scenario = SCENARIOS.find(s => s.id === call.scenarioId);
  const expectedIntent = scenario ? [scenario.intent, ...(scenario.intentAlternatives ?? []).map(a => [a.primary, ...a.requiredSecondary].join(" + "))].join(" or ") : "";
  const result = r ? outcome(r) : null;
  return <details aria-label="Call measurements" className="my-3 rounded-xl border border-white/10 bg-white/[0.025] p-3.5 text-xs text-white/70">
    <summary className="cursor-pointer font-medium text-white/90">Call measurements <span className="ml-2 font-normal text-white/40">{call.channel} · {call.analyticsState ?? "Not evaluated"}</span></summary>
    <div className="mt-3">
    <label className="block text-white/50">Expected test scenario
      <select aria-label="Expected test scenario" value={call.scenarioId ?? ""} disabled={saving} className="mt-1 mb-2 w-full rounded border border-white/15 bg-neutral-900 p-2 text-white/80" onChange={async e => {
        const id = e.target.value || null;
        setSaving(true); setError("");
        try { await onScenario(id); } catch { setError("Could not save the scenario. Please try again."); } finally { setSaving(false); }
      }}>
        <option value="">Unlabeled / free-form call</option>
        {SCENARIOS.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
      </select>
    </label>
    {error && <p role="alert" className="mb-2 text-orange-300">{error}</p>}
    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 [&_dt]:text-white/40 [&_dd]:mt-0.5 [&_dd]:tabular-nums">
      <div><dt>Primary intent</dt><dd>{r?.primaryIntent ?? "Pending"}</dd></div>
      <div><dt>Secondary intents</dt><dd>{!r ? "Pending" : r.secondaryIntents.length ? r.secondaryIntents.join(", ") : "None"}</dd></div>
      <div><dt>Expected intent match</dt><dd>{!scenario ? "Needs scenario label" : !r ? `Pending · expected ${expectedIntent}` : `${matchesScenarioIntent(scenario, r) ? "Correct" : "Mismatch"} · expected ${expectedIntent}`}</dd></div>
      <div><dt>Resolved</dt><dd>{result ? yesNo(result.resolved) : "Not evaluated"}</dd></div>
      <div><dt>Contained</dt><dd>{result ? yesNo(result.contained) : "Not evaluated"}</dd></div>
      <div><dt>Escalation (simulated)</dt><dd>{r?.escalation ?? "Not evaluated"}</dd></div>
      <div><dt>Duration</dt><dd>{m?.durationSeconds !== undefined ? `${m.durationSeconds.toFixed(1)} s` : call.durationSeconds !== undefined ? `${call.durationSeconds.toFixed(1)} s` : "Unavailable"}</dd></div>
      <div><dt>Call ended reason</dt><dd>{call.endedReason ?? (call.status === "ended" ? "Not reported" : "Still active")}</dd></div>
      <div><dt>Transcript messages</dt><dd>{m ? `${m.messageCount} · ${m.userMessageCount} caller / ${m.assistantMessageCount} agent` : `${call.transcriptCount} logged`}</dd></div>
      <div><dt>Tool calls</dt><dd>{m?.toolCallCount ?? `${call.toolCount} logged`} · {call.toolFailureCount ?? "?"} logged failures</dd></div>
      <div><dt>Reasoner delegations</dt><dd>{m?.delegationCount ?? "Unavailable"}</dd></div>
      <div><dt>Avg reply delay · estimate</dt><dd>{ms(m?.responseTimeAverageMs)} ({m?.responseSamples ?? 0} samples)</dd></div>
      <div><dt>Reply p50 / p95 · estimates</dt><dd>{ms(m?.responseTimeP50Ms)} / {ms(m?.responseTimeP95Ms)}</dd></div>
      <div><dt>First reply · estimate</dt><dd>{ms(m?.firstResponseEstimateMs)}</dd></div>
      <div><dt>Greeting delay · estimate</dt><dd>{ms(m?.greetingDelayEstimateMs)}</dd></div>
      <div><dt>Avg logged tool execution</dt><dd>{ms(call.toolLatencyAverageMs)} ({call.toolLatencySamples ?? 0} samples)</dd></div>
      <div><dt>Reported call cost</dt><dd>{m?.costUsd !== undefined ? `$${m.costUsd.toFixed(4)}${m.usageComplete === false ? " · incomplete" : ""}` : "Unavailable"}</dd></div>
    </dl>
    {r?.evidence && <p className="mt-3 leading-relaxed text-white/55"><span className="text-white/40">{call.reviewSource === "reviewed-preview" ? "Reviewed preview" : "Post-call review"}: </span>{r.evidence}</p>}
    <p className="mt-3 text-[11px] leading-relaxed text-white/40">Timing estimates use Vapi transcript timestamps, including tool waits. Greeting delay starts at Vapi call start; it does not prove when a phone caller heard audio. Answer-to-first-audio and model first-token timing are unavailable. Overlaps excluded: {m?.overlapCount ?? 0}. Expected labels stay outside agent inputs.</p>
    {call.analyticsError && <p className="mt-2 text-orange-200/70">{call.analyticsError}</p>}
    </div>
  </details>;
}

type Overview = { window: number; completed: number; evaluated: number; labeled: number; correct: number; resolved: number; contained: number; unknownResolution: number; channels: Array<{ channel: string; evaluated: number; resolved: number; contained: number }> };
const rate = (n: number, d: number) => d ? `${Math.round(n / d * 100)}% (${n}/${d})` : "Not yet evaluated";
export function CallMetricsOverview({ data }: { data: Overview }) {
  return <section aria-label="Call quality overview" className="mb-3 rounded-xl border border-white/10 p-3 text-xs text-white/60">
    <p className="mb-2 font-medium text-white/85">Recent unarchived history · {data.window} calls, including demo calls</p>
    <p>Expected intent accuracy: {rate(data.correct, data.labeled)}</p>
    <p>Containment: {rate(data.contained, data.evaluated)} · Resolution: {rate(data.resolved, data.evaluated)}</p>
    <p className="mt-1 text-white/40">Reviewed {data.evaluated}/{data.completed} completed calls · {data.unknownResolution} unknown outcomes. Unknown outcomes remain in the reviewed denominator; pending calls are excluded. Unlabeled calls are excluded from intent accuracy.</p>
    {data.channels.filter(c => c.evaluated).map(c => <p key={c.channel} className="mt-2">{c.channel}: contained {rate(c.contained, c.evaluated)}, resolved {rate(c.resolved, c.evaluated)}</p>)}
  </section>;
}
