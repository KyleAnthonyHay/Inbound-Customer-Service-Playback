"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CallScreen } from "@/components/CallScreen";
import { PhoneFrame } from "@/components/PhoneFrame";
import { ActivityPanel } from "@/components/ActivityPanel";
import { config, isVapiConfigured } from "@/lib/config";
import { useVapiCall } from "@/lib/useVapiCall";

export default function CallPage() {
  const call = useVapiCall();
  const configured = isVapiConfigured();
  const [panelOpen, setPanelOpen] = useState(false);
  // Dev aid: /call?callId=<id> shows the logged events of a past call in the panel.
  const [callIdOverride, setCallIdOverride] = useState<string | null>(null);
  const [demo, setDemo] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("demo")) setTimeout(() => setDemo(true), 0);
    const id = params.get("callId");
    if (!id) return;
    // Deferred so the first client render matches the server-rendered HTML.
    const t = setTimeout(() => {
      setCallIdOverride(id);
      setPanelOpen(true);
    }, 0);
    return () => clearTimeout(t);
  }, []);

  return (
    <main className="relative min-h-[100dvh] bg-background">
      <Link
        href="/"
        className="fixed bottom-4 left-4 z-10 flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-sm text-white/80 backdrop-blur hover:bg-white/15 sm:bottom-auto sm:top-4"
      >
        <ArrowLeft size={16} /> Home
      </Link>

      <PhoneFrame>
      <CallScreen
        status={call.status}
        label={config.inboundNumber || config.callerLabel}
        subtitle="MultiTracks"
        startedAt={call.startedAt}
        muted={call.muted}
        assistantSpeaking={call.assistantSpeaking}
        onStart={call.start}
        onEnd={call.stop}
        onToggleMute={call.toggleMute}
        handoff={call.handoff}
      />
      </PhoneFrame>

      <ActivityPanel
        open={panelOpen}
        onToggle={() => setPanelOpen((o) => !o)}
        callId={call.callId ?? callIdOverride}
        status={call.status}
        startedAt={call.startedAt}
        assistantSpeaking={call.assistantSpeaking}
        handoff={call.handoff}
        clientEvents={call.events}
        transcript={call.transcript}
      />

      {demo && (
        <div className="fixed bottom-4 right-4 z-30 flex flex-col gap-2 rounded-xl border border-white/10 bg-[#111113]/95 p-3 text-xs text-white/80">
          <span className="text-white/50">Dev simulation (synthetic client messages)</span>
          <button
            type="button"
            className="rounded-md bg-white/10 px-3 py-1.5 text-left hover:bg-white/15"
            onClick={() => {
              const id = `sim-${Date.now()}`;
              call.debugInject({ type: "tool-calls", toolCallList: [{ id, type: "function", function: { name: "initiate_handoff", arguments: { teamId: "playback-support" } } }] });
              setTimeout(
                () =>
                  call.debugInject({
                    type: "tool-calls-result",
                    toolCallResult: { toolCallId: id, name: "initiate_handoff", result: JSON.stringify({ ok: true, simulated: true, team: "Playback Technical Support", source: "simulated" }) },
                  }),
                900
              );
            }}
          >
            Simulate successful handoff
          </button>
          <button
            type="button"
            className="rounded-md bg-white/10 px-3 py-1.5 text-left hover:bg-white/15"
            onClick={() => {
              // A real GPT-Live turn: think -> tool -> think -> speak, strictly in sequence.
              const t = Date.now();
              const d1 = `sim-d1-${t}`, s1 = `sim-s1-${t}`, d2 = `sim-d2-${t}`;
              call.debugInject({ type: "tool-calls", toolCallList: [{ id: d1, type: "function", function: { name: "delegate", arguments: {} } }] });
              setTimeout(() => call.debugInject({ type: "tool-calls", toolCallList: [{ id: s1, type: "function", function: { name: "search_playback_docs", arguments: { query: "download error" } } }] }), 1200);
              setTimeout(() => call.debugInject({ type: "tool-calls-result", toolCallResult: { toolCallId: s1, name: "search_playback_docs", result: "{\"ok\":true,\"found\":3}" } }), 1800);
              setTimeout(() => call.debugInject({ type: "tool-calls", toolCallList: [{ id: d2, type: "function", function: { name: "delegate", arguments: {} } }] }), 3200);
              setTimeout(() => call.debugInject({ type: "transcript", role: "assistant", transcriptType: "final", transcript: "Could you tap Try Again twice and tell me if it still fails?" }), 5200);
            }}
          >
            Simulate think → tool → think → speak
          </button>
          <button
            type="button"
            className="rounded-md bg-white/10 px-3 py-1.5 text-left hover:bg-white/15"
            onClick={() => {
              const id = `sim-${Date.now()}`;
              call.debugInject({ type: "tool-calls", toolCallList: [{ id, type: "function", function: { name: "search_playback_docs", arguments: { query: "download error" } } }] });
              setTimeout(() => call.debugInject({ type: "tool-calls-result", toolCallResult: { toolCallId: id, name: "search_playback_docs", result: "{\"ok\":true,\"found\":3}" } }), 1200);
            }}
          >
            Simulate docs search
          </button>
        </div>
      )}

      {(call.error || !configured) && (
        <div
          role="alert"
          className="fixed inset-x-0 top-4 z-10 mx-auto w-[calc(100%-2rem)] max-w-[360px] rounded-xl bg-danger/90 px-4 py-2.5 text-center text-sm text-white shadow-lg"
        >
          {call.error ?? "Add NEXT_PUBLIC_VAPI_PUBLIC_KEY to .env.local to place a real call."}
        </div>
      )}
    </main>
  );
}
