"use client";

/**
 * Call sound cues, synthesized with the Web Audio API. Ported from the
 * portfolio's voice call (components/chat/voice/cues.ts), which generates
 * these in code rather than loading audio files: connected is a warm two-note
 * pulse, mute/unmute step down/up, hang-up is a lower, slower pair. Transfer
 * is new here: two attention beeps, then a second of US ringback (440+480 Hz).
 * startRingback() loops the same ringback while an outgoing call connects, and
 * playDtmf() gives the keypad its touch-tone clicks.
 * The Call button primes the context inside a tap so later cues can sound.
 */
export type Cue = "connected" | "mute" | "unmute" | "hangup" | "transfer";

type Shape = { notes: number[][]; length: number; gap: number; gain: number };

const SHAPES: Record<Exclude<Cue, "transfer">, Shape> = {
  connected: { notes: [[220], [330]], length: 0.18, gap: 0.22, gain: 0.12 },
  mute: { notes: [[622], [440]], length: 0.08, gap: 0.095, gain: 0.07 },
  unmute: { notes: [[440], [622]], length: 0.08, gap: 0.095, gain: 0.07 },
  hangup: { notes: [[392], [262]], length: 0.15, gap: 0.18, gain: 0.09 },
};

let shared: AudioContext | null = null;

function context(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    shared ??= new AudioContext();
    if (shared.state === "suspended") void shared.resume().catch(() => {});
    return shared;
  } catch {
    return null;
  }
}

/** Create the audio context inside a tap so a cue that follows later can still sound. */
export function primeCues(): void {
  context();
}

function tone(audio: AudioContext, freqs: number[], at: number, length: number, gain: number) {
  const envelope = audio.createGain();
  envelope.gain.setValueAtTime(0, at);
  envelope.gain.linearRampToValueAtTime(gain, at + 0.006);
  envelope.gain.exponentialRampToValueAtTime(0.0001, at + length);
  envelope.connect(audio.destination);
  for (const frequency of freqs) {
    const oscillator = audio.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    oscillator.connect(envelope);
    oscillator.start(at);
    oscillator.stop(at + length + 0.02);
  }
}

/** Plays a cue; resolves when it has finished sounding. */
export function playCue(cue: Cue): Promise<void> {
  const audio = context();
  if (!audio) return Promise.resolve();
  const start = audio.currentTime + 0.01;
  if (cue === "transfer") {
    tone(audio, [1000], start, 0.14, 0.12);
    tone(audio, [1000], start + 0.24, 0.14, 0.12);
    tone(audio, [440, 480], start + 0.7, 1.2, 0.08);
    return new Promise((r) => setTimeout(r, 2000));
  }
  const { notes, length, gap, gain } = SHAPES[cue];
  notes.forEach((freqs, index) => tone(audio, freqs, start + index * gap, length, gain));
  return new Promise((r) => setTimeout(r, (notes.length * gap + length) * 1000));
}

/**
 * Classic North American ringback while the call is connecting: 440+480 Hz,
 * two seconds on, four seconds off, repeating until stopped. Each ring is
 * scheduled ahead on the audio clock; stopping fades out whatever is playing.
 */
const RING_ON = 2;
const RING_PERIOD = 6;
const RING_GAIN = 0.08;

let ringback: { stop: () => void } | null = null;

export function startRingback(): void {
  const audio = context();
  if (!audio || ringback) return;

  const out = audio.createGain();
  out.gain.value = 1;
  out.connect(audio.destination);
  const oscillators: OscillatorNode[] = [];

  const ring = (at: number) => {
    const envelope = audio.createGain();
    envelope.gain.setValueAtTime(0, at);
    envelope.gain.linearRampToValueAtTime(RING_GAIN, at + 0.02);
    envelope.gain.setValueAtTime(RING_GAIN, at + RING_ON - 0.02);
    envelope.gain.linearRampToValueAtTime(0, at + RING_ON);
    envelope.connect(out);
    for (const frequency of [440, 480]) {
      const oscillator = audio.createOscillator();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      oscillator.connect(envelope);
      oscillator.start(at);
      oscillator.stop(at + RING_ON + 0.02);
      oscillators.push(oscillator);
    }
  };

  // Short pause before the first ring, as on a real line.
  let next = audio.currentTime + 0.4;
  ring(next);
  next += RING_PERIOD;
  // Keep one ring scheduled ahead of the clock.
  const timer = setInterval(() => {
    if (audio.currentTime > next - RING_PERIOD + RING_ON) {
      ring(next);
      next += RING_PERIOD;
    }
  }, 500);

  ringback = {
    stop: () => {
      clearInterval(timer);
      const now = audio.currentTime;
      out.gain.cancelScheduledValues(now);
      out.gain.setValueAtTime(out.gain.value, now);
      out.gain.linearRampToValueAtTime(0, now + 0.05);
      for (const oscillator of oscillators) {
        try {
          oscillator.stop(now + 0.06);
        } catch {
          // already stopped
        }
      }
      setTimeout(() => out.disconnect(), 200);
    },
  };
}

/** Stops the ringback if it is playing. Safe to call any time. */
export function stopRingback(): void {
  ringback?.stop();
  ringback = null;
}

/**
 * DTMF key tones for the keypad: each key is the sum of one low and one high
 * frequency, as on a real touch-tone phone. Short, like iOS's keypad clicks.
 */
const DTMF_LOW = [697, 770, 852, 941];
const DTMF_HIGH = [1209, 1336, 1477];
const DTMF_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"];

export function playDtmf(key: string): void {
  const index = DTMF_KEYS.indexOf(key);
  const audio = context();
  if (index < 0 || !audio) return;
  const freqs = [DTMF_LOW[Math.floor(index / 3)], DTMF_HIGH[index % 3]];
  tone(audio, freqs, audio.currentTime + 0.005, 0.12, 0.06);
}
