"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { ConvexError } from "convex/values";
import { api } from "../../convex/_generated/api";
import { StatTile } from "./CallMetrics";

export type DemoCallsData = FunctionReturnType<typeof api.demoCalls.get>;
const button = "min-h-[32px] rounded-lg border border-white/10 px-2.5 text-[12px] text-white/75 transition-colors hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-40";
const primary = "min-h-[32px] rounded-lg bg-white px-2.5 text-[12px] font-medium text-black transition-colors hover:bg-white/85 disabled:cursor-not-allowed disabled:opacity-40";
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
  if (data === undefined) return <p className="text-[13px] text-white/50" role="status">Loading demo calls…</p>;
  if (data === null) return <p className="text-[13px] text-white/50">Demo call selection is available on the initialized development environment.</p>;
  const metrics = [
    { label: "Intent accuracy", value: data.metrics.intentAccuracy },
    { label: "Containment", value: data.metrics.containment },
    { label: "Resolution", value: data.metrics.resolution },
  ];
  return <section aria-label="Selected demo calls">
    <div className="grid grid-cols-3 gap-2">
      {metrics.map(({ label, value }) => <StatTile key={label} label={label} percent={value.percent} detail={`${value.numerator}/${value.denominator} reviewed`} />)}
    </div>
    <details className="mt-2 text-[11.5px] leading-relaxed text-white/45">
      <summary className="cursor-pointer list-none text-white/50 hover:text-white/80 [&::-webkit-details-marker]:hidden">{data.counts.selected}/10 selected · {data.counts.reviewed} reviewed · voice role-play · <span className="underline decoration-white/25 underline-offset-2">How these are counted</span></summary>
      <p className="mt-2">Only reviewed calls selected here count. Intent compares the review with its independently assigned test scenario. Containment requires resolution with no human escalation. Resolution requires all requests answered or fixed; a simulated callback alone is not a resolution.</p>
      <p className="mt-1">Missing calls, changed scenario labels and pending reviews are excluded and flagged below. Unknown outcomes count as unresolved. These role-play results do not verify physical equipment or telephone delivery.</p>
    </details>
    {data.counts.reviewed < data.counts.selected && <p className="mt-3 text-[12px] text-[#f5c45e]" role="status">{data.counts.selected - data.counts.reviewed} selected call(s) need attention before they count in these scores.</p>}
    {data.counts.unknownResolution > 0 && <p className="mt-2 text-[12px] text-[#f5c45e]">{data.counts.unknownResolution} reviewed call(s) have an unknown outcome.</p>}
    {error && <p className="mt-3 text-[12px] text-[#ff8a8f]" role="alert">{error}</p>}
    <h3 className="mb-1 mt-6 text-[11px] font-medium uppercase tracking-wide text-white/40">Scenarios</h3>
    <div className="divide-y divide-white/[0.06]">
      {data.slots.map(slot => <article key={slot.scenarioId} className="py-3.5">
        <h4 className="text-[13px] font-medium text-white/90">{slot.title}</h4>
        <p className="mt-0.5 text-[11.5px] text-white/45">{slot.call ? date(slot.call.startedAt) : slot.state === "empty" ? "No call selected" : "Source call no longer available"}</p>
        {slot.call?.review && <p className="mt-0.5 text-[11.5px] text-white/55">{[slot.call.review.primaryIntent, ...slot.call.review.secondaryIntents].join(" + ")} · {slot.call.review.resolution} · {slot.call.review.escalation === "none" ? "no escalation" : slot.call.review.escalation}</p>}
        {slot.state !== "ready" && slot.state !== "empty" && <p className="mt-1 text-[11.5px] text-[#f5c45e]">{slot.state === "label-mismatch" ? "Scenario label changed — excluded from scores" : slot.state === "unreviewed" ? "Awaiting an eligible completed voice call and review" : "Missing call — excluded from scores"}</p>}
        <div className="mt-2.5 flex flex-wrap gap-2">
          {slot.call && <button className={button} disabled={locked} onClick={() => onOpen(slot.call!.callId)}>Open call</button>}
          {data.editable && <button className={button} disabled={locked} onClick={() => { setPicker(slot.scenarioId); setChoice(""); setError(null); }} aria-expanded={picker === slot.scenarioId}>{slot.callId ? "Swap call" : "Choose call"}</button>}
          {data.editable && slot.callId && <button className={button} disabled={locked} onClick={() => void update(() => remove({ scenarioId: slot.scenarioId }))}>Remove from demo</button>}
        </div>
        {data.editable && picker === slot.scenarioId && <div className="mt-3 rounded-xl bg-white/[0.04] p-3">
          {candidates === undefined ? <p className="text-[12px] text-white/50" role="status">Loading reviewed calls…</p> : candidates.length === 0 ? <p className="text-[12px] leading-relaxed text-white/50">No other reviewed calls for this scenario among its latest 100 calls. Open a completed voice call and assign this test scenario in Call measurements first.</p> : <>
            <label className="text-[12px] text-white/60" htmlFor={`demo-${slot.scenarioId}`}>Replacement call</label>
            <select id={`demo-${slot.scenarioId}`} value={choice} disabled={locked} onChange={e => setChoice(e.target.value)} className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#1c1c1f] px-2.5 py-2 text-[13px] text-white/85">
              <option value="">Choose a reviewed call…</option>
              {candidates.map(c => <option key={c.callId} value={c.callId}>{date(c.startedAt)} · {c.title || c.callId.slice(-8)}</option>)}
            </select>
            <button className={`${primary} mt-2 mr-2`} disabled={locked || !choice} onClick={() => void update(() => replace({ scenarioId: slot.scenarioId, callId: choice }))}>Save selection</button>
          </>}
          <button className={`${button} mt-2`} disabled={saving} onClick={() => { setPicker(null); setChoice(""); }}>Cancel</button>
        </div>}
      </article>)}
    </div>
  </section>;
}
