import { test } from "node:test";
import assert from "node:assert/strict";
import type { ActionCtx, MutationCtx } from "../convex/_generated/server";
import { tools } from "../convex/vapiTools";
import { callInfoOf } from "../src/lib/tools/callerId";
import { endHandoffCall, HANDOFF_END_GRACE_MS, scheduleHandoffEnd, validControlUrl } from "../convex/lib/handoffEnding";

const callId = "00000000-0000-4000-8000-000000000001";
const controlUrl = `https://phone-call-websocket.aws-us-west-2-backend-production1.vapi.ai/${callId}/control`;

test("per-call control capability rejects other calls, external hosts, credentials and redirects", () => {
  assert.equal(validControlUrl(callId, controlUrl), controlUrl);
  for (const value of [controlUrl.replace(callId, "00000000-0000-4000-8000-000000000002"), controlUrl.replace(".vapi.ai", ".vapi.ai.evil.test"),
    controlUrl.replace("https:", "http:"), controlUrl.replace("https://", "https://user:secret@"), `${controlUrl}?redirect=https://example.com`, `${controlUrl}#x`,
    controlUrl.replace("/control", "/other"), "not a URL"]) assert.equal(validControlUrl(callId, value), null);
  assert.equal(validControlUrl("text-poc-test", controlUrl), null);
});

test("signed call metadata carries control URL server-side without changing caller ID behavior", () => {
  const call = callInfoOf({ id: callId, type: "inboundPhoneCall", monitor: { controlUrl }, customer: { number: "+15550001111" } });
  assert.equal(call.controlUrl, controlUrl);
  assert.equal(call.callerNumber, "+15550001111");
  assert.equal("controlUrl" in callInfoOf({ id: "text-poc-test" }), false);
});

test("available accepted handoff is terminal and schedules its live-call fallback without leaking the capability", async () => {
  const writes: unknown[] = [];
  const ctx = {
    runQuery: async () => ({ teams: [{ label: "Playback Technical Support", canTransferNow: true }] }),
    runMutation: async (_ref: unknown, args: unknown) => { writes.push(args); return true; },
  } as unknown as ActionCtx;
  const result = await tools.initiate_handoff.run({}, ctx, { callId, callType: "inboundPhoneCall", controlUrl }) as Record<string, unknown>;
  assert.equal(result.ok, true);
  assert.equal(result.endCallRequired, true);
  assert.equal(result.conversationComplete, true);
  assert.equal(result.nextAction, "endCall");
  assert.equal(result.callEndingFallbackScheduled, true);
  assert.deepEqual(writes, [{ callId, callType: "inboundPhoneCall", controlUrl }]);
  assert.ok(!JSON.stringify(result).includes(controlUrl));
});

test("availability alone, missing team and unavailable handoff never schedule a hang-up", async () => {
  let writes = 0;
  const ctx = {
    runQuery: async () => ({ teams: [{ label: "Playback Technical Support", canTransferNow: false }] }),
    runMutation: async () => { writes++; return true; },
  } as unknown as ActionCtx;
  const call = { callId, controlUrl };
  const availability = await tools.check_team_availability.run({}, ctx, call) as Record<string, unknown>;
  assert.equal(availability.handoffStarted, false);
  assert.equal(availability.teamNotified, false);
  const failed = await tools.initiate_handoff.run({}, ctx, call) as Record<string, unknown>;
  assert.equal(failed.ok, false);
  assert.equal(failed.endCallRequired, undefined);
  assert.match(String(failed.next), /callback/);
  ctx.runQuery = (async () => ({ teams: [] })) as ActionCtx["runQuery"];
  assert.equal((await tools.initiate_handoff.run({}, ctx, call) as Record<string, unknown>).ok, false);
  assert.equal(writes, 0);
});

test("text handoffs return completion intent but cannot schedule live call control", async () => {
  const ctx = {
    runQuery: async () => ({ teams: [{ label: "Playback Technical Support", canTransferNow: true }] }),
    runMutation: async () => { throw Error("No live operation allowed"); },
  } as unknown as ActionCtx;
  const result = await tools.initiate_handoff.run({}, ctx, { callId: "text-poc-test" }) as Record<string, unknown>;
  assert.equal(result.ok, true);
  assert.equal(result.endCallRequired, true);
  assert.equal(result.callEndingFallbackScheduled, false);
});

test("handoff fallback schedules once, gives the goodbye a grace period and leaves ended calls alone", async () => {
  const row: Record<string, unknown> = { _id: "call-row", status: "in-progress", channel: "phone" };
  const jobs: unknown[] = [];
  const ctx = {
    db: {
      query: (table: string) => ({ withIndex: () => ({ unique: async () => table === "deletedCalls" ? null : row }) }),
      get: async () => row,
      patch: async (_id: unknown, patch: unknown) => Object.assign(row, patch),
    },
    scheduler: { runAfter: async (ms: number, _ref: unknown, args: unknown) => { jobs.push({ ms, args }); } },
  } as unknown as MutationCtx;
  assert.equal(await scheduleHandoffEnd(ctx, { callId, controlUrl }), true);
  assert.equal(await scheduleHandoffEnd(ctx, { callId, controlUrl }), true);
  assert.deepEqual(jobs, [{ ms: HANDOFF_END_GRACE_MS, args: { callId, controlUrl } }]);
  assert.equal(HANDOFF_END_GRACE_MS, 15_000);
  assert.ok(!JSON.stringify(row).includes(controlUrl), "Never store the capability in public call history");
  row.status = "ended";
  assert.equal(await scheduleHandoffEnd(ctx, { callId, controlUrl }), false);
  assert.equal(jobs.length, 1);
});

test("active successful handoff sends exactly the documented end-call command", async () => {
  let requests = 0;
  const result = await endHandoffCall({ callId, controlUrl }, {
    getState: async () => ({ status: "in-progress", handoffEndScheduledAt: 1 }), publicKey: "mock-public-key",
    fetcher: async (url, init) => {
      requests++;
      assert.equal(url, controlUrl);
      assert.equal(init?.method, "POST");
      assert.equal(init?.redirect, "error");
      assert.equal((init?.headers as Record<string, string>).Authorization, "Bearer mock-public-key");
      assert.deepEqual(JSON.parse(String(init?.body)), { type: "end-call" });
      return new Response('{"status":"ok"}');
    },
  });
  assert.deepEqual(result, { status: "accepted", httpStatus: 200 });
  assert.equal(requests, 1);
});

test("fallback cannot end already-ended calls or calls without successful scheduled handoff", async () => {
  for (const state of [null, { status: "ended", handoffEndScheduledAt: 1 }, { status: "in-progress" }]) {
    const result = await endHandoffCall({ callId, controlUrl }, { getState: async () => state,
      fetcher: async () => { throw Error("Must not send control"); } });
    assert.equal(result.status, "skipped");
  }
});

test("control rejection or timeout is reported safely without retrying or claiming a disconnect", async () => {
  for (const fail of [false, true]) {
    let attempts = 0;
    const result = await endHandoffCall({ callId, controlUrl }, {
      getState: async () => ({ status: "in-progress", handoffEndScheduledAt: 1 }),
      fetcher: async () => { attempts++; if (fail) throw Error(`Timeout ${controlUrl}`); return new Response("private provider body", { status: 503 }); },
    });
    assert.equal(result.status, "failed");
    assert.equal(attempts, 1);
    assert.ok(!JSON.stringify(result).includes(controlUrl));
  }
});
