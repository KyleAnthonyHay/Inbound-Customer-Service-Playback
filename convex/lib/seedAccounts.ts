import type { MutationCtx } from "../_generated/server";
import { customers, organizations, orgSongs } from "../../src/lib/demo/accounts";

/** Rename the primary fictional customer in place; historical call/booking records stay intact. */
export async function renamePrimaryDemoCustomer(ctx: Pick<MutationCtx, "db">) {
  const current = await ctx.db.query("customers").withIndex("by_customerId", q => q.eq("customerId", "111")).unique();
  const legacy = await ctx.db.query("customers").withIndex("by_customerId", q => q.eq("customerId", "DEMO-1001")).unique();
  if (current && legacy) throw new Error("Both customer IDs exist; refusing to merge or delete customer records.");
  const row = current ?? legacy;
  if (!row) return { found: false, updated: false };
  const expectedIdentity = current
    ? row.name === "John Doe" && row.email === "john.doe@example.org"
    : row.name === "Jordan Avery" && row.email === "jordan.avery@example.org";
  if (row.orgId !== "480113" || !expectedIdentity)
    throw new Error("Primary demo customer does not match the expected organization/identity.");
  const identity = { customerId: "111", name: "John Doe", email: "john.doe@example.org" };
  const updated = row.customerId !== identity.customerId || row.name !== identity.name || row.email !== identity.email;
  if (updated) await ctx.db.patch(row._id, identity);
  return { found: true, updated };
}

/** Add/update only known fictional accounts. Preserve IDs, bookings and history. */
export async function upsertDemoAccounts(ctx: Pick<MutationCtx, "db">) {
  // Adopt the existing legacy row before upserting the new key, preventing a duplicate admin.
  await renamePrimaryDemoCustomer(ctx);
  let created = 0;
  let updated = 0;
  for (const org of organizations) {
    const row = await ctx.db.query("organizations").withIndex("by_orgId", q => q.eq("orgId", org.orgId)).unique();
    if (row) { await ctx.db.replace(row._id, org); updated++; }
    else { await ctx.db.insert("organizations", org); created++; }
  }
  for (const customer of customers) {
    const row = await ctx.db.query("customers").withIndex("by_customerId", q => q.eq("customerId", customer.customerId)).unique();
    if (row) { await ctx.db.replace(row._id, customer); updated++; }
    else { await ctx.db.insert("customers", customer); created++; }
  }
  for (const song of orgSongs) {
    const library = await ctx.db.query("orgSongs").withIndex("by_orgId", q => q.eq("orgId", song.orgId)).take(201);
    if (library.length > 200) throw new Error("Demo library exceeds the bounded account migration limit.");
    const row = library.find(s => s.title === song.title && s.kind === song.kind);
    if (row) { await ctx.db.replace(row._id, song); updated++; }
    else { await ctx.db.insert("orgSongs", song); created++; }
  }
  return { created, updated, organizations: organizations.length, customers: customers.length, songs: orgSongs.length };
}
