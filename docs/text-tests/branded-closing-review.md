# Standard closing — November 2

Normal support completion now uses one shared question and goodbye in the speaker/reasoner definition:

1. “Is there anything else I can help with?”
2. Wait for the caller's answer.
3. On no / a clear finish: “Okay, thanks for calling MultiTracks Support. Goodbye.”
4. End through native `endCall`.

The speaker is instructed to finish the branded line before delegating the end action. The reasoner must not substitute a short unbranded goodbye or wait for another farewell. Existing direct-human, successful handoff/callback and explicit-leave paths retain their workflow; their goodbye uses the branded line. “No, that didn’t work” and requests to wait are not closing consent.

Five fresh [text controls](branded-closing-2026-11-02/) passed their reviewed criteria:

- Two different recovery reports each received the exact question and waited; both caller declines received the full exact branded goodbye.
- “Yes, another song won’t open” continued with a song question and no goodbye.
- “No, that didn’t work” continued diagnosis.
- An explicit leave request received the branded goodbye without trapping the caller in another question.

Two additional [final-snapshot controls](branded-closing-final-2026-11-02/) passed: “No” after the further-help question returned the full branded goodbye, while “No” during diagnosis continued with a device question. This ties closing to the question being answered, not the word alone.

The saved development and production speaker/reasoner prompts were read back and match source.

The text adapter preserves the policy's prescribed goodbye wording instead of asking for a generic goodbye. All 74 local tests, TypeScript and targeted ESLint passed. All isolated text logs were cleaned. No voice calls were placed.

These tests verify reasoner wording/branching, not actual voice playback or disconnect. GPT-Live does not speak classic tool-start messages, and [Vapi’s quickstart](https://docs.vapi.ai/gpt-live/quickstart) notes that hang-up can cut speech short. The shared speaker instruction is the supported place for the requested wording; no unsupported exact-audio setting or client keyword hang-up was added. A manual browser/phone call must verify the entire spoken farewell before disconnection.
