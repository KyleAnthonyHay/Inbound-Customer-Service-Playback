import { test } from "node:test";
import assert from "node:assert/strict";
import type { MutationCtx } from "../convex/_generated/server";
import { archiveCall, archivePanelBatch, restoreCall, deleteArchivedCall, deleteCallLogBatch } from "../convex/lib/callHistory";
import { ensureCall } from "../convex/calls";

type Row = { _id: string; callId: string; startedAt: number; status: string; archivedAt?: number; transcriptCount: number };
const row = (id: string, status = "ended", startedAt = 100): Row => ({ _id: id, callId: id, startedAt, status, transcriptCount: 3 });

function deletionFixture(call: Row, transcriptCount = 3, eventCount = 2) {
  type RecordRow = { _id: string; callId: string; [key: string]: unknown };
  const tables: Record<string, RecordRow[]> = { calls: [{ ...call }, { ...row("other"), archivedAt: 20 }],
    transcripts: [...Array.from({ length: transcriptCount }, (_, i) => ({ _id: `t${i}`, callId: call.callId })), { _id: "other-t", callId: "other" }],
    callEvents: [...Array.from({ length: eventCount }, (_, i) => ({ _id: `e${i}`, callId: call.callId })), { _id: "other-e", callId: "other" }], deletedCalls: [] };
  const jobs: Array<{ callId: string }> = [];
  const ctx = { db: {
    query: (table: string) => {
      assert.ok(table in tables, "Only call history and the deletion registry may be accessed");
      return { withIndex: (_index: string, range: (q: unknown) => unknown) => {
        let id: unknown;
        range({ eq: (key: string, value: unknown) => { assert.equal(key, "callId"); id = value; } });
        const rows = () => tables[table].filter(r => r.callId === id);
        return { unique: async () => rows()[0] ?? null, take: async (n: number) => rows().slice(0, n) };
      } };
    },
    insert: async (table: string, value: { callId: string }) => { tables[table].push({ _id: `${table}-marker`, ...value }); },
    delete: async (id: string) => { for (const rows of Object.values(tables)) { const index = rows.findIndex(r => r._id === id); if (index >= 0) rows.splice(index, 1); } },
  }, scheduler: { runAfter: async (_ms: number, _ref: unknown, args: { callId: string }) => jobs.push(args) } } as unknown as MutationCtx;
  return { ctx, tables, jobs };
}

test("permanent archive deletion erases only the selected call and logs, leaving a minimal replay guard", async () => {
  const f = deletionFixture({ ...row("erase"), archivedAt: 20 });
  assert.deepEqual(await deleteArchivedCall(f.ctx, "erase"), { ok: true, removed: true });
  for (const name of ["calls", "transcripts", "callEvents"]) assert.equal(f.tables[name].every(r => r.callId === "other"), true);
  assert.equal(f.tables.deletedCalls.length, 1);
  assert.deepEqual(Object.keys(f.tables.deletedCalls[0]).sort(), ["_id", "callId", "deletedAt"]);
  assert.deepEqual(await deleteArchivedCall(f.ctx, "erase"), { ok: true, removed: false });
  await assert.rejects(() => ensureCall(f.ctx, "erase"), /permanently deleted/);
  assert.equal(f.tables.calls.some(r => r.callId === "erase"), false);
});

test("permanent deletion refuses active, ringing and unarchived calls without writing anything", async () => {
  for (const call of [row("erase", "in-progress"), { ...row("erase", "ringing"), archivedAt: 20 }, row("erase")]) {
    const f = deletionFixture(call), before = structuredClone(f.tables);
    const result = await deleteArchivedCall(f.ctx, "erase");
    assert.equal(result.ok, false); assert.equal(result.removed, false);
    assert.deepEqual(f.tables, before); assert.deepEqual(f.jobs, []);
  }
});

