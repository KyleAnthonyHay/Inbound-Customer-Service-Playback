import { normalizeOrgId, type Membership } from "../../src/lib/demo/accounts";

export type AccountLookupArgs = { orgId?: string; customerId?: string; email?: string; name?: string };
type Person = { orgId?: string; memberships?: Membership[] };
type Organization = { orgId: string };
export type PersonMatch<C> =
  | { status: "found"; customer: C }
  | { status: "not_found" }
  | { status: "ambiguous"; candidates: string[] };
export type AccountLookupStore<C, O> = {
  organization: (orgId: string) => Promise<O | null>;
  person: (args: Omit<AccountLookupArgs, "orgId">) => Promise<PersonMatch<C>>;
};

type OrganizationResolution = { status: "resolved" | "not_found" | "not_checked" | "invalid_id" };
type MemberResolution = {
  status: "not_checked" | "matched" | "person_not_found" | "ambiguous" | "person_found_not_member";
  candidates?: string[];
};
type ResolutionMetadata = {
  accountContext: {
    scope: "organization_only" | "organization_and_member" | "unresolved";
    identityVerified: false;
  };
  organizationResolution: OrganizationResolution;
  memberResolution: MemberResolution;
};
export type AccountResolution<C, O> = ResolutionMetadata & (
  | { ok: true; customer: C | null; org: O | null }
  | { ok: false; reason: "not-found" | "ambiguous" | "missing-input" | "invalid-orgId"; candidates?: string[] }
);

/** Record matching is not caller identity verification or evidence of real-world rights. */
function metadata(organization: OrganizationResolution["status"], member: MemberResolution): ResolutionMetadata {
  return {
    accountContext: {
      scope: organization === "resolved" ? member.status === "matched" ? "organization_and_member" : "organization_only" : "unresolved",
      identityVerified: false,
    },
    organizationResolution: { status: organization },
    memberResolution: member,
  };
}

/** Separate organization facts from an optional person's membership resolution. */
export async function resolveAccountContext<C extends Person, O extends Organization>(
  store: AccountLookupStore<C, O>, args: AccountLookupArgs,
): Promise<AccountResolution<C, O>> {
  const hasPerson = !!(args.customerId || args.email || args.name);
  if (args.orgId) {
    const id = normalizeOrgId(args.orgId);
    if (!id) return { ok: false, reason: "invalid-orgId", ...metadata("invalid_id", { status: "not_checked" }) };
    const org = await store.organization(id);
    if (!org) return { ok: false, reason: "not-found", ...metadata("not_found", { status: "not_checked" }) };
    if (!hasPerson) return { ok: true, org, customer: null, ...metadata("resolved", { status: "not_checked" }) };
    const person = await store.person({ customerId: args.customerId, email: args.email, name: args.name });
    if (person.status === "not_found") return { ok: true, org, customer: null, ...metadata("resolved", { status: "person_not_found" }) };
    if (person.status === "ambiguous") return { ok: true, org, customer: null, ...metadata("resolved", { status: "ambiguous", candidates: person.candidates }) };
    const membershipKnown = person.customer.memberships !== undefined;
    const isMember = person.customer.memberships?.some(m => m.orgId === id);
    return {
      ok: true, org, customer: isMember ? person.customer : null,
      ...metadata("resolved", { status: !membershipKnown ? "not_checked" : isMember ? "matched" : "person_found_not_member" }),
    };
  }
  if (!hasPerson) return { ok: false, reason: "missing-input", ...metadata("not_checked", { status: "not_checked" }) };
  const person = await store.person(args);
  if (person.status === "not_found") return { ok: false, reason: "not-found", ...metadata("not_checked", { status: "person_not_found" }) };
  if (person.status === "ambiguous") return { ok: false, reason: "ambiguous", candidates: person.candidates, ...metadata("not_checked", { status: "ambiguous", candidates: person.candidates }) };
  const customer = person.customer;
  const org = customer.orgId ? await store.organization(customer.orgId) : null;
  return {
    ok: true, customer, org,
    ...metadata(org ? "resolved" : customer.orgId ? "not_found" : "not_checked", {
      status: org && customer.memberships ? customer.memberships.some(m => m.orgId === org.orgId) ? "matched" : "person_found_not_member" : "not_checked",
    }),
  };
}

/** Public result metadata intentionally contains no inferred caller permission. */
export function accountResolutionMetadata<C, O>(r: AccountResolution<C, O>): ResolutionMetadata {
  return { accountContext: r.accountContext, organizationResolution: r.organizationResolution, memberResolution: r.memberResolution };
}
