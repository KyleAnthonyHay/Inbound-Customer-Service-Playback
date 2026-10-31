"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronDown, ChevronRight, Activity, Loader2, AlertTriangle } from "lucide-react";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";
import { useConvexReady } from "./ConvexClientProvider";
import { cn } from "@/lib/cn";
import type { ActivityEvent, CallStatus, TranscriptLine } from "@/lib/useVapiCall";
import { config } from "@/lib/config";

type Props = {
  open: boolean;
  onToggle: () => void;
  callId: string | null;
  status: CallStatus;
  startedAt: number | null;
  clientEvents: ActivityEvent[];
  transcript: TranscriptLine[];
};

type Step = {
  id: string;
  at: number;
  label: string;
  status: "running" | "succeeded" | "failed" | "info";
  durationMs?: number;
  source: "live" | "simulated" | "internal" | "client";
  detail?: string;
};

const SOURCE_META = {
  live: { name: "Apple", dot: "bg-sky-400", text: "text-sky-300" },
  simulated: { name: "Simulated", dot: "bg-amber-400", text: "text-amber-300" },
  internal: { name: "Docs", dot: "bg-white/60", text: "text-white/60" },
  client: { name: "Call", dot: "bg-white/40", text: "text-white/50" },
} as const;

export function ActivityPanel(props: Props) {
  const ready = useConvexReady();
  return ready ? <ActivityPanelLive {...props} /> : <ActivityPanelView {...props} serverEvents={[]} />;
}

function ActivityPanelLive(props: Props) {
  const serverEvents = useQuery(api.callEvents.byCall, config.convexUrl ? { callId: props.callId ?? "" } : "skip") ?? [];
  return <ActivityPanelView {...props} serverEvents={serverEvents} />;
}

