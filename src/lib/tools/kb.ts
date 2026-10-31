import kbJson from "../../knowledge/playback-kb.json";
import { classifyStep } from "./disruption";

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
export function searchDocs(query: string, opts?: { category?: string; limit?: number; platform?: string }) {
  const q = tokens(query);
  const limit = Math.min(opts?.limit ?? 3, 5);
  const scored = kb.articles
    .filter((a) => !opts?.category || a.category === opts.category)
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
    .sort((x, y) => y.score - x.score)
    .slice(0, limit);

  return {
    ok: true as const,
    source: "documentation" as const,
    provider: "MultiTracks Help Center (bounded snapshot)",
    snapshotRetrievedAt: kb.retrievedAt,
    query,
    found: scored.length,
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
        steps,
        hasDisruptiveSteps: steps.some((s) => s.disruptive),
        relevance: score,
      };
    }),
    note:
      scored.length === 0
        ? "No documented article matched. Do not invent steps; offer a handoff or ask a clarifying question."
        : "Only give steps that appear in these results. Give non-disruptive steps first. Before a step marked disruptive, say its caution in one short sentence (e.g. 'heads up, this one closes the app, so not mid-service'); do not ask whether they are in a service unless the caution changes which step you give.",
  };
}
