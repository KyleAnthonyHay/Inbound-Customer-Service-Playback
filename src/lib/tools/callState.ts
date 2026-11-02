/**
 * Call-state helpers shared by the Convex event handlers, the web client and the tests.
 *
 * Convex is the source of truth for calls the agent takes on other channels
 * (the phone line, the voice harness). Vapi's status-update messages drive the
 * stored status; the web phone derives its own display state from the row.
 */

/** What the `calls` table stores. "ringing" covers Vapi's queued/ringing before anyone speaks. */
export type StoredCallStatus = "ringing" | "in-progress" | "ended";

/** Display state of the on-screen phone (a subset of the browser call's CallStatus). */
export type PhoneStatus = "idle" | "connecting" | "active" | "ended";

/** A live call that never received its end event stops counting as live after this long. */
export const REMOTE_STALE_MS = 15 * 60 * 1000;

/** Maps a Vapi status-update `status` to the stored status; null for values we do not track. */
export function storedStatusOf(vapiStatus: string | undefined): StoredCallStatus | null {
  switch (vapiStatus) {
    case "queued":
    case "ringing":
      return "ringing";
    case "in-progress":
    case "forwarding":
      return "in-progress";
    case "ended":
      return "ended";
    default:
      return null;
  }
}

export function isLiveStatus(status: StoredCallStatus | string): boolean {
  return status === "ringing" || status === "in-progress";
}

export type RemoteCallRow = { status: StoredCallStatus | string; startedAt: number };

/** The phone's display state for a followed remote call; a stale live row reads as ended. */
export function phoneStatusOf(row: RemoteCallRow | null, now: number = Date.now()): PhoneStatus {
  if (!row) return "idle";
  if (row.status === "ringing") return now - row.startedAt > REMOTE_STALE_MS ? "ended" : "connecting";
  if (row.status === "in-progress") return now - row.startedAt > REMOTE_STALE_MS ? "ended" : "active";
  return "ended";
}

/**
 * Speaking state from a Vapi speech-update (role + "started"/"stopped"). Returns the new
 * assistantSpeaking value, or undefined when the update says nothing about it.
 */
export function assistantSpeakingAfter(role: string | undefined, speechStatus: string | undefined): boolean | undefined {
  if (role === "assistant") return speechStatus === "started";
  if (role === "user" && speechStatus === "started") return false;
  return undefined;
}