function useElapsedLabel(startedAt: number | null, status: CallStatus) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    if (status !== "active") return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [status]);
  if (!startedAt) return status === "connecting" ? "Connecting" : "Ready";
  const end = now ?? startedAt;
  const s = Math.max(0, Math.round((end - startedAt) / 1000));
  const txt = s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`;
  return status === "active" ? `Working for ${txt}` : `Worked for ${txt}`;
}

function buildSteps(serverEvents: Doc<"callEvents">[], clientEvents: ActivityEvent[]): Step[] {
  const byToolCall = new Map<string, Step>();
  const steps: Step[] = [];
  for (const e of serverEvents) {
    const key = e.toolCallId ?? e._id;
    const existing = byToolCall.get(key);
    if (e.kind === "tool-start") {
      const row: Step = { id: key, at: e.at, label: e.label, status: "running", source: e.source };
      byToolCall.set(key, row);
      steps.push(row);
    } else if (e.kind === "tool-end" && existing) {
      existing.status = e.status ?? "succeeded";
      existing.durationMs = e.durationMs;
      existing.detail = e.detail;
    } else {
      steps.push({ id: e._id, at: e.at, label: e.label, status: e.status ?? "info", source: e.source, detail: e.detail });
    }
  }
  for (const c of clientEvents) {
    if (c.kind === "tool-call" || c.kind === "tool-result" || c.kind === "speech") continue;
    steps.push({ id: c.id, at: c.at, label: c.label, status: c.status ?? "info", source: "client", detail: c.detail });
  }
  return steps.sort((a, b) => a.at - b.at);
}

function ActivityPanelView({
  open, onToggle, callId, status, startedAt, clientEvents, transcript, serverEvents,
}: Props & { serverEvents: Doc<"callEvents">[] }) {
  const reduce = useReducedMotion();
  const [cardOpen, setCardOpen] = useState(true);
  const [showTranscript, setShowTranscript] = useState(false);
  const elapsed = useElapsedLabel(startedAt, status);
  const steps = useMemo(() => buildSteps(serverEvents, clientEvents), [serverEvents, clientEvents]);

  const running = steps.filter((s) => s.status === "running");
  const failed = steps.filter((s) => s.status === "failed");
  const liveCount = steps.filter((s) => s.source === "live").length;
  const simCount = steps.filter((s) => s.source === "simulated").length;
  const toolCount = steps.filter((s) => s.source !== "client").length;
  const lastAssistant = [...transcript].reverse().find((t) => t.role === "assistant");
  const lastCaller = [...transcript].reverse().find((t) => t.role === "user");

  const statusLine =
    running.length > 0
      ? running[running.length - 1].label
      : status === "connecting"
        ? "Connecting to the assistant"
        : status === "active"
          ? "Listening"
          : status === "ended"
            ? "Call ended"
            : status === "error"
              ? "Call failed"
              : null;

  const pill = {
    idle: ["Ready", "bg-white/40"],
    connecting: ["Connecting", "bg-amber-400"],
    active: ["Live", "bg-accent"],
    ended: ["Ended", "bg-white/40"],
    error: ["Failed", "bg-danger"],
  }[status];

  const item = {
    initial: reduce ? { opacity: 1 } : { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0 },
    transition: { duration: 0.22, ease: "easeOut" as const },
  };

  return (
    <aside
      className={cn(
        "fixed inset-y-0 right-0 z-20 flex w-[380px] max-w-[92vw] flex-col border-l border-white/10 bg-[#111113]/95 backdrop-blur transition-transform",
        open ? "translate-x-0" : "translate-x-full"
      )}
      aria-label="Agent activity"
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-label={open ? "Hide agent activity" : "Show agent activity"}
        className="absolute -left-10 top-4 flex h-10 w-10 items-center justify-center rounded-l-xl border border-r-0 border-white/10 bg-[#111113]/95 text-white/80"
      >
        {open ? <ChevronRight size={18} /> : <Activity size={18} />}
      </button>

      <div className="flex-1 overflow-y-auto px-4 pb-4 pt-5">
        {/* "Thinking 2s" style header */}
        <button
          type="button"
          onClick={() => setCardOpen((o) => !o)}
          aria-expanded={cardOpen}
          className="flex items-center gap-1.5 text-[13px] text-white/60 hover:text-white/80"
        >
          {cardOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <span>{elapsed}</span>
        </button>

        <AnimatePresence initial={false}>
          {cardOpen && (
            <motion.section
              key="card"
              initial={reduce ? false : { opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]"
            >
              <header className="flex items-center justify-between px-4 pt-3.5">
                <h2 className="text-[14px] font-medium">Playback support call</h2>
                <span className="flex items-center gap-1.5 text-[12px] text-white/70">
                  <span className={cn("h-1.5 w-1.5 rounded-full", pill[1])} aria-hidden />
                  {pill[0]}
                </span>
              </header>

              {/* Step rail */}
              <ol className="relative mt-2 px-4 pb-1">
                {steps.length > 1 && <span aria-hidden className="absolute left-[23px] top-3 bottom-3 w-px bg-white/10" />}
                <AnimatePresence initial={false}>
                  {steps.map((s) => {
                    const meta = SOURCE_META[s.source];
                    const done = s.status === "succeeded" || s.status === "info";
                    return (
                      <motion.li key={s.id} layout="position" {...item} className="relative flex items-center gap-3 py-[7px] pl-1">
                        <span className="relative flex h-3.5 w-3.5 items-center justify-center">
                          {s.status === "running" ? (
                            <Loader2 size={14} className="animate-spin text-white/80" aria-label="running" />
                          ) : s.status === "failed" ? (
                            <span className="h-2 w-2 rounded-full bg-danger" aria-label="failed" />
                          ) : (
                            <span className={cn("h-2 w-2 rounded-full", meta.dot)} aria-label={done ? "done" : s.status} />
                          )}
                        </span>
                        <span className={cn("flex-1 truncate text-[13px]", done ? "text-white/85" : "text-white", s.status === "failed" && "text-white/85")}>
                          {s.label}
                          {s.detail && s.status === "failed" && <span className="ml-2 text-[12px] text-amber-300/90">{s.detail}</span>}
                        </span>
                        <span className="shrink-0 font-mono text-[11px] text-white/40">
                          {typeof s.durationMs === "number" && <span className="mr-2 text-white/55">{s.durationMs} ms</span>}
                          <span className={meta.text}>{meta.name}</span>
                        </span>
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
                {steps.length === 0 && (
                  <li className="py-2 pl-1 text-[13px] text-white/45">No steps yet. Start a call and tool activity will appear here.</li>
                )}
              </ol>

              {/* Status line, like "Pushing 3 commits to origin" */}
              {statusLine && (
                <div className="flex items-center gap-2 border-t border-white/[0.06] px-4 py-2.5 text-[13px] text-white/60">
                  {running.length > 0 ? (
                    <Loader2 size={13} className="animate-spin" aria-hidden />
                  ) : failed.length > 0 && status !== "active" ? (
                    <AlertTriangle size={13} className="text-amber-300" aria-hidden />
                  ) : (
                    <span className={cn("h-1.5 w-1.5 rounded-full", status === "active" ? "bg-accent" : "bg-white/30")} aria-hidden />
                  )}
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span key={statusLine} {...item}>{statusLine}</motion.span>
                  </AnimatePresence>
                </div>
              )}
            </motion.section>
          )}
        </AnimatePresence>

        {/* Natural-language message under the card */}
        <AnimatePresence initial={false}>
          {lastAssistant && (
            <motion.p key={lastAssistant.id} {...item} className="mt-4 text-[14px] leading-relaxed text-white/90">
              {lastAssistant.text}
            </motion.p>
          )}
        </AnimatePresence>
        {lastCaller && <p className="mt-2 text-[13px] leading-relaxed text-white/50">Caller: {lastCaller.text}</p>}

        {/* Summary chip */}
        <div className="mt-4 flex flex-wrap items-center gap-2 text-[12px] text-white/60">
          <span className="flex items-center gap-1.5 rounded-full border border-white/10 px-2.5 py-1">
            <span className={cn("h-1.5 w-1.5 rounded-full", pill[1])} aria-hidden />
            {callId ? `Call ${callId.slice(0, 8)}` : "No call"}
          </span>
          <span className="rounded-full border border-white/10 px-2.5 py-1">
            {toolCount} tool{toolCount === 1 ? "" : "s"} · <span className="text-sky-300">{liveCount} live</span> ·{" "}
            <span className="text-amber-300">{simCount} simulated</span>
          </span>
          {transcript.length > 0 && (
            <button
              type="button"
              onClick={() => setShowTranscript((v) => !v)}
              aria-expanded={showTranscript}
              className="rounded-full border border-white/10 px-2.5 py-1 hover:bg-white/5"
            >
              Transcript {transcript.length} {showTranscript ? "▾" : "▸"}
            </button>
          )}
        </div>

        {showTranscript && (
          <ul className="mt-3 space-y-1.5 border-t border-white/10 pt-3">
            {transcript.map((t) => (
              <li key={t.id} className={cn("text-[13px] leading-snug", t.role === "assistant" ? "text-white/85" : "text-white/50")}>
                <span className="mr-1 text-[10px] uppercase text-white/40">{t.role === "assistant" ? "Agent" : "Caller"}</span>
                {t.text}
              </li>
            ))}
          </ul>
        )}
      </div>

      <footer className="border-t border-white/10 px-4 py-2 text-[11px] leading-snug text-white/40">
        Apple = live App Store lookup. Simulated = demo customers, teams, callbacks; not MultiTracks systems. Docs = bounded help-center snapshot.
      </footer>
    </aside>
  );
}
