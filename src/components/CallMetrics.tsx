"use client";

import { useState, type ReactNode } from "react";
import type { Doc } from "../../convex/_generated/dataModel";
import { matchesScenarioIntent, outcome, SCENARIOS } from "../lib/callMetrics";

const ms = (value?: number) => value === undefined ? "Unavailable" : `${(value / 1000).toFixed(2)} s`;
const yesNo = (value: boolean | null) => value === null ? "Unknown" : value ? "Yes" : "No";

/** One labeled group of label/value rows: labels left in the secondary tone, values right in the primary tone. */
function Group({ title, rows }: { title: string; rows: Array<[string, ReactNode]> }) {
  return <div className="mt-5 first:mt-0">
    <h4 className="mb-1 text-[11px] font-medium uppercase tracking-wide text-white/40">{title}</h4>
    <dl className="divide-y divide-white/[0.06]">
      {rows.map(([label, value]) => <div key={label} className="flex items-baseline justify-between gap-4 py-1.5 text-[12.5px]">
        <dt className="shrink-0 text-white/50">{label}</dt>
        <dd className="min-w-0 text-right tabular-nums text-white/85">{value}</dd>
      </div>)}
    </dl>
  </div>;
}

/** Measurements for one call, shown inside the panel's collapsible "Call measurements" section. */
export function CallMetrics({ call, onScenario }: { call: Doc<"calls">; onScenario: (scenarioId: string | null) => Promise<unknown> }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const m = call.measurements, r = call.review;
  const scenario = SCENARIOS.find(s => s.id === call.scenarioId);
  const expectedIntent = scenario ? [scenario.intent, ...(scenario.intentAlternatives ?? []).map(a => [a.primary, ...a.requiredSecondary].join(" + "))].join(" or ") : "";
  const result = r ? outcome(r) : null;
  return <div aria-label="Call measurements" className="text-[12.5px] text-white/70">
    <label className="block text-[12px] text-white/50">Expected test scenario
      <select aria-label="Expected test scenario" value={call.scenarioId ?? ""} disabled={saving} className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#1c1c1f] px-2.5 py-2 text-[13px] text-white/85 disabled:opacity-50" onChange={async e => {
        const id = e.target.value || null;
        setSaving(true); setError("");
        try { await onScenario(id); } catch { setError("Could not save the scenario. Please try again."); } finally { setSaving(false); }
      }}>
        <option value="">Unlabeled / free-form call</option>
        {SCENARIOS.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
      </select>
    </label>
    {error && <p role="alert" className="mt-2 text-[#ff8a8f]">{error}</p>}
    <div className="mt-5">
      <Group title="Outcome" rows={[
        ["Primary intent", r?.primaryIntent ?? "Pending"],
        ["Secondary intents", !r ? "Pending" : r.secondaryIntents.length ? r.secondaryIntents.join(", ") : "None"],
        ["Expected intent", !scenario ? "Needs scenario label" : !r ? `Pending · ${expectedIntent}` : `${matchesScenarioIntent(scenario, r) ? "Correct" : "Mismatch"} · ${expectedIntent}`],
        ["Resolved", result ? yesNo(result.resolved) : "Not evaluated"],
        ["Contained", result ? yesNo(result.contained) : "Not evaluated"],
        ["Escalation (simulated)", r?.escalation ?? "Not evaluated"],
      ]} />
      <Group title="Timing" rows={[
        ["Duration", m?.durationSeconds !== undefined ? `${m.durationSeconds.toFixed(1)} s` : call.durationSeconds !== undefined ? `${call.durationSeconds.toFixed(1)} s` : "Unavailable"],
        ["Avg reply delay (est.)", `${ms(m?.responseTimeAverageMs)} · ${m?.responseSamples ?? 0} samples`],
        ["Reply p50 / p95 (est.)", `${ms(m?.responseTimeP50Ms)} / ${ms(m?.responseTimeP95Ms)}`],
        ["First reply (est.)", ms(m?.firstResponseEstimateMs)],
        ["Greeting delay (est.)", ms(m?.greetingDelayEstimateMs)],
        ["Avg tool execution", `${ms(call.toolLatencyAverageMs)} · ${call.toolLatencySamples ?? 0} samples`],
      ]} />
      <Group title="Activity and cost" rows={[
        ["Messages", m ? `${m.messageCount} · ${m.userMessageCount} caller / ${m.assistantMessageCount} agent` : `${call.transcriptCount} logged`],
        ["Tool calls", `${m?.toolCallCount ?? `${call.toolCount} logged`} · ${call.toolFailureCount ?? "?"} failed`],
        ["Reasoner delegations", m?.delegationCount ?? "Unavailable"],
        ["Ended reason", call.endedReason?.replace(/-/g, " ") ?? (call.status === "ended" ? "Not reported" : "Still active")],
        ["Reported cost", m?.costUsd !== undefined ? `$${m.costUsd.toFixed(4)}${m.usageComplete === false ? " · incomplete" : ""}` : "Unavailable"],
      ]} />
    </div>
    {r?.evidence && <p className="mt-5 leading-relaxed text-white/60"><span className="text-white/40">{call.reviewSource === "reviewed-preview" ? "Reviewed preview" : "Post-call review"}: </span>{r.evidence}</p>}
    {call.analyticsError && <p className="mt-3 text-[#f5c45e]">{call.analyticsError}</p>}
    <p className="mt-4 text-[11px] leading-relaxed text-white/35">Timing estimates use Vapi transcript timestamps, including tool waits. Greeting delay starts at Vapi call start; it does not prove when a phone caller heard audio. Answer-to-first-audio and model first-token timing are unavailable. Overlaps excluded: {m?.overlapCount ?? 0}. Expected labels stay outside agent inputs.</p>
  </div>;
}

