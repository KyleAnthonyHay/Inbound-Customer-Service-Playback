import { test } from "node:test";
import assert from "node:assert/strict";
import { SCENARIOS } from "../src/lib/callMetrics";
import type { EvaluationCall } from "../src/lib/evaluationRun";
import { DEMO_SET_KEY, INITIAL_DEMO_SNAPSHOT, demoPanelData, replaceDemoEntry, validateDemoEntries } from "../src/lib/demoCalls";
import { initialize, replace, remove, get, candidates } from "../convex/demoCalls";
import type { MutationCtx } from "../convex/_generated/server";

const fixtures = (): EvaluationCall[] => SCENARIOS.map((s, i) => ({
  callId: `voice-${i}`, scenarioId: s.id, channel: "browser", status: "ended", startedAt: i + 1,
  review: { primaryIntent: i === 5 ? "routing" : s.intent, secondaryIntents: i === 5 ? ["compatibility"] : [], resolution: s.target === "agent" ? "resolved" : "unresolved", escalation: s.target === "agent" ? "none" : "callback", evidence: "Role-play result." },
}));
const entries = (calls: EvaluationCall[]) => calls.map(c => ({ scenarioId: c.scenarioId!, callId: c.callId }));

test("demo metrics use only the selected cohort and recalculate after removal and replacement", () => {
  const calls = fixtures();
  const selected = entries(calls);
  const before = structuredClone(calls);
  const outside = { ...calls[0], callId: "outside", review: { ...calls[0].review!, resolution: "unresolved" as const } };
  const initial = demoPanelData(selected, [...calls, outside]);
  assert.deepEqual(initial.metrics.intentAccuracy, { numerator: 10, denominator: 10, percent: 100 });
  assert.deepEqual(initial.metrics.containment, { numerator: 7, denominator: 10, percent: 70 });
  assert.deepEqual(initial.metrics.resolution, { numerator: 7, denominator: 10, percent: 70 });
  const removed = demoPanelData(selected.filter(e => e.scenarioId !== SCENARIOS[5].id), calls);
  assert.equal(removed.counts.selected, 9);
  assert.equal(removed.metrics.containment.numerator, 7);
  assert.equal(removed.metrics.containment.denominator, 9);
  assert.equal(removed.slots[5].state, "empty");
  const changed = demoPanelData(replaceDemoEntry(selected, SCENARIOS[0].id, outside), [...calls, outside]);
  assert.equal(changed.metrics.containment.percent, 60);
  assert.equal(changed.metrics.resolution.percent, 60);
  assert.equal(changed.metrics.intentAccuracy.percent, 100);
  assert.deepEqual(calls, before, "selection never rewrites source reviews");
});

test("missing, relabeled and pending sources are explicit exclusions; unknown outcomes stay in denominator", () => {
  const calls = fixtures();
  const selected = entries(calls);
  calls.splice(0, 1);
  calls[0].scenarioId = SCENARIOS[2].id;
  calls[1].review = undefined;
  calls[2].review = { ...calls[2].review!, resolution: "unknown", escalation: "none" };
  const result = demoPanelData(selected, calls);
  assert.equal(result.counts.selected, 10);
  assert.equal(result.counts.reviewed, 7);
  assert.equal(result.counts.missing, 1);
  assert.equal(result.counts.labelMismatch, 1);
  assert.equal(result.counts.unreviewed, 1);
  assert.equal(result.counts.unknownResolution, 1);
  assert.equal(result.metrics.resolution.denominator, 7);
  assert.equal(result.metrics.resolution.numerator, 3);
  assert.deepEqual(demoPanelData([], calls).metrics.containment, { numerator: 0, denominator: 0, percent: null });
});

test("selection accepts failed outcomes but rejects duplicate slots, wrong labels and non-voice/incomplete calls", () => {
  const calls = fixtures(); const selected = entries(calls);
  for (const patch of [{ scenarioId: SCENARIOS[1].id }, { channel: "harness" }, { callId: "text-poc-fixture" }, { status: "in-progress" }, { review: undefined }]) {
    assert.throws(() => replaceDemoEntry(selected, SCENARIOS[0].id, { ...calls[0], ...patch }));
  }
  assert.throws(() => validateDemoEntries([...selected, selected[0]]));
  assert.throws(() => validateDemoEntries([{ ...selected[0] }, { ...selected[1], callId: selected[0].callId }]));
  assert.throws(() => replaceDemoEntry(selected, "unknown", calls[0]));
  assert.equal(replaceDemoEntry([], SCENARIOS[5].id, calls[5]).length, 1);
});

