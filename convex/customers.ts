import { query, type QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import schema from "./schema";
import type { Doc } from "./_generated/dataModel";
import {
  diagnoseSubscription,
  songAccess as songAccessOf,
  type DemoOrganization,
  type DemoOrgSong,
  type Membership,
} from "../src/lib/demo/accounts";
import { accountResolutionMetadata, resolveAccountContext, type AccountLookupArgs, type PersonMatch } from "./lib/accountContext";

/**
 * Demo account lookup. This is NOT identity verification; it matches on a
 * fictional organization ID, customer ID, email or name only. Returns a
 * structured result so the agent can distinguish "found" from "not found"
 * from "ambiguous", plus a diagnosis of the subscription state with a `next`
 * hint (same convention as the callback tools).
 *
 * The organization ID (six digits, Playback Settings > About) is the primary
 * key: it is what callers can read off their screen and it is the record
 * that owns purchases and subscriptions. See src/lib/demo/accounts.ts.
 */
const lookupArgs = {
  orgId: v.optional(v.string()),
  customerId: v.optional(v.string()),
  email: v.optional(v.string()),
  name: v.optional(v.string()),
};

// Keep stored customer/organization shapes aligned with the owning schema.
const organizationFields = schema.tables.organizations.validator.fields;
const songFields = schema.tables.orgSongs.validator.fields;
const scope = v.union(v.literal("organization"), v.literal("member"));
const resolutionFields = {
  accountContext: v.object({
    scope: v.union(v.literal("organization_only"), v.literal("organization_and_member"), v.literal("unresolved")),
    identityVerified: v.literal(false),
  }),
  organizationResolution: v.object({
    status: v.union(v.literal("resolved"), v.literal("not_found"), v.literal("not_checked"), v.literal("invalid_id")),
  }),
  memberResolution: v.object({
    status: v.union(v.literal("not_checked"), v.literal("matched"), v.literal("person_not_found"), v.literal("ambiguous"), v.literal("person_found_not_member")),
    candidates: v.optional(v.array(v.string())),
  }),
  source: v.literal("simulated"),
};
const failedResult = v.object({
  ok: v.literal(false),
  reason: v.union(v.literal("not-found"), v.literal("ambiguous"), v.literal("missing-input"), v.literal("invalid-orgId"), v.literal("no-organization")),
  candidates: v.optional(v.array(v.string())),
  next: v.optional(v.string()),
  ...resolutionFields,
});
const songSummaryFields = {
  title: songFields.title, artist: songFields.artist, kind: songFields.kind,
  status: songFields.status, expiresAt: songFields.expiresAt,
};
const lookupResult = v.union(failedResult, v.object({
  ok: v.literal(true),
  ...resolutionFields,
  customer: v.optional(schema.tables.customers.validator),
  organization: v.optional(schema.tables.organizations.validator),
  membership: v.optional(schema.tables.customers.validator.fields.memberships.element),
  otherOrganizations: v.array(v.object({
    orgId: organizationFields.orgId, name: organizationFields.name,
    plan: organizationFields.plan, subscriptionStatus: organizationFields.subscriptionStatus,
  })),
  library: v.object({ count: v.number(), songs: v.array(v.object(songSummaryFields)) }),
  diagnosis: v.optional(v.object({
    code: v.union(v.literal("active"), v.literal("past-due"), v.literal("expired"), v.literal("no-subscription"), v.literal("missing-team-sharing"), v.literal("wrong-organization")),
    summary: v.string(), next: v.string(),
  })),
  diagnosisScope: v.optional(scope),
  next: v.optional(v.string()),
}));
const songAccessResult = v.union(failedResult, v.object({
  ok: v.literal(true),
  ...resolutionFields,
  accessScope: scope,
  organization: v.object({
    orgId: organizationFields.orgId, name: organizationFields.name,
    plan: organizationFields.plan, subscriptionStatus: organizationFields.subscriptionStatus,
  }),
  access: v.union(v.literal("purchased"), v.literal("rental-active"), v.literal("cloud-song"), v.literal("rental-expired"), v.literal("click-guide-only"), v.literal("not-in-library"), v.literal("blocked-permission")),
  song: v.optional(v.object(songSummaryFields)),
  summary: v.string(), next: v.string(),
}));

async function resolvePerson(ctx: QueryCtx, args: Omit<AccountLookupArgs, "orgId">): Promise<PersonMatch<Doc<"customers">>> {
  let customer: Doc<"customers"> | null = null;
  if (args.customerId) {
    customer = await ctx.db
      .query("customers")
      .withIndex("by_customerId", (q) => q.eq("customerId", args.customerId!.trim().toUpperCase().replace(/\s+/g, "")))
      .unique();
  } else if (args.email) {
    customer = await ctx.db
      .query("customers")
      .withIndex("by_email", (q) => q.eq("email", args.email!.trim().toLowerCase()))
      .unique();
  } else if (args.name) {
    const needle = args.name.trim().toLowerCase();
    // This demo directory is bounded; do not turn name matching into an unbounded scan.
    const all = await ctx.db.query("customers").take(100);
    const matches = needle ? all.filter((c) => c.name.toLowerCase().includes(needle)) : [];
    if (matches.length > 1) return { status: "ambiguous", candidates: matches.map((m) => m.name) };
    // A truncated directory cannot establish a unique match or absence.
    if (all.length === 100) return { status: "ambiguous", candidates: matches.map((m) => m.name) };
    customer = matches[0] ?? null;
  }
  return customer ? { status: "found", customer } : { status: "not_found" };
}

async function resolve(ctx: QueryCtx, args: AccountLookupArgs) {
  return resolveAccountContext({
    organization: (id) => ctx.db.query("organizations").withIndex("by_orgId", (q) => q.eq("orgId", id)).unique(),
    person: (personArgs) => resolvePerson(ctx, personArgs),
  }, args);
}

async function orgsOf(ctx: QueryCtx, ids: string[]) {
  const out: Doc<"organizations">[] = [];
  for (const id of ids) {
    const o = await ctx.db.query("organizations").withIndex("by_orgId", (q) => q.eq("orgId", id)).unique();
    if (o) out.push(o);
  }
  return out;
}

const SIM = { source: "simulated" as const };

export const lookup = query({
  args: lookupArgs,
  returns: lookupResult,
  handler: async (ctx, args) => {
    const r = await resolve(ctx, args);
    const context = accountResolutionMetadata(r);
    if (!r.ok) {
      if (r.reason === "invalid-orgId")
        return { ok: false as const, reason: r.reason, next: "An organization ID is six digits, shown in Playback under Settings > About. Ask the caller to read it again, or use the email on the account.", ...context, ...SIM };
      return { ok: false as const, reason: r.reason, ...(r.candidates ? { candidates: r.candidates } : {}), ...context, ...SIM };
    }
    const { customer, org } = r;
    const membership: Membership | undefined = customer?.memberships?.find((m) => m.orgId === org?.orgId);
    const otherOrgs = customer ? await orgsOf(ctx, (customer.memberships ?? []).map((m) => m.orgId).filter((id) => id !== org?.orgId)) : [];
    const library = org ? await ctx.db.query("orgSongs").withIndex("by_orgId", (q) => q.eq("orgId", org.orgId)).collect() : [];
    const diagnosis = org ? diagnoseSubscription(stripOrg(org), membership, otherOrgs.map(stripOrg)) : undefined;
    return {
      ok: true as const,
      ...context,
      ...(customer ? { customer: strip(customer) } : {}),
      ...(org ? { organization: stripOrg(org) } : {}),
      ...(membership ? { membership } : {}),
      otherOrganizations: otherOrgs.map((o) => ({ orgId: o.orgId, name: o.name, plan: o.plan, subscriptionStatus: o.subscriptionStatus })),
      library: {
        count: library.length,
        songs: library.map((s) => ({ title: s.title, artist: s.artist, kind: s.kind, status: s.status, expiresAt: s.expiresAt })),
      },
      ...(diagnosis ? { diagnosis, diagnosisScope: membership ? "member" as const : "organization" as const, next: diagnosis.next } : {}),
      ...SIM,
    };
  },
});

/** Can this organization load a specific song? Resolves the org the same way lookup does. */
export const songAccess = query({
  args: { ...lookupArgs, songTitle: v.string() },
  returns: songAccessResult,
  handler: async (ctx, args) => {
    const r = await resolve(ctx, args);
    const context = accountResolutionMetadata(r);
    if (!r.ok) return { ok: false as const, reason: r.reason, ...(r.candidates ? { candidates: r.candidates } : {}), ...context, ...SIM };
    const org = r.org;
    if (!org) return { ok: false as const, reason: "no-organization" as const, ...context, ...SIM };
    const membership = r.customer?.memberships?.find((m) => m.orgId === org.orgId);
    const library = await ctx.db.query("orgSongs").withIndex("by_orgId", (q) => q.eq("orgId", org.orgId)).collect();
    const access = songAccessOf(stripOrg(org), membership, library.map(stripSong), args.songTitle);
    return {
      ok: true as const,
      ...context,
      accessScope: membership ? "member" as const : "organization" as const,
      organization: { orgId: org.orgId, name: org.name, plan: org.plan, subscriptionStatus: org.subscriptionStatus },
      ...access,
      ...SIM,
    };
  },
});

function strip<T extends { _id: unknown; _creationTime: unknown }>(c: T): Omit<T, "_id" | "_creationTime"> {
  const copy: Record<string, unknown> = { ...c };
  delete copy._id;
  delete copy._creationTime;
  return copy as Omit<T, "_id" | "_creationTime">;
}
const stripOrg = (o: Doc<"organizations">): DemoOrganization => strip(o) as DemoOrganization;
const stripSong = (s: Doc<"orgSongs">): DemoOrgSong => strip(s) as DemoOrgSong;
