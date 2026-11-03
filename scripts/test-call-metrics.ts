import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CALL_REVIEW, matchesScenarioIntent, measureCall, outcome, parseReview, reviewFromOutputs, SCENARIOS, type ArtifactMessage } from "../src/lib/callMetrics";
import { capture, overview, queueAnalytics, save } from "../convex/callAnalytics";
import type { MutationCtx, ActionCtx, QueryCtx } from "../convex/_generated/server";
import { textAssistant } from "./lib/text-agent";

const base = Date.parse("2026-11-03T12:00:00Z");
const line = (role: string, seconds: number, duration = 1): ArtifactMessage => ({ role, message: "spoken words", time: base + seconds * 1000, endTime: base + (seconds + duration) * 1000 });
const review = { primaryIntent: "song-loading" as const, secondaryIntents: ["service-plan" as const], resolution: "resolved" as const, escalation: "none" as const, evidence: "Caller confirms song opened after retries, then accepts the returned setlist." };

test("messages exclude system/tool data, count internal delegations separately and deduplicate tool IDs", () => {
  const messages: ArtifactMessage[] = [line("system", 0), line("bot", 1), line("user", 4), { role: "tool_calls", toolCalls: [{ id: "d1", function: { name: "delegate" } }, { id: "t1", function: { name: "search_playback_docs" } }] },
    { role: "tool_calls", toolCalls: [{ id: "t1", function: { name: "search_playback_docs" } }] }, { role: "tool", result: "secret-shaped non-dialogue" }, line("bot", 7)];
  const m = measureCall({ startedAt: new Date(base).toISOString(), artifact: { messages } });
  assert.equal(m.messageCount, 3); assert.equal(m.userMessageCount, 1); assert.equal(m.assistantMessageCount, 2);
  assert.equal(m.toolCallCount, 1); assert.equal(m.delegationCount, 1);
  assert.equal(m.greetingDelayEstimateMs, 1000); assert.equal(m.firstResponseEstimateMs, 2000);
});

test("latency spans caller speech end to the first assistant fragment, including intervening tool work", () => {
  const m = measureCall({ startedAt: new Date(base).toISOString(), artifact: { messages: [line("bot", 1), line("user", 4), line("user", 5),
    { role: "tool", time: base + 8000 }, line("bot", 10), line("bot", 11), line("user", 14), line("bot", 17)] } });
  assert.equal(m.responseSamples, 2); assert.equal(m.responseTimeAverageMs, 3000); assert.equal(m.responseTimeTotalMs, 6000);
  assert.equal(m.responseTimeP50Ms, 2000); assert.equal(m.responseTimeP95Ms, 4000);
});

test("interruptions and missing speech-end times cannot become zero or fabricated latency samples", () => {
  const m = measureCall({ artifact: { messages: [line("user", 2, 5), line("bot", 4), { role: "user", message: "unknown time" }, line("bot", 12), line("user", 15), line("bot", 18)] } });
  assert.equal(m.responseSamples, 1); assert.equal(m.overlapCount, 1); assert.equal(m.responseTimeAverageMs, 2000);
  assert.equal(m.firstResponseEstimateMs, undefined); assert.equal(m.greetingDelayEstimateMs, undefined);
});

test("a missing greeting timestamp cannot be replaced with a later answer timestamp", () => {
  const m = measureCall({ startedAt: new Date(base).toISOString(), artifact: { messages: [{ role: "bot", message: "Hi" }, line("user", 8), line("bot", 12)] } });
  assert.equal(m.greetingDelayEstimateMs, undefined);
});

test("relative seconds are converted once, and absent metrics remain unavailable", () => {
  const m = measureCall({ startedAt: new Date(base).toISOString(), endedAt: new Date(base + 10000).toISOString(), cost: .03, usageComplete: false,
    artifact: { messages: [{ role: "bot", message: "Hello", secondsFromStart: 1.25 }] } });
  assert.equal(m.greetingDelayEstimateMs, 1250); assert.equal(m.durationSeconds, 10); assert.equal(m.costUsd, .03); assert.equal(m.usageComplete, false);
  assert.equal(m.responseTimeAverageMs, undefined); assert.equal(m.responseSamples, 0);
  const missing = measureCall({}); assert.equal(missing.costUsd, undefined); assert.equal(missing.greetingDelayEstimateMs, undefined);
  assert.equal("timeToFirstTokenMs" in m, false); assert.equal("answerToFirstAudioMs" in m, false);
});

