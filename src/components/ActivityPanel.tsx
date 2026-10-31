"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronDown, ChevronRight, Activity, Loader2, AlertTriangle, X } from "lucide-react";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";
import { useConvexReady } from "./ConvexClientProvider";
import { cn } from "@/lib/cn";
import type { ActivityEvent, CallStatus, TranscriptLine } from "@/lib/useVapiCall";
import type { ToolSource } from "@/lib/tools/meta";
import { config } from "@/lib/config";

type Props = {
  open: boolean;
  onToggle: () => void;
  callId: string | null;
  status: CallStatus;
  startedAt: number | null;
  assistantSpeaking: boolean;
  clientEvents: ActivityEvent[];
  transcript: TranscriptLine[];
};

type Step = {
  id: string;
  at: number;
  label: string;
  status: "running" | "succeeded" | "failed" | "info";
  durationMs?: number;
  source: ToolSource | "call";
  detail?: string;
};

/** Source name + dot color, matched to the reference: blue / teal / amber dots. */
const SOURCE = {
  live: { name: "Apple", dot: "bg-[#2f80ed]", text: "text-[#2f80ed]" },
  simulated: { name: "Simulated", dot: "bg-[#e5a100]", text: "text-[#b57c00]" },
  internal: { name: "Docs", dot: "bg-[#1aa37a]", text: "text-[#1aa37a]" },
  model: { name: "Model", dot: "bg-[#8e8e93]", text: "text-[#8e8e93]" },
  call: { name: "Call", dot: "bg-[#8e8e93]", text: "text-[#8e8e93]" },
} as const;

export function ActivityPanel(props: Props) {
  const ready = useConvexReady();
  return ready ? <Live {...props} /> : <View {...props} serverEvents={[]} />;
}

function Live(props: Props) {
  const serverEvents = useQuery(api.callEvents.byCall, config.convexUrl ? { callId: props.callId ?? "" } : "skip") ?? [];
  return <View {...props} serverEvents={serverEvents} />;
}

