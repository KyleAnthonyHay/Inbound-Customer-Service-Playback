import { validControlUrl } from "./handoffEnding";
import { recentSpeechContext } from "../../src/lib/recentSpeech";

/** GPT-Live's documented thinking context updates the speaker without requesting speech. */
export async function appendRecentSpeakerContext(args: { callId: string; controlUrl?: string; messages: string[] }, deps: {
  fetcher?: typeof fetch; publicKey?: string;
} = {}): Promise<boolean> {
  const url = validControlUrl(args.callId, args.controlUrl);
  if (!url || !args.messages.length || args.callId.startsWith("text-poc-")) return false;
  try {
    const response = await (deps.fetcher ?? fetch)(url, {
      method: "POST", redirect: "error", signal: AbortSignal.timeout(3000),
      headers: { "Content-Type": "application/json", ...(deps.publicKey ? { Authorization: `Bearer ${deps.publicKey}` } : {}) },
      body: JSON.stringify({ type: "append-context", kind: "thinking", content: JSON.stringify(recentSpeechContext(args.messages)) }),
    });
    return response.ok;
  } catch { return false; } // Context is optional; never retry an uncertain write.
}
