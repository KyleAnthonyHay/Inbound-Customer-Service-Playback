"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type Vapi from "@vapi-ai/web";
import { config, isVapiConfigured, toolServerUrl } from "./config";
import { buildAssistant } from "./assistant";

export type CallStatus = "idle" | "connecting" | "active" | "ended" | "error";

export type TranscriptLine = {
  id: string;
  role: "user" | "assistant";
  text: string;
  final: boolean;
  at: number;
};

/** One row for the activity panel. Only sourced from real Vapi events. */
export type ActivityEvent = {
  id: string;
  at: number;
  kind:
    | "call"
    | "speech"
    | "tool-call"
    | "tool-result"
    | "status"
    | "error"
    | "transfer";
  label: string;
  detail?: string;
  status?: "running" | "succeeded" | "failed";
  durationMs?: number;
};

type VapiMessage = {
  type?: string;
  role?: "user" | "assistant" | "system";
  transcriptType?: "partial" | "final";
  transcript?: string;
  status?: string;
  endedReason?: string;
  toolCallList?: Array<{ id?: string; name?: string; function?: { name?: string } }>;
  toolCallResult?: { name?: string; result?: unknown; error?: unknown; toolCallId?: string };
  functionCall?: { name?: string; parameters?: unknown };
  destination?: unknown;
  [key: string]: unknown;
};

let idCounter = 0;
const nextId = () => `${Date.now()}-${idCounter++}`;

export function useVapiCall() {
  const vapiRef = useRef<Vapi | null>(null);
  const toolStartTimes = useRef<Map<string, number>>(new Map());
  const [status, setStatus] = useState<CallStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [assistantSpeaking, setAssistantSpeaking] = useState(false);
  const [volume, setVolume] = useState(0);
  const [muted, setMuted] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [callId, setCallId] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [events, setEvents] = useState<ActivityEvent[]>([]);

  const pushEvent = useCallback((e: Omit<ActivityEvent, "id" | "at">) => {
    setEvents((prev) => [...prev, { ...e, id: nextId(), at: Date.now() }]);
  }, []);

  const handleMessage = useCallback(
    (raw: unknown) => {
      const m = raw as VapiMessage;
      switch (m.type) {
        case "transcript": {
          if (!m.transcript || !m.role || m.role === "system") return;
          const role = m.role;
          const final = m.transcriptType === "final";
          setTranscript((prev) => {
            const last = prev[prev.length - 1];
            // Replace the trailing partial line of the same speaker.
            if (last && last.role === role && !last.final) {
              return [...prev.slice(0, -1), { ...last, text: m.transcript!, final }];
            }
            return [...prev, { id: nextId(), role, text: m.transcript!, final, at: Date.now() }];
          });
          return;
        }
        case "status-update": {
          pushEvent({
            kind: "status",
            label: `Call ${m.status ?? "update"}`,
            detail: m.endedReason ? String(m.endedReason) : undefined,
          });
          return;
        }
        case "tool-calls": {
          for (const call of m.toolCallList ?? []) {
            const name = call.name ?? call.function?.name ?? "tool";
            if (call.id) toolStartTimes.current.set(call.id, Date.now());
            pushEvent({ kind: "tool-call", label: name, status: "running" });
          }
          return;
        }
        case "tool-calls-result": {
          const r = m.toolCallResult;
          const started = r?.toolCallId ? toolStartTimes.current.get(r.toolCallId) : undefined;
          pushEvent({
            kind: "tool-result",
            label: r?.name ?? "tool",
            status: r?.error ? "failed" : "succeeded",
            durationMs: started ? Date.now() - started : undefined,
            detail: r?.error ? String(r.error) : undefined,
          });
          return;
        }
        case "function-call": {
          pushEvent({ kind: "tool-call", label: m.functionCall?.name ?? "function", status: "running" });
          return;
        }
        case "transfer-update":
        case "transfer-destination-request": {
          pushEvent({ kind: "transfer", label: "Transfer", detail: m.type });
          return;
        }
        default:
          return;
      }
    },
    [pushEvent]
  );

  const start = useCallback(async () => {
    if (!isVapiConfigured()) {
      setError("Vapi public key is not configured. Add NEXT_PUBLIC_VAPI_PUBLIC_KEY to .env.local.");
      setStatus("error");
      return;
    }
    setError(null);
    setTranscript([]);
    setEvents([]);
    setCallId(null);
    setStatus("connecting");
    pushEvent({ kind: "call", label: "Connecting", status: "running" });

    try {
      const { default: VapiCtor } = await import("@vapi-ai/web");
      const vapi = new VapiCtor(config.vapiPublicKey);
      vapiRef.current = vapi;

      vapi.on("call-start", () => {
        setStatus("active");
        setStartedAt(Date.now());
        pushEvent({ kind: "call", label: "Connected", status: "succeeded" });
      });
      vapi.on("call-end", () => {
        setStatus("ended");
        setAssistantSpeaking(false);
        pushEvent({ kind: "call", label: "Call ended" });
      });
      vapi.on("speech-start", () => setAssistantSpeaking(true));
      vapi.on("speech-end", () => setAssistantSpeaking(false));
      vapi.on("volume-level", (v: number) => setVolume(v));
      vapi.on("message", handleMessage);
      vapi.on("error", (e: unknown) => {
        const msg =
          typeof e === "string"
            ? e
            : (e as { message?: string; error?: { message?: string } })?.message ??
              (e as { error?: { message?: string } })?.error?.message ??
              "Call error";
        setError(msg);
        setStatus("error");
        pushEvent({ kind: "error", label: "Error", detail: msg, status: "failed" });
      });

      let call: { id?: string } | null = null;
      if (config.vapiAssistantId) {
        call = await vapi.start(config.vapiAssistantId);
      } else {
        // Inline assistant; types are loosened because GPT-Live fields
        // (reasoner, speaker) are newer than the SDK's bundled DTO types.
        const assistant = buildAssistant({ toolServerUrl: toolServerUrl() });
        call = await vapi.start(assistant as unknown as Parameters<Vapi["start"]>[0]);
      }
      if (call?.id) setCallId(call.id);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to start call";
      setError(msg);
      setStatus("error");
      pushEvent({ kind: "error", label: "Start failed", detail: msg, status: "failed" });
    }
  }, [handleMessage, pushEvent]);

  const stop = useCallback(() => {
    vapiRef.current?.stop();
    setStatus((s) => (s === "active" || s === "connecting" ? "ended" : s));
  }, []);

  const toggleMute = useCallback(() => {
    const v = vapiRef.current;
    if (!v) return;
    const next = !v.isMuted();
    v.setMuted(next);
    setMuted(next);
  }, []);

  useEffect(() => {
    return () => {
      vapiRef.current?.stop();
    };
  }, []);

  return {
    status,
    error,
    assistantSpeaking,
    volume,
    muted,
    startedAt,
    callId,
    transcript,
    events,
    start,
    stop,
    toggleMute,
  };
}
