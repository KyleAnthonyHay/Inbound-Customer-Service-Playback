/**
 * Retrieval over the Playback User Guide chunks in Pinecone (integrated
 * embeddings: the query text is embedded by Pinecone, no vectors on our side).
 *
 * Runs inside the Convex tool webhook. Reads
 *   PINECONE_API_KEY, PINECONE_INDEX_HOST (https://…svc…pinecone.io), PINECONE_NAMESPACE
 * and degrades to { ok: false, reason: "not-configured" } when they are missing,
 * so the keyword KB in kb.ts keeps working without Pinecone.
 *
 * The same REST shapes are used by scripts/manual/index-manual.ts; keep them in sync.
 */
import { classifyStep } from "./disruption";
import type { ManualCategory, ManualChunk, ManualScope } from "../manual/types";

export const PINECONE_API_VERSION = "2026-07";

export type ManualHit = {
  id: string;
  score: number;
  sectionPath: string;
  sectionUrl: string;
  category: ManualCategory;
  scope: ManualScope;
  part: number;
  parts: number;
  imageIds: string[];
  /** Section text without the heading line; omitted for out-of-scope hits. */
  text?: string;
  steps?: Array<{ n: number; text: string; disruptive: boolean; kind?: string; caution?: string }>;
  hasDisruptiveSteps?: boolean;
  sourceUpdatedAt: string;
};

export type ManualSearchResult =
  | {
      ok: true;
      source: "manual";
      provider: "Playback User Guide (MultiTracks help center, snapshot in Pinecone)";
      query: string;
      found: number;
      results: ManualHit[];
      outOfScope: Array<{ id: string; sectionPath: string; sectionUrl: string }>;
      note: string;
    }
  | { ok: false; source: "manual"; reason: "not-configured" | "request-failed" | "timeout"; detail?: string };

export type ManualSearchOptions = {
  category?: string;
  limit?: number;
  /** Include out-of-scope sections as titles only (default true). */
  includeOutOfScope?: boolean;
  /** Overrides for tests. */
  env?: Partial<Record<"PINECONE_API_KEY" | "PINECONE_INDEX_HOST" | "PINECONE_NAMESPACE" | "PINECONE_RERANK", string>>;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
};

export const MANUAL_FIELDS: Array<keyof ManualChunk> = [
  "text", "section_path", "section_url", "category", "scope", "part", "parts", "image_ids", "image_count", "source_updated_at", "h1", "h2", "h3",
];

/** Tool category (vapiTools.ts enum) → manual categories. */
export function manualCategoriesFor(category?: string): ManualCategory[] | undefined {
  switch (category) {
    case "song-loading":
    case "audio-output":
    case "subscription":
      return [category];
    case "setup":
    case "requirements":
      return ["setup"];
    case "general":
      return ["general", "setup"];
    default:
      return undefined;
  }
}

/** Numbered or bulleted lines of a chunk body, for the disruption classifier. */
export function stepsOf(body: string) {
  const lines = body.split("\n").map((l) => l.trim()).filter((l) => /^(\d+[.)]|-)\s+/.test(l));
  return lines.map((l, i) => {
    const text = l.replace(/^(\d+[.)]|-)\s+/, "");
    return { n: i + 1, text, ...classifyStep(text) };
  });
}

export function bodyOf(text: string) {
  const i = text.indexOf("\n\n");
  return i === -1 ? text : text.slice(i + 2);
}

export async function searchManual(query: string, opts: ManualSearchOptions = {}): Promise<ManualSearchResult> {
  const env = { ...process.env, ...opts.env };
  const apiKey = env.PINECONE_API_KEY;
  const host = env.PINECONE_INDEX_HOST?.replace(/\/$/, "");
  const namespace = env.PINECONE_NAMESPACE || "playback-user-guide";
  if (!apiKey || !host) return { ok: false, source: "manual", reason: "not-configured" };
  const limit = Math.min(opts.limit ?? 3, 5);
  const categories = manualCategoriesFor(opts.category);
  const fetchImpl = opts.fetchImpl ?? fetch;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? 8000);
  try {
    const body: Record<string, unknown> = {
      query: {
        inputs: { text: query },
        top_k: limit * 3,
        ...(categories ? { filter: { category: { $in: categories } } } : {}),
      },
      fields: MANUAL_FIELDS,
    };
    if (env.PINECONE_RERANK === "1") body.rerank = { model: "bge-reranker-v2-m3", top_n: limit * 2, rank_fields: ["text"] };
    const res = await fetchImpl(`${host}/records/namespaces/${encodeURIComponent(namespace)}/search`, {
      method: "POST",
      headers: { "Api-Key": apiKey, "Content-Type": "application/json", "X-Pinecone-API-Version": PINECONE_API_VERSION },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    if (!res.ok) return { ok: false, source: "manual", reason: "request-failed", detail: `HTTP ${res.status}: ${(await res.text()).slice(0, 300)}` };
    const data = (await res.json()) as { result?: { hits?: Array<{ _id: string; _score: number; fields: Partial<ManualChunk> }> } };
    const hits = data.result?.hits ?? [];
    const results: ManualHit[] = [];
    const outOfScope: Array<{ id: string; sectionPath: string; sectionUrl: string }> = [];
    for (const h of hits) {
      const f = h.fields;
      const base = {
        id: h._id,
        score: Math.round(h._score * 1000) / 1000,
        sectionPath: f.section_path ?? "",
        sectionUrl: f.section_url ?? "",
        category: (f.category ?? "general") as ManualCategory,
        scope: (f.scope ?? "adjacent") as ManualScope,
        part: f.part ?? 1,
        parts: f.parts ?? 1,
        imageIds: f.image_ids ?? [],
        sourceUpdatedAt: f.source_updated_at ?? "",
      };
      if (base.scope === "out-of-scope") {
        if (opts.includeOutOfScope !== false && outOfScope.length < 3) outOfScope.push({ id: base.id, sectionPath: base.sectionPath, sectionUrl: base.sectionUrl });
        continue;
      }
      if (results.length >= limit) continue;
      const body = bodyOf(f.text ?? "");
      const steps = stepsOf(body);
      results.push({ ...base, text: body, steps, hasDisruptiveSteps: steps.some((s) => s.disruptive) });
    }
    return {
      ok: true,
      source: "manual",
      provider: "Playback User Guide (MultiTracks help center, snapshot in Pinecone)",
      query,
      found: results.length,
      results,
      outOfScope,
      note:
        results.length === 0
          ? "No in-scope manual section matched."
          : "Manual sections describe how the app works; give only steps that appear in the text, and cite 'the Playback User Guide'. Sections listed under outOfScope are documented but outside this agent's support scope: name the topic and offer a handoff, do not troubleshoot them.",
    };
  } catch (e) {
    const aborted = e instanceof Error && e.name === "AbortError";
    return { ok: false, source: "manual", reason: aborted ? "timeout" : "request-failed", detail: e instanceof Error ? e.message : String(e) };
  } finally {
    clearTimeout(timer);
  }
}
