"use client";

/*
 * Motion spec, measured from the reference recording (562x592, sampled at 15 fps, 1 frame = 67 ms).
 *
 * Overall feel: everything is ease-out (fast start, long settle), no bounce except the completion dot.
 *   Curve used: cubic-bezier(0.22, 1, 0.36, 1). Nothing slides more than ~6 px; most changes are
 *   opacity + a 3-4 px blur that clears, not a translate.
 *
 * Card intro (frames 19-25, ~400 ms): header "Thinking 0s" fades in first, then the title, then the
 *   rows cascade from the BOTTOM (oldest) up to the top (newest), ~1 row every 40-45 ms. Each row:
 *   opacity 0 -> 1, blur 4px -> 0, y +6px -> 0, ~280 ms.
 *
 * List order: newest step on top (git-log style). A new step is inserted at the top or mid-list:
 *   1. Gap opens first: rows below slide down one row height (19 px in the video, 28 px here) over
 *      3-4 frames (~240 ms, ease-out).
 *   2. Then the row content fades in with blur (frame 58 faint/blurred, 59 sharp) starting ~120 ms in.
 *   3. Its label "decodes": resolved prefix grows left -> right with a ~6-char random-glyph tail in a
 *      lighter color ("Add o5tfa1a" -> "Add session 6fcmfj" -> "Add session refresh tests"),
 *      9 frames for 25 chars (~600 ms, ~24 ms/char). A label that changes in place decodes the same way.
 *   4. Right-hand mono metadata ("checking") fades in ~2 frames after the row.
 *   Two rows inserted together stagger by 3 frames (~200 ms), lower (older) one first.
 *
 * Running row: dot is replaced by a thin 3/4-arc spinner (~0.8 s/rev) and the whole row gets a soft
 *   tinted band. Completion (frames 95-98): band fades out (~150 ms), spinner blurs out, the colored
 *   dot scales up from ~0.4 with a slight spring (~200 ms); label color tweens over ~2 frames.
 *
 * Status line (bottom of card): busy text has a shimmer, a light band sweeping left -> right
 *   (~1.4 s loop, linear). Text change = blur crossfade: old text blurs out in 1 frame (~80 ms),
 *   new text sharpens in over ~2 frames (~160 ms). No vertical slide. Spinner stays put.
 *
 * Header counter ("Thinking 1s" -> "2s", "Thinking 5s" -> "Worked for 5s"): in-place blur crossfade,
 *   same timing as the status line; number in a muted tone.
 * Title badges ("#128", "Open") and the warning row/button: fade + blur in over ~2 frames.
 * Message paragraph (frames 103-111): streams in word by word, ~25 words/s (~40 ms/word), each
 *   word fading from blur over ~200 ms, so the leading edge looks soft.
 * Card collapse is not shown in the clip; it uses the same curve: height + opacity, ~280 ms,
 *   chevron rotates 90deg.
 */

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "convex/react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";
import { ChevronRight, Activity, AlertTriangle, X } from "lucide-react";
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

/** Source name + dot color: blue / amber / teal / gray, tuned for the dark panel. */
const SOURCE = {
  live: { name: "Apple", dot: "bg-[#4c9dff]", text: "text-[#6fb0ff]", tag: "bg-[#4c9dff]/[0.14] text-[#8cc0ff]" },
  simulated: { name: "Simulated", dot: "bg-[#f5b83d]", text: "text-[#f5c45e]", tag: "bg-[#f5b83d]/[0.14] text-[#f7cb72]" },
  internal: { name: "Docs", dot: "bg-[#34c79a]", text: "text-[#4fd3a8]", tag: "bg-[#34c79a]/[0.14] text-[#6edcb8]" },
  model: { name: "Model", dot: "bg-[#8e8e93]", text: "text-[#a1a1a6]", tag: "bg-white/[0.08] text-white/60" },
  call: { name: "Call", dot: "bg-[#8e8e93]", text: "text-[#a1a1a6]", tag: "bg-white/[0.08] text-white/60" },
} as const;

const EASE = [0.22, 1, 0.36, 1] as const;
const BLUR_IN = { opacity: 0, filter: "blur(4px)" };
const SHARP = { opacity: 1, filter: "blur(0px)" };
const ROW_H = 28;

