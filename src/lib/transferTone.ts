"use client";

/**
 * Browser-side transfer sound, synthesized with Web Audio so no asset or
 * platform support is needed. Vapi/GPT-Live cannot play an audio file into
 * the call, so on the browser channel the demo plays this locally when the
 * simulated handoff tool succeeds. On the phone channel there is no
 * equivalent; the handoff is spoken only (documented limitation).
 */
export type TonePlayer = {
  /** Call from a user gesture (the Call button) so playback is allowed later. */
  unlock: () => void;
  /** Two short attention beeps, then ~1.2 s of US ringback, then resolves. */
  playTransfer: () => Promise<void>;
  dispose: () => void;
};

export function createTonePlayer(): TonePlayer {
  let ctx: AudioContext | null = null;

  const ensure = () => {
    if (typeof window === "undefined") return null;
    if (!ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
    }
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  };

  const tone = (c: AudioContext, freqs: number[], start: number, dur: number, gain = 0.12) => {
    const g = c.createGain();
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(gain, start + 0.01);
    g.gain.setValueAtTime(gain, start + dur - 0.02);
    g.gain.linearRampToValueAtTime(0, start + dur);
    g.connect(c.destination);
    for (const f of freqs) {
      const o = c.createOscillator();
      o.type = "sine";
      o.frequency.value = f;
      o.connect(g);
      o.start(start);
      o.stop(start + dur);
    }
  };

  return {
    unlock: () => void ensure(),
    playTransfer: () => {
      const c = ensure();
      if (!c) return Promise.resolve();
      const t0 = c.currentTime + 0.05;
      tone(c, [1000], t0, 0.14);
      tone(c, [1000], t0 + 0.24, 0.14);
      tone(c, [440, 480], t0 + 0.7, 1.2, 0.08); // ringback: 440+480 Hz
      const total = 0.7 + 1.2 + 0.1;
      return new Promise((resolve) => setTimeout(resolve, total * 1000));
    },
    dispose: () => {
      void ctx?.close();
      ctx = null;
    },
  };
}
