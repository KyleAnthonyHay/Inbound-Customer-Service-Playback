import { test } from "node:test";
import assert from "node:assert/strict";
import type { MutationCtx } from "../convex/_generated/server";
import { ADMISSION_MESSAGE, AVAILABILITY_MESSAGE, CALL_START_MESSAGE, DEV_SITE, RESERVATION_MS, reserveDevCall, startDevCall, updateDevReservation } from "../convex/lib/callAdmission";
import { friendlyCallError } from "../src/lib/useVapiCall";

const env = { CONVEX_SITE_URL: DEV_SITE, VAPI_PRIVATE_KEY: "private-test-key", VAPI_PUBLIC_KEY: "public-test-key", DEV_VAPI_ASSISTANT_ID: "dev-assistant" };
const limits = { subscriptionLimits: { concurrencyLimit: 4, remainingConcurrentCalls: 4, concurrencyBlocked: false } };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

function fixture(options: { limits?: unknown; calls?: unknown; createStatus?: number; timeout?: boolean; snapshotFailure?: boolean } = {}) {
  const requests: Array<{ url: string; init?: RequestInit }> = [];
  const updates: Array<{ token: string; callId?: string; release: boolean }> = [];
  let held = false;
  const deps = {
    env,
    reserve: async () => { if (held) return false; held = true; return true; },
    update: async (args: typeof updates[number]) => { updates.push(args); if (args.release) held = false; },
    fetcher: (async (url, init) => {
      requests.push({ url: String(url), init });
      if (String(url).endsWith("/org/limits")) return json(options.limits === undefined ? limits : options.limits);
      if (init?.method !== "POST") return options.snapshotFailure ? json({}, 503) : json(options.calls ?? []);
      if (options.timeout) throw Error("Timeout with private provider data");
      return json({ id: "call-1", webCallUrl: "https://test.daily.co/room", transport: { websocketCallUrl: "wss://test.vapi.ai/room" },
        assistant: { server: { headers: { secret: "private-webhook-secret" } } } }, options.createStatus ?? 201);
    }) as typeof fetch,
  };
  return { deps, requests, updates };
}

test("both transports create only the configured dev assistant and return allowlisted connection fields", async () => {
  for (const transport of ["browser", "websocket"] as const) {
    const f = fixture();
    const result = await startDevCall(transport, f.deps);
    assert.equal(result.status, 201);
    assert.equal(f.requests.length, 3);
    const create = f.requests[2];
    const body = JSON.parse(String(create.init?.body));
    assert.equal(body.assistantId, env.DEV_VAPI_ASSISTANT_ID);
    assert.deepEqual(body.assistantOverrides, { maxDurationSeconds: 1800 });
    assert.equal(create.url, transport === "browser" ? "https://api.vapi.ai/call/web" : "https://api.vapi.ai/call");
    assert.equal((create.init?.headers as Record<string, string>).Authorization, `Bearer ${transport === "browser" ? env.VAPI_PUBLIC_KEY : env.VAPI_PRIVATE_KEY}`);
    assert.equal((f.requests[0].init?.headers as Record<string, string>).Authorization, `Bearer ${env.VAPI_PRIVATE_KEY}`);
    if (transport === "browser") {
      assert.equal(body.roomDeleteOnUserLeaveEnabled, true);
      assert.equal("transport" in body, false);
    } else assert.equal(body.transport.provider, "vapi.websocket");
    assert.equal(create.init?.redirect, "error");
    assert.ok(!JSON.stringify(result).includes("private-"));
    assert.deepEqual(f.updates.map(({ callId, release }) => ({ callId, release })), [{ callId: "call-1", release: false }]);
  }
});

test("parallel starts share one reservation, so only one provider create is attempted", async () => {
  const f = fixture();
  const results = await Promise.all(Array.from({ length: 25 }, () => startDevCall("browser", f.deps)));
  assert.equal(results.filter(r => r.status === 201).length, 1);
  assert.equal(results.filter(r => r.status === 429).length, 24);
  assert.equal(f.requests.filter(r => r.init?.method === "POST").length, 1);
});

test("live subscription headroom preserves the configured production reserve and handles downgrades", async () => {
  for (const current of [
    { concurrencyLimit: 4, remainingConcurrentCalls: 1 },
    { concurrencyLimit: 1, remainingConcurrentCalls: 1 },
    { concurrencyLimit: 4, remainingConcurrentCalls: 0, concurrencyBlocked: true },
  ]) {
    const f = fixture({ limits: { subscriptionLimits: current } });
    assert.equal((await startDevCall("browser", f.deps)).status, 429);
    assert.equal(f.requests.length, 1);
    assert.equal(f.updates.at(-1)?.release, true);
  }
  const f = fixture({ limits: { subscriptionLimits: { concurrencyLimit: 4, remainingConcurrentCalls: 2 } } });
  assert.equal((await startDevCall("browser", { ...f.deps, env: { ...env, DEV_CALL_RESERVED_PRODUCTION_SLOTS: "2" } })).status, 429);
});

