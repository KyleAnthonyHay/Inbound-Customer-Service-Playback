/** Offline, conservative style check on final dialogue, never tools/system messages. */
import { hasBrandedFarewell } from "../../src/lib/voicePolicy";
export type DialogueLine = { role: "user" | "assistant"; text: string };
export type AcknowledgmentFinding = {
  message: number;
  previousMessage: number;
  phrases: string[];
  reason: "stacked-acknowledgments" | "repeated-acknowledgment" | "closing-prelude";
};

function openingAcknowledgments(text: string): string[] {
  let rest = text.trim().toLowerCase();
  const phrases: string[] = [];
  while (rest) {
    // A branded sign-off is useful content, not another conversational filler.
    if (/^(?:thanks|thank you)(?: so much)? for calling\b/.test(rest)) break;
    const match = /^(thank you(?: so much)?|thanks(?: so much)?|got it|good to know|great|you're welcome|okay|ok|all right|alright|understood|no problem|of course|sure|yeah)(?=$|[\s,.!?;:—–-])/.exec(rest);
    if (!match) break;
    phrases.push(match[1]);
    rest = rest.slice(match[0].length).replace(/^[\s,.!?;:—–-]+/, "");
  }
  return phrases;
}

/** At most one acknowledgment across assistant segments answering one caller turn. */
export function auditAcknowledgments(dialogue: DialogueLine[]): AcknowledgmentFinding[] {
  const findings: AcknowledgmentFinding[] = [];
  let previous: { message: number; phrases: string[] } | undefined;
  let response = "";
  let farewellReported = false;
  dialogue.forEach((line, index) => {
    if (line.role === "user") { previous = undefined; response = ""; farewellReported = false; return; }
    response = `${response} ${line.text}`.slice(-4000);
    const phrases = openingAcknowledgments(line.text);
    if (!farewellReported && hasBrandedFarewell(response) && (previous || phrases.length)) {
      farewellReported = true;
      findings.push({ message: index + 1, previousMessage: previous?.message ?? index + 1,
        phrases: [...(previous?.phrases ?? []), ...phrases, "branded goodbye"], reason: "closing-prelude" });
      return;
    }
    if (!phrases.length) return;
    if (previous || phrases.length > 1) findings.push({
      message: index + 1,
      previousMessage: previous?.message ?? index + 1,
      phrases: [...(previous?.phrases ?? []), ...phrases],
      reason: previous ? "repeated-acknowledgment" : "stacked-acknowledgments",
    });
    previous = { message: index + 1, phrases };
  });
  return findings;
}

const object = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw Error("Invalid dialogue report.");
  return value as Record<string, unknown>;
};

/** Supported safe exports: call review dialogue, voice-test transcript, text POC turns. */
export function dialogueFromReport(value: unknown): DialogueLine[] {
  const report = object(value);
  if (report.failure) throw Error("The recorded test failed; it cannot receive a clean style result.");
  let dialogue: DialogueLine[];
  if (Array.isArray(report.dialogue)) dialogue = report.dialogue.map(value => {
    const line = object(value);
    if (!["bot", "assistant", "user"].includes(String(line.role)) || typeof line.text !== "string") throw Error("Invalid dialogue line.");
    return { role: line.role === "user" ? "user" : "assistant", text: line.text };
  });
  else if (Array.isArray(report.transcript)) dialogue = report.transcript.map(value => {
    const match = typeof value === "string" && /^(AGENT|CALLER):\s*([\s\S]*)$/.exec(value);
    if (!match) throw Error("Expected final AGENT/CALLER transcript lines.");
    return { role: match[1] === "CALLER" ? "user" : "assistant", text: match[2] };
  });
  else if (Array.isArray(report.turns)) dialogue = report.turns.flatMap(value => {
    const turn = object(value);
    if (typeof turn.input !== "string" || typeof turn.reply !== "string" || !turn.reply.trim()) throw Error("Incomplete text turn.");
    return [{ role: "user" as const, text: turn.input }, { role: "assistant" as const, text: turn.reply }];
  });
  else throw Error("No supported final dialogue found.");
  if (!dialogue.some(line => line.role === "user" && line.text.trim()) || !dialogue.some(line => line.role === "assistant" && line.text.trim())) throw Error("Dialogue requires caller and assistant speech.");
  return dialogue;
}