/** A headline percentage with its fraction underneath. Shared by Past calls and Demo calls. */
export function StatTile({ label, percent, detail }: { label: string; percent: number | null; detail: string }) {
  return <div className="rounded-xl bg-white/[0.04] px-3 py-2.5">
    <p className="text-[11px] text-white/50">{label}</p>
    <p className="mt-0.5 text-[20px] font-semibold leading-tight tabular-nums text-white/95">{percent === null ? "—" : `${Math.round(percent)}%`}</p>
    <p className="mt-0.5 text-[11px] tabular-nums text-white/40">{detail}</p>
  </div>;
}

type Overview = { window: number; completed: number; evaluated: number; labeled: number; correct: number; resolved: number; contained: number; unknownResolution: number; channels: Array<{ channel: string; evaluated: number; resolved: number; contained: number }> };
const pct = (n: number, d: number) => d ? n / d * 100 : null;
export function CallMetricsOverview({ data }: { data: Overview }) {
  return <section aria-label="Call quality overview">
    <div className="grid grid-cols-3 gap-2">
      <StatTile label="Intent accuracy" percent={pct(data.correct, data.labeled)} detail={`${data.correct}/${data.labeled} labeled`} />
      <StatTile label="Containment" percent={pct(data.contained, data.evaluated)} detail={`${data.contained}/${data.evaluated} reviewed`} />
      <StatTile label="Resolution" percent={pct(data.resolved, data.evaluated)} detail={`${data.resolved}/${data.evaluated} reviewed`} />
    </div>
    <details className="mt-2 text-[11.5px] leading-relaxed text-white/45">
      <summary className="cursor-pointer list-none text-white/50 hover:text-white/80 [&::-webkit-details-marker]:hidden">
        Last {data.window} unarchived calls, demo calls included · <span className="underline decoration-white/25 underline-offset-2">How these are counted</span>
      </summary>
      <p className="mt-1.5">Reviewed {data.evaluated}/{data.completed} completed calls · {data.unknownResolution} unknown outcomes. Unknown outcomes remain in the reviewed denominator; pending calls are excluded. Unlabeled calls are excluded from intent accuracy.</p>
      {data.channels.filter(c => c.evaluated).map(c => <p key={c.channel} className="mt-1">{c.channel}: contained {c.contained}/{c.evaluated}, resolved {c.resolved}/{c.evaluated}</p>)}
    </details>
  </section>;
}