test("an external dev call, account saturation and incomplete provider data fail closed", async () => {
  for (const calls of [
    [{ id: "external-dev", status: "in-progress", assistantId: "dev-assistant" }],
    Array.from({ length: 3 }, (_, i) => ({ id: String(i), status: "ringing" })),
    Array.from({ length: 1000 }, (_, i) => ({ id: String(i), status: "ended" })),
    [{ id: "unknown-status" }], { unexpected: true },
  ]) {
    const f = fixture({ calls });
    assert.notEqual((await startDevCall("browser", f.deps)).status, 201);
    assert.equal(f.requests.filter(r => r.init?.method === "POST").length, 0);
    assert.equal(f.updates.at(-1)?.release, true);
  }
  for (const value of [{}, { subscriptionLimits: { concurrencyLimit: 4, remainingConcurrentCalls: 5 } }]) {
    const f = fixture({ limits: value });
    assert.equal((await startDevCall("browser", f.deps)).status, 503);
    assert.equal(f.updates.at(-1)?.release, true);
  }
  const f = fixture({ snapshotFailure: true });
  assert.equal((await startDevCall("browser", f.deps)).status, 503);
  assert.equal(f.updates.at(-1)?.release, true);
});

test("production, missing credentials and invalid reserve cannot reach the provider", async () => {
  for (const override of [{ CONVEX_SITE_URL: "https://earnest-alpaca-725.convex.site" }, { VAPI_PRIVATE_KEY: "" }, { DEV_VAPI_ASSISTANT_ID: "" },
    { VAPI_PUBLIC_KEY: "" }, { DEV_CALL_RESERVED_PRODUCTION_SLOTS: "0" }, { DEV_CALL_RESERVED_PRODUCTION_SLOTS: "1.5" }]) {
    const f = fixture();
    assert.equal((await startDevCall("browser", { ...f.deps, env: { ...env, ...override } })).status, 503);
    assert.equal(f.requests.length, 0);
  }
});

test("uncertain creation retains the lease without retrying; definite 4xx rejection frees it", async () => {
  for (const options of [{ timeout: true }, { createStatus: 503 }, { createStatus: 400 }]) {
    const f = fixture(options);
    const result = await startDevCall("browser", f.deps);
    assert.equal(result.status, 503);
    assert.equal(f.requests.filter(r => r.init?.method === "POST").length, 1);
    assert.equal(f.updates.some(x => x.release), options.createStatus === 400);
    assert.equal(result.body.message, CALL_START_MESSAGE);
  }
});

function storage() {
  let row: Record<string, unknown> | null = null;
  let ended = false;
  const ctx = { db: {
    query: (table: string) => ({ withIndex: () => ({ unique: async () => table === "calls" ? { status: ended ? "ended" : "in-progress" } : row }) }),
    insert: async (_table: string, value: Record<string, unknown>) => { row = { _id: "lease", ...value }; },
    patch: async (_id: string, value: Record<string, unknown>) => { Object.assign(row!, value); },
  } } as unknown as MutationCtx;
  return { ctx, get row() { return row; }, end: () => { ended = true; } };
}

test("lease expires after bounded recovery time; old tokens and unrelated ended calls cannot release a new lease", async () => {
  const f = storage();
  assert.equal(await reserveDevCall(f.ctx, "first", 0), true);
  assert.equal(await reserveDevCall(f.ctx, "second", RESERVATION_MS - 1), false);
  assert.equal(await reserveDevCall(f.ctx, "second", RESERVATION_MS), true);
  await updateDevReservation(f.ctx, { token: "first", release: true });
  await updateDevReservation(f.ctx, { callId: "production-call", release: true });
  assert.equal(f.row!.expiresAt, 2 * RESERVATION_MS);
  await updateDevReservation(f.ctx, { token: "second", callId: "dev-call", release: false });
  await updateDevReservation(f.ctx, { callId: "dev-call", release: true });
  assert.equal(f.row!.expiresAt, 0);
  assert.equal(await reserveDevCall(f.ctx, "third", RESERVATION_MS + 1), true);
});

test("ended webhook arriving before create response binding frees the lease", async () => {
  const f = storage();
  await reserveDevCall(f.ctx, "first", 0);
  f.end();
  await updateDevReservation(f.ctx, { token: "first", callId: "dev-call", release: false });
  assert.equal(f.row!.expiresAt, 0);
});

test("SDK serialized HTTP errors show the retry-later explanation", () => {
  for (const message of [ADMISSION_MESSAGE, AVAILABILITY_MESSAGE, CALL_START_MESSAGE])
    assert.equal(friendlyCallError(JSON.stringify({ message: { message } })), message);
});

test("a failed availability check does not claim that production is using the slots", async () => {
  const f = fixture({ snapshotFailure: true });
  const result = await startDevCall("browser", f.deps);
  assert.equal(result.status, 503);
  assert.equal(result.body.message, AVAILABILITY_MESSAGE);
  assert.equal(f.requests.some(r => r.init?.method === "POST"), false);
});
