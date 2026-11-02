"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";
import type { CallStatus } from "./useVapiCall";
import { phoneStatusOf, type PhoneStatus } from "./tools/callState";

/**
 * Follows the call the agent is on elsewhere (the phone line, the voice harness) so the
 * on-screen phone mirrors it: Convex is the source of truth. Must render under the
 * ConvexProvider (see useConvexReady).
 *
 * - Picks up calls.current (ringing or in progress) whenever the browser is not on its own call.
 * - Remembers the followed callId after that call ends, so the phone can sit on "Call Ended"
 *   with the log available, until a browser call starts or another remote call arrives.
 */
export type RemoteCall = {
  /** True while the phone should show this call instead of the browser call. */
  following: boolean;
  callId: string | null;
  row: Doc<"calls"> | null;
  transcript: Doc<"transcripts">[];
  status: PhoneStatus;
  startedAt: number | null;
  callerNumber?: string;
  assistantSpeaking: boolean;
};

export const NO_REMOTE_CALL: RemoteCall = {
  following: false, callId: null, row: null, transcript: [], status: "idle", startedAt: null, assistantSpeaking: false,
};

export function useRemoteCall(browserStatus: CallStatus): RemoteCall {
  const browserLive = browserStatus === "active" || browserStatus === "connecting";
  const current = useQuery(api.calls.current, {}) ?? null;
  const currentId = current?.callId ?? null;
  // Adjusted during render (not in an effect) so the queries below already use the new id.
  const [storedId, setStoredId] = useState<string | null>(null);
  let followedId = storedId;
  if (browserLive && storedId) {
    setStoredId(null);
    followedId = null;
  } else if (!browserLive && currentId && currentId !== storedId) {
    setStoredId(currentId);
    followedId = currentId;
  }

  const args = followedId ? { callId: followedId } : "skip";
  const row = useQuery(api.calls.get, args) ?? null;
  const transcript = useQuery(api.calls.transcriptByCall, args) ?? [];
  const following = !browserLive && !!followedId && !!row;

  if (!following || !row) return NO_REMOTE_CALL;
  return {
    following,
    callId: followedId,
    row,
    transcript,
    status: phoneStatusOf(row),
    startedAt: row.startedAt,
    callerNumber: row.callerNumber,
    assistantSpeaking: !!row.assistantSpeaking,
  };
}
