import { test } from "node:test";
import assert from "node:assert/strict";
import type { ActionCtx, MutationCtx } from "../convex/_generated/server";
import { CLOSING_GRACE_MS, farewellDurationMs, finishCallWhenReady, hasBrandedFarewell, isBriefSignoff, requestCallClosing, type ClosingState } from "../convex/lib/callClosing";
import { tools } from "../convex/vapiTools";
import { buildAssistant } from "../src/lib/assistant";
import { GOODBYE_MESSAGE } from "../src/lib/voicePolicy";
import { createBrowserClosing } from "../src/lib/browserClosing";
import { recentAssistantMessages, recentSpeechContext } from "../src/lib/recentSpeech";
import { appendRecentSpeakerContext } from "../convex/lib/speakerContext";

const callId = "11111111-1111-4111-8111-111111111111";
const controlUrl = `https://phone-call-websocket.aws-us-east-1-backend-production1.vapi.ai/${callId}/control`;
const args = { callId, controlUrl, requestedAt: 1000 };
const ready: ClosingState = { status: "in-progress", requestedAt: 1000, assistantSpeaking: false,
  assistantStoppedAt: 9500, lastUserSpeechAt: 900, farewell: GOODBYE_MESSAGE };

test("closing includes a callback confirmation only when a completed booking is independently returned", async () => {
  for (const booking of [null, { local: "proposed noon", requested: { available: true } }, { bookingId: "written-booking", local: "Wed, Nov 4, 12:00 PM EST" }]) {
    const ctx = { runQuery: async () => booking } as unknown as ActionCtx;
    const result = await tools.endCall.run({}, ctx, { callId: "text-poc-closing-confirmation" }) as { speak: string };
    assert.ok(result.speak.endsWith(GOODBYE_MESSAGE));
    assert.equal(result.speak.includes("callback is confirmed"), !!booking && "bookingId" in booking);
  }
});

test("farewell matching accepts natural wording and rejects the greeting or a bare acknowledgment", () => {
  for (const line of [GOODBYE_MESSAGE, "Thank you for calling MultiTracks support. Have a good day!"])
    assert.equal(hasBrandedFarewell(line), true);
  for (const line of ["Okay. Got it.", "Hi, thanks for calling MultiTracks Playback support. How can I help?", "Goodbye!"])
    assert.equal(hasBrandedFarewell(line), false);
});

test("where speech events exist, elapsed time alone, an acknowledgment, or ongoing speech cannot disconnect a call", async () => {
  for (const state of [{ ...ready, farewell: "Okay." }, { ...ready, assistantSpeaking: true },
    { ...ready, assistantSpeaking: undefined }, { ...ready, assistantStoppedAt: 900 },
    { ...ready, callerSpeaking: true }, { ...ready, closingInterrupted: true }]) {
    assert.equal(await finishCallWhenReady(args, { now: 10000, getState: async () => state,
      fetcher: async () => { throw Error("Must not send control"); } }), "waiting");
  }
  assert.equal(await finishCallWhenReady(args, { now: 2000, getState: async () => ready }), "waiting");
});

test("brief courtesy sign-offs do not hide a new request inside an interruption", () => {
  for (const text of ["Thanks!", "Okay, thank you. Goodbye!", "You too!", "Nope."])
    assert.equal(isBriefSignoff(text), true, text);
  for (const text of ["", "Yes", "Thanks, but I have another question", "No, wait", "Actually I still need help", "Please stay on"])
    assert.equal(isBriefSignoff(text), false, text);
});

test("an interruption, a superseded closing, ended call or wrong capability cancels hang-up", async () => {
  for (const state of [null, { ...ready, status: "ended" }, { ...ready, lastUserSpeechAt: 1001 }, { ...ready, requestedAt: 2000 }])
    assert.equal(await finishCallWhenReady(args, { now: 10000, getState: async () => state,
      fetcher: async () => { throw Error("Must not send control"); } }), "cancelled");
  assert.equal(await finishCallWhenReady({ ...args, controlUrl: "https://example.com/control" }, {
    getState: async () => { throw Error("Wrong capability must be rejected first"); },
  }), "cancelled");
});

test("a complete farewell and stopped speech authorize exactly one authenticated end request", async () => {
  let requests = 0;
  const result = await finishCallWhenReady(args, { now: 10000, getState: async () => ready, publicKey: "test-public",
    fetcher: async (url, init) => {
      requests++;
      assert.equal(url, controlUrl);
      assert.equal(init?.redirect, "error");
      assert.equal((init?.headers as Record<string, string>).Authorization, "Bearer test-public");
      assert.deepEqual(JSON.parse(String(init?.body)), { type: "end-call" });
      return new Response('{"status":"ok"}');
    },
  });
  assert.equal(result, "accepted");
  assert.equal(requests, 1);
});

