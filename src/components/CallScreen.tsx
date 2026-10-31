"use client";

import { useEffect, useState } from "react";
import {
  Volume2,
  Video,
  MicOff,
  Mic,
  MoreHorizontal,
  Grip,
  Phone,
  PhoneOff,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { CallStatus } from "@/lib/useVapiCall";

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
};

function useElapsed(startedAt: number | null, running: boolean) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    if (!running) return;
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [running]);
  if (!startedAt || now === null) return "00:00";
  const s = Math.max(0, Math.floor((now - startedAt) / 1000));
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

function statusText(status: CallStatus, elapsed: string) {
  switch (status) {
    case "idle":
      return "Tap to call";
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

function RoundButton({
  icon,
  label,
  onClick,
  active,
  disabled,
  variant = "default",
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  variant?: "default" | "end" | "answer";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      className="flex flex-col items-center gap-2 select-none disabled:opacity-40"
    >
      <span
        className={cn(
          "flex h-[76px] w-[76px] items-center justify-center rounded-full transition-colors",
          variant === "default" && (active ? "bg-white text-black" : "bg-call-btn text-white"),
          variant === "end" && "bg-danger text-white active:bg-red-600",
          variant === "answer" && "bg-accent text-white active:bg-green-600"
        )}
      >
        {icon}
      </span>
      <span className="text-[15px] text-white/90">{label}</span>
    </button>
  );
}

export function CallScreen({
  status,
  label,
  subtitle,
  startedAt,
  muted,
  assistantSpeaking,
  onStart,
  onEnd,
  onToggleMute,
}: Props) {
  const elapsed = useElapsed(startedAt, status === "active");
  const inCall = status === "active" || status === "connecting";

  return (
    <div
      className="relative mx-auto flex h-[100dvh] w-full max-w-[430px] flex-col bg-call-bg text-white"
      style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {/* Header: timer + caller */}
      <div className="flex flex-col items-center pt-24">
        <p className="text-[22px] font-medium tabular-nums text-white/60" aria-live="polite">
          {statusText(status, elapsed)}
        </p>
        <h1 className="mt-1 text-center text-[38px] font-semibold leading-tight tracking-tight">
          {label}
        </h1>
        {subtitle && <p className="mt-1 text-[17px] text-white/50">{subtitle}</p>}
        <div
          className={cn(
            "mt-6 h-1.5 w-1.5 rounded-full transition-opacity",
            assistantSpeaking ? "bg-accent opacity-100" : "opacity-0"
          )}
          aria-hidden
        />
      </div>

      <div className="flex-1" />

      {/* Button grid */}
      <div className="mx-auto mb-10 grid w-full max-w-[360px] grid-cols-3 gap-x-6 gap-y-7 px-6">
        <RoundButton icon={<Volume2 size={30} />} label="Speaker" disabled={!inCall} />
        <RoundButton icon={<Video size={30} />} label="FaceTime" disabled />
        <RoundButton
          icon={muted ? <MicOff size={30} /> : <Mic size={30} />}
          label="Mute"
          onClick={onToggleMute}
          active={muted}
          disabled={status !== "active"}
        />
        <RoundButton icon={<MoreHorizontal size={30} />} label="More" disabled />
        {inCall ? (
          <RoundButton icon={<PhoneOff size={32} />} label="End" onClick={onEnd} variant="end" />
        ) : (
          <RoundButton icon={<Phone size={32} />} label="Call" onClick={onStart} variant="answer" />
        )}
        <RoundButton icon={<Grip size={30} />} label="Keypad" disabled />
      </div>

      {/* Home indicator */}
      <div className="mx-auto mb-2 h-1.5 w-36 rounded-full bg-white/80" aria-hidden />
    </div>
  );
}
