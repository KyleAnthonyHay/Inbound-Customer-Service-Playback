import { test } from "node:test";
import assert from "node:assert/strict";
import { auditAcknowledgments, dialogueFromReport } from "./lib/acknowledgments";

test("real-call regression: flags the stacked opening and the second Thanks", () => {
  // Exact final speech excerpts from the November 2 development call,
  // docs/call-reviews/latest-closing-regression.sanitized.json (v36).
  const findings = auditAcknowledgments(dialogueFromReport({ dialogue: [
    { role: "user", text: "Graves Into Gardens won't" },
    { role: "bot", text: "Okay, got it" },
    { role: "user", text: "It says audio files are missing" },
    { role: "bot", text: "Thanks." },
    { role: "bot", text: "Thanks, that's helpful. Was this song recently downloaded in an earlier setlist on this iPad?" },
  ] }));
  assert.deepEqual(findings, [
    { message: 2, previousMessage: 2, phrases: ["okay", "got it"], reason: "stacked-acknowledgments" },
    { message: 5, previousMessage: 4, phrases: ["thanks", "thanks"], reason: "repeated-acknowledgment" },
  ]);
});

test("flags synonymous and stacked filler, including separate speaker segments", () => {
  assert.equal(auditAcknowledgments(dialogueFromReport({ transcript: [
    "CALLER: One song won't open.", "AGENT: Yeah, got it, okay. Let me check.",
    "CALLER: It says Audio Files Missing.", "AGENT: Got it.", "AGENT: Let me check that.",
    "AGENT: Okay, how many attempts have you made?",
  ] })).length, 2);
});

test("allows one acknowledgment followed by substance and preserves a branded goodbye", () => {
  const dialogue = dialogueFromReport({ transcript: [
    "AGENT: Hi there! Thank you for calling MultiTracks Playback support.",
    "CALLER: One song won't open.", "AGENT: Got it.", "AGENT: What message do you see?",
    "CALLER: Audio Files Missing.", "AGENT: How many times have you pressed Try Again?",
    "CALLER: That's everything, thanks.",
    "AGENT: Thanks so much for calling MultiTracks Playback support. Have a great day, and goodbye!",
  ] });
  assert.deepEqual(auditAcknowledgments(dialogue), []);
});

test("closing regression: a separate thank-you before the branded goodbye fails", () => {
  for (const lines of [
    ["Thank you.", "Thanks so much for calling MultiTracks Playback support. Have a great day, and goodbye!"],
    ["Okay. Thanks so much for calling MultiTracks Playback support. Have a great day, and goodbye!"],
    ["Great, okay.", "Thanks so much for calling MultiTracks Playback support. Have a great day, and goodbye!"],
    ["Great, okay.", "Thanks so much for calling", "MultiTracks Playback support. Have a great day, and goodbye!"],
  ]) {
    const findings = auditAcknowledgments(dialogueFromReport({ transcript: ["CALLER: No, that's it. Thank you.", ...lines.map(line => `AGENT: ${line}`)] }));
    assert.equal(findings.at(-1)?.reason, "closing-prelude");
  }
});

test("a fresh caller turn permits a fresh acknowledgment; embedded words aren't openings", () => {
  assert.deepEqual(auditAcknowledgments(dialogueFromReport({ turns: [
    { input: "Can you repeat that?", reply: "Sure. What does the screen say?" },
    { input: "Audio Files Missing.", reply: "Thanks, that helps. How many retries have you tried?" },
    { input: "Three.", reply: 'The button says "OK"; press it only after saving.' },
  ] })), []);
});

test("malformed, empty and failed reports cannot silently pass", () => {
  for (const report of [{}, { transcript: [] }, { dialogue: [{ role: "system", text: "secret" }] }, { transcript: ["partial transcript"] }, { turns: [{ input: "Hello", reply: "" }] }, { failure: "HTTP 500", turns: [] }]) {
    assert.throws(() => dialogueFromReport(report));
  }
});
