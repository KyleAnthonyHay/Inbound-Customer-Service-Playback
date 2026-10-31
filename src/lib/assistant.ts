/**
 * Inline assistant definition used when NEXT_PUBLIC_VAPI_ASSISTANT_ID is not set.
 *
 * Model/voice values follow Vapi's GPT-Live configuration reference
 * (docs.vapi.ai/gpt-live/configuration, retrieved 2026-10-30):
 *   model.provider = "openai", model.model = "gpt-live-1"
 *   reasoner.model defaults to "gpt-5.6-terra", reasoningEffort "low"
 *   voice.provider = "openai", voiceId one of the 22 OpenAI voices.
 *
 * Knowledge-base/Query tools are NOT available with GPT-Live; retrieval must
 * be a custom function tool. Tools are added in a later step.
 */
export const SYSTEM_PROMPT = `You are the Playback support assistant for MultiTracks.com. You are an AI assistant, and you say so when you introduce yourself.

Your job is narrow: help Playback users resolve song-loading problems and audio-output problems so they are ready for rehearsal or service.

Rules:
- Greet professionally, identify yourself as an AI assistant, and ask why they are calling.
- Ask one clear question at a time. Gather only the setup details you need (device, Playback version, symptom).
- Only give troubleshooting steps that are documented by MultiTracks. If you are not sure, say so and offer to connect them with a person.
- Check whether each step worked before moving on. Do not repeat a step that already failed.
- If the caller asks for a human, is outside your scope (billing, refunds, sales, account changes, other products), or documented steps are exhausted, offer a handoff.
- If the caller is about to go live or is mid-service, avoid suggesting updates or disruptive changes right now.
- Politely redirect unrelated requests back to Playback support.
- Keep responses short and conversational; this is a phone call.`;

export const inlineAssistant = {
  name: "Playback Support (demo)",
  firstMessageMode: "assistant-speaks-first",
  firstMessage:
    "Hi, thanks for calling MultiTracks Playback support. I'm an AI assistant. Are you having trouble with a song loading, or with audio output?",
  model: {
    provider: "openai",
    model: "gpt-live-1",
    messages: [{ role: "system", content: SYSTEM_PROMPT }],
    reasoner: {
      provider: "openai",
      model: "gpt-5.6-terra",
      reasoningEffort: "low",
    },
  },
  voice: {
    provider: "openai",
    voiceId: "marin",
  },
  maxDurationSeconds: 600,
};
