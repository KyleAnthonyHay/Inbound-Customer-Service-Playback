"use client";

import { useEffect, useState } from "react";
import { Moon } from "lucide-react";
import { cn } from "@/lib/cn";
import type { CallStatus } from "@/lib/useVapiCall";

type Props = {
  status: CallStatus;
  /** Big line under the timer: the number being called, or a label. */
  label: string;
  /** Faint line under the number, like iOS's city/state. */
  subtitle?: string;
  startedAt: number | null;
  muted: boolean;
  assistantSpeaking: boolean;
  onStart: () => void;
  onEnd: () => void;
  onToggleMute: () => void;
  onKeypadDigit?: (digit: string) => void;
};

function useElapsed(startedAt: number | null, running: boolean) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [running]);
  if (!startedAt || now === null) return "00:00";
  const s = Math.max(0, Math.floor((now - startedAt) / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

function statusText(status: CallStatus, elapsed: string) {
  switch (status) {
    case "idle":
      return "00:00";
    case "connecting":
      return "calling…";
    case "active":
      return elapsed;
    case "ended":
      return "Call Ended";
    case "error":
      return "Call Failed";
  }
}

/* ---------- iOS-style icons (drawn to match the screenshot) ---------- */

function SpeakerIcon() {
  return (
    <svg width="40" height="34" viewBox="0 0 40 34" fill="none" aria-hidden>
      <path d="M4 12.5h6.5L19 5v24l-8.5-7.5H4z" fill="currentColor" />
      <path d="M24 10.5c2 1.6 3.2 4 3.2 6.5s-1.2 4.9-3.2 6.5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M28.5 6c3.4 2.6 5.5 6.6 5.5 11s-2.1 8.4-5.5 11" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

function EndIcon() {
  return (
    <svg width="42" height="42" viewBox="0 0 42 42" fill="none" aria-hidden>
      <path
        d="M6.5 25.2c-1.1-1.3-1-3.2.2-4.4C10.6 17 15.6 15 21 15s10.4 2 14.3 5.8c1.2 1.2 1.3 3.1.2 4.4l-2.2 2.6c-.9 1.1-2.5 1.4-3.8.7l-4-2.2c-1-.6-1.6-1.7-1.5-2.9l.1-1.6c-2-.6-4.2-.6-6.2 0l.1 1.6c.1 1.2-.5 2.3-1.5 2.9l-4 2.2c-1.3.7-2.9.4-3.8-.7z"
        fill="currentColor"
      />
    </svg>
  );
}

function KeypadIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" fill="currentColor" aria-hidden>
      {[0, 1, 2].map((r) =>
        [0, 1, 2].map((c) => <circle key={`${r}${c}`} cx={7 + c * 10} cy={5 + r * 9} r="3.2" />)
      )}
      <circle cx="17" cy="32" r="3.2" />
    </svg>
  );
}

function CallIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="currentColor" aria-hidden>
      <path d="M12.6 6.3c1.2-.4 2.5.1 3.1 1.2l2.6 4.6c.6 1 .4 2.3-.4 3.1l-2 2c1.6 3.3 4.2 5.9 7.5 7.5l2-2c.8-.8 2.1-1 3.1-.4l4.6 2.6c1.1.6 1.6 1.9 1.2 3.1l-1 3.1c-.4 1.3-1.7 2.2-3 2-12.6-1.5-22.6-11.5-24.1-24.1-.2-1.3.7-2.6 2-3z" />
    </svg>
  );
}

/* ---------- Buttons ---------- */

function RoundButton({
  icon, label, onClick, active, disabled, variant = "default",
}: {
  icon: React.ReactNode; label: string; onClick?: () => void; active?: boolean; disabled?: boolean;
  variant?: "default" | "end" | "answer";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      className="flex flex-col items-center gap-[10px] select-none disabled:opacity-40"
    >
      <span
        className={cn(
          "flex h-[84px] w-[84px] items-center justify-center rounded-full transition-colors",
          variant === "default" &&
            (active ? "bg-white text-black" : "bg-white/[0.17] text-white ring-1 ring-inset ring-white/20 active:bg-white/30"),
          variant === "end" && "bg-[#ff3b30] text-white active:bg-[#d92b22]",
          variant === "answer" && "bg-[#34c759] text-white active:bg-[#28a745]"
        )}
      >
        {icon}
      </span>
      <span className="text-[17px] leading-none text-white">{label}</span>
    </button>
  );
}

/* ---------- Keypad ---------- */

const KEYS: Array<[string, string]> = [
  ["1", ""], ["2", "ABC"], ["3", "DEF"],
  ["4", "GHI"], ["5", "JKL"], ["6", "MNO"],
  ["7", "PQRS"], ["8", "TUV"], ["9", "WXYZ"],
  ["*", ""], ["0", "+"], ["#", ""],
];

function Keypad({ onDigit }: { onDigit: (d: string) => void }) {
  return (
    <div className="grid grid-cols-3 gap-x-[22px] gap-y-[14px]" role="group" aria-label="Keypad">
      {KEYS.map(([d, letters]) => (
        <button
          key={d}
          type="button"
          onClick={() => onDigit(d)}
          aria-label={`Key ${d}${letters ? ` ${letters}` : ""}`}
          className="flex h-[82px] w-[82px] flex-col items-center justify-center rounded-full bg-white/[0.17] text-white active:bg-white/35"
        >
          <span className={cn("leading-none", d === "*" ? "mt-3 text-[46px]" : "text-[36px] font-normal")}>{d}</span>
          {letters && <span className={cn("mt-0.5 text-[10px] font-semibold tracking-[0.18em]", d === "0" && "text-[18px] tracking-normal")}>{letters}</span>}
        </button>
      ))}
    </div>
  );
}