test("structured results require the versioned output name and valid enum fields", () => {
  assert.deepEqual(reviewFromOutputs({ id: { name: CALL_REVIEW.name, result: review } }), review);
  assert.equal(reviewFromOutputs({ id: { name: "unrelated", result: review } }), null);
  assert.equal(parseReview({ ...review, primaryIntent: "made-up" }), null);
  assert.equal(parseReview({ ...review, resolution: true }), null);
  assert.equal(parseReview({ ...review, secondaryIntents: ["bad"] }), null);
  assert.deepEqual(parseReview({ ...review, secondaryIntents: ["song-loading", "service-plan", "service-plan"] })?.secondaryIntents, ["service-plan"]);
});

test("a successful escalation is not automatically a resolution or containment", () => {
  assert.deepEqual(outcome(review), { resolved: true, contained: true });
  assert.deepEqual(outcome({ ...review, resolution: "unresolved", escalation: "callback" }), { resolved: false, contained: false });
  assert.deepEqual(outcome({ ...review, resolution: "unknown", escalation: "handoff" }), { resolved: null, contained: false });
  assert.deepEqual(outcome({ ...review, resolution: "unknown" }), { resolved: null, contained: null });
  assert.deepEqual(outcome({ ...review, escalation: "requested" }), { resolved: true, contained: false });
});

test("the user's ten labels match the existing private cases, with seven agent and three specialist targets", () => {
  const catalog = JSON.parse(readFileSync("scripts/text-cases/curated.json", "utf8"));
  assert.deepEqual(SCENARIOS.map(s => [s.id, s.intent]), catalog.cases.map((s: { id: string; intent: string }) => [s.id, s.intent]));
  assert.equal(SCENARIOS.filter(s => s.target === "agent").length, 7);
  assert.equal(SCENARIOS.filter(s => s.target === "specialist").length, 3);
  assert.equal(SCENARIOS[8].intent, "song-loading");
});

test("private expected labels do not leak into the existing text reasoner harness", () => {
  const a = textAssistant({ CONVEX_DEPLOYMENT: "dev:ceaseless-rhinoceros-106", NEXT_PUBLIC_CONVEX_SITE_URL: "https://ceaseless-rhinoceros-106.convex.site", VAPI_PRIVATE_KEY: "fake", VAPI_TOOL_SECRET: "fake" }, "text-poc-metrics-check");
  const serialized = JSON.stringify(a);
  for (const s of SCENARIOS) assert.equal(serialized.includes(s.id), false);
  assert.equal(serialized.includes(CALL_REVIEW.name), false);
});

test("completion queues analytics once, excluding production, text fixtures and unknown IDs", async () => {
  const old = process.env.CONVEX_SITE_URL;
  let queuedAt: number | undefined;
  let scheduled = 0;
  const ctx = { db: { query: () => ({ withIndex: () => ({ unique: async () => ({ _id: "row", analyticsQueuedAt: queuedAt }) }) }), patch: async (_id: unknown, patch: { analyticsQueuedAt: number }) => { queuedAt = patch.analyticsQueuedAt; } },
    scheduler: { runAfter: async () => { scheduled++; } } } as unknown as MutationCtx;
  try {
    process.env.CONVEX_SITE_URL = "https://ceaseless-rhinoceros-106.convex.site";
    const id = "11111111-1111-4111-8111-111111111111";
    await queueAnalytics(ctx, "unknown"); await queueAnalytics(ctx, "text-poc-fixture"); assert.equal(scheduled, 0);
    await queueAnalytics(ctx, id); await queueAnalytics(ctx, id); assert.equal(scheduled, 1);
    process.env.CONVEX_SITE_URL = "https://production.example"; queuedAt = undefined;
    await queueAnalytics(ctx, id); assert.equal(scheduled, 1);
  } finally { if (old === undefined) delete process.env.CONVEX_SITE_URL; else process.env.CONVEX_SITE_URL = old; }
});

