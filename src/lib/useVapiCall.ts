"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type Vapi from "@vapi-ai/web";
import { config, isVapiConfigured, toolServerUrl } from "./config";
import { buildAssistant } from "./assistant";
import { toolMeta, type ToolSource } from "./tools/meta";
import { playCue, primeCues } from "./cues";
import { parseHandoffResult } from "./handoff";

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
  kind: "call" | "speech" | "tool-call" | "status" | "error" | "transfer";
  label: string;
  detail?: string;
  status?: "running" | "succeeded" | "failed";
  durationMs?: number;
  /** Set for tool rows; matches the server log's toolCallId. */
  toolCallId?: string;
  tool?: string;
  source?: ToolSource;
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
  toolWithToolCallList?: unknown;
  functionCall?: { name?: string; parameters?: unknown };
  destination?: unknown;
  [key: string]: unknown;
};

/**
 * Daily (Vapi's WebRTC layer) reports the server closing the room as an error
 * ("Meeting ended due to ejection: Meeting has ended"). That is how every
 * assistant-side hang-up arrives in the browser: endCall, maxDurationSeconds,
 * the idle hooks, or a server-side failure. It is the end of the call, not a
 * client fault, so it is handled as a remote hang-up; the real reason comes in
 * the status-update / end-of-call-report (shown on the "Call ended" row).
 */
export function isRemoteHangup(raw: string): boolean {
  return /ejection|meeting has ended|ejected/i.test(raw);
}

/**
 * The SDK's error event is not one shape: a string, an Error, or
 * { type: "daily-error", error: { type, msg, errorMsg, details } }. Always
 * return a string; rendering the raw object crashed the activity panel.
 */
export function errorText(e: unknown): string {
  if (typeof e === "string") return e;
  if (!e || typeof e !== "object") return "Call error";
  const o = e as Record<string, unknown>;
  const inner = (o.error && typeof o.error === "object" ? (o.error as Record<string, unknown>) : null) ?? o;
  for (const k of ["errorMsg", "msg", "message"]) {
    const v = inner[k] ?? o[k];
    if (typeof v === "string" && v) return v;
  }
  if (typeof inner.type === "string") return `Call error (${inner.type})`;
  try {
    return JSON.stringify(e).slice(0, 200);
  } catch {
    return "Call error";
  }
}

/** Turns browser/SDK error strings into something a tester can act on. */
export function friendlyCallError(raw: string): string {
  if (/permission denied|notallowederror|not allowed/i.test(raw))
    return "Microphone access was denied. Allow the mic for this site, or open the page in Chrome; embedded browser panes block it.";
  if (/notfounderror|no microphone|device not found/i.test(raw)) return "No microphone was found. Connect one and try again.";
  return raw;
}

/** Vapi endedReason codes a tester sees most, in plain words. */
export function friendlyEndedReason(reason: string): string {
  if (reason === "silence-timed-out") return "silence-timed-out (nobody spoke for the silence timeout)";
  if (reason === "assistant-ended-call") return "assistant-ended-call (the assistant called endCall)";
  if (reason === "customer-ended-call") return "customer-ended-call (hung up from the page)";
  if (reason === "exceeded-max-duration") return "exceeded-max-duration (maxDurationSeconds reached)";
  return reason;
}

let idCounter = 0;
const nextId = () => `${Date.now()}-${idCounter++}`;

/** After a successful simulated handoff, end the demo call if the model has not. */
const HANDOFF_END_BACKSTOP_MS = 12_000;

export type Handoff = { team: string; at: number };

