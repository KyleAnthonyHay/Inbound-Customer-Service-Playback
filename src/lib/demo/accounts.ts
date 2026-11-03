/**
 * SYNTHETIC account data for the demo, plus the pure logic that turns a
 * customer, their organization and the organization's song library into
 * something the agent can act on. Everything here is fictional and is not
 * connected to MultiTracks' real systems.
 *
 * Shared by the Convex seed (convex/seed.ts), the Convex lookup queries
 * (convex/customers.ts) and the unit tests (scripts/test-accounts.ts), so
 * the diagnosis logic is testable without a database.
 *
 * Lookup key: the ORGANIZATION ID NUMBER. Playback shows it in Settings >
 * About ("User Name, Organization Name, and Organization ID Number" in the
 * User Guide), and the organization is the umbrella under which content is
 * purchased and subscriptions are shared, so it is the record that answers
 * "did my church buy this song" and "is our Cloud Pro still active". Six
 * digits are easy to say and transcribe on a phone call; an email address
 * ("priya dot n at example dot org") is not. Email stays as the fallback for
 * callers without the app open, and the primary demo customer ID (111) is supported
 * for the existing scenarios.
 */

export type Plan = "Cloud Pro" | "Cloud" | "Premium" | "Rentals" | "Intro" | "none";
export type SubscriptionStatus = "active" | "past-due" | "expired" | "none";
export type Role = "Org Admin" | "Campus Admin" | "Team Leader" | "Team Member";

export type DemoOrganization = {
  orgId: string; // six digits, as shown in Playback Settings > About
  name: string;
  plan: Plan;
  subscriptionStatus: SubscriptionStatus;
  renewsAt?: string; // ISO date, active plans
  expiredAt?: string; // ISO date, expired plans
  /** Payment failed on this date; access continues until graceEndsAt. */
  pastDueSince?: string;
  graceEndsAt?: string;
  /** Playback Rentals credits left this cycle. */
  rentalCredits?: number;
  teamSharingSeats?: { total: number; used: number };
  notes?: string;
  simulated: true;
};

export type Membership = {
  orgId: string;
  role: Role;
  /** Playback Team Sharing permission on the org's People page: needed to use the org's purchased tracks. */
  teamSharing: boolean;
  /** Playback Rentals permission: needed to spend the org's rental credits. */
  rentals: boolean;
};

export type DemoCustomer = {
  customerId: string; // e.g. "111"
  name: string;
  email: string;
  organization: string; // display name of the primary org (legacy field)
  /** Primary organization: the one the caller is signed into unless they say otherwise. */
  orgId: string;
  memberships: Membership[];
  /** Legacy mirrors of the primary org's subscription, kept for older seed rows and tests. */
  plan: Plan;
  subscriptionStatus: SubscriptionStatus;
  renewsAt?: string;
  expiredAt?: string;
  entitlements: string[];
  notes?: string;
};

export type SongKind = "purchased" | "rental" | "cloud-song";
export type DemoOrgSong = {
  orgId: string;
  title: string;
  artist: string;
  kind: SongKind;
  status: "active" | "expired";
  /** Rentals expire; purchases do not. */
  expiresAt?: string;
  simulated: true;
};