test("capture reads only an existing dev artifact and projects no assistant snapshot or credentials", async () => {
  const old = { site: process.env.CONVEX_SITE_URL, key: process.env.VAPI_PRIVATE_KEY, assistant: process.env.DEV_VAPI_ASSISTANT_ID, fetch: globalThis.fetch };
  const saved: unknown[] = [], scheduled: unknown[] = [], urls: string[] = [];
  const id = "11111111-1111-4111-8111-111111111111";
  const ctx = { runQuery: async () => ({ status: "ended" }), runMutation: async (_ref: unknown, args: unknown) => saved.push(args), scheduler: { runAfter: async (...args: unknown[]) => scheduled.push(args) } } as unknown as ActionCtx;
  try {
    process.env.CONVEX_SITE_URL = "https://ceaseless-rhinoceros-106.convex.site";
    process.env.VAPI_PRIVATE_KEY = "fixture-private-key"; process.env.DEV_VAPI_ASSISTANT_ID = "dev-agent";
    globalThis.fetch = async url => { urls.push(String(url)); return new Response(JSON.stringify({ assistantId: "dev-agent", status: "ended", assistant: { server: { headers: { secret: "fixture-webhook-secret" } } }, artifact: { messages: [line("user", 1), line("bot", 3)], structuredOutputs: { output: { name: CALL_REVIEW.name, result: review } } } })); };
    const run = (capture as unknown as { _handler: (ctx: ActionCtx, args: { callId: string; attempt: number }) => Promise<null> })._handler;
    await run(ctx, { callId: id, attempt: 0 });
    assert.deepEqual(urls, [`https://api.vapi.ai/call/${id}`]); assert.equal(scheduled.length, 0);
    assert.equal(JSON.stringify(saved).includes("fixture-webhook-secret"), false); assert.equal(JSON.stringify(saved).includes("fixture-private-key"), false);
    assert.equal((saved[0] as { review: { primaryIntent: string } }).review.primaryIntent, "song-loading");
    globalThis.fetch = async () => new Response(JSON.stringify({ assistantId: "other-agent", status: "ended", artifact: { messages: [line("bot", 1)] } }));
    await run(ctx, { callId: id, attempt: 4 });
    assert.deepEqual(saved[1], { callId: id, final: true, error: "Call does not belong to the development assistant" });
    assert.equal(scheduled.length, 0);
  } finally {
    globalThis.fetch = old.fetch;
    for (const [key, value] of [["CONVEX_SITE_URL", old.site], ["VAPI_PRIVATE_KEY", old.key], ["DEV_VAPI_ASSISTANT_ID", old.assistant]]) if (value === undefined) delete process.env[key!]; else process.env[key!] = value;
  }
});

test("repeat post-call saves do not inflate tool counts and successful simulated escalation blocks containment", async () => {
  const row = { _id: "row", review: undefined, measurements: undefined } as Record<string, unknown>;
  const event = { _id: "e1", kind: "tool-end", toolCallId: "t1", tool: "reserve_callback", status: "succeeded", durationMs: 200, output: JSON.stringify({ ok: true, bookingId: "demo-booking", source: "simulated" }) };
  const ctx = { db: {
    query: (table: string) => ({ withIndex: () => table === "calls" ? { unique: async () => row } : {
      take: async () => [event, { ...event, _id: "retry" }, { _id: "e2", kind: "tool-end", toolCallId: "t2", status: "failed", durationMs: 400 }],
    } }),
    patch: async (_id: string, patch: object) => Object.assign(row, patch),
  } } as unknown as MutationCtx;
  const run = (save as unknown as { _handler: (ctx: MutationCtx, args: unknown) => Promise<null> })._handler;
  const args = { callId: "fixture", review, measurements: measureCall({ artifact: { messages: [line("bot", 1)] } }), final: true };
  await run(ctx, args); await run(ctx, args);
  assert.equal(row.toolFailureCount, 1); assert.equal(row.toolLatencySamples, 2); assert.equal(row.toolLatencyAverageMs, 300);
  assert.equal(row.analyticsState, "complete");
  assert.equal((row.review as typeof review).escalation, "callback"); assert.equal(outcome(row.review as typeof review).contained, false);
});

