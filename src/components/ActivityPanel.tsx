"use client";

/*
 * Motion spec, measured from the reference reel (Instagram, 1440x2560 @ 30 fps; the agent card is a
 * screen recording of a "generative UI" coding-agent panel). Stepped frame by frame at 30 fps, so
 * 1 frame = 33 ms. Distances are in the recording's pixels; one row pitch there = 41 px (28 px here).
 *
 * Overall feel: fast, crisp, no springs and no overshoot anywhere. Movement only happens when layout
 *   changes (rows pushed down); everything else is opacity + blur clearing in place, no translate.
 *   Layout curve fits ease-out-quart, cubic-bezier(0.25, 1, 0.5, 1).
 *
 * Row insertion (the reference puts newest on top; this panel lists steps oldest first to match the
 * conversation, so new rows land at the bottom), frames 113-136:
 *   1. Gap opens first. Rows below are pushed down by one row height. Measured gap: 0 / 40% / 66% / 78% /
 *      88% / 95% / 100% at 0 / 33 / 67 / 100 / 133 / 167 / ~230 ms -> 280 ms ease-out-quart, no bounce.
 *   2. The gap stays empty until it has (nearly) settled; content appears ~230 ms after the gap began
 *      (f113 -> f121). Content reveal: opacity 0 -> 1 with blur ~8px -> 0 (f121 heavy blur, f122 half,
 *      f123 slight, f124 sharp) = ~130 ms, ease-out. No vertical offset. Right-hand meta reveals with it.
 *   3. New-row wash: a warm tint behind the new row fades in with the content, holds ~700 ms, then
 *      fades out over ~300 ms (gone ~1.1 s after it appeared). Not shown on the initial cascade.
 *   4. Label decodes: the resolved prefix grows left -> right (linear), ~26 ms/char (19 chars ~470 ms,
 *      25 chars ~800 ms), followed by a tail of ~8 random [a-z0-9] glyphs in the SAME color, re-rolled
 *      every frame (33 ms): "Rox18o rgh" -> "Rotate 6a316gh" -> "Rotate sess4nh" -> "Rotate session keys".
 *      A label that changes in place decodes the same way, with no gap step.
 *   5. Two rows arriving together go one after another, the lower (older) first, ~250 ms apart
 *      (second gap f120-127, second content f129).
 *   Initial build (frames 14-23): rows cascade bottom-up, ~50 ms apart, each a ~150 ms blur reveal.
 *
 * Running -> done (frames 162-168): the spinner is cut in <= 1 frame; the new icon blur-fades in
 *   (blur ~4px -> 0, opacity 0 -> 1) over ~100-130 ms after a 1-frame gap, same size, no scale pop.
 *   Label color tweens in ~120 ms. Right-hand meta ("checking" -> "3 conflicts") does the same blur swap.
 *
 * Status line ("Fetching main" -> "Checking it merges cleanly", frames 129-133 and 48-52):
 *   old text blurs/fades out in ~1 frame (50 ms), one empty frame, new text sharpens from blur ~6px over
 *   ~3 frames (120 ms). No slide. While busy the text shimmers: a lower-contrast band ~1/3 of the text
 *   wide sweeps left -> right in ~500 ms, then ~700 ms of rest (period ~1.2 s, linear). The busy
 *   spinner turns continuously (~0.8 s/rev). "Thinking" in the header carries the same shimmer.
 *
 * Header counter ("Thinking 1s" -> "2s", frames 64-65): a hard cut, no tween. Only the label word
 *   ("Thinking" -> "Worked for") gets the blur swap.
 *
 * Streamed text (the agent's paragraph, frames 177-211): words arrive ~26/s (~38 ms/word); each word
 *   sharpens from blur ~6px and low opacity over ~180 ms, so the leading 2-3 words are always soft.
 *   Used here for transcript lines: a new line blur-reveals in ~130 ms, the newest agent line streams.
 *
 * Reduced motion: no movement, no blur, no decode, no shimmer; final states render immediately.
 */

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useMutation, useQuery, usePaginatedQuery } from "convex/react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";
import { ChevronDown, ChevronRight, Activity, AlertTriangle, Archive, ArchiveRestore, Trash2, Wrench, X, Headset, User } from "lucide-react";
import { PERSONA_NAME } from "@/lib/voicePolicy";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";
import { useConvexReady } from "./ConvexClientProvider";
import { cn } from "@/lib/cn";
import type { ActivityEvent, CallStatus, TranscriptLine } from "@/lib/useVapiCall";
import type { ToolSource } from "@/lib/tools/meta";
import { config } from "@/lib/config";
import { formatCallerNumber } from "@/lib/tools/callerId";
import { CallMetrics, CallMetricsOverview } from "./CallMetrics";
import { DemoCallsPanel, type DemoCallsData } from "./DemoCallsPanel";

type Props = {
  open: boolean;
  onToggle: () => void;
  callId: string | null;
  status: CallStatus;
  startedAt: number | null;
  assistantSpeaking: boolean;
  handoff?: { team: string; at: number } | null;
  clientEvents: ActivityEvent[];
  transcript: TranscriptLine[];
  /** Open a past call (from the history list) in the panel. */
  onOpenPastCall?: (callId: string) => void;
  /** The single agent instance picked up a call on another channel (phone, harness); the page may open the panel. */
  onRemoteCall?: (callId: string) => void;
  onClearPanel?: () => void;
  viewingHistory?: boolean;
};

type ViewData = {
  demoData?: DemoCallsData;
  metrics?: React.ReactNode;
  metricsOverview?: React.ReactNode;
  serverEvents: Doc<"callEvents">[];
  pastCalls: Doc<"calls">[];
  callRow: Doc<"calls"> | null;
  storedTranscript: Doc<"transcripts">[];
  onClearHistory?: () => Promise<unknown>;
  onArchiveCall?: (callId: string) => Promise<unknown>;
  onRestoreCall?: (callId: string) => Promise<unknown>;
  onDeleteCall?: (callId: string) => Promise<unknown>;
  savedCalls?: Doc<"calls">[];
  onLoadHistory?: () => void;
  historyHasMore?: boolean;
  historyLoading?: boolean;
};

type Step = {
  id: string;
  at: number;
  label: string;
  status: "running" | "succeeded" | "failed" | "info";
  durationMs?: number;
  source: ToolSource | "call";
  detail?: string;
  /** Raw function name, e.g. get_callback_slots. */
  tool?: string;
  /** JSON (truncated) from the server log. */
  args?: string;
  output?: string;
};

const ACTIVITY_COLOR = {
  connecting: "255, 159, 10",
  connected: "99, 211, 146",
  thinking: "194, 164, 255",
  tool: "122, 184, 255",
  failed: "255, 138, 143",
  idle: "161, 161, 166",
};

function stepColor(step: Step): string {
  if (step.status === "failed") return ACTIVITY_COLOR.failed;
  if (step.tool === "delegate") return ACTIVITY_COLOR.thinking;
  if (step.tool) return ACTIVITY_COLOR.tool;
  if (step.source === "model") return ACTIVITY_COLOR.thinking;
  if (step.label === "Connecting") return ACTIVITY_COLOR.connecting;
  if (step.label === "Connected" || step.label.startsWith("Call connected")) return ACTIVITY_COLOR.connected;
  return ACTIVITY_COLOR.idle;
}

/** Provenance badges retain their secondary source colors. */
const SOURCE = {
  live: { name: "Apple", dot: "bg-[#4c9dff]", text: "text-[#6fb0ff]", tag: "bg-[#4c9dff]/[0.14] text-[#8cc0ff]" },
  simulated: { name: "Simulated", dot: "bg-[#f5b83d]", text: "text-[#f5c45e]", tag: "bg-[#f5b83d]/[0.14] text-[#f7cb72]" },
  internal: { name: "Docs", dot: "bg-[#34c79a]", text: "text-[#4fd3a8]", tag: "bg-[#34c79a]/[0.14] text-[#6edcb8]" },
  model: { name: "Model", dot: "bg-[#8e8e93]", text: "text-[#a1a1a6]", tag: "bg-white/[0.08] text-white/60" },
  call: { name: "Call", dot: "bg-[#8e8e93]", text: "text-[#a1a1a6]", tag: "bg-white/[0.08] text-white/60" },
} as const;