test("a rejected or uncertain disconnect is never automatically retried", async () => {
  for (const timeout of [false, true]) {
    let requests = 0;
    const result = await finishCallWhenReady(args, { now: 10000, getState: async () => ready,
      fetcher: async () => { requests++; if (timeout) throw Error(controlUrl); return new Response("private", { status: 503 }); },
    });
    assert.equal(result, "failed");
    assert.equal(requests, 1);
    assert.ok(!result.includes(controlUrl));
  }
});

test("phone calls without speech events hang up once the endCall farewell's estimated duration has passed", async () => {
  // GPT-Live phone calls deliver no speech-update/transcript webhooks: only the farewell deadline exists.
  const silent: ClosingState = { status: "in-progress", channel: "phone", requestedAt: 1000, assistantSpeaking: false,
    farewell: "", deadlineAt: 1000 + farewellDurationMs(GOODBYE_MESSAGE) };
  const deadline = silent.deadlineAt!;
  const never = async () => { throw Error("Must not send control"); };
  assert.equal(await finishCallWhenReady(args, { now: deadline - 1, getState: async () => silent, fetcher: never }), "waiting");
  for (const state of [{ ...silent, channel: "browser" }, { ...silent, deadlineAt: undefined }, { ...silent, deadlineAt: 900 },
    { ...silent, assistantStoppedAt: 1500 }, { ...silent, farewell: "Thanks so much" }, { ...silent, callerSpeaking: false }])
    assert.equal(await finishCallWhenReady(args, { now: deadline + 1, getState: async () => state, fetcher: never }), "waiting");
  assert.equal(await finishCallWhenReady(args, { now: deadline + 1, getState: async () => ({ ...silent, resumedAt: 1001 }), fetcher: never }), "cancelled");
  let requests = 0;
  assert.equal(await finishCallWhenReady(args, { now: deadline, getState: async () => silent, publicKey: "test-public",
    fetcher: async (_url, init) => { requests++; assert.deepEqual(JSON.parse(String(init?.body)), { type: "end-call" }); return new Response('{"status":"ok"}'); },
  }), "accepted");
  assert.equal(requests, 1);
});

test("the farewell estimate covers a spoken goodbye without leaving long dead air", () => {
  const ms = farewellDurationMs(GOODBYE_MESSAGE);
  // The recorded phone goodbye finished 4.4 s after endCall.
  assert.ok(ms >= 6_000 && ms <= 10_000, String(ms));
  assert.ok(farewellDurationMs(`Your demo callback is confirmed for Wed, Nov 4, 12:00 PM EST. ${GOODBYE_MESSAGE}`) > ms);
});

test("endCall sets the farewell deadline once, including after a handoff or booking armed closing", async t => {
  let now = 1000;
  t.mock.method(Date, "now", () => now);
  const row: Record<string, unknown> = { _id: "row", status: "in-progress", channel: "phone" };
  const jobs: Array<Record<string, unknown>> = [];
  const ctx = { db: { query: (table: string) => ({ withIndex: () => ({ unique: async () => table === "deletedCalls" ? null : row }) }), get: async () => row,
    patch: async (_id: unknown, value: Record<string, unknown>) => Object.assign(row, value) },
  scheduler: { runAfter: async (_ms: number, _ref: unknown, a: Record<string, unknown>) => { jobs.push(a); } },
  } as unknown as MutationCtx;
  await requestCallClosing(ctx, { callId, controlUrl });
  assert.equal(row.closingDeadlineAt, undefined);
  now = 3000;
  await requestCallClosing(ctx, { callId, controlUrl, farewell: GOODBYE_MESSAGE });
  assert.equal(row.closingDeadlineAt, 3000 + farewellDurationMs(GOODBYE_MESSAGE));
  now = 4000;
  await requestCallClosing(ctx, { callId, controlUrl, farewell: GOODBYE_MESSAGE });
  assert.equal(row.closingDeadlineAt, 3000 + farewellDurationMs(GOODBYE_MESSAGE));
  assert.equal(jobs.length, 1);
  row.closingResumedAt = 5000; now = 6000;
  await requestCallClosing(ctx, { callId, controlUrl, farewell: GOODBYE_MESSAGE });
  assert.equal(jobs.length, 2);
  assert.equal(row.closingRequestedAt, 6000);
  assert.equal(row.closingDeadlineAt, 6000 + farewellDurationMs(GOODBYE_MESSAGE));
});