test("quality denominators include unknown reviewed outcomes, exclude pending and unlabeled intent, and exclude archived calls", async () => {
  const rows = [
    { status: "ended", channel: "phone", scenarioId: "09-loading-recovery", review },
    { status: "ended", channel: "phone", scenarioId: "09-loading-recovery", review: { ...review, primaryIntent: "routing", resolution: "unresolved" }, archivedAt: 100 },
    { status: "ended", channel: "browser", review: { ...review, resolution: "unknown" } },
    { status: "ended", channel: "browser", analyticsState: "pending" },
    { status: "in-progress", channel: "phone" },
  ];
  const ctx = { db: { query: () => ({ withIndex: (name: string) => { assert.equal(name, "by_archivedAt_startedAt"); return { order: () => ({ take: async (n: number) => { assert.equal(n, 200); return rows.filter(r => r.archivedAt === undefined); } }) }; } }) } } as unknown as QueryCtx;
  const result = await (overview as unknown as { _handler: (ctx: QueryCtx, args: Record<string, never>) => Promise<Record<string, unknown>> })._handler(ctx, {});
  assert.equal(result.window, 4); assert.equal(result.completed, 3); assert.equal(result.evaluated, 2); assert.equal(result.labeled, 1); assert.equal(result.correct, 1);
  assert.equal(result.contained, 1); assert.equal(result.resolved, 1); assert.equal(result.unknownResolution, 1);
});

test("mixed compatibility/routing expectations accept both supported orderings without accepting missing goals or unrelated primaries", async () => {
  const compatibilityReview = { ...review, primaryIntent: "compatibility" as const, secondaryIntents: ["routing" as const], resolution: "unresolved" as const, escalation: "requested" as const,
    evidence: "Caller asks whether equipment supports the setup and separates music from click/guide; exact compatibility remains unverified." };
  // A scenario is evaluator ground truth, not a runtime intent or classifier input.
  assert.equal(parseReview({ ...compatibilityReview, primaryIntent: "borrowed-mixer" }), null);
  assert.equal(parseReview({ ...compatibilityReview, secondaryIntents: ["borrowed-mixer"] }), null);
  assert.deepEqual(parseReview(compatibilityReview), compatibilityReview);
  const rows = [
    { status: "ended", scenarioId: "06-borrowed-mixer", review: compatibilityReview },
    { status: "ended", scenarioId: "06-borrowed-mixer", review: { ...compatibilityReview, secondaryIntents: [] } },
    { status: "ended", scenarioId: "06-borrowed-mixer", review: { ...compatibilityReview, primaryIntent: "routing", secondaryIntents: ["compatibility"] } },
    { status: "ended", scenarioId: "06-borrowed-mixer", review: { ...compatibilityReview, primaryIntent: "account-access", secondaryIntents: ["compatibility", "routing"] } },
    { status: "ended", scenarioId: "06-borrowed-mixer", review: { ...compatibilityReview, primaryIntent: "unknown" } },
    { status: "ended", scenarioId: "06-borrowed-mixer", review: { ...compatibilityReview, primaryIntent: "routing", secondaryIntents: [] } },
    { status: "ended", scenarioId: "nonexistent-scenario", review: compatibilityReview },
    { status: "ended", review: compatibilityReview },
  ];
  const run = (overview as unknown as { _handler: (ctx: QueryCtx, args: Record<string, never>) => Promise<{ labeled: number; correct: number }> })._handler;
  const ctx = (selected: typeof rows) => ({ db: { query: () => ({ withIndex: () => ({ order: () => ({ take: async () => selected }) }) }) } }) as unknown as QueryCtx;
  // Assert each labeled call individually so acceptance cannot hide a false positive.
  for (let i = 0; i < 6; i++) assert.deepEqual(await run(ctx([rows[i]]), {}).then(({ labeled, correct }) => ({ labeled, correct })), { labeled: 1, correct: i < 3 ? 1 : 0 });
  const totals = await run(ctx(rows), {});
  assert.equal(totals.labeled, 6); assert.equal(totals.correct, 3);
});

test("mixed-goal acceptance does not weaken dominant-primary expectations for other scenarios", () => {
  for (const scenario of SCENARIOS.filter(s => s.id !== "06-borrowed-mixer")) {
    assert.equal(matchesScenarioIntent(scenario, { primaryIntent: scenario.intent, secondaryIntents: [] }), true, scenario.id);
    assert.equal(matchesScenarioIntent(scenario, { primaryIntent: "unknown", secondaryIntents: [scenario.intent] }), false, scenario.id);
    assert.equal(matchesScenarioIntent(scenario, { primaryIntent: scenario.intent === "routing" ? "compatibility" : "routing", secondaryIntents: [scenario.intent] }), false, scenario.id);
  }
});