/** ease-out-quart: fits the measured gap curve (40% at 33 ms, 95% at 167 ms of a 280 ms move). */
const EASE = [0.25, 1, 0.5, 1] as const;
const BLUR_IN = { opacity: 0, filter: "blur(6px)" };
const ROW_IN = { opacity: 0, filter: "blur(8px)" };
const ICON_IN = { opacity: 0, filter: "blur(4px)" };
const SHARP = { opacity: 1, filter: "blur(0px)" };
const ROW_H = 28;
/** Seconds. */
const GAP = 0.28; // gap opens / rows pushed down
const REVEAL_DELAY = 0.23; // content waits for the gap
const REVEAL = 0.13; // content blur -> sharp
const SWAP_OUT = 0.05; // old text/icon cut
const SWAP_IN = 0.12; // new text/icon sharpens
const INSERT_STAGGER = 0.25; // rows arriving together, lower first
const INTRO_STAGGER = 0.05; // initial bottom-up cascade
const MS_PER_CHAR = 26;

export function ActivityPanel(props: Props) {
  const ready = useConvexReady();
  return ready ? <Live {...props} /> : <View {...props} serverEvents={[]} pastCalls={[]} callRow={null} storedTranscript={[]} />;
}

function Live(props: Props) {
  const skip = !config.convexUrl;
  const browserLive = props.status === "active" || props.status === "connecting";
  // One agent instance: when the browser is not on a call, follow the call the agent is on elsewhere.
  const current = useQuery(api.calls.current, skip ? "skip" : {}) ?? null;
  const remoteId = !browserLive && current ? current.callId : null;
  const callId = remoteId ?? props.callId;
  const { onRemoteCall } = props;
  useEffect(() => {
    if (remoteId) onRemoteCall?.(remoteId);
  }, [remoteId, onRemoteCall]);
  const callArgs = skip ? "skip" : { callId: callId ?? "" };
  const serverEvents = useQuery(api.callEvents.byCall, callArgs) ?? [];
  const pastCalls = useQuery(api.calls.list, skip ? "skip" : { limit: 50 }) ?? [];
  const demoData = useQuery(api.demoCalls.get, skip || !props.open ? "skip" : {});
  const selectedDemoIds = new Set(demoData?.selectedCallIds);
  const workingCalls = pastCalls.filter(c => !selectedDemoIds.has(c.callId));
  const callRow = useQuery(api.calls.get, callArgs) ?? null;
  const storedTranscript = useQuery(api.calls.transcriptByCall, callArgs) ?? [];
  const clearAll = useMutation(api.calls.clearAll);
  const archive = useMutation(api.calls.archive);
  const restore = useMutation(api.calls.restore);
  const deleteArchived = useMutation(api.calls.deleteArchived);
  const assignScenario = useMutation(api.callAnalytics.assignScenario);
  const metricsOverview = useQuery(api.callAnalytics.overview, skip || !props.open ? "skip" : {});
  const history = usePaginatedQuery(api.calls.archived, skip ? "skip" : {}, { initialNumItems: 50 });
  const { onClearPanel, viewingHistory } = props;
  useEffect(() => {
    if (callRow?.archivedAt !== undefined && !browserLive && !viewingHistory) onClearPanel?.();
  }, [callRow?.archivedAt, browserLive, viewingHistory, onClearPanel]);

  // Browser calls are mirrored to Convex from here (Vapi's web client is the only party that sees
  // them live), so the same call shows on every other device and lands in Past calls.
  const touch = useMutation(api.calls.touch);
  const appendTranscript = useMutation(api.calls.appendTranscript);
  const statusUpdate = useMutation(api.calls.statusUpdate);
  const mirrored = useRef<{ callId: string | null; lines: Set<string>; ended: boolean }>({ callId: null, lines: new Set(), ended: false });
  const browserCallId = props.status === "active" ? props.callId : null;
  useEffect(() => {
    if (skip || !browserCallId) return;
    if (mirrored.current.callId !== browserCallId) mirrored.current = { callId: browserCallId, lines: new Set(), ended: false };
    void touch({ callId: browserCallId, callType: "webCall" }).catch(() => {});
  }, [skip, browserCallId, touch]);
  const { transcript } = props;
  useEffect(() => {
    const m = mirrored.current;
    if (skip || !m.callId || props.status !== "active") return;
    for (const line of transcript) {
      if (!line.final || m.lines.has(line.id)) continue;
      m.lines.add(line.id);
      void appendTranscript({ callId: m.callId, role: line.role, text: line.text, callType: "webCall" }).catch(() => {});
    }
  }, [skip, transcript, props.status, appendTranscript]);
  useEffect(() => {
    const m = mirrored.current;
    if (skip || !m.callId || m.ended || props.status !== "ended") return;
    m.ended = true;
    void statusUpdate({ callId: m.callId, status: "ended", callType: "webCall" }).catch(() => {});
  }, [skip, props.status, statusUpdate]);

  return <View {...props} callId={callId} serverEvents={serverEvents} pastCalls={workingCalls} demoData={demoData} callRow={callRow} storedTranscript={storedTranscript}
    metrics={callRow ? <CallMetrics key={callRow.callId} call={callRow} onScenario={scenarioId => assignScenario({ callId: callRow.callId, scenarioId })} /> : undefined}
    metricsOverview={metricsOverview ? <CallMetricsOverview data={metricsOverview} /> : undefined}
    savedCalls={history.results} historyHasMore={history.status === "CanLoadMore"} historyLoading={history.status === "LoadingMore" || history.status === "LoadingFirstPage"}
    onLoadHistory={() => history.loadMore(50)}
    onArchiveCall={async id => {
      const result = await archive({ callId: id });
      if (!result.ok) throw Error(result.reason === "call-in-progress" ? "Finish the call before clearing it." : "This call is no longer available.");
      if (id === callId) props.onClearPanel?.();
    }}
    onRestoreCall={async id => {
      const result = await restore({ callId: id });
      if (!result.ok) throw Error(result.reason === "call-in-progress" ? "Finish the call before restoring it." : "This call is no longer available.");
    }}
    onDeleteCall={async id => {
      const result = await deleteArchived({ callId: id });
      if (!result.ok) throw Error(result.reason === "call-in-progress" ? "Finish the call before deleting it." : "Move the call to Archive before deleting it.");
      if (id === callId) props.onClearPanel?.();
    }}
    onClearHistory={async () => { await clearAll({}); props.onClearPanel?.(); }} />;
}