export const organizations: DemoOrganization[] = [
  {
    orgId: "480113",
    name: "Riverbend Community Church (demo)",
    plan: "Cloud Pro",
    subscriptionStatus: "active",
    renewsAt: "2027-03-14",
    teamSharingSeats: { total: 10, used: 4 },
    notes: "Healthy Cloud Pro org. Used for the 'active subscriber sees Cloud Pro expired' software-bug scenario.",
    simulated: true,
  },
  {
    orgId: "517204",
    name: "Harbor Light Fellowship (demo)",
    plan: "Cloud Pro",
    subscriptionStatus: "expired",
    expiredAt: "2026-09-02",
    teamSharingSeats: { total: 10, used: 2 },
    notes: "Cloud Pro genuinely expired on 2026-09-02. Purchased songs still download; click and guide and cloud features do not.",
    simulated: true,
  },
  {
    orgId: "362990",
    name: "Northgate Worship Collective (demo)",
    plan: "Cloud",
    subscriptionStatus: "active",
    renewsAt: "2027-01-20",
    teamSharingSeats: { total: 5, used: 3 },
    simulated: true,
  },
  {
    orgId: "605781",
    name: "Grace Chapel (demo)",
    plan: "none",
    subscriptionStatus: "none",
    notes: "No subscription. Uses Playback with a handful of purchased songs only; the catalog is not available to add from.",
    simulated: true,
  },
  {
    orgId: "714318",
    name: "Cedar Ridge Church (demo)",
    plan: "Rentals",
    subscriptionStatus: "active",
    renewsAt: "2026-11-15",
    rentalCredits: 0,
    teamSharingSeats: { total: 3, used: 1 },
    notes: "Playback Rentals subscriber. All credits for this cycle are spent and one rental has expired.",
    simulated: true,
  },
  {
    orgId: "829455",
    name: "Lakeside Youth Ministry (demo)",
    plan: "Cloud Pro",
    subscriptionStatus: "past-due",
    pastDueSince: "2026-10-28",
    graceEndsAt: "2026-11-11",
    teamSharingSeats: { total: 10, used: 6 },
    notes: "Cloud Pro renewal payment failed on 2026-10-28 (card declined). Access continues through the grace period; billing must update the card.",
    simulated: true,
  },
  {
    orgId: "931027",
    name: "Olivia Brennan (personal, demo)",
    plan: "Intro",
    subscriptionStatus: "none",
    notes: "Personal org created at sign-up. Empty library; the user's church content lives in Northgate Worship Collective.",
    simulated: true,
  },
];

const orgName = (id: string) => organizations.find((o) => o.orgId === id)!.name;

export const customers: DemoCustomer[] = [
  {
    customerId: "111",
    name: "John Doe",
    email: "john.doe@example.org",
    organization: orgName("480113"),
    orgId: "480113",
    memberships: [{ orgId: "480113", role: "Org Admin", teamSharing: true, rentals: true }],
    plan: "Cloud Pro",
    subscriptionStatus: "active",
    renewsAt: "2027-03-14",
    entitlements: ["cloud-sync", "playback-pro-features", "multitrack-downloads"],
    notes:
      "Active Cloud Pro subscriber. Reports a 'Cloud Pro expired' message in Playback despite an active plan. Last known Playback version 8.6.2 (iPad).",
  },
  {
    customerId: "DEMO-1002",
    name: "Priya Natarajan",
    email: "priya.n@example.org",
    organization: orgName("517204"),
    orgId: "517204",
    memberships: [{ orgId: "517204", role: "Org Admin", teamSharing: true, rentals: true }],
    plan: "Cloud Pro",
    subscriptionStatus: "expired",
    expiredAt: "2026-09-02",
    entitlements: [],
    notes:
      "Cloud Pro subscription genuinely expired on 2026-09-02. Sees 'Cloud Pro expired' message; a software update will not resolve this.",
  },
  {
    customerId: "DEMO-1003",
    name: "Marcus Bell",
    email: "marcus.bell@example.org",
    organization: orgName("362990"),
    orgId: "362990",
    memberships: [{ orgId: "362990", role: "Org Admin", teamSharing: true, rentals: true }],
    plan: "Cloud",
    subscriptionStatus: "active",
    renewsAt: "2027-01-20",
    entitlements: ["cloud-sync", "multitrack-downloads"],
    notes: "Reports no audio from the right channel when using a USB interface on iPhone.",
  },
  {
    customerId: "DEMO-1004",
    name: "Elena Cruz",
    email: "elena.cruz@example.org",
    organization: orgName("605781"),
    orgId: "605781",
    memberships: [{ orgId: "605781", role: "Org Admin", teamSharing: true, rentals: false }],
    plan: "none",
    subscriptionStatus: "none",
    entitlements: [],
    notes: "No subscription on file. Uses Playback with purchased songs only.",
  },
  {
    customerId: "DEMO-1005",
    name: "Sam Okafor",
    email: "sam.okafor@example.org",
    organization: orgName("480113"),
    orgId: "480113",
    memberships: [{ orgId: "480113", role: "Team Member", teamSharing: false, rentals: false }],
    plan: "Cloud Pro",
    subscriptionStatus: "active",
    renewsAt: "2027-03-14",
    entitlements: [],
    notes:
      "Volunteer drummer added to Riverbend's People page without the Playback Team Sharing permission. Sees the setlist but purchased tracks will not download for this user.",
  },
  {
    customerId: "DEMO-1006",
    name: "Tasha Reyes",
    email: "tasha.reyes@example.org",
    organization: orgName("714318"),
    orgId: "714318",
    memberships: [{ orgId: "714318", role: "Org Admin", teamSharing: true, rentals: true }],
    plan: "Rentals",
    subscriptionStatus: "active",
    renewsAt: "2026-11-15",
    entitlements: ["rentals"],
    notes: "Playback Rentals subscriber. Rental credits for this cycle are used up; the rental of 'Build My Life' expired on 2026-10-26.",
  },
  {
    customerId: "DEMO-1007",
    name: "Daniel Kim",
    email: "daniel.kim@example.org",
    organization: orgName("829455"),
    orgId: "829455",
    memberships: [{ orgId: "829455", role: "Org Admin", teamSharing: true, rentals: true }],
    plan: "Cloud Pro",
    subscriptionStatus: "past-due",
    entitlements: ["cloud-sync", "playback-pro-features", "multitrack-downloads"],
    notes: "Cloud Pro renewal payment failed on 2026-10-28. Playback shows a payment warning; features still work until 2026-11-11.",
  },
  {
    customerId: "DEMO-1008",
    name: "Olivia Brennan",
    email: "olivia.brennan@example.org",
    organization: orgName("931027"),
    orgId: "931027",
    memberships: [
      { orgId: "931027", role: "Org Admin", teamSharing: true, rentals: false },
      { orgId: "362990", role: "Team Leader", teamSharing: true, rentals: true },
    ],
    plan: "Intro",
    subscriptionStatus: "none",
    entitlements: [],
    notes:
      "Belongs to two organizations. Signed into the personal org by mistake, so the Library is empty; Northgate's songs appear after switching organizations (Settings > About > Switch Organizations).",
  },
];

