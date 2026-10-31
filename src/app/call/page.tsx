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
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("callId");
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
      />
      </PhoneFrame>

      <ActivityPanel
        open={panelOpen}
        onToggle={() => setPanelOpen((o) => !o)}
        callId={call.callId ?? callIdOverride}
        status={call.status}
        startedAt={call.startedAt}
        clientEvents={call.events}
        transcript={call.transcript}
      />

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
