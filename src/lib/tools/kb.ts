import kbJson from "../../knowledge/playback-kb.json";
import { classifyStep } from "./disruption";
import { compareVersions } from "./version";

export type KbArticle = {
  id: string;
  category: string;
  title: string;
  url: string;
  retrievedAt: string;
  summary: string;
  steps: string[];
  appliesTo?: string[];
  keywords?: string[];
  /** Source-stated version limits; unknown versions cannot authorize restricted steps. */
  versionRange?: { minInclusive?: string; maxExclusive?: string };
  /** Related source-backed feature requirements, distinct from hardware compatibility. */
  requirements?: Array<{ text: string; sourceUrl: string }>;
};

export type KbRelease = {
  version: string;
  date: string | null;
  url: string;
  notes: string[];
  keywords?: string[];
};

export type KnowledgeBase = {
  retrievedAt: string;
  articles: KbArticle[];
  releases: KbRelease[];
  requirements?: { url: string; summary: string; details: string[] };
  gaps?: string[];
};

export const kb = kbJson as unknown as KnowledgeBase;

const STOP = new Set(["the", "a", "an", "to", "of", "in", "on", "and", "or", "is", "my", "it", "for", "with", "not", "i", "me"]);

function tokens(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9. ]+/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP.has(t));
}

/** Simple keyword search over the bounded, source-backed knowledge base. */
export function searchDocs(query: string, opts?: { category?: string; limit?: number; platform?: string; installedVersion?: string }) {
  const q = tokens(query);
  const limit = Math.min(opts?.limit ?? 3, 5);
  const matches = kb.articles
    .filter((a) => !opts?.platform || !a.appliesTo?.length || a.appliesTo.some((p) => p.toLowerCase().includes(opts.platform!.toLowerCase())))
    .map((a) => {
      const hay = tokens([a.title, a.summary, ...(a.keywords ?? []), ...a.steps].join(" "));
      const titleHay = tokens(a.title + " " + (a.keywords ?? []).join(" "));
      let score = 0;
      for (const t of q) {
        if (titleHay.includes(t)) score += 3;
        else if (hay.includes(t)) score += 1;
      }
      return { a, score };
    })
    .filter((x) => x.score > 0)
    // As with manual retrieval, the model's category guess is a preference.
    // A hard filter hid the master guide (general) from organization/setup queries.
    // Lexical scores are integers: this only breaks ties and cannot create a match.
    .map(({ a, score }) => ({ a, score: score + (opts?.category === a.category ? 0.25 : 0) }))
    .sort((x, y) => y.score - x.score);
  const installedVersion = opts?.installedVersion?.trim();
  const applicable = (a: KbArticle) => !a.versionRange || (!!installedVersion && /^v?\d+(?:\.\d+){1,3}$/i.test(installedVersion)
    && (!a.versionRange.minInclusive || compareVersions(installedVersion, a.versionRange.minInclusive) >= 0)
    && (!a.versionRange.maxExclusive || compareVersions(installedVersion, a.versionRange.maxExclusive) < 0));
  const scored = matches.filter(({ a }) => applicable(a)).slice(0, limit);

  return {
    ok: true as const,
    source: "documentation" as const,
    provider: "MultiTracks Help Center (bounded snapshot)",
    evidenceScope: "product-documentation" as const,
    establishesCallerContext: false as const,
    snapshotRetrievedAt: kb.retrievedAt,
    query,
    found: scored.length,
    // Do not expose obsolete procedures as runnable steps next to current instructions.
    withheldArticles: matches.filter(({ a }) => !applicable(a)).slice(0, limit).map(({ a }) => ({
      id: a.id, title: a.title, url: a.url, versionRange: a.versionRange,
      reason: installedVersion ? "Installed version is invalid or outside the source's supported range." : "Restricted procedure requires a caller-confirmed version in its supported range.",
    })),
    results: scored.map(({ a, score }) => {
      const steps = a.steps.map((text, i) => ({ n: i + 1, text, ...classifyStep(text) }));
      return {
        id: a.id,
        title: a.title,
        category: a.category,
        url: a.url,
        retrievedAt: a.retrievedAt,
        appliesTo: a.appliesTo ?? [],
        summary: a.summary,
        ...(a.versionRange ? { versionRange: a.versionRange } : {}),
        ...(a.requirements ? { requirements: a.requirements } : {}),
        steps,
        hasDisruptiveSteps: steps.some((s) => s.disruptive),
        relevance: score,
      };
    }),
    note:
      scored.length === 0
        ? "No documented article matched. Do not invent steps; offer a handoff or ask a clarifying question."
        : "These results describe Playback, not where the caller is currently looking or making a change. A matching article does not establish caller context. Use only steps whose application/control, source section, named error, version and setup conditions match the caller's established facts. A less disruptive step is not automatically applicable. Prefer applicable non-disruptive steps. Explain a disruptive step's effect briefly once and honor constraints already stated; if no applicable safe step remains, offer specialist review.",
  };
}
