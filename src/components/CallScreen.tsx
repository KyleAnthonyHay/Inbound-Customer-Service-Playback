"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import type { CallStatus } from "@/lib/useVapiCall";

/**
 * iOS Phone in-call screen, measured from a 1320x2868 (440x956 pt) recording.
 * All sizes below are CSS px on a 440x956 logical screen (1 px = 1 pt).
 */

type Props = {
  status: CallStatus;
  label: string;
  subtitle?: string;
  startedAt: number | null;
  muted: boolean;
  assistantSpeaking: boolean;
  onStart: () => void;
  onEnd: () => void;
  onToggleMute: () => void;
  onKeypadDigit?: (digit: string) => void;
  /** Set after a successful simulated handoff; shows the transferring state. */
  handoff?: { team: string; at: number } | null;
};

export const SCREEN_W = 440;
export const SCREEN_H = 956;

// The Phone app's End button, sampled from the reference
const END_RED = "#8a1c16";

const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Inter, system-ui, sans-serif';

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

/* ---------- Icons, sized to the recording ---------- */

function MuteIcon({ dark }: { dark?: boolean }) {
  // 22 x 27, mic with slash
  const c = dark ? "#1c1c1e" : "#ffffff";
  return (
    <svg width="22" height="27" viewBox="0 0 22 27" fill="none" aria-hidden>
      <rect x="7" y="1" width="8" height="14" rx="4" fill={c} />
      <path d="M3.5 11.5a7.5 7.5 0 0 0 15 0" stroke={c} strokeWidth="2" strokeLinecap="round" />
      <path d="M11 19v5M7 24.5h8" stroke={c} strokeWidth="2" strokeLinecap="round" />
      <path d="M2.5 2.5l17 21" stroke={c} strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function KeypadIcon() {
  // 26 x 26, Apple's Phone keypad glyph: a tight 3 x 3 grid, 7.4 pt dots on a 9.3 pt pitch
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="#fff" aria-hidden>
      {[0, 1, 2].map((r) => [0, 1, 2].map((c) => <circle key={`${r}${c}`} cx={3.7 + c * 9.3} cy={3.7 + r * 9.3} r="3.7" />))}
    </svg>
  );
}

function EndIcon() {
  // 30 x 10 handset
  return (
    <svg width="30" height="11" viewBox="0 0 30 11" fill="#fff" aria-hidden>
      <path d="M1.2 7.1C.5 6.4.6 5.3 1.4 4.6 5 1.6 9.9 0 15 0s10 1.6 13.6 4.6c.8.7.9 1.8.2 2.5l-1.8 1.9c-.6.6-1.6.8-2.4.4l-3.3-1.6c-.7-.3-1.1-1-1.1-1.8V5c-2.9-.9-5.9-.9-8.8 0v1c0 .8-.4 1.5-1.1 1.8L7 9.4c-.8.4-1.8.2-2.4-.4z" />
    </svg>
  );
}

function CallIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 40 40" fill="#fff" aria-hidden>
      <path d="M12.6 6.3c1.2-.4 2.5.1 3.1 1.2l2.6 4.6c.6 1 .4 2.3-.4 3.1l-2 2c1.6 3.3 4.2 5.9 7.5 7.5l2-2c.8-.8 2.1-1 3.1-.4l4.6 2.6c1.1.6 1.6 1.9 1.2 3.1l-1 3.1c-.4 1.3-1.7 2.2-3 2-12.6-1.5-22.6-11.5-24.1-24.1-.2-1.3.7-2.6 2-3z" />
    </svg>
  );
}

/* ---------- Status bar ---------- */

