"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type Vapi from "@vapi-ai/web";
import { config, isVapiConfigured, toolServerUrl } from "./config";
import { buildAssistant } from "./assistant";
import { toolMeta, type ToolSource } from "./tools/meta";
import { createTonePlayer, type TonePlayer } from "./transferTone";
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

/** Turns browser/SDK error strings into something a tester can act on. */
export function friendlyCallError(raw: string): string {
  if (/permission denied|notallowederror|not allowed/i.test(raw))
    return "Microphone access was denied. Allow the mic for this site, or open the page in Chrome; embedded browser panes block it.";
  if (/notfounderror|no microphone|device not found/i.test(raw)) return "No microphone was found. Connect one and try again.";
  return raw;
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
  const toneRef = useRef<TonePlayer | null>(null);
  const backstopRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
            setEvents((prev) =>
              prev.map((e) => (e.kind === "call" && e.label === "Call ended" ? { ...e, detail: String(m.endedReason) } : e))
            );
          }
          return;
        }
        case "tool-calls": {
          for (const call of m.toolCallList ?? []) {
            const name = call.name ?? call.function?.name ?? "tool";
            if (name !== "delegate") settleThinking();
            const meta = toolMeta(name);
            const id = call.id ?? nextId();
            toolStartTimes.current.set(id, Date.now());
            toolNames.current.set(id, name);
            setEvents((prev) =>
              prev.some((e) => e.toolCallId === id)
                ? prev
                : [...prev, { id: nextId(), at: Date.now(), kind: "tool-call", label: meta.label, status: "running", toolCallId: id, tool: name, source: meta.source }]
            );
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
              void toneRef.current?.playTransfer();
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
    if (!toneRef.current) toneRef.current = createTonePlayer();
    toneRef.current.unlock();
    setStatus("connecting");
    pushEvent({ kind: "call", label: "Connecting", status: "running" });

    try {
      const { default: VapiCtor } = await import("@vapi-ai/web");
      const vapi = new VapiCtor(config.vapiPublicKey);
      vapiRef.current = vapi;

      vapi.on("call-start", () => {
        setStatus("active");
        setStartedAt(Date.now());
        settleRunning("succeeded");
        pushEvent({ kind: "call", label: "Connected", status: "succeeded" });
      });
      vapi.on("call-end", () => {
        if (backstopRef.current) clearTimeout(backstopRef.current);
        settleThinking();
        setStatus("ended");
        setAssistantSpeaking(false);
        pushEvent({ kind: "call", label: "Call ended" });
      });
      vapi.on("speech-start", () => setAssistantSpeaking(true));
      vapi.on("speech-end", () => setAssistantSpeaking(false));
      vapi.on("volume-level", (v: number) => setVolume(v));
      vapi.on("message", handleMessage);
      vapi.on("error", (e: unknown) => {
        const raw =
          typeof e === "string"
            ? e
            : (e as { message?: string; error?: { message?: string } })?.message ??
              (e as { error?: { message?: string } })?.error?.message ??
              "Call error";
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
  }, []);

  useEffect(() => {
    return () => {
      if (backstopRef.current) clearTimeout(backstopRef.current);
      vapiRef.current?.stop();
      toneRef.current?.dispose();
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
