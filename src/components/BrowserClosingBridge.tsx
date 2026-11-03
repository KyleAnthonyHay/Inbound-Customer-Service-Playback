"use client";

import { useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

/** The tool webhook is authoritative; GPT-Live need not relay a tool result to the SDK. */
export function BrowserClosingBridge({ callId, active, onRequested }: {
  callId: string | null;
  active: boolean;
  onRequested: (requestedAt: number) => void;
}) {
  const call = useQuery(api.calls.get, callId && active ? { callId } : "skip");
  const requestedAt = call?.status === "in-progress" ? call.closingRequestedAt : undefined;
  useEffect(() => {
    if (requestedAt !== undefined) onRequested(requestedAt);
  }, [requestedAt, onRequested]);
  return null;
}