function StatusBar({ inCall }: { inCall: boolean }) {
  return (
    <div className="absolute inset-x-0 top-0 h-[54px] [.bare_&]:invisible">
      <span className="absolute left-[38px] top-[22px] text-[17px] font-semibold leading-[20px] text-white">11:41</span>

      {/* Dynamic Island, expanded for an active call */}
      <span className="absolute left-1/2 top-[14px] flex h-[36px] w-[169px] -translate-x-1/2 items-center justify-between rounded-full bg-black px-[13px]" aria-hidden>
        <span />
        <span className={cn("h-[5px] w-[5px] rounded-full", inCall ? "bg-[#ff9500]" : "bg-transparent")} />
      </span>

      <span className="absolute right-[26px] top-[21px] flex items-center gap-[5px]">
        <svg width="19" height="12" viewBox="0 0 19 12" fill="#fff" aria-hidden>
          <rect x="0" y="8.5" width="3.3" height="3.5" rx="1" /><rect x="5.2" y="6" width="3.3" height="6" rx="1" />
          <rect x="10.4" y="3" width="3.3" height="9" rx="1" /><rect x="15.6" y="0" width="3.3" height="12" rx="1" opacity="0.3" />
        </svg>
        <span className="text-[15px] font-semibold leading-none text-white">5G<span className="relative -top-[4px] text-[7px] font-bold leading-none">UW</span></span>
        <span className="relative flex h-[13px] w-[27px] items-center justify-center rounded-[4px] bg-[#30d158] text-[11px] font-bold leading-none text-black" aria-label="Battery 44%, charging">
          44
          <svg className="absolute -right-[1px] top-[2px]" width="6" height="9" viewBox="0 0 6 9" fill="#fff" aria-hidden><path d="M3.6 0 0 5h2.4L2.2 9 6 3.8H3.4z" /></svg>
          <span className="absolute -right-[3px] top-1/2 h-[4px] w-[1.5px] -translate-y-1/2 rounded-r bg-white/40" />
        </span>
      </span>
    </div>
  );
}

/* ---------- Round control ---------- */

