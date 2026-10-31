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
 * Row insertion (newest on top; also mid-list), frames 113-136:
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
import { useMutation, useQuery } from "convex/react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";
import { ChevronLeft, ChevronRight, Activity, AlertTriangle, History, Trash2, Wrench, X } from "lucide-react";
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
  handoff?: { team: string; at: number } | null;
  clientEvents: ActivityEvent[];
  transcript: TranscriptLine[];
  /** Open a past call (from the history list) in the panel. */
  onOpenPastCall?: (callId: string) => void;
};

type ViewData = {
  serverEvents: Doc<"callEvents">[];
  pastCalls: Doc<"calls">[];
  callRow: Doc<"calls"> | null;
  storedTranscript: Doc<"transcripts">[];
  onClearHistory?: () => Promise<unknown>;
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

/** Source name + dot color: blue / amber / teal / gray, tuned for the dark panel. */
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
  const callArgs = skip ? "skip" : { callId: props.callId ?? "" };
  const serverEvents = useQuery(api.callEvents.byCall, callArgs) ?? [];
  const pastCalls = useQuery(api.calls.list, skip ? "skip" : { limit: 50 }) ?? [];
  const callRow = useQuery(api.calls.get, callArgs) ?? null;
  const storedTranscript = useQuery(api.calls.transcriptByCall, callArgs) ?? [];
  const clearAll = useMutation(api.calls.clearAll);
  return <View {...props} serverEvents={serverEvents} pastCalls={pastCalls} callRow={callRow} storedTranscript={storedTranscript} onClearHistory={() => clearAll({})} />;
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
function Shimmer({ children, active, base = 0.8, idle = 0.6 }: { children: string; active: boolean; base?: number; idle?: number }) {
  const reduce = useReducedMotion();
  if (!active || reduce) return <span style={{ color: `rgba(255,255,255,${active ? base : idle})` }}>{children}</span>;
  const b = `rgba(255,255,255,${base})`;
  return (
    <motion.span
      className="bg-clip-text text-transparent"
      style={{
        backgroundImage: `linear-gradient(90deg, ${b} 0%, ${b} 41%, rgba(255,255,255,${base * 0.4}) 50%, ${b} 59%, ${b} 100%)`,
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
  const color = step.status === "failed" ? "bg-[#ff6369]" : SOURCE[step.source].dot;
  return (
    <span className="relative z-[1] flex h-3.5 w-3.5 shrink-0 items-center justify-center" aria-label={step.status === "info" || step.status === "succeeded" ? "done" : step.status}>
      <AnimatePresence initial={false}>
        {running ? (
          <motion.span
            key="spin"
            className="absolute inset-0 flex items-center justify-center text-white/85"
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
            <span className={cn("h-2 w-2 rounded-full transition-colors duration-[120ms]", color)} />
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
            className={cn(
              "truncate text-[13px] transition-colors duration-[120ms]",
              running ? "text-white" : step.status === "failed" ? "text-[#ff8a8f]" : "text-white/75"
            )}
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

  // Newest on top, like the reference.
  const display = [...steps].reverse();
  const n = display.length;
  return (
    <ol className="relative mt-2 max-h-[266px] overflow-y-auto overscroll-contain px-4 pb-1.5 [scrollbar-width:thin]">
      <AnimatePresence initial={false}>
        {display.map((s, i) => {
          const entrance: Entrance = seen.intro.has(s.id)
            ? { mode: "intro", delay: 0.06 + (n - 1 - i) * INTRO_STAGGER }
            : { mode: "insert", delay: seen.stagger.get(s.id) ?? 0 };
          return <StepRow key={s.id} step={s} entrance={entrance} first={i === 0} last={i === n - 1} expanded={openIds.has(s.id)} onToggle={() => toggle(s.id)} />;
        })}
      </AnimatePresence>
    </ol>
  );
}

/* ------------------------------------------------------------------ live transcript */

type Marker = { id: string; at: number; tool: string; status: Step["status"]; detail?: string };

/** Transcript lines with the tool calls the agent made, interleaved where they happened. */
function LiveTranscript({ transcript, markers, reduce }: { transcript: TranscriptLine[]; markers: Marker[]; reduce: boolean }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const last = transcript[transcript.length - 1];
  const rows = useMemo(() => {
    const merged: Array<{ kind: "line"; t: TranscriptLine; at: number } | { kind: "tool"; m: Marker; at: number }> = [
      ...transcript.map((t) => ({ kind: "line" as const, t, at: t.at })),
      ...markers.map((m) => ({ kind: "tool" as const, m, at: m.at })),
    ];
    return merged.sort((a, b) => a.at - b.at);
  }, [transcript, markers]);
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: reduce ? "auto" : "smooth" });
  }, [rows.length, last?.text, reduce]);
  return (
    <div className="mt-4">
      <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-white/35">Live transcript</p>
      <div ref={boxRef} className="max-h-[240px] overflow-y-auto overscroll-contain rounded-xl border border-white/[0.07] bg-white/[0.02] px-3.5 py-3 [scrollbar-width:thin]">
        <ul className="space-y-2">
          {rows.map((r) => {
            if (r.kind === "tool") {
              const m = r.m;
              const color = m.status === "failed" ? "text-[#ff8a8f]" : m.status === "running" ? "text-white/55" : "text-[#6edcb8]/80";
              return (
                <motion.li key={`tool-${m.id}`} initial={reduce ? false : BLUR_IN} animate={SHARP} transition={{ duration: reduce ? 0 : REVEAL, ease: EASE }} className="flex items-center gap-1.5 font-mono text-[11px]">
                  <Wrench size={10} aria-hidden className={cn("shrink-0", color)} />
                  <span className={color}>{m.tool}</span>
                  {m.status === "running" ? <Spinner size={10} className="text-white/40" /> : m.detail ? <span className="truncate text-white/35">· {m.detail}</span> : null}
                </motion.li>
              );
            }
            const t = r.t;
            const isLast = t === last;
            return (
              <motion.li
                key={t.id}
                initial={reduce ? false : BLUR_IN}
                animate={SHARP}
                transition={{ duration: reduce ? 0 : REVEAL, ease: EASE }}
                className={cn("text-[13px] leading-snug", t.role === "assistant" ? "text-white/90" : "text-white/50")}
              >
                <span className="mr-1.5 text-[10px] uppercase tracking-wide text-white/35">{t.role === "assistant" ? "Agent" : "Caller"}</span>
                {isLast && t.role === "assistant" ? <StreamText text={t.text} /> : t.text}
              </motion.li>
            );
          })}
        </ul>
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
  const secs = Math.round(c.durationSeconds ?? ((c.endedAt ?? now) - c.startedAt) / 1000);
  if (!Number.isFinite(secs) || secs < 0) return "";
  return secs >= 60 ? `${Math.floor(secs / 60)}m ${secs % 60}s` : `${secs}s`;
}

/**
 * The panel's second view: every past call, like a chat app's conversation list. Newest first,
 * grouped by day, each row opens that call's own activity view (steps card + transcript).
 * A red two-step "Delete past calls" clears the calls, their transcripts and their tool events.
 */
function HistoryView({ calls, currentId, busy, onOpen, onClear, reduce }: { calls: Doc<"calls">[]; currentId: string | null; busy: boolean; onOpen?: (id: string) => void; onClear?: () => Promise<unknown>; reduce: boolean }) {
  const [confirm, setConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);
  const now = useNow();
  const groups: { label: string; items: Doc<"calls">[] }[] = [];
  for (const c of calls) {
    const label = now ? dayBucket(c.startedAt, now) : "Recent";
    const g = groups[groups.length - 1];
    if (g && g.label === label) g.items.push(c);
    else groups.push({ label, items: [c] });
  }
  const deletable = calls.filter((c) => c.status === "ended").length;

  return (
    <motion.div key="history" initial={reduce ? false : BLUR_IN} animate={SHARP} exit={reduce ? undefined : BLUR_IN} transition={{ duration: reduce ? 0 : REVEAL, ease: EASE }} className="mt-3">
      {calls.length === 0 ? (
        <p className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-[13px] text-white/45">
          No past calls yet. Each finished call is listed here with its steps and transcript.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
          {groups.map((g) => (
            <div key={g.label}>
              <p className="px-4 pb-1 pt-3 text-[10.5px] font-medium uppercase tracking-wide text-white/35">{g.label}</p>
              <ul>
                {g.items.map((c) => {
                  const current = c.callId === currentId;
                  const live = c.status === "in-progress";
                  return (
                    <li key={c._id} className="border-t border-white/[0.05]">
                      <button
                        type="button"
                        disabled={!onOpen || (busy && !current)}
                        onClick={() => onOpen?.(c.callId)}
                        aria-current={current ? "true" : undefined}
                        className={cn(
                          "flex min-h-[44px] w-full items-center gap-3 px-4 py-2.5 text-left transition-colors",
                          current ? "bg-white/[0.06]" : "hover:bg-white/[0.04]",
                          (!onOpen || (busy && !current)) && "cursor-default opacity-60"
                        )}
                      >
                        <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", live ? "bg-[#34c79a] motion-safe:animate-pulse" : "bg-white/25")} aria-hidden />
                        <span className="min-w-0 flex-1">
                          <span className={cn("block truncate text-[13px]", current ? "text-white" : "text-white/85")}>{c.title ?? "Playback support call"}</span>
                          <span className="block truncate font-mono text-[10.5px] text-white/40">
                            {now ? relativeTime(c.startedAt, now) : ""}
                            {now && durationText(c, now) ? ` · ${durationText(c, now)}` : ""}
                            {` · ${c.toolCount} tool${c.toolCount === 1 ? "" : "s"}`}
                            {c.transcriptCount ? ` · ${c.transcriptCount} lines` : ""}
                            {c.channel !== "unknown" ? ` · ${c.channel}` : ""}
                            {live ? " · live" : c.endedReason ? ` · ${c.endedReason.replace(/-/g, " ")}` : ""}
                          </span>
                        </span>
                        <ChevronRight size={14} aria-hidden className="shrink-0 text-white/30" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}

      {onClear && deletable > 0 && (
        <div className="mt-4 flex min-h-[44px] flex-wrap items-center gap-2">
          {confirm ? (
            <>
              <span className="text-[12.5px] text-white/65">Delete {deletable} past call{deletable === 1 ? "" : "s"} and their logs?</span>
              <button
                type="button"
                disabled={clearing}
                onClick={async () => {
                  setClearing(true);
                  try {
                    await onClear();
                  } finally {
                    setClearing(false);
                    setConfirm(false);
                  }
                }}
                className="min-h-[36px] rounded-lg bg-[#ff5f66] px-3.5 text-[13px] font-medium text-white hover:bg-[#ff747a] disabled:opacity-50"
              >
                {clearing ? "Deleting…" : "Delete"}
              </button>
              <button type="button" onClick={() => setConfirm(false)} className="min-h-[36px] rounded-lg px-3 text-[13px] text-white/60 hover:text-white/90">
                Cancel
              </button>
            </>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={() => setConfirm(true)}
              title={busy ? "Available when no call is in progress" : undefined}
              className="flex min-h-[40px] items-center gap-2 rounded-lg border border-[#ff5f66]/35 bg-[#ff5f66]/[0.12] px-3.5 text-[13px] font-medium text-[#ff8a8f] transition-colors hover:bg-[#ff5f66]/20 disabled:opacity-40"
            >
              <Trash2 size={14} aria-hidden /> Delete past calls
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ view */

function View({ open, onToggle, callId, status, startedAt, assistantSpeaking, handoff, clientEvents, transcript, onOpenPastCall, serverEvents, pastCalls, callRow, storedTranscript, onClearHistory }: Props & ViewData) {
  const reduce = useReducedMotion();
  const [cardOpen, setCardOpen] = useState(true);
  const [view, setView] = useState<"activity" | "history">("activity");
  const elapsed = useElapsed(startedAt, status);
  const logged = useMemo(() => buildSteps(serverEvents, clientEvents), [serverEvents, clientEvents]);
  // Live lines while a call runs; the stored transcript when replaying a past call.
  const shownTranscript: TranscriptLine[] =
    transcript.length > 0 ? transcript : storedTranscript.map((t) => ({ id: t._id, role: t.role, text: t.text, final: true, at: t.at }));
  const viewingPast = !!callRow && callRow.status === "ended" && status !== "active" && status !== "connecting";
  // A replayed call has no client rows (Connected / Call ended), so frame its tool rows from the stored call record.
  const steps: Step[] =
    viewingPast && clientEvents.length === 0 && callRow
      ? [
          { id: `${callRow.callId}-start`, at: callRow.startedAt, label: "Call connected", status: "info", source: "call" },
          ...logged,
          { id: `${callRow.callId}-end`, at: callRow.endedAt ?? callRow.startedAt + (callRow.durationSeconds ?? 0) * 1000, label: "Call ended", status: "info", source: "call", detail: callRow.endedReason?.replace(/-/g, " ") },
        ]
      : logged;
  const liveCall = status === "active" || status === "connecting";

  const running = steps.filter((s) => s.status === "running");
  const failed = steps.filter((s) => s.status === "failed");
  const tools = steps.filter((s) => s.source !== "call" && s.source !== "model");
  const markers: Marker[] = steps.flatMap((s) => (s.tool && s.tool !== "delegate" ? [{ id: s.id, at: s.at, tool: s.tool, status: s.status, detail: s.detail }] : []));
  const liveCount = tools.filter((s) => s.source === "live").length;
  const simCount = tools.filter((s) => s.source === "simulated").length;

  const statusLine =
    status === "connecting" ? "Connecting to the assistant"
    : status === "active" && running.length ? running[running.length - 1].label
    : status === "active" && handoff ? `Transferring to ${handoff.team}`
    : status === "active" && assistantSpeaking ? "Speaking"
    : status === "active" ? "Listening"
    : status === "ended" ? "Call ended"
    : status === "error" ? "Call failed"
    : null;
  const busy = status === "connecting" || (status === "active" && (running.length > 0 || !!handoff));
  const warn = failed.length > 0 && status !== "active";

  const pill = {
    idle: ["Ready", "bg-[#8e8e93]"],
    connecting: ["Connecting", "bg-[#f5b83d]"],
    active: ["Live", "bg-[#34c79a]"],
    ended: ["Ended", "bg-[#8e8e93]"],
    error: ["Failed", "bg-[#ff6369]"],
  }[status];

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
          "sm:inset-x-auto sm:inset-y-0 sm:right-0 sm:h-auto sm:w-[400px] sm:max-w-[94vw] sm:rounded-none sm:border-l sm:border-t-0 sm:shadow-[-20px_0_60px_rgba(0,0,0,0.45)]",
          open ? "translate-y-0 sm:translate-x-0" : "translate-y-full sm:translate-x-full sm:translate-y-0"
        )}
        style={{ fontFamily: "var(--font-geist-sans), -apple-system, system-ui, sans-serif" }}
        aria-label="Agent activity"
        role="dialog"
        aria-modal={open ? "true" : undefined}
      >
        {/* grabber, phones only */}
        <div className="mx-auto mt-2.5 h-1 w-9 shrink-0 rounded-full bg-white/25 sm:hidden" aria-hidden />
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-5 pt-4 sm:px-5 sm:pt-6">
          <div className="flex items-center justify-between gap-3">
            {view === "history" ? (
              <button
                type="button"
                onClick={() => setView("activity")}
                className="-ml-1 flex min-h-[44px] items-center gap-1 text-[13px] text-white/55 transition-colors hover:text-white/85 sm:min-h-0"
              >
                <ChevronLeft size={14} aria-hidden />
                Activity
                <span className="ml-2 font-medium text-white/90">Past calls</span>
                <span className="ml-1 rounded-full bg-white/[0.08] px-1.5 py-px font-mono text-[10.5px] tabular-nums text-white/55">{pastCalls.length}</span>
              </button>
            ) : (
            <motion.button
              type="button"
              onClick={() => setCardOpen((o) => !o)}
              aria-expanded={cardOpen}
              className="flex items-center gap-1.5 text-[13px] text-white/55 transition-colors hover:text-white/85"
              initial={reduce ? false : BLUR_IN}
              animate={SHARP}
              transition={{ duration: 0.22, ease: EASE }}
            >
              <motion.span initial={false} animate={{ rotate: cardOpen ? 90 : 0 }} transition={{ duration: reduce ? 0 : 0.2, ease: EASE }} className="flex">
                <ChevronRight size={14} />
              </motion.span>
              <Swap k={elapsed.prefix}>
                <Shimmer active={status === "active"} base={0.75} idle={0.75}>{elapsed.prefix}</Shimmer>
              </Swap>
              {/* counter ticks as a hard cut, like the reference */}
              {elapsed.value && <span className="tabular-nums text-white/40">{elapsed.value}</span>}
            </motion.button>
            )}
            <span className="flex shrink-0 items-center gap-0.5">
              {view === "activity" && (
                <button
                  type="button"
                  onClick={() => setView("history")}
                  aria-label={`Past calls (${pastCalls.length})`}
                  title="Past calls"
                  className="flex h-11 items-center gap-1.5 rounded-full px-2.5 text-[12.5px] text-white/55 transition-colors hover:bg-white/[0.06] hover:text-white/90 sm:h-7"
                >
                  <History size={14} aria-hidden />
                  <span className="hidden sm:inline">Past calls</span>
                  <span className="rounded-full bg-white/[0.08] px-1.5 py-px font-mono text-[10.5px] tabular-nums">{pastCalls.length}</span>
                </button>
              )}
            {/* Open: compact close control in the header row */}
            <button
              type="button"
              onClick={onToggle}
              aria-expanded={open}
              aria-label="Hide agent activity"
              tabIndex={open ? 0 : -1}
              className="-mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white/50 transition-colors hover:bg-white/[0.06] hover:text-white/90 sm:-mr-1.5 sm:h-7 sm:w-7"
            >
              <X size={15} aria-hidden />
            </button>
            </span>
          </div>

          {view === "history" ? (
            <HistoryView
              calls={pastCalls}
              currentId={callId}
              busy={liveCall}
              onOpen={(id) => {
                onOpenPastCall?.(id);
                setView("activity");
              }}
              onClear={onClearHistory}
              reduce={!!reduce}
            />
          ) : (
          <>
          <AnimatePresence initial={false}>
            {cardOpen && (
              <motion.section
                key="card"
                initial={reduce ? false : { opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: reduce ? 0 : 0.28, ease: EASE }}
                className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]"
              >
                <header className="flex items-center justify-between px-4 pt-3.5">
                  <motion.h2
                    className="text-[13.5px] font-semibold text-white/95"
                    initial={reduce ? false : BLUR_IN}
                    animate={SHARP}
                    transition={{ duration: 0.22, ease: EASE, delay: 0.04 }}
                  >
                    Playback support call
                  </motion.h2>
                  <span className="flex items-center gap-1.5 text-[12px] text-white/55">
                    <span className={cn("h-1.5 w-1.5 rounded-full transition-colors duration-200", pill[1])} aria-hidden />
                    <Swap k={pill[0]}>{pill[0]}</Swap>
                  </span>
                </header>

                {/* Rail */}
                {steps.length > 0 ? (
                  <Rail key="rail" steps={steps} />
                ) : (
                  <p key="empty" className="px-4 py-2.5 text-[13px] text-white/40">
                    No steps yet. Start a call and activity appears here.
                  </p>
                )}

                {/* Status line, like "Pushing 3 commits to origin" */}
                <AnimatePresence initial={false}>
                  {statusLine && (
                    <motion.div
                      key="status"
                      layout="position"
                      initial={reduce ? false : { opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: reduce ? 0 : 0.24, ease: EASE }}
                      className="overflow-hidden"
                    >
                      <div className="flex items-center gap-2 border-t border-white/[0.06] px-4 py-2.5 text-[13px]">
                        <span className="relative flex h-3.5 w-3.5 shrink-0 items-center justify-center">
                          <AnimatePresence initial={false} mode="wait">
                            <motion.span
                              key={busy ? "busy" : warn ? "warn" : "idle"}
                              className="flex items-center justify-center"
                              initial={reduce ? false : ICON_IN}
                              animate={SHARP}
                              exit={{ ...ICON_IN, transition: { duration: reduce ? 0 : SWAP_OUT, ease: "easeIn" } }}
                              transition={{ duration: reduce ? 0 : SWAP_IN, ease: EASE }}
                            >
                              {busy ? (
                                <Spinner size={13} className="text-white/70" />
                              ) : warn ? (
                                <AlertTriangle size={13} className="text-[#f5c45e]" aria-hidden />
                              ) : (
                                <span
                                  className={cn(
                                    "h-1.5 w-1.5 rounded-full",
                                    status === "active" ? (assistantSpeaking ? "bg-[#34c79a] motion-safe:animate-pulse" : "bg-[#34c79a]") : "bg-white/30"
                                  )}
                                  aria-hidden
                                />
                              )}
                            </motion.span>
                          </AnimatePresence>
                        </span>
                        <span className="min-w-0 truncate" aria-live="polite">
                          <Swap k={statusLine}>
                            <Shimmer active={busy}>{statusLine}</Shimmer>
                          </Swap>
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.section>
            )}
          </AnimatePresence>

          {/* Live transcript: scrolls, follows the newest line */}
          {shownTranscript.length > 0 && <LiveTranscript transcript={shownTranscript} markers={markers} reduce={!!reduce} />}

          {viewingPast && callRow?.summary && (
            <div className="mt-3 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3.5 py-3">
              <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-white/35">Call summary</p>
              <p className="text-[13px] leading-snug text-white/75">{callRow.summary}</p>
            </div>
          )}

          {/* Chips */}
          <motion.div layout="position" transition={{ layout: { duration: reduce ? 0 : 0.26, ease: EASE } }} className="mt-4 flex flex-wrap items-center gap-2 text-[12px] text-white/60">
            <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1">
              <span className={cn("h-1.5 w-1.5 rounded-full transition-colors duration-200", pill[1])} aria-hidden />
              {callId ? `Call ${callId.slice(0, 8)}` : "No call"}
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 tabular-nums">
              {tools.length} tool{tools.length === 1 ? "" : "s"} · <span className={SOURCE.live.text}>{liveCount} live</span> ·{" "}
              <span className={SOURCE.simulated.text}>{simCount} simulated</span>
            </span>
            {shownTranscript.length > 0 && (
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 tabular-nums">Transcript {shownTranscript.length}</span>
            )}
            {viewingPast && (
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1">
                Past call{callRow?.endedReason ? ` · ${callRow.endedReason.replace(/-/g, " ")}` : ""}
              </span>
            )}
          </motion.div>

          </>
          )}

        </div>

        <footer className="border-t border-white/[0.08] px-4 py-2 text-[11px] leading-snug text-white/40 sm:px-5" style={{ paddingBottom: "max(8px, env(safe-area-inset-bottom))" }}>
          Apple = live App Store lookup. Simulated = demo customers, teams, callbacks; not MultiTracks systems. Docs = bounded help-center snapshot. Model = GPT-Live reasoning.
        </footer>
      </aside>
    </MotionConfig>
  );
}