test("closing requests deduplicate and re-arm after caller speech; capabilities stay out of call history", async t => {
  let now = 1000;
  t.mock.method(Date, "now", () => now);
  const row: Record<string, unknown> = { _id: "row", status: "in-progress", channel: "browser" };
  const jobs: Array<{ ms: number; args: Record<string, unknown> }> = [];
  const ctx = { db: { query: (table: string) => ({ withIndex: () => ({ unique: async () => table === "deletedCalls" ? null : row }) }), get: async () => row,
    patch: async (_id: unknown, value: Record<string, unknown>) => Object.assign(row, value) },
  scheduler: { runAfter: async (ms: number, _ref: unknown, a: Record<string, unknown>) => { jobs.push({ ms, args: a }); } },
  } as unknown as MutationCtx;
  assert.equal(await requestCallClosing(ctx, { callId, controlUrl }), true);
  assert.equal(await requestCallClosing(ctx, { callId, controlUrl }), true);
  assert.equal(jobs.length, 1);
  assert.equal(jobs[0].ms, CLOSING_GRACE_MS);
  assert.ok(!JSON.stringify(row).includes(controlUrl));
  row.lastUserSpeechAt = 1500; now = 2000;
  await requestCallClosing(ctx, { callId, controlUrl });
  assert.equal(jobs.length, 2);
  assert.equal(row.closingRequestedAt, 2000);
});

test("the exposed end tool prepares a farewell and cannot perform an immediate native hang-up", async () => {
  const assistant = buildAssistant({ toolServerUrl: "https://demo.example/vapi/tools" });
  assert.equal(assistant.model.tools.some(t => t.type === "endCall"), false);
  assert.equal(assistant.model.tools.some(t => t.type === "function" && t.function?.name === "endCall"), true);
  const ctx = { runMutation: async () => true } as unknown as ActionCtx;
  const result = await tools.endCall.run({}, ctx, { callId, controlUrl }) as Record<string, unknown>;
  assert.equal(result.closingPending, true);
  assert.equal(result.speak, GOODBYE_MESSAGE);
  assert.ok(!JSON.stringify(result).includes(controlUrl));
  const text = await tools.endCall.run({}, { runMutation: async () => { throw Error("No live operation"); } } as unknown as ActionCtx,
    { callId: "text-poc-closing" }) as Record<string, unknown>;
  assert.equal(text.voiceCall, false);
  const missing = await tools.endCall.run({}, ctx, { callId }) as Record<string, unknown>;
  assert.equal(missing.ok, false);
});

function browserFixture() {
  let stops = 0;
  const timers = new Set<() => void>();
  const closing = createBrowserClosing({ stop: () => { stops++; },
    schedule: callback => { timers.add(callback); return callback; },
    clear: timer => { timers.delete(timer as () => void); },
  });
  return { closing, stops: () => stops, flush: () => { for (const timer of [...timers]) { timers.delete(timer); timer(); } } };
}

test("browser regression: partial farewell plus completed audio closes without a final transcript", () => {
  const f = browserFixture();
  f.closing.transcript("user", "No, that's it. Thank you", false);
  f.closing.arm();
  // A delayed final of the closing reply must not be a new interruption.
  f.closing.transcript("user", "No, that's it. Thank you", true);
  f.closing.speech(true);
  f.closing.audioLevel(0.4);
  f.closing.transcript("assistant", GOODBYE_MESSAGE, false);
  f.flush(); assert.equal(f.stops(), 0, "must not interrupt speech");
  f.closing.speech(false);
  f.flush(); f.flush();
  assert.equal(f.stops(), 1);
});

test("backend request arms closing when GPT-Live sends no SDK tool-result event", () => {
  const f = browserFixture();
  f.closing.transcript("user", "No, that's everything. Thank you.", false);
  assert.equal(f.closing.serverRequested(1000), true);
  assert.equal(f.closing.serverRequested(1000), false);
  f.closing.speech(true); f.closing.audioLevel(0.4);
  f.closing.transcript("assistant", "Thanks so much for calling", false);
  f.closing.transcript("assistant", "MultiTracks Playback support. Have a great day, and goodbye!", true);
  f.closing.speech(false); f.flush();
  assert.equal(f.stops(), 1);
});

test("a delayed backend signal can use the already observed farewell and audio completion", () => {
  const f = browserFixture();
  f.closing.transcript("user", "No, that's everything, thank you", false);
  f.closing.speech(true); f.closing.audioLevel(0.4);
  f.closing.transcript("assistant", GOODBYE_MESSAGE, false);
  f.closing.speech(false); f.flush(); assert.equal(f.stops(), 0);
  f.closing.serverRequested(1000); f.flush();
  assert.equal(f.stops(), 1);
});