function useElapsedLabel(startedAt: number | null, status: CallStatus) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    if (status !== "active") return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [status]);
  if (!startedAt) return status === "connecting" ? "Connecting" : "Ready";
  const s = Math.max(0, Math.round(((now ?? startedAt) - startedAt) / 1000));
  const txt = s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`;
  return status === "active" ? `Working for ${txt}` : `Worked for ${txt}`;
}

/** Client rows appear instantly; server log rows (provenance, measured duration) merge in by toolCallId. */
function buildSteps(serverEvents: Doc<"callEvents">[], clientEvents: ActivityEvent[]): Step[] {
  const byKey = new Map<string, Step>();
  const order: Step[] = [];
  const upsert = (key: string, make: () => Step, patch?: (s: Step) => void) => {
    let s = byKey.get(key);
    if (!s) {
      s = make();
      byKey.set(key, s);
      order.push(s);
    }
    patch?.(s);
  };
  for (const c of clientEvents) {
    if (c.kind === "speech") continue;
    const key = c.toolCallId ?? c.id;
    upsert(key, () => ({ id: key, at: c.at, label: c.label, status: c.status ?? "info", source: c.source ?? "call", detail: c.detail, durationMs: c.durationMs }), (s) => {
      s.status = c.status ?? s.status;
      s.durationMs = c.durationMs ?? s.durationMs;
      s.detail = c.detail ?? s.detail;
    });
  }
  for (const e of serverEvents) {
    const key = e.toolCallId ?? e._id;
    if (e.kind === "tool-start") {
      upsert(key, () => ({ id: key, at: e.at, label: e.label, status: "running", source: e.source }), (s) => {
        s.source = e.source;
        s.label = e.label;
      });
    } else if (e.kind === "tool-end") {
      upsert(key, () => ({ id: key, at: e.at, label: e.label, status: e.status ?? "succeeded", source: e.source }), (s) => {
        s.status = e.status ?? "succeeded";
        s.durationMs = e.durationMs ?? s.durationMs;
        s.detail = e.detail ?? s.detail;
        s.source = e.source;
      });
    } else {
      upsert(e._id, () => ({ id: e._id, at: e.at, label: e.label, status: e.status ?? "info", source: e.source, detail: e.detail }));
    }
  }
  return order.sort((a, b) => a.at - b.at);
}

function View({ open, onToggle, callId, status, startedAt, assistantSpeaking, clientEvents, transcript, serverEvents }: Props & { serverEvents: Doc<"callEvents">[] }) {
  const reduce = useReducedMotion();
  const [cardOpen, setCardOpen] = useState(true);
  const [showTranscript, setShowTranscript] = useState(false);
  const elapsed = useElapsedLabel(startedAt, status);
  const steps = useMemo(() => buildSteps(serverEvents, clientEvents), [serverEvents, clientEvents]);

  const running = steps.filter((s) => s.status === "running");
  const failed = steps.filter((s) => s.status === "failed");
  const tools = steps.filter((s) => s.source !== "call" && s.source !== "model");
  const liveCount = tools.filter((s) => s.source === "live").length;
  const simCount = tools.filter((s) => s.source === "simulated").length;
  const lastAssistant = [...transcript].reverse().find((t) => t.role === "assistant");
  const lastCaller = [...transcript].reverse().find((t) => t.role === "user");

  const statusLine =
    status === "connecting" ? "Connecting to the assistant"
    : status === "active" && running.length ? running[running.length - 1].label
    : status === "active" && assistantSpeaking ? "Speaking"
    : status === "active" ? "Listening"
    : status === "ended" ? "Call ended"
    : status === "error" ? "Call failed"
    : null;
  const busy = status === "connecting" || (status === "active" && running.length > 0);

  const pill = {
    idle: ["Ready", "bg-[#8e8e93]"],
    connecting: ["Connecting", "bg-[#e5a100]"],
    active: ["Live", "bg-[#1aa37a]"],
    ended: ["Ended", "bg-[#8e8e93]"],
    error: ["Failed", "bg-[#e5484d]"],
  }[status];

  const reveal = {
    initial: reduce ? { opacity: 1 } : { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0 },
    transition: { duration: 0.28, ease: [0.2, 0.8, 0.2, 1] as const },
  };

  return (
    <aside
      className={cn(
        "fixed inset-y-0 right-0 z-20 flex w-[400px] max-w-[94vw] flex-col border-l border-black/10 bg-white text-[#1a1a1a] shadow-[-20px_0_60px_rgba(0,0,0,0.25)] transition-transform duration-300",
        open ? "translate-x-0" : "translate-x-full"
      )}
      style={{ fontFamily: "var(--font-geist-sans), -apple-system, system-ui, sans-serif" }}
      aria-label="Agent activity"
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-label={open ? "Hide agent activity" : "Show agent activity"}
        className={cn(
          "absolute -left-11 top-4 flex h-10 w-10 items-center justify-center rounded-xl border text-sm",
          open ? "border-black/10 bg-white text-[#1a1a1a]" : "border-white/10 bg-[#111113]/95 text-white/80"
        )}
      >
        {open ? <X size={18} /> : <Activity size={18} />}
      </button>

      <div className="flex-1 overflow-y-auto px-5 pb-5 pt-6">
        {/* "Thinking 2s" header */}
        <button type="button" onClick={() => setCardOpen((o) => !o)} aria-expanded={cardOpen} className="flex items-center gap-1.5 text-[13px] text-[#6b6b70] hover:text-[#1a1a1a]">
          {cardOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <AnimatePresence mode="wait" initial={false}>
            <motion.span key={elapsed} {...reveal}>{elapsed}</motion.span>
          </AnimatePresence>
        </button>

        <AnimatePresence initial={false}>
          {cardOpen && (
            <motion.section
              key="card"
              initial={reduce ? false : { opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22 }}
              className="mt-3 overflow-hidden rounded-xl border border-black/[0.07] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
            >
              <header className="flex items-center justify-between px-4 pt-3.5">
                <h2 className="text-[13.5px] font-semibold">Playback support call</h2>
                <span className="flex items-center gap-1.5 text-[12px] text-[#6b6b70]">
                  <span className={cn("h-1.5 w-1.5 rounded-full", pill[1])} aria-hidden />
                  {pill[0]}
                </span>
              </header>

              {/* Rail */}
              <ol className="relative mt-1.5 px-4 pb-1">
                {steps.length > 1 && <span aria-hidden className="absolute bottom-[18px] left-[22.5px] top-[14px] w-px bg-black/[0.08]" />}
                <AnimatePresence initial={false}>
                  {steps.map((s) => {
                    const meta = SOURCE[s.source];
                    const done = s.status === "succeeded" || s.status === "info";
                    return (
                      <motion.li key={s.id} layout="position" {...reveal} className="relative flex items-center gap-3 py-[6px]">
                        <span className="relative z-[1] flex h-[14px] w-[14px] items-center justify-center rounded-full bg-white">
                          {s.status === "running" ? (
                            <Loader2 size={13} className="animate-spin text-[#1a1a1a]/70" aria-label="running" />
                          ) : s.status === "failed" ? (
                            <span className="h-2 w-2 rounded-full bg-[#e5484d]" aria-label="failed" />
                          ) : (
                            <span className={cn("h-2 w-2 rounded-full", meta.dot)} aria-label={done ? "done" : s.status} />
                          )}
                        </span>
                        <span className={cn("flex-1 truncate text-[13px]", s.status === "running" ? "text-[#1a1a1a]" : "text-[#1a1a1a]/80")}>
                          {s.label}
                          {s.detail && s.status === "failed" && <span className="ml-2 text-[12px] text-[#b57c00]">{s.detail}</span>}
                        </span>
                        <span className="shrink-0 font-mono text-[11px] text-[#9a9aa0]">
                          {typeof s.durationMs === "number" && <span className="mr-2">{s.durationMs} ms</span>}
                          <span className={meta.text}>{meta.name}</span>
                        </span>
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
                {steps.length === 0 && <li className="py-2 text-[13px] text-[#9a9aa0]">No steps yet. Start a call and activity appears here.</li>}
              </ol>

              {/* Status line, like "Pushing 3 commits to origin" */}
              {statusLine && (
                <div className="flex items-center gap-2 border-t border-black/[0.06] px-4 py-2.5 text-[13px] text-[#6b6b70]">
                  {busy ? (
                    <Loader2 size={13} className="animate-spin" aria-hidden />
                  ) : failed.length > 0 && status !== "active" ? (
                    <AlertTriangle size={13} className="text-[#b57c00]" aria-hidden />
                  ) : (
                    <span className={cn("h-1.5 w-1.5 rounded-full", status === "active" ? (assistantSpeaking ? "bg-[#1aa37a] animate-pulse" : "bg-[#1aa37a]") : "bg-[#c7c7cc]")} aria-hidden />
                  )}
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span key={statusLine} {...reveal}>{statusLine}</motion.span>
                  </AnimatePresence>
                </div>
              )}
            </motion.section>
          )}
        </AnimatePresence>

        {/* Message under the card */}
        <AnimatePresence initial={false}>
          {lastAssistant && (
            <motion.p key={lastAssistant.id} {...reveal} className="mt-4 text-[14px] leading-relaxed text-[#1a1a1a]">
              {lastAssistant.text}
            </motion.p>
          )}
        </AnimatePresence>
        {lastCaller && <p className="mt-2 text-[13px] leading-relaxed text-[#6b6b70]">Caller: {lastCaller.text}</p>}

        {/* Chips */}
        <div className="mt-4 flex flex-wrap items-center gap-2 text-[12px] text-[#6b6b70]">
          <span className="flex items-center gap-1.5 rounded-full border border-black/10 px-2.5 py-1">
            <span className={cn("h-1.5 w-1.5 rounded-full", pill[1])} aria-hidden />
            {callId ? `Call ${callId.slice(0, 8)}` : "No call"}
          </span>
          <span className="rounded-full border border-black/10 px-2.5 py-1">
            {tools.length} tool{tools.length === 1 ? "" : "s"} · <span className={SOURCE.live.text}>{liveCount} live</span> ·{" "}
            <span className={SOURCE.simulated.text}>{simCount} simulated</span>
          </span>
          {transcript.length > 0 && (
            <button type="button" onClick={() => setShowTranscript((v) => !v)} aria-expanded={showTranscript} className="rounded-full border border-black/10 px-2.5 py-1 hover:bg-black/[0.03]">
              Transcript {transcript.length} {showTranscript ? "▾" : "▸"}
            </button>
          )}
        </div>

        {showTranscript && (
          <ul className="mt-3 space-y-1.5 border-t border-black/[0.08] pt-3">
            {transcript.map((t) => (
              <li key={t.id} className={cn("text-[13px] leading-snug", t.role === "assistant" ? "text-[#1a1a1a]" : "text-[#6b6b70]")}>
                <span className="mr-1 text-[10px] uppercase text-[#9a9aa0]">{t.role === "assistant" ? "Agent" : "Caller"}</span>
                {t.text}
              </li>
            ))}
          </ul>
        )}
      </div>

      <footer className="border-t border-black/[0.08] px-5 py-2 text-[11px] leading-snug text-[#9a9aa0]">
        Apple = live App Store lookup. Simulated = demo customers, teams, callbacks; not MultiTracks systems. Docs = bounded help-center snapshot. Model = GPT-Live reasoning.
      </footer>
    </aside>
  );
}