const song = (orgId: string, title: string, artist: string, kind: SongKind, extra: Partial<DemoOrgSong> = {}): DemoOrgSong => ({
  orgId,
  title,
  artist,
  kind,
  status: "active",
  simulated: true,
  ...extra,
});

export const orgSongs: DemoOrgSong[] = [
  // Riverbend (Cloud Pro, active)
  // Synthetic purchases for the shared Planning Center demo set, not API-verified entitlements.
  song("480113", "Graves Into Gardens", "Elevation Worship", "purchased"),
  song("480113", "Do It Again", "Elevation Worship", "purchased"),
  song("480113", "What A Beautiful Name", "Hillsong Worship", "purchased"),
  song("480113", "Goodness of God", "Bethel Music", "purchased"),
  song("480113", "Great Are You Lord", "All Sons & Daughters", "purchased"),
  song("480113", "Gratitude", "Brandon Lake", "purchased"),
  song("480113", "House of the Lord", "Phil Wickham", "purchased"),
  song("480113", "Riverbend Benediction", "Riverbend Worship", "cloud-song"),
  // Harbor Light (Cloud Pro, expired)
  song("517204", "Way Maker", "Leeland", "purchased"),
  song("517204", "King of Kings", "Hillsong Worship", "purchased"),
  // Northgate (Cloud, active)
  song("362990", "Build My Life", "Pat Barrett", "purchased"),
  song("362990", "Living Hope", "Phil Wickham", "purchased"),
  song("362990", "Raise a Hallelujah", "Bethel Music", "purchased"),
  // Grace Chapel (no subscription)
  song("605781", "10,000 Reasons (Bless the Lord)", "Matt Redman", "purchased"),
  song("605781", "How Great Is Our God", "Chris Tomlin", "purchased"),
  // Cedar Ridge (Rentals)
  song("714318", "Firm Foundation (He Won't)", "Cody Carnes", "rental", { expiresAt: "2026-11-20" }),
  song("714318", "Build My Life", "Pat Barrett", "rental", { status: "expired", expiresAt: "2026-10-26" }),
  song("714318", "Cornerstone", "Hillsong Worship", "purchased"),
  // Lakeside (Cloud Pro, past-due)
  song("829455", "Graves Into Gardens", "Elevation Worship", "purchased"),
  song("829455", "Praise", "Elevation Worship", "purchased"),
  // Olivia's personal org: empty on purpose.
];