// Exercise registered functions with a recording DB: mutations may only touch membership.
test("development membership mutations preserve calls and immutable snapshot; initialization never resets edits", async () => {
  const previous = process.env.CONVEX_SITE_URL;
  const calls = fixtures(); const sourceBefore = structuredClone(calls);
  const snapshot = { key: INITIAL_DEMO_SNAPSHOT, calls: entries(calls) };
  const snapshotBefore = structuredClone(snapshot);
  let set: { _id: string; key: string; entries: ReturnType<typeof entries> } | null = null;
  let writes = 0;
  const ctx = { db: {
    query: (table: string) => ({ withIndex: (_index: string, filter: (q: unknown) => unknown) => {
      let value: string;
      filter({ eq: (_field: string, v: string) => { value = v; return {}; } });
      const lookup = () => table === "demoCallSets" ? set : table === "evaluationRuns" ? snapshot : calls.find(c => c.callId === value) ?? null;
      return { unique: async () => lookup(), order: () => ({ take: async () => calls.filter(c => c.scenarioId === value) }) };
    } }),
    insert: async (table: string, value: object) => { assert.equal(table, "demoCallSets"); set = { ...value, _id: "membership" } as typeof set; writes++; return "membership"; },
    patch: async (id: string, patch: object) => { assert.equal(id, "membership"); Object.assign(set!, patch); writes++; },
  } } as unknown as MutationCtx;
  // Convex's _handler is exposed by its registration wrapper for local unit checks.
  const handler = <A, R>(fn: unknown) => (fn as { _handler: (ctx: MutationCtx, args: A) => Promise<R> })._handler;
  const init = handler<Record<string, never>, { created: boolean; selected: number }>(initialize);
  const removeCall = handler<{ scenarioId: string }, null>(remove);
  const replaceCall = handler<{ scenarioId: string; callId: string }, null>(replace);
  const read = handler<Record<string, never>, ReturnType<typeof demoPanelData> | null>(get);
  const choices = handler<{ scenarioId: string }, Array<{ callId: string }>>(candidates);
  try {
    process.env.CONVEX_SITE_URL = "https://production.example";
    await assert.rejects(() => init(ctx, {}), /development only/);
    await assert.rejects(() => removeCall(ctx, { scenarioId: SCENARIOS[0].id }), /development only/);
    await assert.rejects(() => replaceCall(ctx, { scenarioId: SCENARIOS[0].id, callId: calls[0].callId }), /development only/);
    assert.equal(await read(ctx, {}), null);
    assert.deepEqual(await choices(ctx, { scenarioId: SCENARIOS[0].id }), []);
    assert.equal(writes, 0);
    process.env.CONVEX_SITE_URL = "https://ceaseless-rhinoceros-106.convex.site";
    assert.deepEqual(await init(ctx, {}), { created: true, selected: 10 });
    assert.equal(set!.key, DEMO_SET_KEY);
    await removeCall(ctx, { scenarioId: SCENARIOS[5].id });
    assert.deepEqual(await init(ctx, {}), { created: false, selected: 9 });
    assert.equal((await read(ctx, {}))!.counts.selected, 9);
    assert.deepEqual(await choices(ctx, { scenarioId: SCENARIOS[5].id }), [{ callId: calls[5].callId, startedAt: calls[5].startedAt, channel: "browser" }]);
    await replaceCall(ctx, { scenarioId: SCENARIOS[5].id, callId: calls[5].callId });
    assert.equal((await read(ctx, {}))!.metrics.containment.percent, 70);
    assert.deepEqual(await choices(ctx, { scenarioId: SCENARIOS[5].id }), []);
    await assert.rejects(() => replaceCall(ctx, { scenarioId: SCENARIOS[0].id, callId: calls[5].callId }), /labeled with this scenario/);
    assert.equal(writes, 3);
    assert.deepEqual(calls, sourceBefore);
    assert.deepEqual(snapshot, snapshotBefore);
  } finally { if (previous === undefined) delete process.env.CONVEX_SITE_URL; else process.env.CONVEX_SITE_URL = previous; }
});