export function ActivityPanel(props: Props) {
  const ready = useConvexReady();
  return ready ? <Live {...props} /> : <View {...props} serverEvents={[]} />;
}

function Live(props: Props) {
  const serverEvents = useQuery(api.callEvents.byCall, config.convexUrl ? { callId: props.callId ?? "" } : "skip") ?? [];
  return <View {...props} serverEvents={serverEvents} />;
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
        animate={{ ...SHARP, transition: { duration: reduce ? 0 : 0.16, ease: EASE } }}
        exit={{ ...BLUR_IN, transition: { duration: reduce ? 0 : 0.08, ease: "easeIn" } }}
      >
        {children}
      </motion.span>
    </AnimatePresence>
  );
}

/** Light band sweeping left to right across busy text. */
function Shimmer({ children, active }: { children: string; active: boolean }) {
  const reduce = useReducedMotion();
  if (!active || reduce) return <span className={active ? "text-white/80" : "text-white/60"}>{children}</span>;
  return (
    <motion.span
      className="bg-clip-text text-transparent"
      style={{
        backgroundImage:
          "linear-gradient(90deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.5) 38%, rgba(255,255,255,0.98) 50%, rgba(255,255,255,0.5) 62%, rgba(255,255,255,0.5) 100%)",
        backgroundSize: "250% 100%",
        WebkitBackgroundClip: "text",
      }}
      initial={{ backgroundPosition: "100% 0%" }}
      animate={{ backgroundPosition: "0% 0%" }}
      transition={{ duration: 1.4, ease: "linear", repeat: Infinity }}
    >
      {children}
    </motion.span>
  );
}

const GLYPHS = "abcdefghijklmnopqrstuvwxyz0123456789";
const TAIL = 6;

/** Deterministic glyph for (tick, index) so render stays pure. */
function glyph(tick: number, i: number) {
  let n = (tick * 374761393 + i * 668265263) | 0;
  n = Math.imul(n ^ (n >>> 15), 2246822519);
  n = Math.imul(n ^ (n >>> 13), 3266489917);
  n = (n ^ (n >>> 16)) >>> 0;
  return GLYPHS[n % GLYPHS.length];
}

/**
 * "Decode" reveal: the resolved prefix grows left to right with a short random tail.
 * Plays on mount when `animateMount`, and again whenever `text` changes.
 */