test("long archived histories are deleted completely in bounded batches, with unrelated rows preserved", async () => {
  const f = deletionFixture({ ...row("erase"), archivedAt: 20 }, 1200, 650);
  await deleteArchivedCall(f.ctx, "erase");
  assert.equal(f.tables.transcripts.length, 701); assert.equal(f.tables.callEvents.length, 151);
  while (f.jobs.length) await deleteCallLogBatch(f.ctx, f.jobs.shift()!.callId);
  assert.equal(f.tables.transcripts.length, 1); assert.equal(f.tables.callEvents.length, 1);
  assert.equal(f.tables.transcripts[0].callId, "other");
  const before = structuredClone(f.tables);
  await deleteCallLogBatch(f.ctx, "other"); assert.deepEqual(f.tables, before);
});
function fixture(rows: Row[]) {
  const patches: string[] = [];
  const jobs: Array<{ before: number }> = [];
  const ctx = { db: {
    query: (table: string) => {
      assert.equal(table, "calls", "archiving must not remove or rewrite transcripts/activity");
      return { withIndex: (_index: string, range: (q: unknown) => unknown) => {
        const filters: Array<(r: Row) => boolean> = [];
        const q = { eq: (key: keyof Row, value: unknown) => { filters.push(r => r[key] === value); return q; },
          lte: (key: keyof Row, value: number) => { filters.push(r => Number(r[key]) <= value); return q; } };
        range(q);
        const matches = () => rows.filter(r => filters.every(f => f(r)));
        return { unique: async () => matches()[0] ?? null, take: async (n: number) => matches().slice(0, n) };
      } };
    },
    patch: async (id: string, value: Record<string, unknown>) => {
      assert.deepEqual(Object.keys(value), ["archivedAt"]);
      patches.push(id);
      const target = rows.find(r => r._id === id)!;
      if (value.archivedAt === undefined) delete target.archivedAt;
      else Object.assign(target, value);
    },
    delete: async () => { throw Error("History must never be deleted by panel actions"); },
  }, scheduler: { runAfter: async (_ms: number, _ref: unknown, args: { before: number }) => { jobs.push(args); } } } as unknown as MutationCtx;
  return { ctx, rows, patches, jobs };
}

test("removing one panel entry retains the full call record and leaves other calls untouched", async () => {
  const f = fixture([row("first"), row("second"), row("live", "in-progress")]);
  const before = structuredClone(f.rows);
  assert.deepEqual(await archiveCall(f.ctx, "first"), { ok: true, archived: true });
  assert.equal(typeof f.rows[0].archivedAt, "number");
  assert.deepEqual(f.rows.map(r => ({ ...r, archivedAt: undefined })), before.map(r => ({ ...r, archivedAt: undefined })));
  assert.deepEqual(f.patches, ["first"]);
  assert.deepEqual(await archiveCall(f.ctx, "first"), { ok: true, archived: false });
  assert.equal(f.patches.length, 1);
});

test("active/ringing calls and missing IDs cannot be archived", async () => {
  const f = fixture([row("live", "in-progress"), row("ringing", "ringing")]);
  for (const id of ["live", "ringing"]) assert.deepEqual(await archiveCall(f.ctx, id), { ok: false, archived: false, reason: "call-in-progress" });
  assert.deepEqual(await archiveCall(f.ctx, "missing"), { ok: false, archived: false, reason: "not-found" });
  assert.equal(f.patches.length, 0);
});

test("archive then restore returns the identical original call and leaves other history intact", async () => {
  const f = fixture([row("first"), row("second")]);
  const before = structuredClone(f.rows);
  await archiveCall(f.ctx, "first");
  assert.deepEqual(await restoreCall(f.ctx, "first"), { ok: true, restored: true });
  assert.deepEqual(f.rows, before);
  assert.equal("archivedAt" in f.rows[0], false);
  assert.deepEqual(f.patches, ["first", "first"]);
});

test("restoring an already visible call is a no-op", async () => {
  const f = fixture([row("visible")]);
  assert.deepEqual(await restoreCall(f.ctx, "visible"), { ok: true, restored: false });
  assert.equal(f.patches.length, 0);
});

test("missing and live calls cannot be restored or otherwise modified", async () => {
  const f = fixture([{ ...row("live", "in-progress"), archivedAt: 10 }, { ...row("ringing", "ringing"), archivedAt: 20 }]);
  const before = structuredClone(f.rows);
  for (const id of ["live", "ringing"]) assert.deepEqual(await restoreCall(f.ctx, id), { ok: false, restored: false, reason: "call-in-progress" });
  assert.deepEqual(await restoreCall(f.ctx, "missing"), { ok: false, restored: false, reason: "not-found" });
  assert.deepEqual(f.rows, before);
  assert.equal(f.patches.length, 0);
});

test("clear-panel batches archive all finished entries and preserve live, future and previously saved calls", async () => {
  const old = { ...row("old"), archivedAt: 10 };
  const f = fixture([...Array.from({ length: 102 }, (_, i) => row(`finished-${i}`)), row("live", "in-progress"), row("future", "ended", 3000), old]);
  assert.deepEqual(await archivePanelBatch(f.ctx, 1000), { ok: true, archived: 100, continuing: true });
  assert.deepEqual(f.jobs, [{ before: 1000 }]);
  assert.deepEqual(await archivePanelBatch(f.ctx, 1000), { ok: true, archived: 2, continuing: false });
  assert.equal(f.rows.length, 105);
  assert.equal(f.rows.find(r => r.callId === "live")!.archivedAt, undefined);
  assert.equal(f.rows.find(r => r.callId === "future")!.archivedAt, undefined);
  assert.equal(old.archivedAt, 10);
  assert.equal(f.rows.every(r => r.transcriptCount === 3), true);
});
