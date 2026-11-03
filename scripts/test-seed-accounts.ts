import { test } from "node:test";
import assert from "node:assert/strict";
import { renamePrimaryDemoCustomer, upsertDemoAccounts } from "../convex/lib/seedAccounts";
import type { MutationCtx } from "../convex/_generated/server";

type Row = Record<string, unknown> & { _id: string; _creationTime: number };

test("account upgrade is repeatable, preserves fixture IDs and leaves bookings/history/unrelated data intact", async () => {
  const data: Record<string, Row[]> = {
    customers: [{ _id: "customer-old", _creationTime: 1, customerId: "DEMO-1001", name: "Jordan Avery", email: "jordan.avery@example.org", orgId: "480113", obsolete: true },
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
    async patch(id: string, value: Record<string, unknown>) {
      writes.push("customers");
      Object.assign(data.customers.find(row => row._id === id)!, value);
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
  assert.equal(data.customers.find(c => c.customerId === "111")!._id, "customer-old");
  assert.equal(data.customers.find(c => c.customerId === "111")!.obsolete, undefined);
  assert.equal(data.customers.some(c => c.customerId === "DEMO-1001"), false);
  const afterFirst = JSON.stringify(data);
  const second = await upsertDemoAccounts(ctx);
  assert.equal(second.created, 0);
  assert.equal(JSON.stringify(data), afterFirst, "rerun must not duplicate or re-ID rows");
  assert.ok(writes.every(t => ["customers", "organizations", "orgSongs"].includes(t)));
  assert.equal(JSON.stringify([data.calls, data.callbacks, data.callbackSlots, data.teams, data.customers.find(c => c.customerId === "CUSTOM-KEEP")]), protectedBefore);
});

test("primary customer rename changes only identity, preserves the row and is repeatable", async () => {
  const row = { _id: "keep-id", _creationTime: 1, customerId: "DEMO-1001", name: "Jordan Avery", email: "jordan.avery@example.org",
    orgId: "480113", organization: "Riverbend Community Church (demo)", memberships: [{ role: "Org Admin", orgId: "480113" }],
    plan: "Cloud Pro", subscriptionStatus: "active", entitlements: ["cloud-sync"], notes: "Keep existing notes" };
  const before = structuredClone(row);
  const patches: unknown[] = [];
  const ctx = { db: {
    query: (table: string) => {
      assert.equal(table, "customers", "the targeted rename must not inspect other tables");
      return { withIndex: (_index: string, select: (q: { eq: (key: string, value: string) => unknown }) => unknown) => {
        let value = "";
        select({ eq: (_key, v) => { value = v; return null; } });
        return { unique: async () => row.customerId === value ? row : null };
      } };
    },
    patch: async (id: string, value: Record<string, unknown>) => { assert.equal(id, before._id); patches.push(value); Object.assign(row, value); },
  } } as unknown as Pick<MutationCtx, "db">;
  assert.deepEqual(await renamePrimaryDemoCustomer(ctx), { found: true, updated: true });
  assert.deepEqual(row, { ...before, customerId: "111", name: "John Doe", email: "john.doe@example.org" });
  assert.deepEqual(await renamePrimaryDemoCustomer(ctx), { found: true, updated: false });
  assert.equal(patches.length, 1);
});

test("primary customer rename refuses collisions or an unexpected legacy identity", async () => {
  for (const duplicate of [false, true]) {
    const row = { orgId: "480113", name: "Unrelated person", email: "unrelated@example.org" };
    const ctx = { db: {
      query: () => ({ withIndex: (_index: string, select: (q: { eq: (key: string, value: string) => unknown }) => unknown) => {
        let value = "";
        select({ eq: (_key, v) => { value = v; return null; } });
        return { unique: async () => duplicate || value === "DEMO-1001" ? row : null };
      } }),
      patch: async () => assert.fail("Must not write on a collision or unexpected identity"),
    } } as unknown as Pick<MutationCtx, "db">;
    await assert.rejects(renamePrimaryDemoCustomer(ctx), duplicate ? /Both customer IDs/ : /expected organization\/identity/);
  }
});