function Control({
  x, y, label, icon, onClick, active, disabled, fill, ariaLabel,
}: {
  x: number; y: number; label?: string; icon: React.ReactNode; onClick?: () => void;
  active?: boolean; disabled?: boolean; fill?: string; ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel ?? label}
      aria-pressed={active}
      className="absolute flex w-[110px] -translate-x-1/2 flex-col items-center disabled:opacity-40"
      style={{ left: x, top: y - 43 }}
    >
      <span
        className="flex h-[86px] w-[86px] items-center justify-center rounded-full transition-colors active:brightness-150"
        style={{
          background: fill ?? (active ? "#e5e5e5" : "rgba(255,255,255,0.09)"),
          // Thin glass rim, as on the Phone app's round buttons
          boxShadow: active ? undefined : "inset 0 0 0 1.5px rgba(255,255,255,0.28)",
        }}
      >
        {icon}
      </span>
      {label && <span className="mt-[9px] text-[15px] leading-[18px] text-[#bfbfbf]">{label}</span>}
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
const COLS = [88, 220, 352];
const KEY_ROWS = [367, 473, 580, 687];

function Keypad({ onDigit }: { onDigit: (d: string) => void }) {
  return (
    <div role="group" aria-label="Keypad">
      {KEYS.map(([d, sub], i) => {
        const x = COLS[i % 3];
        const y = KEY_ROWS[Math.floor(i / 3)];
        const symbol = d === "*" || d === "#";
        return (
          <button
            key={d}
            type="button"
            onClick={() => onDigit(d)}
            aria-label={`Key ${d}${sub ? ` ${sub}` : ""}`}
            className="absolute flex h-[86px] w-[86px] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full bg-[#3b383b] text-white active:bg-[#524e52]"
            style={{ left: x, top: y }}
          >
            <span
              className={cn("leading-none", symbol ? "text-[40px] font-normal" : "text-[40px] font-normal -mt-[14px]")}
              style={{ marginTop: symbol ? (d === "*" ? 10 : 0) : undefined }}
            >
              {d}
            </span>
            {sub && (
              <span
                className={cn(
                  "absolute left-1/2 -translate-x-1/2 leading-none",
                  d === "0" ? "top-[59px] text-[18px] font-normal" : "top-[55px] text-[12px] font-bold tracking-[0.17em]"
                )}
              >
                {sub}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Screen ---------- */

export function CallScreen({
  status, label, subtitle, startedAt, muted, onStart, onEnd, onToggleMute, onKeypadDigit, handoff,
}: Props) {
  const elapsed = useElapsed(startedAt, status === "active");
  const inCall = status === "active" || status === "connecting";
  const [keypadOpen, setKeypadOpen] = useState(false);
  const [typed, setTyped] = useState("");

  // Reset the keypad when a call ends. Keyed on status so it runs once per transition.
  const [resetFor, setResetFor] = useState<CallStatus | null>(null);
  if ((status === "ended" || status === "error") && resetFor !== status) {
    setResetFor(status);
    if (keypadOpen) setKeypadOpen(false);
    if (typed) setTyped("");
  }

  const digit = (d: string) => {
    setTyped((t) => (t + d).slice(-20));
    onKeypadDigit?.(d);
  };

  const transferring = !!handoff && status === "active";
  const topLine =
    status === "connecting" ? "Calling…"
    : status === "ended" ? "Call Ended"
    : status === "error" ? "Call Failed"
    : transferring ? "Transferring…"
    : elapsed;
  const showTyped = keypadOpen && typed.length > 0;

  return (
    <div
      className="relative select-none overflow-hidden bg-[#242424] text-white"
      style={{ width: SCREEN_W, height: SCREEN_H, fontFamily: FONT }}
    >
      <StatusBar inCall={inCall} />

      {showTyped ? (
        <p className="absolute inset-x-0 top-[118px] text-center text-[34px] font-semibold leading-[44px] tracking-[0.01em] tabular-nums">{typed}</p>
      ) : (
        <>
          <p className="absolute inset-x-0 top-[119px] text-center text-[22px] font-normal leading-[27px] tabular-nums text-[#8b8b8f]" aria-live="polite">
            {topLine}
          </p>
          <h1 className="absolute inset-x-0 top-[146px] px-4 text-center text-[34px] font-semibold leading-[44px] tracking-[-0.005em] text-[#e5e5e5]">
            {label}
          </h1>
          {status === "connecting" && subtitle && (
            <p className="absolute inset-x-0 top-[192px] text-center text-[22px] leading-[27px] text-[#8b8b8f]">{subtitle}</p>
          )}
          {transferring && (
            <p className="absolute inset-x-0 top-[192px] text-center text-[22px] leading-[27px] text-[#8b8b8f]">{handoff.team}</p>
          )}
        </>
      )}

      {keypadOpen ? (
        <>
          <Keypad onDigit={digit} />
          {inCall ? (
            <Control x={220} y={827} icon={<EndIcon />} onClick={onEnd} fill={END_RED} ariaLabel="End" />
          ) : (
            <Control x={220} y={827} icon={<CallIcon />} onClick={onStart} fill="#30d158" ariaLabel="Call" />
          )}
          <button
            type="button"
            onClick={() => setKeypadOpen(false)}
            className="absolute left-[352px] top-[827px] -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-[15px] leading-[18px] text-white"
          >
            Hide Keypad
          </button>
        </>
      ) : (
        <>
          <Control
            x={88} y={827} label="Mute" icon={<MuteIcon dark={muted} />}
            onClick={onToggleMute} active={muted} disabled={status !== "active"}
          />
          {inCall ? (
            <Control x={220} y={827} label="End" icon={<EndIcon />} onClick={onEnd} fill={END_RED} />
          ) : (
            <Control x={220} y={827} label="Call" icon={<CallIcon />} onClick={onStart} fill="#30d158" />
          )}
          <Control x={352} y={827} label="Keypad" icon={<KeypadIcon />} onClick={() => setKeypadOpen(true)} />
        </>
      )}
    </div>
  );
}
