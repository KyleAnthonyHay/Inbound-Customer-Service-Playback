"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { ConvexError } from "convex/values";
import { api } from "../../convex/_generated/api";

export type DemoCallsData = FunctionReturnType<typeof api.demoCalls.get>;
const button = "rounded-md border border-white/20 px-2.5 py-1.5 text-xs text-white/80 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40";
const date = (at: number) => new Date(at).toLocaleString();

export function DemoCallsPanel({ data, busy, onOpen }: { data: DemoCallsData | undefined; busy: boolean; onOpen: (id: string) => void }) {
  const [picker, setPicker] = useState<string | null>(null);
  const [choice, setChoice] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const candidates = useQuery(api.demoCalls.candidates, picker ? { scenarioId: picker } : "skip");
  const replace = useMutation(api.demoCalls.replace);
  const remove = useMutation(api.demoCalls.remove);
  const locked = busy || saving;
  async function update(action: () => Promise<unknown>) {
    setSaving(true); setError(null);
    try { await action(); setPicker(null); setChoice(""); }
    catch (e) { setError(e instanceof ConvexError && typeof e.data === "string" ? e.data : "Could not update the demo selection. Please try again."); }
    finally { setSaving(false); }
  }
  if (data === undefined) return <p className="mt-5 text-sm text-white/65" role="status">Loading demo calls…</p>;
  if (data === null) return <p className="mt-5 text-sm text-white/65">Demo call selection is available on the initialized development environment.</p>;
  const metrics = [
    { label: "Intent accuracy", value: data.metrics.intentAccuracy },
    { label: "Containment", value: data.metrics.containment },
    { label: "Resolution", value: data.metrics.resolution },
  ];
  return <section aria-label="Selected demo calls" className="mt-5">
    <h2 className="text-lg font-semibold text-white">Demo calls</h2>
    <p className="mt-1 text-xs text-white/65">{data.counts.selected}/10 selected · {data.counts.reviewed} reviewed · Voice role-play</p>
    <div className="mt-4 grid grid-cols-3 gap-2">
      {metrics.map(({ label, value }) => <div key={label} className="rounded-xl border border-white/15 bg-white/[0.04] p-2.5">
        <h3 className="text-[11px] text-white/70">{label}</h3>
        <p className="mt-1 text-xl font-semibold tabular-nums text-sky-200">{value.percent === null ? "—" : `${Math.round(value.percent)}%`}</p>
        <p className="text-xs tabular-nums text-white/65">{value.numerator}/{value.denominator} reviewed</p>
      </div>)}
    </div>
    <details className="mt-3 text-xs leading-relaxed text-white/65">
      <summary className="cursor-pointer text-white/80">How these scores are calculated</summary>
      <p className="mt-2">Only reviewed calls selected here count. Intent compares the review with its independently assigned test scenario. Containment requires resolution with no human escalation. Resolution requires all requests answered or fixed; a simulated callback alone is not a resolution.</p>
      <p className="mt-1">Missing calls, changed scenario labels and pending reviews are excluded and flagged below. Unknown outcomes count as unresolved. These role-play results do not verify physical equipment or telephone delivery.</p>
    </details>
    {data.counts.reviewed < data.counts.selected && <p className="mt-3 text-xs text-amber-200" role="status">{data.counts.selected - data.counts.reviewed} selected call(s) need attention before they count in these scores.</p>}
    {data.counts.unknownResolution > 0 && <p className="mt-2 text-xs text-amber-200">{data.counts.unknownResolution} reviewed call(s) have an unknown outcome.</p>}
    {error && <p className="mt-3 text-xs text-red-200" role="alert">{error}</p>}
    <div className="mt-4 space-y-3">
      {data.slots.map(slot => <article key={slot.scenarioId} className="rounded-xl border border-white/15 p-3">
        <h3 className="text-sm font-medium text-white/90">{slot.title}</h3>
        <p className="mt-1 text-xs text-white/65">{slot.call ? date(slot.call.startedAt) : slot.state === "empty" ? "No call selected" : "Source call no longer available"}</p>
        {slot.call?.review && <p className="mt-1 text-xs text-white/65">{[slot.call.review.primaryIntent, ...slot.call.review.secondaryIntents].join(" + ")} · {slot.call.review.resolution} · {slot.call.review.escalation === "none" ? "no escalation" : slot.call.review.escalation}</p>}
        {slot.state !== "ready" && slot.state !== "empty" && <p className="mt-1 text-xs text-amber-200">{slot.state === "label-mismatch" ? "Scenario label changed — excluded from scores" : slot.state === "unreviewed" ? "Awaiting an eligible completed voice call and review" : "Missing call — excluded from scores"}</p>}
        <div className="mt-3 flex flex-wrap gap-2">
          {slot.call && <button className={button} disabled={locked} onClick={() => onOpen(slot.call!.callId)}>Open call</button>}
          {data.editable && <button className={button} disabled={locked} onClick={() => { setPicker(slot.scenarioId); setChoice(""); setError(null); }} aria-expanded={picker === slot.scenarioId}>{slot.callId ? "Swap call" : "Choose call"}</button>}
          {data.editable && slot.callId && <button className={button} disabled={locked} onClick={() => void update(() => remove({ scenarioId: slot.scenarioId }))}>Remove from demo</button>}
        </div>
        {data.editable && picker === slot.scenarioId && <div className="mt-3 border-t border-white/15 pt-3">
          {candidates === undefined ? <p className="text-xs text-white/65" role="status">Loading reviewed calls…</p> : candidates.length === 0 ? <p className="text-xs leading-relaxed text-white/65">No other reviewed calls for this scenario among its latest 100 calls. Open a completed voice call and assign this test scenario in Call measurements first.</p> : <>
            <label className="text-xs text-white/80" htmlFor={`demo-${slot.scenarioId}`}>Replacement call</label>
            <select id={`demo-${slot.scenarioId}`} value={choice} disabled={locked} onChange={e => setChoice(e.target.value)} className="mt-1 w-full rounded-lg border border-white/25 bg-[#202023] p-2 text-xs text-white">
              <option value="">Choose a reviewed call…</option>
              {candidates.map(c => <option key={c.callId} value={c.callId}>{date(c.startedAt)} · {c.title || c.callId.slice(-8)}</option>)}
            </select>
            <button className={`${button} mt-2 mr-2`} disabled={locked || !choice} onClick={() => void update(() => replace({ scenarioId: slot.scenarioId, callId: choice }))}>Save selection</button>
          </>}
          <button className={`${button} mt-2`} disabled={saving} onClick={() => { setPicker(null); setChoice(""); }}>Cancel</button>
        </div>}
      </article>)}
    </div>
  </section>;
}