export function useVapiCall() {
  const vapiRef = useRef<Vapi | null>(null);
  const toolStartTimes = useRef<Map<string, number>>(new Map());
  const toolNames = useRef<Map<string, string>>(new Map());
  const backstopRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Vapi's status-update "ended" usually lands before Daily's left-meeting, so keep the reason for the "Call ended" row. */
  const endedReasonRef = useRef<string | null>(null);
  const [handoff, setHandoff] = useState<Handoff | null>(null);
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
  /** GPT-Live sends no result for its internal delegate step; close those rows when the agent moves on. */
  const settleThinking = useCallback(() => {
    setEvents((prev) =>
      prev.map((e) =>
        e.tool === "delegate" && e.status === "running"
          ? { ...e, status: "succeeded", durationMs: e.durationMs ?? Date.now() - (toolStartTimes.current.get(e.toolCallId ?? "") ?? e.at) }
          : e
      )
    );
  }, []);
  /** Mark any still-running client rows (e.g. "Connecting") as finished. */
  const settleRunning = useCallback((status: "succeeded" | "failed") => {
    setEvents((prev) => prev.map((e) => (e.status === "running" ? { ...e, status } : e)));
  }, []);

  const handleMessage = useCallback(
    (raw: unknown) => {
      const m = raw as VapiMessage;
      switch (m.type) {
        case "transcript": {
          if (!m.transcript || !m.role || m.role === "system") return;
          const role = m.role;
          const final = m.transcriptType === "final";
          if (role === "assistant" && final) settleThinking();
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
          // call-start / call-end already produce rows; only surface an ended reason.
          if (m.status === "ended" && m.endedReason) {
            endedReasonRef.current = friendlyEndedReason(String(m.endedReason));
            setEvents((prev) =>
              prev.map((e) => (e.kind === "call" && e.label === "Call ended" ? { ...e, detail: String(m.endedReason) } : e))
            );
          }
          return;
        }
        case "tool-calls": {
          for (const call of m.toolCallList ?? []) {
            const name = call.name ?? call.function?.name ?? "tool";
            const meta = toolMeta(name);
            const id = call.id ?? nextId();
            toolStartTimes.current.set(id, Date.now());
            toolNames.current.set(id, name);
            setEvents((prev) => {
              if (prev.some((e) => e.toolCallId === id)) return prev;
              // GPT-Live work is sequential: a new tool call means any running "Thinking" is over.
              const now = Date.now();
              const settled = prev.map((e) =>
                e.tool === "delegate" && e.status === "running"
                  ? { ...e, status: "succeeded" as const, durationMs: e.durationMs ?? now - e.at }
                  : e
              );
              // Back-to-back delegates within a couple of seconds are one thinking step, not two.
              if (name === "delegate") {
                const last = settled[settled.length - 1];
                if (last && last.tool === "delegate" && now - last.at < 2500) {
                  return settled.map((e) => (e === last ? { ...e, status: "running" as const, durationMs: undefined, toolCallId: id } : e));
                }
              }
              return [...settled, { id: nextId(), at: now, kind: "tool-call", label: meta.label, status: "running", toolCallId: id, tool: name, source: meta.source }];
            });
          }
          return;
        }
        case "tool-calls-result": {
          const r = m.toolCallResult;
          if (!r?.toolCallId) return;
          const started = toolStartTimes.current.get(r.toolCallId);
          const name = r.name ?? toolNames.current.get(r.toolCallId);
          if (name === "initiate_handoff") {
            const parsed = parseHandoffResult(r.result);
            if (parsed?.ok) {
              setHandoff({ team: parsed.team, at: Date.now() });
              pushEvent({ kind: "transfer", label: "Transfer sound (browser)", status: "succeeded" });
              void playCue("transfer");
              if (backstopRef.current) clearTimeout(backstopRef.current);
              backstopRef.current = setTimeout(() => {
                pushEvent({ kind: "call", label: "Ending demo call after handoff", status: "succeeded" });
                vapiRef.current?.stop();
              }, HANDOFF_END_BACKSTOP_MS);
            }
          }
          setEvents((prev) =>
            prev.map((e) =>
              e.toolCallId === r.toolCallId
                ? { ...e, status: r.error ? "failed" : "succeeded", durationMs: started ? Date.now() - started : e.durationMs, detail: r.error ? String(r.error) : e.detail }
                : e
            )
          );
          return;
        }
        case "function-call": {
          const name = m.functionCall?.name ?? "function";
          const meta = toolMeta(name);
          pushEvent({ kind: "tool-call", label: meta.label, status: "running", tool: name, source: meta.source });
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
    [pushEvent, settleThinking]
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
    setHandoff(null);
    endedReasonRef.current = null;
    primeCues();
    setStatus("connecting");
    pushEvent({ kind: "call", label: "Connecting", status: "running" });

    try {
      const { default: VapiCtor } = await import("@vapi-ai/web");
      const vapi = new VapiCtor(config.vapiPublicKey);
      vapiRef.current = vapi;

      vapi.on("call-start", () => {
        setStatus("active");
        setStartedAt(Date.now());
        void playCue("connected");
        settleRunning("succeeded");
        pushEvent({ kind: "call", label: "Connected", status: "succeeded" });
      });
      vapi.on("call-end", () => {
        if (backstopRef.current) clearTimeout(backstopRef.current);
        settleThinking();
        void playCue("hangup");
        setStatus("ended");
        setAssistantSpeaking(false);
        pushEvent({ kind: "call", label: "Call ended", detail: endedReasonRef.current ?? undefined });
      });
      vapi.on("speech-start", () => setAssistantSpeaking(true));
      vapi.on("speech-end", () => setAssistantSpeaking(false));
      vapi.on("volume-level", (v: number) => setVolume(v));
      vapi.on("message", handleMessage);
      vapi.on("error", (e: unknown) => {
        const raw = errorText(e);
        if (isRemoteHangup(raw)) {
          // The assistant (or Vapi) hung up; "call-end" follows from Daily's left-meeting.
          pushEvent({ kind: "call", label: "Ended by the assistant", detail: "The call was closed from the server side; see the ended reason below." });
          setStatus((s) => (s === "active" || s === "connecting" ? "ended" : s));
          return;
        }
        const msg = friendlyCallError(raw);
        setError(msg);
        setStatus("error");
        settleRunning("failed");
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
      const msg = friendlyCallError(e instanceof Error ? e.message : "Failed to start call");
      setError(msg);
      setStatus("error");
      settleRunning("failed");
      pushEvent({ kind: "error", label: "Start failed", detail: msg, status: "failed" });
    }
  }, [handleMessage, pushEvent, settleRunning, settleThinking]);

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
    void playCue(next ? "mute" : "unmute");
  }, []);

  useEffect(() => {
    return () => {
      if (backstopRef.current) clearTimeout(backstopRef.current);
      vapiRef.current?.stop();
    };
  }, []);

  /** Dev-only: feed a synthetic server message through the same handler. */
  const debugInject = useCallback((message: unknown) => handleMessage(message), [handleMessage]);

  return {
    status,
    error,
    assistantSpeaking,
    volume,
    muted,
    startedAt,
    callId,
    handoff,
    transcript,
    events,
    start,
    stop,
    toggleMute,
    debugInject,
  };
}
