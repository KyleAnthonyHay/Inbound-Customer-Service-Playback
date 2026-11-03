import { test } from "node:test";
import assert from "node:assert/strict";
import { SCENARIOS } from "../src/lib/callMetrics";
import { calculateEvaluationRun, type EvaluationCall } from "../src/lib/evaluationRun";
import { capture } from "../convex/evaluationRuns";
import type { MutationCtx } from "../convex/_generated/server";

const fixtures = (): EvaluationCall[] => SCENARIOS.map((s, i) => ({
  callId: `manual-${i}`, scenarioId: s.id, channel: "browser", status: "ended", startedAt: i + 1, endedAt: i + 2,
  reviewSource: "native-post-call",
  review: { primaryIntent: i === 5 ? "routing" : s.intent, secondaryIntents: i === 5 ? ["compatibility"] : [], resolution: s.target === "agent" ? "resolved" : "unresolved", escalation: s.target === "agent" ? "none" : "callback", evidence: "Fictional caller result and verified demo action." },
}));

test("fixed cohort calculates intent, containment and overall/conditional resolution with explicit denominators", () => {
  const r = calculateEvaluationRun(fixtures().reverse());
  assert.deepEqual(r.metrics.intentAccuracy, { numerator: 10, denominator: 10, percent: 100 });
  assert.deepEqual(r.metrics.primaryOnlyIntentAccuracy, { numerator: 9, denominator: 10, percent: 90 });
  assert.deepEqual(r.metrics.containment, { numerator: 7, denominator: 10, percent: 70 });
  assert.deepEqual(r.metrics.resolution, { numerator: 7, denominator: 10, percent: 70 });
  assert.deepEqual(r.metrics.resolutionAmongNoEscalation, { numerator: 7, denominator: 7, percent: 100 });
  assert.equal(r.counts.callbacks, 3);
  assert.deepEqual(r.calls.map(c => c.scenarioId), SCENARIOS.map(s => s.id));
  assert.equal(r.calls[5].review.primaryIntent, "routing", "do not rewrite the blind prediction to fit its expected label");
});

test("unknown/abandoned outcomes do not become successful containment and conditional resolution is not forced to 100", () => {
  const rows = fixtures();
  rows[5].review = { ...rows[5].review!, resolution: "unknown", escalation: "none" };
  const r = calculateEvaluationRun(rows);
  assert.equal(r.counts.unknownResolution, 1);
  assert.equal(r.counts.contained, 7);
  assert.equal(r.counts.noHumanEscalation, 8);
  assert.deepEqual(r.metrics.resolutionAmongNoEscalation, { numerator: 7, denominator: 8, percent: 87.5 });
  for (const row of rows) row.review = { ...row.review!, resolution: "unresolved", escalation: "callback" };
  assert.deepEqual(calculateEvaluationRun(rows).metrics.resolutionAmongNoEscalation, { numerator: 0, denominator: 0, percent: null });
});

test("a resolved but escalated call increases overall resolution without becoming containment", () => {
  const rows = fixtures();
  rows[5].review = { ...rows[5].review!, resolution: "resolved", escalation: "callback" };
  const r = calculateEvaluationRun(rows);
  assert.deepEqual(r.metrics.resolution, { numerator: 8, denominator: 10, percent: 80 });
  assert.deepEqual(r.metrics.containment, { numerator: 7, denominator: 10, percent: 70 });
  assert.deepEqual(r.metrics.resolutionAmongNoEscalation, { numerator: 7, denominator: 7, percent: 100 });
});

test("fixed voice cohort rejects duplicate/missing scenarios, incomplete reviews, active calls and text/harness substitution", () => {
  assert.throws(() => calculateEvaluationRun(fixtures().slice(1)), /exactly one/);
  const duplicate = fixtures(); duplicate[1] = { ...duplicate[0] };
  assert.throws(() => calculateEvaluationRun(duplicate), /Duplicate call/);
  for (const patch of [{ scenarioId: "not-a-scenario" }, { scenarioId: SCENARIOS[1].id }, { review: undefined }, { status: "in-progress" }, { channel: "harness" }, { callId: "text-poc-fixture" }]) {
    const rows = fixtures(); Object.assign(rows[0], patch);
    assert.throws(() => calculateEvaluationRun(rows));
  }
});

test("development snapshot is immutable/idempotent and writes no call or transcript history", async () => {
  const previous = process.env.CONVEX_SITE_URL;
  const rows = fixtures(); let prior: Record<string, unknown> | null = null, inserts = 0;
  const ctx = { db: {
    query: (table: string) => ({ withIndex: (_name: string, filter: (q: unknown) => unknown) => {
      let value: string;
      filter({ eq: (_field: string, v: string) => { value = v; return {}; } });
      return { unique: async () => table === "evaluationRuns" ? prior : rows.find(r => r.callId === value) ?? null };
    } }),
    insert: async (table: string, record: Record<string, unknown>) => { assert.equal(table, "evaluationRuns"); prior = { ...record, _id: "snapshot" }; inserts++; return "snapshot"; },
  } } as unknown as MutationCtx;
  const run = (capture as unknown as { _handler: (ctx: MutationCtx, args: { key: string; label: string; callIds: string[]; selectionCutoffAt: number; note: string }) => Promise<{ id: string; created: boolean }> })._handler;
  const args = { key: "initial-ten", label: "Initial manual cohort", callIds: rows.map(r => r.callId), selectionCutoffAt: 100, note: "Preserve original calls." };
  try {
    process.env.CONVEX_SITE_URL = "https://production.example";
    await assert.rejects(() => run(ctx, args), /development-only/);
    assert.equal(inserts, 0);
    process.env.CONVEX_SITE_URL = "https://ceaseless-rhinoceros-106.convex.site";
    await assert.rejects(() => run(ctx, { ...args, selectionCutoffAt: 1 }), /selection cutoff/);
    assert.equal(inserts, 0);
    assert.deepEqual(await run(ctx, args), { id: "snapshot", created: true });
    assert.deepEqual(await run(ctx, args), { id: "snapshot", created: false });
    assert.equal(inserts, 1);
    await assert.rejects(() => run(ctx, { ...args, callIds: [...args.callIds.slice(1), "other-call"] }), /different cohort/);
  } finally { if (previous === undefined) delete process.env.CONVEX_SITE_URL; else process.env.CONVEX_SITE_URL = previous; }
});