function useElapsed(startedAt: number | null, status: CallStatus): { prefix: string; value: string | null } {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    if (status !== "active") return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [status]);
  if (!startedAt) return { prefix: status === "connecting" ? "Connecting" : "Ready", value: null };
  const s = Math.max(0, Math.round(((now ?? startedAt) - startedAt) / 1000));
  const txt = s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`;
  return { prefix: status === "active" ? "Working for" : "Worked for", value: txt };
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
    upsert(key, () => ({ id: key, at: c.at, label: c.label, status: c.status ?? "info", source: c.source ?? "call", detail: c.detail, durationMs: c.durationMs, tool: c.tool }), (s) => {
      s.status = c.status ?? s.status;
      s.tool = s.tool ?? c.tool;
      s.durationMs = c.durationMs ?? s.durationMs;
      s.detail = c.detail ?? s.detail;
    });
  }
  for (const e of serverEvents) {
    const key = e.toolCallId ?? e._id;
    if (e.kind === "tool-start") {
      upsert(key, () => ({ id: key, at: e.at, label: e.label, status: "running", source: e.source, tool: e.tool, args: e.args }), (s) => {
        s.source = e.source;
        s.label = e.label;
        s.tool = e.tool ?? s.tool;
        s.args = e.args ?? s.args;
      });
    } else if (e.kind === "tool-end") {
      upsert(key, () => ({ id: key, at: e.at, label: e.label, status: e.status ?? "succeeded", source: e.source, tool: e.tool, args: e.args, output: e.output }), (s) => {
        s.status = e.status ?? "succeeded";
        s.durationMs = e.durationMs ?? s.durationMs;
        s.detail = e.detail ?? s.detail;
        s.source = e.source;
        s.tool = e.tool ?? s.tool;
        s.args = e.args ?? s.args;
        s.output = e.output ?? s.output;
      });
    } else {
      upsert(e._id, () => ({ id: e._id, at: e.at, label: e.label, status: e.status ?? "info", source: e.source, detail: e.detail }));
    }
  }
  return order.sort((a, b) => a.at - b.at);
}

/* ------------------------------------------------------------------ primitives */

/** Thin 3/4 arc, like the reference spinner. */
function Spinner({ size = 12, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" aria-hidden className={cn("motion-safe:animate-spin [animation-duration:0.8s]", className)}>
      <circle cx="6" cy="6" r="4.75" stroke="currentColor" strokeOpacity="0.18" strokeWidth="1.5" />
      <path d="M6 1.25a4.75 4.75 0 0 1 4.75 4.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/** In-place blur crossfade for text that swaps (status line, header label, pill). */
function Swap({ k, children, className }: { k: string; children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={k}
        className={cn("inline-block", className)}
        initial={reduce ? false : BLUR_IN}
        animate={{ ...SHARP, transition: { duration: reduce ? 0 : SWAP_IN, ease: EASE } }}
        exit={{ ...BLUR_IN, transition: { duration: reduce ? 0 : SWAP_OUT, ease: "easeIn" } }}
      >
        {children}
      </motion.span>
    </AnimatePresence>
  );
}

/**
 * Busy text: a lower-contrast band (~1/3 of the text wide) sweeps left -> right in ~500 ms, then rests
 * ~700 ms. With a 300%-wide gradient the band is only on the text for the middle half of each pass.
 */
function Shimmer({ children, active, base = 0.8, idle = 0.6, rgb = "255, 255, 255" }: { children: string; active: boolean; base?: number; idle?: number; rgb?: string }) {
  const reduce = useReducedMotion();
  if (!active || reduce) return <span style={{ color: `rgba(${rgb},${active ? base : idle})` }}>{children}</span>;
  const b = `rgba(${rgb},${base})`;
  return (
    <motion.span
      className="bg-clip-text text-transparent"
      style={{
        backgroundImage: `linear-gradient(90deg, ${b} 0%, ${b} 41%, rgba(${rgb},${base * 0.4}) 50%, ${b} 59%, ${b} 100%)`,
        backgroundSize: "300% 100%",
        WebkitBackgroundClip: "text",
      }}
      initial={{ backgroundPosition: "100% 0%" }}
      animate={{ backgroundPosition: "0% 0%" }}
      transition={{ duration: 1, ease: "linear", repeat: Infinity, repeatDelay: 0.2 }}
    >
      {children}
    </motion.span>
  );
}

const GLYPHS = "abcdefghijklmnopqrstuvwxyz0123456789";
const TAIL = 8;
const TICK_MS = 33; // glyphs re-roll every recorded frame

/** Deterministic glyph for (tick, index) so render stays pure. */
function glyph(tick: number, i: number) {
  let n = (tick * 374761393 + i * 668265263) | 0;
  n = Math.imul(n ^ (n >>> 15), 2246822519);
  n = Math.imul(n ^ (n >>> 13), 3266489917);
  n = (n ^ (n >>> 16)) >>> 0;
  return GLYPHS[n % GLYPHS.length];
}

/**
 * "Decode" reveal: the resolved prefix grows left to right (~26 ms/char) with an 8-glyph random tail
 * in the same color. Plays on mount when `animateMount` (after `delayMs`, so it starts as the row's
 * content appears), and again, without delay, whenever `text` changes.
 */
function ScrambleText({ text, animateMount, delayMs = 0 }: { text: string; animateMount: boolean; delayMs?: number }) {
  const reduce = useReducedMotion();
  const [done, setDone] = useState<string | null>(animateMount ? null : text);
  const [frame, setFrame] = useState<{ text: string; p: number; tick: number } | null>(null);

  useEffect(() => {
    if (reduce || done === text) return;
    const dur = Math.min(900, Math.max(300, text.length * MS_PER_CHAR));
    const wait = done === null ? delayMs : 0;
    let raf = 0;
    let start = 0;
    const step = (now: number) => {
      if (!start) start = now;
      const p = Math.min(1, Math.max(0, (now - start - wait) / dur));
      if (p >= 1) {
        setDone(text);
        setFrame(null);
        return;
      }
      setFrame({ text, p, tick: Math.floor((now - start) / TICK_MS) });
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [text, done, reduce, delayMs]);

  if (reduce || done === text) return <>{text}</>;
  const p = frame?.text === text ? frame.p : 0;
  const tick = frame?.text === text ? frame.tick : 0;
  const resolved = Math.floor(p * text.length);
  const tailLen = Math.min(TAIL, text.length - resolved);
  let tail = "";
  for (let i = 0; i < tailLen; i++) {
    const ch = text[resolved + i];
    tail += ch === " " ? " " : glyph(tick, resolved + i);
  }
  return (
    <>
      {text.slice(0, resolved)}
      {tail}
    </>
  );
}

/** Word-by-word stream with a soft (blurred) leading edge. */
function StreamText({ text }: { text: string }) {
  const reduce = useReducedMotion();
  const [initialCount] = useState(() => text.split(/\s+/).length);
  const words = text.split(/(\s+)/);
  let w = 0;
  return (
    <>
      {words.map((part, i) => {
        if (/^\s+$/.test(part)) return part;
        const idx = w++;
        return (
          <motion.span
            key={i}
            className="inline-block"
            initial={reduce ? false : BLUR_IN}
            animate={SHARP}
            transition={{ duration: 0.18, ease: EASE, delay: idx < initialCount ? idx * 0.038 : 0 }}
          >
            {part}
          </motion.span>
        );
      })}
    </>
  );
}

/* ------------------------------------------------------------------ rail */

type Entrance = { mode: "intro" | "insert"; delay: number };

function StepDot({ step }: { step: Step }) {
  const reduce = useReducedMotion();
  const running = step.status === "running";
  const color = `rgb(${stepColor(step)})`;
  return (
    <span className="relative z-[1] flex h-3.5 w-3.5 shrink-0 items-center justify-center" aria-label={step.status === "info" || step.status === "succeeded" ? "done" : step.status}>
      <AnimatePresence initial={false}>
        {running ? (
          <motion.span
            key="spin"
            className="absolute inset-0 flex items-center justify-center"
            style={{ color }}
            initial={reduce ? false : ICON_IN}
            animate={SHARP}
            exit={{ ...ICON_IN, transition: { duration: reduce ? 0 : SWAP_OUT, ease: "easeIn" } }}
            transition={{ duration: reduce ? 0 : SWAP_IN, ease: EASE, delay: reduce ? 0 : SWAP_OUT }}
          >
            <Spinner size={12} />
          </motion.span>
        ) : (
          <motion.span
            key="dot"
            className="absolute inset-0 flex items-center justify-center"
            initial={reduce ? false : ICON_IN}
            animate={SHARP}
            transition={{ duration: reduce ? 0 : SWAP_IN, ease: EASE, delay: reduce ? 0 : SWAP_OUT }}
          >
            <span className="h-2 w-2 rounded-full transition-colors duration-[120ms]" style={{ backgroundColor: color }} />
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

function StepRow({ step, entrance, first, last, expanded, onToggle }: { step: Step; entrance: Entrance; first: boolean; last: boolean; expanded: boolean; onToggle: () => void }) {
  const reduce = useReducedMotion();
  const meta = SOURCE[step.source];
  const running = step.status === "running";
  const expandable = !!step.tool && step.tool !== "delegate";
  const insert = entrance.mode === "insert";
  const d = entrance.delay;
  // Insert: the gap opens first, content sharpens in once it has settled. Intro: straight blur reveal.
  const revealAt = insert ? d + REVEAL_DELAY : d;

  return (
    <motion.li
      layout="position"
      initial={reduce ? false : insert ? { height: 0 } : { opacity: 0, height: ROW_H }}
      animate={insert ? { height: expanded ? "auto" : ROW_H } : { opacity: 1, height: expanded ? "auto" : ROW_H }}
      exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { height: 0, opacity: 0, transition: { duration: 0.2, ease: EASE } }}
      transition={{
        height: { duration: reduce ? 0 : GAP, ease: EASE, delay: d },
        opacity: { duration: reduce ? 0 : 0.15, ease: EASE, delay: d },
        layout: { duration: reduce ? 0 : GAP, ease: EASE },
      }}
      className={cn("relative -mx-4 overflow-hidden px-4", expandable && "cursor-pointer")}
      style={{ height: ROW_H }}
      onClick={expandable ? onToggle : undefined}
      title={expandable ? (expanded ? "Hide tool call" : "Show tool call") : undefined}
    >
      {/* new-row wash: in with the content, hold ~700 ms, out over ~300 ms */}
      {insert && !reduce && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[#ffb35c]/[0.08]"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 1, 0] }}
          transition={{ duration: 1.13, times: [0, 0.115, 0.735, 1], ease: "easeOut", delay: revealAt }}
        />
      )}
      {/* rail segments above / below the dot */}
      {!first && <span aria-hidden className="absolute left-[22.5px] top-0 h-[9px] w-px bg-white/[0.18]" />}
      {!last && <span aria-hidden className="absolute bottom-0 left-[22.5px] h-[9px] w-px bg-white/[0.18]" />}

      <motion.div
        className="relative flex h-7 items-center gap-3"
        initial={reduce ? false : ROW_IN}
        animate={SHARP}
        transition={{ duration: reduce ? 0 : insert ? REVEAL : 0.15, ease: EASE, delay: revealAt }}
      >
        <StepDot step={step} />
        <span className="flex min-w-0 flex-1 items-center gap-2">
          <span
            className="truncate text-[13px] transition-colors duration-[120ms]"
            style={{ color: `rgb(${stepColor(step)})` }}
          >
            <ScrambleText text={step.label} animateMount={insert && !reduce} delayMs={revealAt * 1000} />
          </span>
          <span className={cn("shrink-0 rounded px-1.5 py-px font-mono text-[10.5px] leading-[16px]", meta.tag)}>{meta.name}</span>
          {step.detail && step.status === "failed" && <span className="truncate text-[12px] text-[#f5c45e]">{step.detail}</span>}
        </span>
        <span className="shrink-0 font-mono text-[11px] text-white/40">
          <Swap k={running ? "running" : typeof step.durationMs === "number" ? `ms${step.durationMs}` : "none"}>
            {running ? "running" : typeof step.durationMs === "number" ? `${step.durationMs} ms` : ""}
          </Swap>
        </span>
        {expandable && (
          <ChevronRight
            size={12}
            aria-hidden
            className={cn("-mr-1 shrink-0 text-white/30 transition-transform duration-200", expanded && "rotate-90")}
          />
        )}
      </motion.div>
      {expandable && expanded && <ToolDetail step={step} />}
    </motion.li>
  );
}

/** Exact call: function name, arguments, and the result the webhook returned (both truncated server-side). */
function ToolDetail({ step }: { step: Step }) {
  const pretty = (raw?: string) => {
    if (!raw) return undefined;
    try {
      return JSON.stringify(JSON.parse(raw), null, 1).replace(/\n\s*/g, " ");
    } catch {
      return raw;
    }
  };
  const args = pretty(step.args);
  const output = pretty(step.output);
  return (
    <div className="mb-2 ml-[26px] rounded-lg border border-white/[0.07] bg-black/30 px-2.5 py-2 font-mono text-[11px] leading-[16px] text-white/60" onClick={(e) => e.stopPropagation()}>
      <div className="text-white/85">
        {step.tool}
        <span className="text-white/40">(</span>
        {args ? <span className="break-all text-[#f7cb72]/90">{args}</span> : <span className="text-white/30">no arguments</span>}
        <span className="text-white/40">)</span>
      </div>
      {step.status === "running" && <div className="mt-1 text-white/35">waiting for result…</div>}
      {output && (
        <div className="mt-1 max-h-[140px] overflow-y-auto break-all text-white/55 [scrollbar-width:thin]">
          <span className="text-white/35">→ </span>
          {output}
        </div>
      )}
      {!output && step.status !== "running" && step.detail && (
        <div className="mt-1 break-all text-white/55">
          <span className="text-white/35">→ </span>
          {step.detail}
        </div>
      )}
      {!output && step.status !== "running" && !step.detail && step.source === "model" && <div className="mt-1 text-white/35">handled by the model, no server result</div>}
    </div>
  );
}

/**
 * Remount (keyed by the parent) when the list first gets rows, so a batch that loads at once
 * (historical call) cascades bottom-up, while rows that arrive later get the insert animation.
 */
function Rail({ steps }: { steps: Step[] }) {
  const [seen, setSeen] = useState(() => ({
    ids: new Set(steps.map((s) => s.id)),
    intro: new Set(steps.length >= 2 ? steps.map((s) => s.id) : []),
    stagger: new Map<string, number>(),
  }));
  const [openIds, setOpenIds] = useState<ReadonlySet<string>>(() => new Set());
  const toggle = (id: string) =>
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const fresh = steps.filter((s) => !seen.ids.has(s.id));
  if (fresh.length) {
    const ids = new Set(seen.ids);
    const stagger = new Map(seen.stagger);
    fresh.forEach((s, i) => {
      ids.add(s.id);
      stagger.set(s.id, i * INSERT_STAGGER);
    });
    setSeen({ ids, intro: seen.intro, stagger });
  }

  // Oldest first, so steps read top to bottom in the same order as the conversation.
  const display = steps;
  const n = display.length;
  return (
    <ol className="relative -mx-4 px-4">
      <AnimatePresence initial={false}>
        {display.map((s, i) => {
          const entrance: Entrance = seen.intro.has(s.id)
            ? { mode: "intro", delay: 0.06 + i * INTRO_STAGGER }
            : { mode: "insert", delay: seen.stagger.get(s.id) ?? 0 };
          return <StepRow key={s.id} step={s} entrance={entrance} first={i === 0} last={i === n - 1} expanded={openIds.has(s.id)} onToggle={() => toggle(s.id)} />;
        })}
      </AnimatePresence>
    </ol>
  );
}

/* ------------------------------------------------------------------ live transcript */

type Marker = { id: string; at: number; tool: string; status: Step["status"]; detail?: string };

/** Same-speaker lines closer than this merge into one timeline entry. */
const LATER_GAP_MS = 8000;

/** Call-relative clock for the timeline's time column, e.g. 1:07. */
function callClock(at: number, start: number): string {
  const s = Math.max(0, Math.round((at - start) / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/**
 * Transcript as a timeline: a time column, an icon on a vertical rail, a heading per
 * speaker turn or tool call, the spoken words in a card.
 */
/** `follow` (live calls): the list scrolls on its own and keeps the newest line in view. Otherwise it reads top-down with the panel. */
function LiveTranscript({ transcript, markers, reduce, follow }: { transcript: TranscriptLine[]; markers: Marker[]; reduce: boolean; follow: boolean }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const last = transcript[transcript.length - 1];
  const rows = useMemo(() => {
    const merged: Array<{ kind: "line"; t: TranscriptLine; at: number; last?: string } | { kind: "tool"; m: Marker; at: number; last?: string }> = [
      ...transcript.map((t) => ({ kind: "line" as const, t, at: t.at })),
      ...markers.map((m) => ({ kind: "tool" as const, m, at: m.at })),
    ];
    merged.sort((a, b) => a.at - b.at);
    // Back-to-back lines from the same speaker read as one turn: one heading, one card.
    const out: typeof merged = [];
    for (const r of merged) {
      const prev = out[out.length - 1];
      if (r.kind === "line" && prev?.kind === "line" && prev.t.role === r.t.role && r.at - prev.at < LATER_GAP_MS)
        out[out.length - 1] = { ...prev, t: { ...prev.t, text: `${prev.t.text} ${r.t.text}`, final: r.t.final }, last: r.t.id };
      else out.push(r.kind === "line" ? { ...r, last: r.t.id } : r);
    }
    return out;
  }, [transcript, markers]);
  const start = rows[0]?.at ?? 0;
  useEffect(() => {
    const el = boxRef.current;
    if (!el || !follow) return;
    el.scrollTo({ top: el.scrollHeight, behavior: reduce ? "auto" : "smooth" });
  }, [rows.length, last?.text, reduce, follow]);
  return (
    <div>
      <div ref={boxRef} className={cn(follow && "max-h-[min(460px,55vh)] overflow-y-auto overscroll-contain pr-1 [scrollbar-width:thin]")}>
        <ol className="relative">
          {rows.map((r, i) => {
            const isLastRow = i === rows.length - 1;
            const key = r.kind === "tool" ? `tool-${r.m.id}` : r.t.id;
            const agent = r.kind === "line" && r.t.role === "assistant";
            const failed = r.kind === "tool" && r.m.status === "failed";
            const Icon = r.kind === "tool" ? Wrench : agent ? Headset : User;
            const badge = r.kind === "tool"
              ? failed ? "bg-[#ff8a8f]/15 text-[#ff8a8f]" : "bg-[#7ab8ff]/15 text-[#7ab8ff]"
              : agent ? "bg-[#c2a4ff]/15 text-[#c2a4ff]" : "bg-white/[0.08] text-white/70";
            return (
              <motion.li key={key} initial={reduce ? false : BLUR_IN} animate={SHARP} transition={{ duration: reduce ? 0 : REVEAL, ease: EASE }}
                className="relative grid grid-cols-[38px_24px_1fr] gap-x-2.5">
                {/* rail from this icon down to the next entry */}
                {!isLastRow && <span aria-hidden className="absolute bottom-0 left-[59px] top-[22px] w-px bg-white/[0.1]" />}
                <span className="col-start-1 pt-[3px] text-right font-mono text-[11px] tabular-nums text-white/40">{callClock(r.at, start)}</span>
                <span className={cn("relative z-[1] col-start-2 flex h-6 w-6 items-center justify-center rounded-md", badge)}>
                  <Icon size={12} aria-hidden />
                </span>
                <div className="col-start-3 min-w-0 pb-3.5">
                  {r.kind === "tool" ? (
                    <div className="flex min-h-6 items-center gap-2 text-[12.5px]">
                      <span className={cn("font-mono", failed ? "text-[#ff8a8f]" : "text-white/80")}>{r.m.tool}</span>
                      {r.m.status === "running" ? <Spinner size={10} className="text-[#7ab8ff]" /> : r.m.detail ? <span className="truncate text-white/40">{r.m.detail}</span> : null}
                    </div>
                  ) : (
                    <>
                      <p className="flex min-h-6 items-center text-[13px] font-medium text-white/90">{agent ? PERSONA_NAME : "Caller"}</p>
                      <div className={cn("mt-1.5 rounded-xl border px-3.5 py-2.5 text-[13.5px] leading-relaxed",
                        agent ? "border-white/[0.08] bg-white/[0.035] text-white/90" : "border-white/[0.06] bg-transparent text-white/75")}>
                        {r.last === last?.id && agent ? <StreamText text={r.t.text} /> : r.t.text}
                      </div>
                    </>
                  )}
                </div>
              </motion.li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ past calls */

/** Wall clock that ticks every 30 s, started in an effect so prerender stays pure. */
function useNow(intervalMs = 30000): number | null {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const t = setInterval(tick, intervalMs);
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
  }, [intervalMs]);
  return now;
}

function relativeTime(at: number, now: number): string {
  const s = Math.max(0, Math.round((now - at) / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hr ago`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d} day${d === 1 ? "" : "s"} ago`;
  return new Date(at).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function dayBucket(at: number, now: number): "Today" | "Yesterday" | "Earlier" {
  const a = new Date(at), n = new Date(now);
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((startOf(n) - startOf(a)) / 86400000);
  return diffDays <= 0 ? "Today" : diffDays === 1 ? "Yesterday" : "Earlier";
}

function durationText(c: Doc<"calls">, now: number): string {
  const secs = Math.round(c.measurements?.durationSeconds ?? c.durationSeconds ?? ((c.endedAt ?? now) - c.startedAt) / 1000);
  if (!Number.isFinite(secs) || secs < 0) return "";
  return secs >= 60 ? `${Math.floor(secs / 60)}m ${secs % 60}s` : `${secs}s`;
}


/**
 * Past calls tab: every call, like a chat app's conversation list. Newest first, grouped by day; a row
 * opens that call in the Call tab. Removing a call from Recent archives it; only an explicit delete
 * from Archived erases history.
 */
function HistoryView({ calls: panelCalls, savedCalls = [], currentId, busy, onOpen, onClear, onArchive, onRestore, onDelete, onLoadMore, hasMore, loading, reduce }: {
  calls: Doc<"calls">[]; savedCalls?: Doc<"calls">[]; currentId: string | null; busy: boolean;
  onOpen?: (id: string) => void; onClear?: () => Promise<unknown>; onArchive?: (id: string) => Promise<unknown>; onRestore?: (id: string) => Promise<unknown>;
  onDelete?: (id: string) => Promise<unknown>;
  onLoadMore?: () => void; hasMore?: boolean; loading?: boolean; reduce: boolean;
}) {
  const [confirm, setConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Doc<"calls"> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const calls = saved ? savedCalls : panelCalls;
  const now = useNow();
  const groups: { label: string; items: Doc<"calls">[] }[] = [];
  for (const c of calls) {
    const label = now ? dayBucket(c.startedAt, now) : "Recent";
    const g = groups[groups.length - 1];
    if (g && g.label === label) g.items.push(c);
    else groups.push({ label, items: [c] });
  }
  const deletable = calls.filter((c) => c.status === "ended").length;
  const iconButton = "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/35 transition-colors hover:bg-white/[0.08] hover:text-white/85 disabled:opacity-30";

  return (
    <motion.div key="history" initial={reduce ? false : BLUR_IN} animate={SHARP} transition={{ duration: reduce ? 0 : REVEAL, ease: EASE }} className="mt-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-1 rounded-lg bg-white/[0.04] p-0.5" role="tablist" aria-label="Which calls to show">
          {[[false, "Recent"], [true, "Archived"]].map(([value, label]) => (
            <button key={String(value)} type="button" role="tab" aria-selected={saved === value}
              onClick={() => { setSaved(value === true); setConfirm(false); setDeleteTarget(null); setError(null); }}
              className={cn("min-h-[30px] rounded-md px-3 text-[12px] transition-colors", saved === value ? "bg-white/[0.1] text-white" : "text-white/50 hover:text-white/85")}>{label}</button>
          ))}
        </div>
        {!saved && onClear && deletable > 0 && !confirm && (
          <button type="button" disabled={busy || removing !== null} onClick={() => setConfirm(true)}
            title={busy ? "Available when no call is in progress" : "Move every finished call to Archived"}
            className="flex min-h-[30px] items-center gap-1.5 rounded-lg px-2.5 text-[12px] text-white/50 transition-colors hover:bg-white/[0.06] hover:text-white/85 disabled:opacity-40">
            <Archive size={13} aria-hidden /> Archive all
          </button>
        )}
      </div>

      {confirm && onClear && (
        <div role="alertdialog" aria-labelledby="clear-calls-title" className="mt-3 rounded-xl bg-white/[0.04] p-3">
          <p id="clear-calls-title" className="text-[13px] text-white/85">Move all {deletable} finished calls to Archived?</p>
          <p className="mt-0.5 text-[12px] text-white/50">You can restore them from Archived later.</p>
          <div className="mt-3 flex gap-2">
            <button type="button" disabled={clearing} onClick={async () => {
              setClearing(true);
              try { await onClear(); setConfirm(false); }
              catch (e) { setError(e instanceof Error ? e.message : "Could not archive the calls. Please try again."); }
              finally { setClearing(false); }
            }} className="min-h-[32px] rounded-lg bg-white px-3 text-[12px] font-medium text-black hover:bg-white/85 disabled:opacity-50">{clearing ? "Archiving…" : "Archive all"}</button>
            <button type="button" onClick={() => setConfirm(false)} className="min-h-[32px] rounded-lg px-3 text-[12px] text-white/60 hover:text-white/90">Cancel</button>
          </div>
        </div>
      )}
      {error && <p role="alert" className="mt-3 text-[12px] text-[#ff8a8f]">{error}</p>}
      {saved && deleteTarget && onDelete && (
        <div role="alertdialog" aria-labelledby="delete-call-title" aria-describedby="delete-call-description" className="mt-3 rounded-xl border border-[#ff5f66]/30 bg-[#ff5f66]/[0.08] p-3">
          <p id="delete-call-title" className="text-[13px] font-medium text-white">Delete this call permanently?</p>
          <p className="mt-0.5 truncate text-[12px] text-white/70">{deleteTarget.title ?? "Playback support call"}</p>
          <p id="delete-call-description" className="mt-1 text-[12px] text-white/55">The saved call, transcript, activity and measurements will be deleted. This cannot be undone.</p>
          <div className="mt-3 flex gap-2">
            <button type="button" disabled={busy || removing !== null} className="min-h-[32px] rounded-lg bg-[#ff5f66] px-3 text-[12px] font-medium text-white hover:bg-[#ff747a] disabled:opacity-40" onClick={async () => {
              setRemoving(deleteTarget.callId); setError(null);
              try { await onDelete(deleteTarget.callId); setDeleteTarget(null); }
              catch (e) { setError(e instanceof Error ? e.message : "Could not delete this call. Please try again."); }
              finally { setRemoving(null); }
            }}>{removing === deleteTarget.callId ? "Deleting…" : "Delete permanently"}</button>
            <button type="button" disabled={removing !== null} onClick={() => setDeleteTarget(null)} className="min-h-[32px] rounded-lg px-3 text-[12px] text-white/60 hover:text-white/90 disabled:opacity-40">Cancel</button>
          </div>
        </div>
      )}

      {calls.length === 0 ? (
        <p className="py-10 text-center text-[13px] text-white/40">
          {saved ? (loading ? "Loading archived calls…" : "No archived calls.") : "No recent calls."}
        </p>
      ) : (
        groups.map((g) => (
          <div key={g.label}>
            <p className="pb-1 pt-5 text-[11px] font-medium uppercase tracking-wide text-white/40">{g.label}</p>
            <ul className="-mx-2 divide-y divide-white/[0.05]">
              {g.items.map((c) => {
                const current = c.callId === currentId;
                const live = c.status === "in-progress" || c.status === "ringing";
                const tools = c.measurements?.toolCallCount ?? c.toolCount;
                const title = c.title ?? "Playback support call";
                const intent = c.review ? [c.review.primaryIntent, ...c.review.secondaryIntents].join(" + ") : c.status === "ended" ? "Intent pending review" : "Intent after the call";
                const meta = [
                  now ? relativeTime(c.startedAt, now) : "",
                  now ? durationText(c, now) : "",
                  `${tools} tool${tools === 1 ? "" : "s"}`,
                  c.channel !== "unknown" ? c.channel : "",
                  c.callerNumber ? `from ${formatCallerNumber(c.callerNumber)}` : "",
                  live ? "live" : "",
                ].filter(Boolean).join(" · ");
                const disabled = !onOpen || (busy && !current);
                return (
                  <li key={c._id} className="flex items-center gap-1 py-0.5">
                    <button type="button" disabled={disabled} onClick={() => onOpen?.(c.callId)} aria-current={current ? "true" : undefined}
                      className={cn("flex min-h-[44px] min-w-0 flex-1 items-start gap-3 rounded-lg px-2 py-2 text-left transition-colors",
                        current ? "bg-white/[0.06]" : "hover:bg-white/[0.04]", disabled && "cursor-default opacity-60")}>
                      <span className={cn("mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full", c.status === "ringing" ? "bg-[#ff9f0a] motion-safe:animate-pulse" : live ? "bg-[#63d392] motion-safe:animate-pulse" : "bg-white/20")} aria-hidden />
                      <span className="min-w-0 flex-1">
                        <span className={cn("block truncate text-[13px]", current ? "text-white" : "text-white/85")}>{title}</span>
                        <span className="mt-0.5 block truncate text-[12px] text-white/55">{intent}</span>
                        <span className="mt-0.5 block truncate text-[11px] tabular-nums text-white/35">{meta}</span>
                      </span>
                    </button>
                    {onArchive && c.status === "ended" && c.archivedAt === undefined && (
                      <button type="button" aria-label={`Archive call: ${title}`} title="Archive" disabled={busy || clearing || removing !== null} className={iconButton}
                        onClick={async () => {
                          setRemoving(c.callId); setError(null);
                          try { await onArchive(c.callId); } catch (e) { setError(e instanceof Error ? e.message : "Could not archive this call. Please try again."); }
                          finally { setRemoving(null); }
                        }}><Archive size={15} aria-hidden /></button>
                    )}
                    {onRestore && c.status === "ended" && c.archivedAt !== undefined && (
                      <button type="button" aria-label={`Restore call: ${title}`} title="Restore to Recent" disabled={busy || clearing || removing !== null} className={iconButton}
                        onClick={async () => {
                          setRemoving(c.callId); setError(null);
                          try { await onRestore(c.callId); } catch (e) { setError(e instanceof Error ? e.message : "Could not restore this call. Please try again."); }
                          finally { setRemoving(null); }
                        }}><ArchiveRestore size={15} aria-hidden /></button>
                    )}
                    {saved && onDelete && c.status === "ended" && c.archivedAt !== undefined && (
                      <button type="button" aria-label={`Delete archived call permanently: ${title}`} title="Delete permanently" disabled={busy || clearing || removing !== null}
                        className={cn(iconButton, "hover:bg-[#ff5f66]/15 hover:text-[#ff8a8f]")}
                        onClick={() => { setDeleteTarget(c); setError(null); }}><Trash2 size={15} aria-hidden /></button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))
      )}

      {saved && (hasMore || loading) && <button type="button" disabled={loading} onClick={onLoadMore}
        className="mt-4 min-h-[36px] w-full rounded-lg text-[12px] text-white/55 transition-colors hover:bg-white/[0.04] hover:text-white/85 disabled:opacity-40">{loading ? "Loading…" : "Load older calls"}</button>}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ view */

/**
 * A collapsible section: the header (title, short summary, chevron on the right) is the toggle, and
 * its content opens directly underneath it.
 */
function Section({ title, meta, open, onToggle, children }: { title: string; meta?: ReactNode; open: boolean; onToggle: () => void; children: ReactNode }) {
  const reduce = useReducedMotion();
  const id = `section-${title.toLowerCase().replace(/\W+/g, "-")}`;
  return (
    <section className="border-t border-white/[0.08]">
      <h3>
        <button type="button" onClick={onToggle} aria-expanded={open} aria-controls={id}
          className="group flex min-h-[48px] w-full items-center gap-2 py-3 text-left">
          <span className="text-[13px] font-medium text-white/90">{title}</span>
          {meta && <span className="min-w-0 truncate text-[12px] tabular-nums text-white/40">{meta}</span>}
          <ChevronDown size={16} aria-hidden
            className={cn("ml-auto shrink-0 text-white/35 transition-transform duration-200 group-hover:text-white/70", open && "rotate-180")} />
        </button>
      </h3>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div key="body" id={id}
            initial={reduce ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: reduce ? 0 : 0.24, ease: EASE }}
            className="overflow-hidden">
            <div className="pb-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

const SOURCE_NOTE: Record<ToolSource | "call", string> = {
  live: "live App Store lookup",
  simulated: "demo customers, teams and callbacks, not MultiTracks systems",
  internal: "bounded help-center snapshot",
  model: "GPT-Live reasoning",
  call: "",
};

type Tab = "call" | "history" | "demo";
type SectionId = "conversation" | "steps" | "measurements";

function View({ open, onToggle, callId, status: browserStatus, startedAt: browserStartedAt, assistantSpeaking, handoff, clientEvents, transcript, onOpenPastCall, serverEvents, pastCalls, callRow, storedTranscript, onClearHistory, onArchiveCall, onRestoreCall, onDeleteCall, savedCalls, onLoadHistory, historyHasMore, historyLoading, metrics, metricsOverview, demoData }: Props & ViewData) {
  const reduce = useReducedMotion();
  // A call on another channel (phone, harness) that the agent is on right now: show it as live.
  const remoteLive =
    browserStatus !== "active" && browserStatus !== "connecting" && !!callRow && (callRow.status === "in-progress" || callRow.status === "ringing") && clientEvents.length === 0;
  const status: CallStatus = remoteLive ? (callRow.status === "ringing" ? "connecting" : "active") : browserStatus;
  const startedAt = remoteLive && callRow ? callRow.startedAt : browserStartedAt;
  const [tab, setTab] = useState<Tab>("call");
  const [sections, setSections] = useState<Record<SectionId, boolean>>({ conversation: true, steps: true, measurements: false });
  const toggleSection = (id: SectionId) => setSections((s) => ({ ...s, [id]: !s[id] }));
  const elapsed = useElapsed(startedAt, status);
  const logged = useMemo(() => buildSteps(serverEvents, clientEvents), [serverEvents, clientEvents]);
  // Live lines while a call runs; the stored transcript when replaying a past call.
  const shownTranscript: TranscriptLine[] =
    transcript.length > 0 ? transcript : storedTranscript.map((t) => ({ id: t._id, role: t.role, text: t.text, final: true, at: t.at }));
  const viewingPast = !!callRow && callRow.status === "ended" && status !== "active" && status !== "connecting";
  // A replayed call has no client rows (Connected / Call ended), so frame its tool rows from the stored call record.
  const steps: Step[] =
    (viewingPast || remoteLive) && clientEvents.length === 0 && callRow
      ? [
          { id: `${callRow.callId}-start`, at: callRow.startedAt, label: remoteLive ? `Call connected (${callRow.channel})` : "Call connected", status: "info", source: "call" },
          ...logged,
          ...(viewingPast
            ? [{ id: `${callRow.callId}-end`, at: callRow.endedAt ?? callRow.startedAt + (callRow.durationSeconds ?? 0) * 1000, label: "Call ended", status: "info" as const, source: "call" as const, detail: callRow.endedReason?.replace(/-/g, " ") }]
            : []),
        ]
      : logged;
  const liveCall = status === "active" || status === "connecting";
  const hasCall = !!callId || steps.length > 0 || shownTranscript.length > 0;

  const running = steps.filter((s) => s.status === "running");
  const failed = steps.filter((s) => s.status === "failed");
  const tools = steps.filter((s) => s.tool && s.tool !== "delegate");
  const toolCount = callRow?.measurements?.toolCallCount ?? tools.length;
  const markers: Marker[] = steps.flatMap((s) => (s.tool && s.tool !== "delegate" ? [{ id: s.id, at: s.at, tool: s.tool, status: s.status, detail: s.detail }] : []));
  const liveCount = tools.filter((s) => s.source === "live").length;
  const simCount = tools.filter((s) => s.source === "simulated").length;
  const usedSources = (["live", "simulated", "internal", "model"] as const).filter((k) => tools.some((s) => s.source === k));

  const statusLine =
    status === "connecting" ? "Connecting to the assistant"
    : status === "active" && running.length ? running[running.length - 1].label
    : status === "active" && handoff ? `Transferring to ${handoff.team}`
    : status === "active" && assistantSpeaking ? "Speaking"
    : status === "active" ? "Listening"
    : status === "error" ? "Call failed"
    : null;
  const busy = status === "connecting" || (status === "active" && (running.length > 0 || !!handoff));
  const activityColor = status === "connecting" ? ACTIVITY_COLOR.connecting
    : status === "error" ? ACTIVITY_COLOR.failed
    : status === "active" ? (running.length ? stepColor(running[running.length - 1]) : ACTIVITY_COLOR.connected)
    : ACTIVITY_COLOR.idle;

  const pill = {
    idle: ["Ready", ACTIVITY_COLOR.idle],
    connecting: ["Connecting", ACTIVITY_COLOR.connecting],
    active: ["Live", ACTIVITY_COLOR.connected],
    ended: ["Ended", ACTIVITY_COLOR.idle],
    error: ["Failed", ACTIVITY_COLOR.failed],
  }[viewingPast ? "ended" : status];

  const callMeta = [
    callRow && callRow.channel !== "unknown" ? (callRow.channel === "phone" ? "Phone line" : callRow.channel === "browser" ? "Browser" : callRow.channel) : "",
    callRow?.callerNumber ? `from ${formatCallerNumber(callRow.callerNumber)}` : "",
    callId ? `Call ${callId.slice(0, 8)}` : "",
  ].filter(Boolean).join(" · ");

  const tabs: Array<{ id: Tab; label: string; count?: number }> = [
    { id: "call", label: "Call" },
    { id: "history", label: "Past calls", count: pastCalls.length },
    ...(demoData ? [{ id: "demo" as const, label: "Demo calls", count: demoData.counts.selected }] : []),
  ];
  const openCall = (id: string) => {
    onOpenPastCall?.(id);
    setTab("call");
  };

  return (
    <MotionConfig reducedMotion="user">
      {/* Closed: a labeled pill top-right of the viewport (outside the transformed aside so `fixed` is viewport-relative). */}
      <AnimatePresence initial={false}>
        {!open && (
          <motion.button
            key="open-pill"
            type="button"
            onClick={onToggle}
            aria-expanded={false}
            className="fixed right-4 z-20 flex min-h-[44px] items-center gap-2 rounded-full border border-white/10 bg-[#111113]/95 px-4 py-2 text-[14px] font-medium text-white/85 shadow-[0_8px_30px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-colors hover:text-white sm:top-4 sm:min-h-0 sm:text-[13px]"
            style={{ fontFamily: "var(--font-geist-sans), -apple-system, system-ui, sans-serif", top: "calc(env(safe-area-inset-top) + 8px)" }}
            initial={reduce ? false : BLUR_IN}
            animate={{ ...SHARP, transition: { duration: reduce ? 0 : SWAP_IN, ease: EASE, delay: reduce ? 0 : 0.15 } }}
            exit={{ ...BLUR_IN, transition: { duration: reduce ? 0 : SWAP_OUT, ease: "easeIn" } }}
          >
            <Activity size={15} aria-hidden />
            View agent activity
          </motion.button>
        )}
      </AnimatePresence>

      {/* Phones: scrim behind the bottom sheet; tap to dismiss */}
      {open && <div className="fixed inset-0 z-10 bg-black/55 sm:hidden" onClick={onToggle} aria-hidden />}

      <aside
        className={cn(
          // phones: modal bottom sheet; tablets and up: right-hand drawer
          "fixed inset-x-0 bottom-0 z-20 flex h-[80dvh] w-full flex-col rounded-t-[28px] border-t border-white/10 bg-[#111113]/95 text-white shadow-[0_-20px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-transform duration-300",
          "sm:inset-x-auto sm:inset-y-0 sm:right-0 sm:h-auto sm:w-[480px] sm:max-w-[94vw] lg:w-[560px] xl:w-[640px] sm:rounded-none sm:border-l sm:border-t-0 sm:shadow-[-20px_0_60px_rgba(0,0,0,0.45)]",
          open ? "translate-y-0 sm:translate-x-0" : "translate-y-full sm:translate-x-full sm:translate-y-0"
        )}
        style={{ fontFamily: "var(--font-geist-sans), -apple-system, system-ui, sans-serif" }}
        aria-label="Agent activity"
        role="dialog"
        aria-modal={open ? "true" : undefined}
      >
        {/* grabber, phones only */}
        <div className="mx-auto mt-2.5 h-1 w-9 shrink-0 rounded-full bg-white/25 sm:hidden" aria-hidden />

        {/* Fixed header: panel title, close, and the tabs that switch between the panel's three views. */}
        <div className="shrink-0 px-4 pt-3 sm:px-6 sm:pt-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[15px] font-semibold text-white">Agent activity</h2>
            <button
              type="button"
              onClick={onToggle}
              aria-expanded={open}
              aria-label="Hide agent activity"
              tabIndex={open ? 0 : -1}
              className="-mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white/45 transition-colors hover:bg-white/[0.06] hover:text-white/90 sm:h-8 sm:w-8"
            >
              <X size={16} aria-hidden />
            </button>
          </div>
          <div role="tablist" aria-label="Panel views" className="mt-2 flex gap-6 border-b border-white/[0.08]">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "-mb-px flex min-h-[40px] items-center gap-1.5 border-b-2 text-[13px] transition-colors",
                  tab === t.id ? "border-white font-medium text-white" : "border-transparent text-white/50 hover:text-white/85"
                )}
              >
                {t.id === "call" && liveCall && <span className="h-1.5 w-1.5 rounded-full bg-[#63d392] motion-safe:animate-pulse" aria-label="live" />}
                {t.label}
                {t.count !== undefined && <span className="text-[11.5px] tabular-nums text-white/40">{t.count}</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-8 sm:px-6" style={{ paddingBottom: "max(32px, env(safe-area-inset-bottom))" }}>
          {tab === "demo" ? (
            <div className="mt-6"><DemoCallsPanel data={demoData} busy={liveCall} onOpen={openCall} /></div>
          ) : tab === "history" ? (
            <div className="pt-6">
              {metricsOverview}
              <HistoryView
                calls={pastCalls}
                savedCalls={savedCalls}
                currentId={callId}
                busy={liveCall}
                onOpen={openCall}
                onClear={onClearHistory}
                onArchive={onArchiveCall}
                onRestore={onRestoreCall}
                onDelete={onDeleteCall}
                onLoadMore={onLoadHistory}
                hasMore={historyHasMore}
                loading={historyLoading}
                reduce={!!reduce}
              />
            </div>
          ) : !hasCall ? (
            <div className="flex flex-col items-center px-6 py-16 text-center">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.05] text-white/45"><Activity size={18} aria-hidden /></span>
              <p className="mt-4 text-[14px] font-medium text-white/85">No call yet</p>
              <p className="mt-1 max-w-[300px] text-[13px] leading-relaxed text-white/45">Start a call on the phone. The conversation and every step the agent takes will appear here as they happen.</p>
              {pastCalls.length > 0 && (
                <button type="button" onClick={() => setTab("history")} className="mt-5 min-h-[36px] rounded-lg border border-white/10 px-3.5 text-[12.5px] text-white/75 transition-colors hover:bg-white/[0.06] hover:text-white">
                  Open a past call
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Call header: what call this is and what is happening now. */}
              <div className="pb-5 pt-6">
                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0 text-[16px] font-semibold leading-snug text-white">{callRow?.title ?? "Playback support call"}</p>
                  <span className="mt-0.5 flex shrink-0 items-center gap-1.5 rounded-full bg-white/[0.05] px-2.5 py-1 text-[12px]" style={{ color: `rgb(${pill[1]})` }}>
                    <span className="h-1.5 w-1.5 rounded-full transition-colors duration-200" style={{ backgroundColor: `rgb(${pill[1]})` }} aria-hidden />
                    <Swap k={pill[0]}>{pill[0]}</Swap>
                  </span>
                </div>
                <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-[12px] text-white/45">
                  {elapsed.prefix !== "Ready" && (
                    <span>
                      <Swap k={elapsed.prefix}>
                        <Shimmer active={status === "active"} base={0.75} idle={0.5} rgb={status === "active" ? activityColor : "255, 255, 255"}>{elapsed.prefix}</Shimmer>
                      </Swap>
                      {elapsed.value && <span className="tabular-nums"> {elapsed.value}</span>}
                    </span>
                  )}
                  {elapsed.prefix !== "Ready" && callMeta && <span aria-hidden>·</span>}
                  {callMeta && <span>{callMeta}</span>}
                </p>

                {/* What the agent is doing right now (live calls only). */}
                <AnimatePresence initial={false}>
                  {statusLine && (
                    <motion.div
                      key="status"
                      initial={reduce ? false : { opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: reduce ? 0 : 0.24, ease: EASE }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 flex items-center gap-2.5 rounded-lg bg-white/[0.04] px-3 py-2.5 text-[13px]">
                        <span className="relative flex h-3.5 w-3.5 shrink-0 items-center justify-center">
                          <AnimatePresence initial={false} mode="wait">
                            <motion.span
                              key={busy ? "busy" : status === "error" ? "warn" : "idle"}
                              className="flex items-center justify-center"
                              style={{ color: `rgb(${activityColor})` }}
                              initial={reduce ? false : ICON_IN}
                              animate={SHARP}
                              exit={{ ...ICON_IN, transition: { duration: reduce ? 0 : SWAP_OUT, ease: "easeIn" } }}
                              transition={{ duration: reduce ? 0 : SWAP_IN, ease: EASE }}
                            >
                              {busy ? (
                                <Spinner size={13} />
                              ) : status === "error" ? (
                                <AlertTriangle size={13} aria-hidden />
                              ) : (
                                <span className={cn("h-1.5 w-1.5 rounded-full bg-[#63d392]", assistantSpeaking && "motion-safe:animate-pulse")} aria-hidden />
                              )}
                            </motion.span>
                          </AnimatePresence>
                        </span>
                        <span className="min-w-0 truncate" aria-live="polite">
                          <Swap k={statusLine}>
                            <Shimmer active={busy} rgb={activityColor}>{statusLine}</Shimmer>
                          </Swap>
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {viewingPast && callRow?.summary && <p className="mt-4 text-[13px] leading-relaxed text-white/70">{callRow.summary}</p>}
              </div>

              <Section
                title="Conversation"
                meta={shownTranscript.length ? `${shownTranscript.length} message${shownTranscript.length === 1 ? "" : "s"}` : undefined}
                open={sections.conversation}
                onToggle={() => toggleSection("conversation")}
              >
                {shownTranscript.length > 0 ? (
                  <LiveTranscript transcript={shownTranscript} markers={markers} reduce={!!reduce} follow={liveCall} />
                ) : (
                  <p className="text-[13px] text-white/40">{liveCall ? "Waiting for the first words…" : "No conversation was recorded for this call."}</p>
                )}
              </Section>

              <Section
                title="Agent steps"
                meta={
                  <>
                    {toolCount} tool{toolCount === 1 ? "" : "s"}
                    {liveCount > 0 && ` · ${liveCount} live`}
                    {simCount > 0 && ` · ${simCount} simulated`}
                    {failed.length > 0 && <span className="text-[#ff8a8f]"> · {failed.length} failed</span>}
                  </>
                }
                open={sections.steps}
                onToggle={() => toggleSection("steps")}
              >
                {steps.length > 0 ? (
                  <Rail key="rail" steps={steps} />
                ) : (
                  <p className="text-[13px] text-white/40">No steps yet.</p>
                )}
                {usedSources.length > 0 && (
                  <ul className="mt-4 space-y-1 text-[11.5px] text-white/40">
                    {usedSources.map((k) => (
                      <li key={k} className="flex items-baseline gap-2">
                        <span className={cn("shrink-0 rounded px-1.5 py-px font-mono text-[10.5px] leading-[16px]", SOURCE[k].tag)}>{SOURCE[k].name}</span>
                        <span>{SOURCE_NOTE[k]}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>

              {metrics && (
                <Section
                  title="Call measurements"
                  meta={callRow?.analyticsState ?? "Not evaluated"}
                  open={sections.measurements}
                  onToggle={() => toggleSection("measurements")}
                >
                  {metrics}
                </Section>
              )}
            </>
          )}
        </div>
      </aside>
    </MotionConfig>
  );
}