test("an earlier farewell cannot end a new caller turn", () => {
  const f = browserFixture();
  f.closing.speech(true); f.closing.audioLevel(0.4);
  f.closing.transcript("assistant", GOODBYE_MESSAGE, true); f.closing.speech(false);
  f.closing.transcript("user", "Actually I have another question", false);
  f.closing.serverRequested(1000); f.flush(); assert.equal(f.stops(), 0);
});

test("browser waits when partial transcript follows speech-end, not just when it precedes it", () => {
  const f = browserFixture();
  f.closing.arm(); f.closing.speech(true); f.closing.audioLevel(0.3); f.closing.speech(false);
  f.flush(); assert.equal(f.stops(), 0);
  f.closing.transcript("assistant", GOODBYE_MESSAGE, false);
  f.flush(); assert.equal(f.stops(), 1);
});

test("a tool result, old greeting, bare thank-you or missing audio cannot alone close the browser", () => {
  for (const text of ["Thank you.", "Hi, thank you for calling MultiTracks. How can I help?"]) {
    const f = browserFixture(); f.closing.arm(); f.closing.speech(true); f.closing.audioLevel(0.4);
    f.closing.transcript("assistant", text, true); f.closing.speech(false); f.flush();
    assert.equal(f.stops(), 0);
  }
  const f = browserFixture(); f.closing.arm(); f.closing.transcript("assistant", GOODBYE_MESSAGE, true);
  f.closing.speech(false); f.flush(); assert.equal(f.stops(), 0);
});

test("browser closing pauses for a new caller partial and cancels on a substantive final", () => {
  const f = browserFixture(); f.closing.arm(); f.closing.speech(true); f.closing.audioLevel(0.4);
  f.closing.transcript("assistant", GOODBYE_MESSAGE, false); f.closing.speech(false);
  f.closing.transcript("user", "Wait, I have another question", false);
  f.flush(); assert.equal(f.stops(), 0);
  f.closing.transcript("user", "Wait, I have another question", true);
  f.closing.speech(true); f.closing.audioLevel(0.4); f.closing.speech(false); f.flush();
  assert.equal(f.stops(), 0);
});

test("resumed audio cancels the quiet window; a completed courtesy reply can finish", () => {
  const f = browserFixture(); f.closing.arm(); f.closing.speech(true); f.closing.audioLevel(0.4);
  f.closing.transcript("assistant", GOODBYE_MESSAGE, false); f.closing.speech(false);
  f.closing.speech(true); f.flush(); assert.equal(f.stops(), 0);
  f.closing.transcript("user", "You too!", false); f.closing.speech(false);
  f.flush(); assert.equal(f.stops(), 0);
  f.closing.transcript("user", "You too!", true); f.flush(); assert.equal(f.stops(), 1);
});

test("resetting on hang-up/new call removes old audio and pending timers", () => {
  const f = browserFixture(); f.closing.arm(); f.closing.speech(true); f.closing.audioLevel(0.4);
  f.closing.transcript("assistant", GOODBYE_MESSAGE, false); f.closing.speech(false);
  f.closing.reset(); f.flush(); assert.equal(f.stops(), 0);
  f.closing.arm(); f.closing.speech(false); f.flush(); assert.equal(f.stops(), 0);
});

test("recent context projects only the last two spoken messages, preserving a short acknowledgment", () => {
  const recent = recentAssistantMessages([
    { role: "system", content: "credentials-never-export" }, { role: "bot", message: "Old reply" },
    { role: "user", message: "No, that's it." }, { role: "bot", message: "Thank you." },
    { role: "tool", content: "private-tool-result" }, { role: "assistant", content: "Is there anything else I can help you with today?" },
    { role: "assistant", content: null },
  ]);
  assert.deepEqual(recentSpeechContext(recent).recentAssistantMessages, ["Thank you.", "Is there anything else I can help you with today?"]);
  assert.doesNotMatch(JSON.stringify(recent), /credentials|private-tool/);
});

test("speaker receives two real messages as thinking context without requesting another utterance", async () => {
  let writes = 0;
  assert.equal(await appendRecentSpeakerContext({ callId, controlUrl, messages: ["Old", "Thank you.", "Useful question?"] }, {
    fetcher: async (url, init) => {
      writes++; assert.equal(url, controlUrl);
      const body = JSON.parse(String(init?.body));
      assert.equal(body.type, "append-context"); assert.equal(body.kind, "thinking");
      assert.deepEqual(JSON.parse(body.content).recentAssistantMessages, ["Thank you.", "Useful question?"]);
      return new Response('{}');
    },
  }), true);
  assert.equal(writes, 1);
  assert.equal(await appendRecentSpeakerContext({ callId: "text-poc-demo", controlUrl, messages: ["Thanks"] }, {
    fetcher: async () => { throw Error("Text must not control a call"); },
  }), false);
});