/* ---------- Screen ---------- */

export function CallScreen({
  status, label, subtitle, startedAt, muted, assistantSpeaking, onStart, onEnd, onToggleMute, onKeypadDigit,
}: Props) {
  const elapsed = useElapsed(startedAt, status === "active");
  const inCall = status === "active" || status === "connecting";
  const [keypadOpen, setKeypadOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [speaker, setSpeaker] = useState(false);

  useEffect(() => {
    if (status === "ended" || status === "error") {
      setKeypadOpen(false);
      setTyped("");
    }
  }, [status]);

  const digit = (d: string) => {
    setTyped((t) => (t + d).slice(-24));
    onKeypadDigit?.(d);
  };

  return (
    <div
      className="relative flex h-full w-full select-none flex-col overflow-hidden bg-[#1c1c1e] text-white"
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", Inter, system-ui, sans-serif' }}
    >
      {/* Status bar */}
      <div className="relative flex h-[54px] items-center justify-between px-[26px] pt-[6px] text-[17px] font-semibold">
        <span className="flex items-center gap-1.5 tabular-nums">
          10:00 <Moon size={15} fill="currentColor" aria-hidden />
        </span>
        {/* Dynamic Island */}
        <span className="absolute left-1/2 top-[12px] flex h-[37px] w-[126px] -translate-x-1/2 items-center justify-end rounded-full bg-black pr-[26px]" aria-hidden>
          <span className={cn("h-[7px] w-[7px] rounded-full", inCall ? "bg-[#ff9f0a]" : "bg-transparent")} />
        </span>
        <span className="flex items-center gap-[6px]">
          <svg width="20" height="13" viewBox="0 0 20 13" fill="currentColor" aria-hidden>
            <rect x="0" y="9" width="3.5" height="4" rx="1" /><rect x="5.5" y="6.5" width="3.5" height="6.5" rx="1" />
            <rect x="11" y="3.5" width="3.5" height="9.5" rx="1" /><rect x="16.5" y="0" width="3.5" height="13" rx="1" opacity="0.35" />
          </svg>
          <span className="text-[15px] leading-none">5G<span className="align-top text-[8px] leading-none">UW</span></span>
          <span className="relative flex h-[13px] w-[28px] items-center rounded-[4px] border border-white/35" aria-label="Battery 40%">
            <span className="ml-[1.5px] h-[9px] w-[9.5px] rounded-[2px] bg-white" />
            <span className="absolute -right-[4px] top-1/2 h-[5px] w-[2px] -translate-y-1/2 rounded-r bg-white/35" />
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-black mix-blend-difference">40</span>
          </span>
        </span>
      </div>

      {/* Timer, number, ghost location */}
      <div className="mt-[58px] flex flex-col items-center">
        <p className="text-[24px] font-medium tabular-nums text-white/55" aria-live="polite">{statusText(status, elapsed)}</p>
        <h1 className="mt-[2px] text-center text-[44px] font-semibold leading-[1.1] tracking-[-0.01em]">
          {keypadOpen && typed ? <span className="tabular-nums tracking-wide">{typed}</span> : label}
        </h1>
        <p className="mt-[4px] text-[22px] font-medium text-white/[0.07]" aria-hidden>{subtitle ?? " "}</p>
        <span className={cn("mt-5 h-1.5 w-1.5 rounded-full bg-[#34c759] transition-opacity", assistantSpeaking ? "opacity-100" : "opacity-0")} aria-hidden />
      </div>

      <div className="flex-1" />

      {/* Keypad overlay */}
      {keypadOpen && (
        <div className="mb-[26px] flex flex-col items-center">
          <Keypad onDigit={digit} />
        </div>
      )}

      {/* Buttons */}
      <div className="mx-auto mb-[26px] flex w-full max-w-[380px] items-start justify-between px-[42px]">
        {keypadOpen ? (
          <>
            <span className="w-[84px]" />
            {inCall ? <RoundButton icon={<EndIcon />} label="End" onClick={onEnd} variant="end" /> : <RoundButton icon={<CallIcon />} label="Call" onClick={onStart} variant="answer" />}
            <button type="button" onClick={() => setKeypadOpen(false)} className="w-[84px] pt-[30px] text-[17px] text-white">Hide</button>
          </>
        ) : (
          <>
            <RoundButton icon={<SpeakerIcon />} label="Speaker" onClick={() => setSpeaker((s) => !s)} active={speaker} disabled={!inCall} />
            {inCall ? <RoundButton icon={<EndIcon />} label="End" onClick={onEnd} variant="end" /> : <RoundButton icon={<CallIcon />} label="Call" onClick={onStart} variant="answer" />}
            <RoundButton icon={<KeypadIcon />} label="Keypad" onClick={() => setKeypadOpen(true)} />
          </>
        )}
      </div>

      {/* Mute lives off-screen in iOS when the row is trimmed; keep it keyboard-accessible */}
      <button type="button" onClick={onToggleMute} disabled={status !== "active"} className="sr-only" aria-pressed={muted}>
        {muted ? "Unmute" : "Mute"}
      </button>

      {/* Home indicator */}
      <div className="mx-auto mb-[9px] h-[5px] w-[139px] rounded-full bg-white/80" aria-hidden />
    </div>
  );
}
