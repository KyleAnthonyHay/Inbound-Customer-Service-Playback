"use client";

import { useQuery } from "convex/react";
import type { Doc } from "../../convex/_generated/dataModel";
import { useConvexReady } from "./ConvexClientProvider";
import { api } from "../../convex/_generated/api";
import { CheckCircle2, CircleDashed, XCircle, ChevronRight, Activity } from "lucide-react";
import { cn } from "@/lib/cn";
import type { ActivityEvent, TranscriptLine } from "@/lib/useVapiCall";
import { config } from "@/lib/config";

type Props = {
  open: boolean;
  onToggle: () => void;
  callId: string | null;
  clientEvents: ActivityEvent[];
  transcript: TranscriptLine[];
};

type Row = {
  id: string;
  at: number;
  label: string;
  status?: "running" | "succeeded" | "failed";
  durationMs?: number;
  source: "live" | "simulated" | "internal" | "client";
  detail?: string;
};

function StatusIcon({ status }: { status?: Row["status"] }) {
  if (status === "succeeded") return <CheckCircle2 size={16} className="text-accent" />;
  if (status === "failed") return <XCircle size={16} className="text-danger" />;
  if (status === "running") return <CircleDashed size={16} className="animate-spin text-white/70" />;
  return <span className="inline-block h-4 w-4 rounded-full border border-white/20" />;
}

function SourceTag({ source }: { source: Row["source"] }) {
  const map = {
    live: ["Live API", "border-sky-400/40 text-sky-300"],
    simulated: ["Simulated", "border-amber-400/40 text-amber-300"],
    internal: ["Docs", "border-white/20 text-white/60"],
    client: ["Call", "border-white/20 text-white/60"],
  } as const;
  const [text, cls] = map[source];
  return <span className={cn("rounded-full border px-1.5 py-px text-[10px] uppercase tracking-wide", cls)}>{text}</span>;
}

export function ActivityPanel(props: Props) {
  const ready = useConvexReady();
  return ready ? <ActivityPanelLive {...props} /> : <ActivityPanelRows {...props} serverEvents={[]} />;
}

function ActivityPanelLive(props: Props) {
  const serverEvents = useQuery(api.callEvents.byCall, config.convexUrl ? { callId: props.callId ?? "" } : "skip") ?? [];
  return <ActivityPanelRows {...props} serverEvents={serverEvents} />;
}

function ActivityPanelRows({ open, onToggle, callId, clientEvents, transcript, serverEvents }: Props & { serverEvents: Doc<"callEvents">[] }) {

  // Collapse tool-start/tool-end pairs into one row keyed by toolCallId.
  const byToolCall = new Map<string, Row>();
  const rows: Row[] = [];
  for (const e of serverEvents) {
    const key = e.toolCallId ?? e._id;
    const existing = byToolCall.get(key);
    if (e.kind === "tool-start") {
      const row: Row = { id: key, at: e.at, label: e.label, status: "running", source: e.source };
      byToolCall.set(key, row);
      rows.push(row);
    } else if (e.kind === "tool-end" && existing) {
      existing.status = e.status;
      existing.durationMs = e.durationMs;
      existing.detail = e.detail;
    } else {
      rows.push({ id: e._id, at: e.at, label: e.label, status: e.status, source: e.source, detail: e.detail });
    }
  }
  for (const c of clientEvents) {
    if (c.kind === "tool-call" || c.kind === "tool-result") continue; // server rows are authoritative
    rows.push({ id: c.id, at: c.at, label: c.label, status: c.status, source: "client", detail: c.detail });
  }
  rows.sort((a, b) => a.at - b.at);

  return (
    <aside
      className={cn(
        "fixed inset-y-0 right-0 z-20 flex w-[340px] max-w-[90vw] flex-col border-l border-white/10 bg-surface/95 backdrop-blur transition-transform",
        open ? "translate-x-0" : "translate-x-full"
      )}
      aria-label="Agent activity"
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="absolute -left-10 top-4 flex h-10 w-10 items-center justify-center rounded-l-xl border border-r-0 border-white/10 bg-surface/95 text-white/80"
      >
        {open ? <ChevronRight size={18} /> : <Activity size={18} />}
      </button>

      <header className="border-b border-white/10 px-4 py-3">
        <h2 className="text-sm font-medium">Agent activity</h2>
        <p className="text-xs text-muted">
          {callId ? `Call ${callId.slice(0, 8)}…` : "No active call"} · events come from real tool calls
        </p>
      </header>

      <div className="flex-1 overflow-y-auto px-3 py-2">
        {rows.length === 0 && <p className="px-1 py-6 text-center text-xs text-muted">Start a call to see activity.</p>}
        <ul className="space-y-1.5">
          {rows.map((r) => (
            <li key={r.id} className="rounded-lg bg-surface-2 px-3 py-2">
              <div className="flex items-center gap-2">
                <StatusIcon status={r.status} />
                <span className="flex-1 truncate text-sm">{r.label}</span>
                {typeof r.durationMs === "number" && (
                  <span className="font-mono text-[11px] text-muted">{r.durationMs} ms</span>
                )}
              </div>
              <div className="mt-1 flex items-center gap-2 pl-6">
                <SourceTag source={r.source} />
                {r.detail && <span className="truncate text-[11px] text-muted">{r.detail}</span>}
              </div>
            </li>
          ))}
        </ul>

        {transcript.length > 0 && (
          <section className="mt-4 border-t border-white/10 pt-3">
            <h3 className="mb-2 text-xs font-medium text-muted">Transcript</h3>
            <ul className="space-y-1.5">
              {transcript.map((t) => (
                <li key={t.id} className={cn("text-[13px] leading-snug", t.role === "assistant" ? "text-white/90" : "text-sky-200")}>
                  <span className="mr-1 text-[10px] uppercase text-muted">{t.role === "assistant" ? "Agent" : "Caller"}</span>
                  {t.text}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <footer className="border-t border-white/10 px-4 py-2 text-[11px] text-muted">
        Live API = Apple App Store lookup. Simulated = demo customers, teams, callbacks. Not MultiTracks systems.
      </footer>
    </aside>
  );
}