function ScrambleText({ text, animateMount }: { text: string; animateMount: boolean }) {
  const reduce = useReducedMotion();
  const [done, setDone] = useState<string | null>(animateMount ? null : text);
  const [frame, setFrame] = useState<{ text: string; p: number; tick: number } | null>(null);

  useEffect(() => {
    if (reduce || done === text) return;
    const dur = Math.min(700, Math.max(360, text.length * 24));
    let raf = 0;
    let start = 0;
    const step = (now: number) => {
      if (!start) start = now;
      const p = Math.min(1, (now - start) / dur);
      if (p >= 1) {
        setDone(text);
        setFrame(null);
        return;
      }
      setFrame({ text, p, tick: Math.floor((now - start) / 55) });
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [text, done, reduce]);

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
      <span className="text-white/35">{tail}</span>
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
            transition={{ duration: 0.22, ease: EASE, delay: idx < initialCount ? idx * 0.04 : 0 }}
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
            initial={reduce ? false : { opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.7, filter: "blur(2px)", transition: { duration: reduce ? 0 : 0.12 } }}
            transition={{ duration: reduce ? 0 : 0.16, ease: EASE }}
          >
            <Spinner size={12} />
          </motion.span>
        ) : (
          <motion.span
            key="dot"
            className="absolute inset-0 flex items-center justify-center"
            initial={reduce ? false : { opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={reduce ? { duration: 0 } : { type: "spring", duration: 0.3, bounce: 0.35, delay: 0.05 }}
          >
            <span className={cn("h-2 w-2 rounded-full transition-colors duration-200", color)} />
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

function StepRow({ step, entrance, first, last }: { step: Step; entrance: Entrance; first: boolean; last: boolean }) {
  const reduce = useReducedMotion();
  const meta = SOURCE[step.source];
  const running = step.status === "running";
  const insert = entrance.mode === "insert";
  const d = entrance.delay;

  const initial = reduce ? false : insert ? { height: 0, opacity: 0 } : { opacity: 0, y: 6 };
  const animate = insert ? { height: ROW_H, opacity: 1 } : { opacity: 1, y: 0 };
  const transition = insert
    ? { height: { duration: 0.24, ease: EASE, delay: d }, opacity: { duration: 0.2, ease: EASE, delay: d + 0.12 }, layout: { duration: 0.26, ease: EASE } }
    : { duration: 0.28, ease: EASE, delay: d, layout: { duration: 0.26, ease: EASE } };

  return (
    <motion.li
      layout="position"
      initial={initial}
      animate={animate}
      exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { height: 0, opacity: 0, transition: { duration: 0.2, ease: EASE } }}
      transition={transition}
      className="relative -mx-4 h-7 overflow-hidden px-4"
    >
      {/* running band */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[#ffb35c]/[0.07]"
        initial={false}
        animate={{ opacity: running ? 1 : 0 }}
        transition={{ duration: reduce ? 0 : running ? 0.2 : 0.16, ease: EASE }}
      />
      {/* rail segments above / below the dot */}
      {!first && <span aria-hidden className="absolute left-[22.5px] top-0 h-[9px] w-px bg-white/[0.18]" />}
      {!last && <span aria-hidden className="absolute bottom-0 left-[22.5px] h-[9px] w-px bg-white/[0.18]" />}

      <motion.div
        className="relative flex h-full items-center gap-3"
        initial={reduce ? false : { filter: "blur(4px)" }}
        animate={{ filter: "blur(0px)" }}
        transition={{ duration: reduce ? 0 : 0.24, ease: EASE, delay: insert ? d + 0.12 : d }}
      >
        <StepDot step={step} />
        <span className="flex min-w-0 flex-1 items-center gap-2">
          <span
            className={cn(
              "truncate text-[13px] transition-colors duration-200",
              running ? "text-white" : step.status === "failed" ? "text-[#ff8a8f]" : "text-white/75"
            )}
          >
            <ScrambleText text={step.label} animateMount={insert && !reduce} />
          </span>
          <span className={cn("shrink-0 rounded px-1.5 py-px font-mono text-[10.5px] leading-[16px]", meta.tag)}>{meta.name}</span>
          {step.detail && step.status === "failed" && <span className="truncate text-[12px] text-[#f5c45e]">{step.detail}</span>}
        </span>
        <motion.span
          className="shrink-0 font-mono text-[11px] text-white/40"
          initial={reduce || !insert ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay: d + 0.26 }}
        >
          <Swap k={running ? "running" : typeof step.durationMs === "number" ? `ms${step.durationMs}` : "none"}>
            {running ? "running" : typeof step.durationMs === "number" ? `${step.durationMs} ms` : ""}
          </Swap>
        </motion.span>
      </motion.div>
    </motion.li>
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
  const fresh = steps.filter((s) => !seen.ids.has(s.id));
  if (fresh.length) {
    const ids = new Set(seen.ids);
    const stagger = new Map(seen.stagger);
    fresh.forEach((s, i) => {
      ids.add(s.id);
      stagger.set(s.id, i * 0.2);
    });
    setSeen({ ids, intro: seen.intro, stagger });
  }

  // Newest on top, like the reference.
  const display = [...steps].reverse();
  const n = display.length;
  return (
    <ol className="relative mt-2 px-4 pb-1.5">
      <AnimatePresence initial={false}>
        {display.map((s, i) => {
          const entrance: Entrance = seen.intro.has(s.id)
            ? { mode: "intro", delay: 0.06 + (n - 1 - i) * 0.045 }
            : { mode: "insert", delay: seen.stagger.get(s.id) ?? 0 };
          return <StepRow key={s.id} step={s} entrance={entrance} first={i === 0} last={i === n - 1} />;
        })}
      </AnimatePresence>
    </ol>
  );
}

/* ------------------------------------------------------------------ view */

function View({ open, onToggle, callId, status, startedAt, assistantSpeaking, handoff, clientEvents, transcript, serverEvents }: Props & { serverEvents: Doc<"callEvents">[] }) {
  const reduce = useReducedMotion();
  const [cardOpen, setCardOpen] = useState(true);
  const [showTranscript, setShowTranscript] = useState(false);
  const elapsed = useElapsed(startedAt, status);
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

  const fadeBlur = {
    initial: reduce ? false : BLUR_IN,
    animate: SHARP,
    exit: { ...BLUR_IN, transition: { duration: reduce ? 0 : 0.12 } },
    transition: { duration: reduce ? 0 : 0.22, ease: EASE },
  } as const;

  return (
    <MotionConfig reducedMotion="user">
      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-20 flex w-[400px] max-w-[94vw] flex-col border-l border-white/10 bg-[#111113]/95 text-white shadow-[-20px_0_60px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-transform duration-300",
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
          className="absolute -left-11 top-4 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-[#111113]/95 text-sm text-white/80 backdrop-blur-xl hover:text-white"
        >
          {open ? <X size={18} /> : <Activity size={18} />}
        </button>

        <div className="flex-1 overflow-y-auto px-5 pb-5 pt-6">
          {/* "Thinking 2s" header */}
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
            <Swap k={elapsed.prefix} className="text-white/75">{elapsed.prefix}</Swap>
            {elapsed.value && <Swap k={elapsed.value} className="tabular-nums text-white/40">{elapsed.value}</Swap>}
          </motion.button>

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
                              initial={reduce ? false : { opacity: 0, scale: 0.6 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.6, transition: { duration: reduce ? 0 : 0.08 } }}
                              transition={{ duration: reduce ? 0 : 0.16, ease: EASE }}
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

          {/* Message under the card */}
          <AnimatePresence mode="wait" initial={false}>
            {lastAssistant && (
              <motion.p
                key={lastAssistant.id}
                layout="position"
                initial={false}
                exit={{ opacity: 0, filter: "blur(4px)", transition: { duration: reduce ? 0 : 0.12 } }}
                className="mt-4 text-[14px] leading-relaxed text-white/90"
              >
                <StreamText text={lastAssistant.text} />
              </motion.p>
            )}
          </AnimatePresence>
          <AnimatePresence mode="wait" initial={false}>
            {lastCaller && (
              <motion.p key={lastCaller.id} layout="position" {...fadeBlur} className="mt-2 text-[13px] leading-relaxed text-white/50">
                Caller: {lastCaller.text}
              </motion.p>
            )}
          </AnimatePresence>

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
            <AnimatePresence initial={false}>
              {transcript.length > 0 && (
                <motion.button
                  key="transcript"
                  type="button"
                  {...fadeBlur}
                  onClick={() => setShowTranscript((v) => !v)}
                  aria-expanded={showTranscript}
                  className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 hover:bg-white/[0.07]"
                >
                  Transcript <span className="tabular-nums">{transcript.length}</span>
                  <motion.span initial={false} animate={{ rotate: showTranscript ? 90 : 0 }} transition={{ duration: reduce ? 0 : 0.2, ease: EASE }} className="flex">
                    <ChevronRight size={12} />
                  </motion.span>
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>

          <AnimatePresence initial={false}>
            {showTranscript && (
              <motion.div
                key="transcript"
                initial={reduce ? false : { opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: reduce ? 0 : 0.28, ease: EASE }}
                className="overflow-hidden"
              >
                <ul className="mt-3 space-y-1.5 border-t border-white/[0.08] pt-3">
                  {transcript.map((t) => (
                    <li key={t.id} className={cn("text-[13px] leading-snug", t.role === "assistant" ? "text-white/85" : "text-white/50")}>
                      <span className="mr-1 text-[10px] uppercase tracking-wide text-white/35">{t.role === "assistant" ? "Agent" : "Caller"}</span>
                      {t.text}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <footer className="border-t border-white/[0.08] px-5 py-2 text-[11px] leading-snug text-white/40">
          Apple = live App Store lookup. Simulated = demo customers, teams, callbacks; not MultiTracks systems. Docs = bounded help-center snapshot. Model = GPT-Live reasoning.
        </footer>
      </aside>
    </MotionConfig>
  );
}