/* ----------------------------- pure logic ------------------------------ */

export const ORG_ID_RE = /^\d{6}$/;

/** "4 8 0 1 1 3", "480-113", "org 480113" -> "480113"; anything else -> null. */
export function normalizeOrgId(raw: string | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  return ORG_ID_RE.test(digits) ? digits : null;
}

export type SubscriptionDiagnosis = {
  code: "active" | "past-due" | "expired" | "no-subscription" | "missing-team-sharing" | "wrong-organization";
  summary: string;
  /** What the agent should do next, in the same style as the other tools' `next` hints. */
  next: string;
};

/**
 * Explains the account state in one line and tells the agent what to do.
 * `otherOrgs` are the caller's other memberships, used to spot a sign-in to
 * the wrong organization.
 */
export function diagnoseSubscription(
  org: DemoOrganization,
  membership: Membership | undefined,
  otherOrgs: DemoOrganization[] = []
): SubscriptionDiagnosis {
  const richer = otherOrgs.find((o) => o.subscriptionStatus === "active" || o.subscriptionStatus === "past-due");
  if ((org.plan === "Intro" || org.plan === "none") && richer) {
    return {
      code: "wrong-organization",
      summary: `${org.name} has no subscription or purchases, but the caller also belongs to ${richer.name}, which does.`,
      next: `Ask which organization they picked at login. The church content is under ${richer.name}; they can use Switch Organizations in Playback's side menu, or sign out and pick it at login. Do not troubleshoot downloads until they are in the right organization.`,
    };
  }
  if (membership && !membership.teamSharing && org.subscriptionStatus !== "none") {
    return {
      code: "missing-team-sharing",
      summary: `${org.name}'s subscription is ${org.subscriptionStatus}, but this user (${membership.role}) does not have the Playback Team Sharing permission, so the organization's purchased tracks will not download for them.`,
      next: "Explain that their organization's admin has to grant Playback Team Sharing on the People page at MultiTracks.com; the app itself is working. Do not run download troubleshooting.",
    };
  }
  switch (org.subscriptionStatus) {
    case "active":
      return {
        code: "active",
        summary: `${org.plan} is active${org.renewsAt ? ` and renews on ${org.renewsAt}` : ""}.`,
        next:
          org.plan === "Rentals"
            ? `Rentals subscription is active with ${org.rentalCredits ?? 0} credit(s) left this cycle. Use check_song_access for the specific song.`
            : "The subscription is active. This alone does not establish the cause of a conflicting app message or access to every song. Use caller facts and applicable documentation to choose useful diagnostic evidence; release history can explain behavior left unexplained by account or configuration facts.",
      };
    case "past-due":
      return {
        code: "past-due",
        summary: `${org.plan} renewal payment failed on ${org.pastDueSince}; access continues until ${org.graceEndsAt}.`,
        next: "Tell the caller their features still work for now and that the payment method needs updating with billing before the grace period ends. Offer a handoff or callback with the billing team; do not troubleshoot the warning as a bug.",
      };
    case "expired":
      return {
        code: "expired",
        summary: `${org.plan} expired on ${org.expiredAt}. Purchased songs still download; click and guide, cloud songs and other subscription features do not.`,
        next: "This is a billing matter you cannot resolve. Say the subscription ended, say what still works, and offer a handoff or callback with billing. Do not suggest an update or reinstall.",
      };
    default:
      return {
        code: "no-subscription",
        summary: `${org.name} has no Playback subscription; only purchased songs are available.`,
        next: "Songs they bought still download. The catalog, click and guide, and rentals need a subscription or purchase from MultiTracks.com, which is a sales matter: say so and offer billing if they want it.",
      };
  }
}

