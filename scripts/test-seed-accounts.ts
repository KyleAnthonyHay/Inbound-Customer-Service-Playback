import { test } from "node:test";
import assert from "node:assert/strict";
import { upsertDemoAccounts } from "../convex/lib/seedAccounts";
import type { MutationCtx } from "../convex/_generated/server";

type Row = Record<string, unknown> & { _id: string; _creationTime: number };

test("account upgrade is repeatable, preserves fixture IDs and leaves bookings/history/unrelated data intact", async () => {
  const data: Record<string, Row[]> = {
    customers: [{ _id: "customer-old", _creationTime: 1, customerId: "DEMO-1001", name: "Earlier fixture", obsolete: true },
      { _id: "unrelated", _creationTime: 2, customerId: "CUSTOM-KEEP", name: "Keep this row" }],
    organizations: [], orgSongs: [],
    calls: [{ _id: "call-keep", _creationTime: 1, status: "ended" }],
    callbacks: [{ _id: "booking-keep", _creationTime: 1, slotId: "slot-keep", status: "confirmed" }],
    callbackSlots: [{ _id: "slot-keep", _creationTime: 1, reserved: true }],
    teams: [{ _id: "team-keep", _creationTime: 1, status: "busy" }],
  };
  const protectedBefore = JSON.stringify([data.calls, data.callbacks, data.callbackSlots, data.teams, data.customers[1]]);
  let nextId = 1;
  const writes: string[] = [];
  const db = {
    query(table: string) {
      assert.ok(["organizations", "customers", "orgSongs"].includes(table), "migration must not even inspect protected tables");
      return { withIndex(_index: string, select: (q: { eq: (key: string, value: unknown) => unknown }) => unknown) {
        let key = "", value: unknown;
        select({ eq(k, v) { key = k; value = v; return null; } });
        const rows = () => data[table].filter(row => row[key] === value);
        return { async unique() { const matches = rows(); assert.ok(matches.length <= 1); return matches[0] ?? null; }, async take(n: number) { return rows().slice(0, n); } };
      } };
    },
    async replace(id: string, value: Record<string, unknown>) {
      const table = Object.keys(data).find(t => data[t].some(row => row._id === id))!;
      writes.push(table);
      const i = data[table].findIndex(row => row._id === id);
      data[table][i] = { ...value, _id: id, _creationTime: data[table][i]._creationTime };
    },
    async insert(table: string, value: Record<string, unknown>) {
      writes.push(table);
      data[table].push({ ...value, _id: `${table}-${nextId++}`, _creationTime: nextId });
    },
  };
  const ctx = { db } as unknown as Pick<MutationCtx, "db">;
  const first = await upsertDemoAccounts(ctx);
  assert.equal(first.created, 34);
  assert.equal(first.updated, 1);
  assert.equal(data.customers.find(c => c.customerId === "DEMO-1001")!._id, "customer-old");
  assert.equal(data.customers.find(c => c.customerId === "DEMO-1001")!.obsolete, undefined);
  const afterFirst = JSON.stringify(data);
  const second = await upsertDemoAccounts(ctx);
  assert.equal(second.created, 0);
  assert.equal(JSON.stringify(data), afterFirst, "rerun must not duplicate or re-ID rows");
  assert.ok(writes.every(t => ["customers", "organizations", "orgSongs"].includes(t)));
  assert.equal(JSON.stringify([data.calls, data.callbacks, data.callbackSlots, data.teams, data.customers.find(c => c.customerId === "CUSTOM-KEEP")]), protectedBefore);
});
