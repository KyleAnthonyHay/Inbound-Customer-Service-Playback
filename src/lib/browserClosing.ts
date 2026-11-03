import { hasBrandedFarewell, isBriefSignoff } from "./voicePolicy";

/** Browser calls receive live audio/partials that GPT-Live doesn't send to our server. */
export function createBrowserClosing(deps: {
  stop: () => void;
  schedule: (callback: () => void, ms: number) => unknown;
  clear: (timer: unknown) => void;
  onPhase?: (phase: string) => void;
}) {
  let armed = false;
  let farewell = "";
  let speaking = false;
  let heardAudio = false;
  let userPending = false;
  let lastUserText = "";
  let timer: unknown;
  let lastRequest = -Infinity;
  let phase = "";
  const report = (next: string) => { if (phase !== next) { phase = next; deps.onPhase?.(next); } };
  const clear = () => { if (timer !== undefined) deps.clear(timer); timer = undefined; };
  const reset = () => { clear(); armed = false; farewell = ""; heardAudio = false; userPending = false; };
  const check = () => {
    clear();
    if (!armed) { report("idle"); return; }
    if (userPending) { report("Waiting for the caller to finish."); return; }
    if (!hasBrandedFarewell(farewell)) { report("Waiting for the branded goodbye."); return; }
    if (!heardAudio || speaking) { report("Waiting for goodbye audio to finish."); return; }
    report("Goodbye heard; waiting for a quiet line.");
    // SDK speech-end already requires one second of audio silence. Allow a further
    // short quiet window for resumed speech or a caller interruption, not a blind timer.
    timer = deps.schedule(() => {
      timer = undefined;
      if (!armed || speaking || userPending) return;
      reset();
      deps.stop();
    }, 750);
  };
  const arm = () => {
    if (!armed) { clear(); armed = true; userPending = false; }
    check();
  };
  return {
    reset,
    arm,
    serverRequested(requestedAt: number) {
      if (!Number.isFinite(requestedAt) || requestedAt <= lastRequest) return false;
      lastRequest = requestedAt;
      arm();
      return true;
    },
    audioLevel(level: number) { if (level > 0.1) heardAudio = true; },
    speech(started: boolean) {
      speaking = started;
      if (started) heardAudio = true;
      check();
    },
    transcript(role: string, text: string, final: boolean) {
      if (role === "user") {
        const normalized = text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
        // Finals may repeat a caller partial from before the tool returned.
        if (normalized === lastUserText) {
          if (final && userPending && !isBriefSignoff(text)) { reset(); return; }
          if (final) userPending = false;
          check(); return;
        }
        lastUserText = normalized;
        if (!armed) { farewell = ""; heardAudio = false; return; }
        clear();
        if (final && !isBriefSignoff(text)) { reset(); return; }
        userPending = !final;
      } else if (role === "assistant") {
        // A cumulative partial may arrive before the final, which can be delayed
        // until the caller speaks again. Never require that next caller turn.
        // Retain this caller turn's speech even if the reactive server signal
        // trails the transcript. A new caller turn clears the pre-request buffer.
        farewell = `${farewell} ${text}`.slice(-3000);
      }
      check();
    },
  };
}