/** Normalize a title for matching: lowercase, no punctuation or bracketed suffixes. */
function titleKey(t: string): string {
  return t
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Finds songs in a library whose title contains, or is contained by, the caller's words. */
export function matchSongs(library: DemoOrgSong[], title: string): DemoOrgSong[] {
  const needle = titleKey(title);
  if (!needle) return [];
  return library.filter((s) => {
    const key = titleKey(s.title);
    return key === needle || key.includes(needle) || needle.includes(key);
  });
}

export type SongAccess = {
  access: "purchased" | "rental-active" | "cloud-song" | "rental-expired" | "click-guide-only" | "not-in-library" | "blocked-permission";
  song?: Pick<DemoOrgSong, "title" | "artist" | "kind" | "status" | "expiresAt">;
  summary: string;
  next: string;
};

/**
 * Can this organization (and this user) load the tracks for a song?
 * Combines the org library with the org's plan and the user's permission.
 */
export function songAccess(org: DemoOrganization, membership: Membership | undefined, library: DemoOrgSong[], title: string): SongAccess {
  const matches = matchSongs(library, title);
  const hit = matches.find((s) => s.status === "active") ?? matches[0];
  const subActive = org.subscriptionStatus === "active" || org.subscriptionStatus === "past-due";
  const catalogPlan = subActive && (org.plan === "Cloud Pro" || org.plan === "Rentals");

  if (hit && membership && !membership.teamSharing) {
    return {
      access: "blocked-permission",
      song: pick(hit),
      summary: `${org.name} owns "${hit.title}", but this user has no Playback Team Sharing permission, so it will not download for them.`,
      next: "Their organization's admin must grant Playback Team Sharing on the People page at MultiTracks.com. Nothing to fix in the app.",
    };
  }
  if (hit && hit.kind === "rental" && hit.status === "expired") {
    return {
      access: "rental-expired",
      song: pick(hit),
      summary: `The rental of "${hit.title}" expired on ${hit.expiresAt}; the organization has ${org.rentalCredits ?? 0} rental credit(s) left.`,
      next:
        (org.rentalCredits ?? 0) > 0
          ? "They can rent it again from the song's Tracks cell (Unlock with Rental Credit) using a remaining credit."
          : "No credits remain this cycle, so the tracks cannot be rented again until the cycle renews or the song is purchased on MultiTracks.com. That is a purchase or billing matter: say so and offer billing.",
    };
  }
  if (hit && hit.kind === "rental") {
    return {
      access: "rental-active",
      song: pick(hit),
      summary: `"${hit.title}" is an active rental until ${hit.expiresAt}.`,
      next: "Entitlement is fine; if it will not download, troubleshoot with search_playback_docs as a song-loading problem.",
    };
  }
  if (hit && hit.kind === "cloud-song") {
    return {
      access: "cloud-song",
      song: pick(hit),
      summary: `"${hit.title}" is a Cloud Song uploaded by ${org.name}.`,
      next: subActive ? "Entitlement is fine; troubleshoot as a song-loading problem." : "Cloud Songs need an active Cloud Pro subscription; this one has lapsed, so point to billing.",
    };
  }
  if (hit) {
    return {
      access: "purchased",
      song: pick(hit),
      summary: `${org.name} purchased "${hit.title}" (${hit.artist}). Purchased tracks download regardless of subscription.`,
      next: "Entitlement is fine; if it will not download, troubleshoot with search_playback_docs as a song-loading problem.",
    };
  }
  if (catalogPlan) {
    return {
      access: "click-guide-only",
      summary: `"${title}" is not in ${org.name}'s library. With ${org.plan} they can add its click and guide from the catalog, but the tracks need a purchase${org.plan === "Rentals" ? ` or a rental credit (${org.rentalCredits ?? 0} left)` : ""}.`,
      next: "Explain that the song has not been purchased, so only click and guide load; buying or renting it on MultiTracks.com is up to them (sales, not support). Do not run download troubleshooting.",
    };
  }
  return {
    access: "not-in-library",
    summary: `"${title}" is not in ${org.name}'s library and the organization has no subscription that would add it from the catalog.`,
    next: "Explain that the organization has not purchased this song, so there is nothing to download; purchasing it on MultiTracks.com is a sales matter. Do not run download troubleshooting.",
  };
}

function pick(s: DemoOrgSong) {
  return { title: s.title, artist: s.artist, kind: s.kind, status: s.status, expiresAt: s.expiresAt };
}
