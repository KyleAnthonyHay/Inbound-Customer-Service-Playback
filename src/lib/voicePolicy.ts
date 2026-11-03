/** Shared caller-facing wording; does not import assistant/tool configuration. */
export const PERSONA_NAME = "Penny";
export const CLOSING_QUESTION = "Is there anything else I can help you with today?";
export const GOODBYE_MESSAGE = "Thanks so much for calling MultiTracks Playback support. Have a great day, and goodbye!";

/** Shared by browser audio completion and the protected server closing path. */
export function hasBrandedFarewell(text: string) {
  return /\bfor calling\b[\s\S]{0,80}\bmulti\s*tracks\b/i.test(text) &&
    /\b(?:goodbye|bye|have (?:a )?(?:great|good|lovely|wonderful) day)\b/i.test(text);
}

export function isBriefSignoff(text: string) {
  const normalized = text.toLowerCase().replace(/[^a-z\s']/g, " ").replace(/\s+/g, " ").trim();
  return /^(?:(?:no|nope|okay|ok|thanks|thank you|bye|goodbye|you too|that's all|that's it|that's everything|have a great day|have a good day|so much)(?: |$))+$/.test(normalized + " ");
}
