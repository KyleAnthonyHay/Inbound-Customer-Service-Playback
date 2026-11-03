import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeTimeZone, localToUtcMs, resolveDate, normalizeTime, formatLocal } from "../convex/time";
import { tools } from "../convex/vapiTools";
import type { ActionCtx, MutationCtx } from "../convex/_generated/server";
import { cleanupTextTest } from "../convex/callbacks";

// Saturday 2026-10-31 18:00 UTC. US DST ends 2026-11-01, so Monday is EST (UTC-5).
const NOW = Date.UTC(2026, 9, 31, 18, 0);

test("slot availability cannot be mistaken for a booking or staff notification", async () => {
  let writes = 0;
  const ctx = { runQuery: async () => ({ requested: { available: true, slotId: "slot", local: "Noon Eastern" }, instruction: "Noon is open" }),
    runMutation: async () => { writes++; } } as unknown as ActionCtx;
  const result = await tools.get_callback_slots.run({}, ctx, { callId: "fixture", callType: "webCall" }) as Record<string, unknown>;
  assert.equal(result.bookingCreated, false); assert.equal(result.teamNotified, false);
  assert.equal(result.actionPerformed, "availability-lookup-only"); assert.equal(result.callbackNumberRequired, true);
  assert.match(String(result.bookingInstruction), /reserve_callback/); assert.equal(writes, 0);
});

test("callback number is required before a reservation can write, and successful booking returns explicit state", async () => {
  let writes = 0;
  const ctx = { runMutation: async () => { writes++; return { ok: true, bookingId: "demo-booking", local: "Noon Eastern" }; } } as unknown as ActionCtx;
  for (const callbackNumber of [undefined, "", " ", "caller-id"]) {
    const result = await tools.reserve_callback.run({ slotId: "slot", callbackNumber }, ctx, { callId: "fixture", callType: "webCall" }) as Record<string, unknown>;
    assert.equal(result.ok, false); assert.equal(writes, 0);
  }
  const result = await tools.reserve_callback.run({ slotId: "slot", callbackNumber: "+12025550146", callerName: "Taylor", timeZone: "Eastern" }, ctx, { callId: "fixture" }) as Record<string, unknown>;
  assert.equal(writes, 1); assert.equal(result.bookingCreated, true); assert.equal(result.bookingId, "demo-booking");
  assert.equal(result.actionPerformed, "callback-reserved"); assert.equal(result.teamNotified, false);
});

test("successful voice callback arms guarded farewell closing without leaking its capability; failures do not", async () => {
  const callId = "11111111-1111-4111-8111-111111111111";
  const controlUrl = `https://phone-call-websocket.aws-us-east-1-backend-production1.vapi.ai/${callId}/control`;
  for (const succeeds of [true, false]) {
    const writes: unknown[] = [];
    const ctx = { runMutation: async (_ref: unknown, args: unknown) => { writes.push(args); return writes.length === 1 ? succeeds ? { ok: true, bookingId: "demo-booking", local: "Noon Eastern" } : { ok: false, reason: "slot-taken" } : true; } } as unknown as ActionCtx;
    const result = await tools.reserve_callback.run({ slotId: "slot", callbackNumber: "+12025550146", callerName: "Taylor", timeZone: "Eastern" }, ctx, { callId, callType: "inboundPhoneCall", controlUrl }) as Record<string, unknown>;
    assert.equal(writes.length, succeeds ? 2 : 1);
    if (succeeds) { assert.equal(result.callEndingFallbackScheduled, true); assert.equal(result.endCallRequired, true); assert.equal(result.nextAction, "endCall"); }
    assert.equal(JSON.stringify(result).includes(controlUrl), false);
  }
});

test("text booking cleanup rejects voice/production targets and does not release another booking's slot", async () => {
  const old = process.env.CONVEX_SITE_URL;
  const callId = "text-poc-11111111-1111-4111-8111-111111111111";
  const run = (cleanupTextTest as unknown as { _handler: (ctx: MutationCtx, args: { callId: string }) => Promise<number> })._handler;
  const own = { _id: "own-booking", callId, slotId: "slot", status: "confirmed" };
  const deleted: string[] = [], patched: unknown[] = [];
  const ctx = { db: { query: () => ({ withIndex: (index: string) => ({ take: async () => index === "by_callId" ? [own] : [own, { _id: "other-booking", status: "confirmed" }] }) }),
    get: async () => ({ _id: "slot", reserved: true }), delete: async (id: string) => deleted.push(id), patch: async (...args: unknown[]) => patched.push(args) } } as unknown as MutationCtx;
  try {
    process.env.CONVEX_SITE_URL = "https://production.example";
    await assert.rejects(() => run(ctx, { callId }), /development text tests only/);
    process.env.CONVEX_SITE_URL = "https://ceaseless-rhinoceros-106.convex.site";
    await assert.rejects(() => run(ctx, { callId: "11111111-1111-4111-8111-111111111111" }), /development text tests only/);
    assert.deepEqual(deleted, []);
    assert.equal(await run(ctx, { callId }), 1);
    assert.deepEqual(deleted, ["own-booking"]); assert.deepEqual(patched, []);
  } finally { if (old === undefined) delete process.env.CONVEX_SITE_URL; else process.env.CONVEX_SITE_URL = old; }
});

test("time zones: spoken names normalize to IANA", () => {
  assert.equal(normalizeTimeZone("EST"), "America/New_York");
  assert.equal(normalizeTimeZone("Eastern time"), "America/New_York");
  assert.equal(normalizeTimeZone("central"), "America/Chicago");
  assert.equal(normalizeTimeZone("America/Denver"), "America/Denver");
  assert.equal(normalizeTimeZone("Narnia"), null);
});

test("dates: weekday names resolve from today in the caller's zone", () => {
  assert.equal(resolveDate("Monday", "America/New_York", NOW), "2026-11-02");
  assert.equal(resolveDate("tomorrow", "America/New_York", NOW), "2026-11-01");
  assert.equal(resolveDate("2026-11-05", "America/New_York", NOW), "2026-11-05");
  assert.equal(resolveDate("Nov 3", "America/New_York", NOW), "2026-11-03");
});

test("times: spoken times normalize and convert across the DST boundary", () => {
  assert.equal(normalizeTime("5 PM"), "17:00");
  assert.equal(normalizeTime("9:30am"), "09:30");
  assert.equal(normalizeTime("17:00"), "17:00");
  // Monday 5 PM Eastern after DST ends = 22:00 UTC; Saturday 5 PM Eastern (still EDT) = 21:00 UTC.
  assert.equal(new Date(localToUtcMs("2026-11-02", "17:00", "America/New_York")!).toISOString(), "2026-11-02T22:00:00.000Z");
  assert.equal(new Date(localToUtcMs("2026-10-31", "17:00", "America/New_York")!).toISOString(), "2026-10-31T21:00:00.000Z");
  assert.match(formatLocal("2026-11-02T22:00:00.000Z", "America/New_York"), /Mon, Nov 2, 5:00 PM EST/);
});
