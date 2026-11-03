/**
 * Live mirroring of phone calls on the web phone.
 *
 * With the gpt-live-1 voice model, Vapi sends the server no status-update "in-progress",
 * speech-update, transcript or conversation-update while a call is running: the first
 * event for a phone call is the "ended" status-update after the caller hangs up
 * (prod logs, 2026-11-03). So the web phone never saw the call as live.
 *
 * Two signals do arrive during the call, and Convex uses them instead:
 * - assistant-request: when the phone number has no fixed assistant and points its
 *   server URL at /vapi/events, Vapi asks which assistant should answer before it picks
 *   up. That marks the call live right away (scripts/route-phone-number.ts sets this up).
 * - tool-calls: every tool webhook carries the conversation so far (artifact.messages),
 *   which keeps the mirrored transcript current mid-call.
 */
import type { ArtifactMessage } from "../callMetrics";

export const PROD_SITE = "https://earnest-alpaca-725.convex.site";
/** "Playback Support (prod)", the assistant behind +1 878-277-9342. Not a secret. */
export const PROD_ASSISTANT_ID = "90e6e998-fb6e-4a9e-8f06-f28fcac8b306";

/** The assistant that answers inbound calls routed through assistant-request, or null if none is configured. */
export function inboundAssistantId(env: { VAPI_INBOUND_ASSISTANT_ID?: string; CONVEX_SITE_URL?: string }): string | null {
  const configured = env.VAPI_INBOUND_ASSISTANT_ID?.trim();
  if (configured) return configured;
  return env.CONVEX_SITE_URL?.replace(/\/$/, "") === PROD_SITE ? PROD_ASSISTANT_ID : null;
}

export type ConversationLine = { role: "user" | "assistant"; text: string; at: number };

/** Spoken lines from a Vapi artifact message list, in order; tool and system messages are dropped. */
export function conversationLines(messages: ReadonlyArray<ArtifactMessage & { content?: unknown }>): ConversationLine[] {
  return messages
    .filter(x => (x.role === "user" || x.role === "bot" || x.role === "assistant") && typeof x.message === "string" && x.message.trim())
    .map(x => ({ role: x.role === "user" ? "user" as const : "assistant" as const, text: x.message!, at: x.time ?? 0 }));
}
