/**
 * Step 3 of the manual ingestion: upsert chunks.jsonl into a Pinecone index
 * with integrated embeddings (Pinecone embeds the `text` field; we never send
 * vectors or image bytes).
 *
 *   npm run manual:index              create the index if missing, upsert, verify
 *   npm run manual:index -- --dry-run show what would be sent, no network writes
 *   npm run manual:index -- --prune   also delete records of this doc that are no longer in chunks.jsonl
 *
 * Env (.env.local): PINECONE_API_KEY (required)
 *   PINECONE_INDEX      default playback-support-kb
 *   PINECONE_NAMESPACE  default playback-user-guide
 *   PINECONE_CLOUD / PINECONE_REGION  default aws / us-east-1 (the Starter plan's region)
 *
 * Never deletes an index or a namespace. Re-running upserts the same ids in place.
 * Writes docs/source-snapshots/<slug>/index-report.json with what was indexed.
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { PINECONE_API_VERSION, searchManual } from "../../src/lib/tools/manual";
import type { ManualChunk } from "../../src/lib/manual/types";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const prune = args.includes("--prune");
const dir = args.find((a) => !a.startsWith("--")) ?? path.join("docs", "source-snapshots", "playback-user-guide");

const apiKey = process.env.PINECONE_API_KEY;
const indexName = process.env.PINECONE_INDEX ?? "playback-support-kb";
const namespace = process.env.PINECONE_NAMESPACE ?? "playback-user-guide";
const cloud = process.env.PINECONE_CLOUD ?? "aws";
const region = process.env.PINECONE_REGION ?? "us-east-1";
const EMBED = { model: "llama-text-embed-v2", field_map: { text: "text" }, metric: "cosine", write_parameters: { input_type: "passage", truncate: "END" }, read_parameters: { input_type: "query", truncate: "END" } };
/** Integrated-embedding indexes accept at most 96 records per upsert request. */
const BATCH = 96;

const headers = (extra: Record<string, string> = {}) => ({ "Api-Key": apiKey ?? "", "X-Pinecone-API-Version": PINECONE_API_VERSION, ...extra });

async function api<T>(url: string, init: RequestInit = {}): Promise<{ status: number; body: T }> {
  const res = await fetch(url, { ...init, headers: { ...headers(), ...(init.headers as Record<string, string>) } });
  const text = await res.text();
  let body: T;
  try {
    body = JSON.parse(text) as T;
  } catch {
    body = text as unknown as T;
  }
  return { status: res.status, body };
}

type IndexDesc = {
  name: string;
  host: string;
  status: { ready: boolean; state: string };
  /** Pre-2026 API versions report integrated embeddings here. */
  embed?: { model?: string; field_map?: Record<string, string> };
  /** API version 2026-07 reports them as a semantic_text field in the schema. */
  schema?: { fields?: Record<string, { type?: string; model?: string }> };
};

async function ensureIndex(): Promise<IndexDesc> {
  const existing = await api<IndexDesc>(`https://api.pinecone.io/indexes/${indexName}`);
  if (existing.status === 200) {
    const d = existing.body;
    const semanticField = Object.entries(d.schema?.fields ?? {}).find(([, f]) => f.type === "semantic_text");
    const model = d.embed?.model ?? semanticField?.[1].model;
    const textField = d.embed?.field_map?.text ?? semanticField?.[0];
    if (!model) throw new Error(`Index ${indexName} exists but has no integrated embedding model; pick another PINECONE_INDEX (this script never recreates indexes).`);
    if (model !== EMBED.model || textField !== "text")
      throw new Error(`Index ${indexName} uses ${model} on field '${textField}', expected ${EMBED.model} on 'text'. Pick another PINECONE_INDEX.`);
    console.log(`Index ${indexName} exists (${model}, host ${d.host}, ready=${d.status.ready})`);
    return d;
  }
  if (existing.status !== 404) throw new Error(`describe index: HTTP ${existing.status} ${JSON.stringify(existing.body)}`);
  if (dryRun) {
    console.log(`[dry-run] would create index ${indexName} on ${cloud}/${region} with ${JSON.stringify(EMBED)}`);
    return { name: indexName, host: "", status: { ready: false, state: "dry-run" }, embed: EMBED };
  }
  console.log(`Creating index ${indexName} (${cloud}/${region}, ${EMBED.model})…`);
  const created = await api<IndexDesc>("https://api.pinecone.io/indexes/create-for-model", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: indexName, cloud, region, embed: EMBED }),
  });
  if (created.status >= 300) throw new Error(`create index: HTTP ${created.status} ${JSON.stringify(created.body)}`);
  for (let i = 0; i < 60; i++) {
    const d = await api<IndexDesc>(`https://api.pinecone.io/indexes/${indexName}`);
    if (d.status === 200 && d.body.status?.ready) {
      console.log(`Index ready at ${d.body.host}`);
      return d.body;
    }
    await new Promise((r) => setTimeout(r, 5000));
  }
  throw new Error("Index did not become ready within 5 minutes");
}

/** Pinecone record fields: string | number | boolean | string[]; empty lists are dropped. */
function toRecord(c: ManualChunk): Record<string, string | number | boolean | string[]> {
  const { id, image_ids, ...rest } = c;
  const rec: Record<string, string | number | boolean | string[]> = { _id: id, ...rest };
  if (image_ids.length) rec.image_ids = image_ids;
  return rec;
}

async function recordCount(host: string): Promise<number> {
  const r = await api<{ namespaces?: Record<string, { vectorCount?: number; recordCount?: number }> }>(`https://${host}/describe_index_stats`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  const ns = r.body.namespaces?.[namespace];
  return ns?.recordCount ?? ns?.vectorCount ?? 0;
}

async function listIds(host: string, prefix: string): Promise<string[]> {
  const ids: string[] = [];
  let token: string | undefined;
  do {
    const q = new URLSearchParams({ namespace, prefix, limit: "100", ...(token ? { paginationToken: token } : {}) });
    const r = await api<{ vectors?: Array<{ id: string }>; pagination?: { next?: string } }>(`https://${host}/vectors/list?${q}`);
    if (r.status !== 200) throw new Error(`list ids: HTTP ${r.status} ${JSON.stringify(r.body)}`);
    ids.push(...(r.body.vectors ?? []).map((v) => v.id));
    token = r.body.pagination?.next;
  } while (token);
  return ids;
}

async function main() {
  if (!apiKey) {
    console.error("Set PINECONE_API_KEY in .env.local (free Starter plan key from app.pinecone.io)");
    process.exit(1);
  }
  const chunks = (await readFile(path.join(dir, "chunks.jsonl"), "utf8"))
    .split("\n")
    .filter(Boolean)
    .map((l) => JSON.parse(l) as ManualChunk);
  const docSlug = chunks[0]?.doc_slug ?? path.basename(dir);
  const records = chunks.map(toRecord);
  const bytes = Buffer.byteLength(records.map((r) => JSON.stringify(r)).join("\n"));
  console.log(`${chunks.length} chunks from ${dir} (${bytes} bytes of records, ${Math.ceil(chunks.length / BATCH)} batch(es) of ≤${BATCH})`);
  const ids = new Set(chunks.map((c) => c.id));
  if (ids.size !== chunks.length) throw new Error("duplicate chunk ids");
  const tooLong = chunks.filter((c) => c.text.length > 8000);
  if (tooLong.length) throw new Error(`chunks over 8000 chars (would be truncated by the embedder): ${tooLong.map((c) => c.id).join(", ")}`);

  const index = await ensureIndex();
  if (dryRun) {
    console.log(`[dry-run] would upsert ${records.length} records into ${indexName}/${namespace}. First record:\n${JSON.stringify(records[0], null, 2)}`);
    return;
  }
  const host = index.host;

  const before = await recordCount(host);
  for (let i = 0; i < records.length; i += BATCH) {
    const batch = records.slice(i, i + BATCH);
    const r = await api<unknown>(`https://${host}/records/namespaces/${encodeURIComponent(namespace)}/upsert`, {
      method: "POST",
      headers: { "Content-Type": "application/x-ndjson" },
      body: batch.map((x) => JSON.stringify(x)).join("\n"),
    });
    if (r.status >= 300) throw new Error(`upsert batch ${i / BATCH + 1}: HTTP ${r.status} ${JSON.stringify(r.body)}`);
    console.log(`  upserted ${i + batch.length}/${records.length}`);
  }

  let pruned: string[] = [];
  if (prune) {
    const existing = await listIds(host, `${docSlug}:`);
    pruned = existing.filter((id) => !ids.has(id));
    if (pruned.length) {
      const r = await api<unknown>(`https://${host}/vectors/delete`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: pruned, namespace }) });
      if (r.status >= 300) throw new Error(`prune: HTTP ${r.status} ${JSON.stringify(r.body)}`);
      console.log(`  pruned ${pruned.length} stale record(s): ${pruned.join(", ")}`);
    } else console.log("  nothing to prune");
  }

  // Records become searchable asynchronously; wait until the namespace count catches up.
  let after = before;
  for (let i = 0; i < 24; i++) {
    after = await recordCount(host);
    if (after >= chunks.length) break;
    await new Promise((r) => setTimeout(r, 5000));
  }
  console.log(`namespace ${namespace}: ${before} record(s) before, ${after} after`);

  const probes = ["how do I pick which audio device Playback uses", "song will not download in my setlist", "click track and guide only in one ear"];
  const probeResults = [];
  for (const q of probes) {
    const r = await searchManual(q, { env: { PINECONE_API_KEY: apiKey, PINECONE_INDEX_HOST: `https://${host}`, PINECONE_NAMESPACE: namespace } });
    probeResults.push({ query: q, ok: r.ok, top: r.ok ? r.results.map((x) => `${x.id} (${x.score})`) : (r as { reason: string }).reason });
    console.log(`  probe "${q}": ${r.ok ? r.results.map((x) => x.id).join(" | ") : r.reason}`);
  }

  const report = {
    indexed_at: new Date().toISOString(),
    index: indexName,
    host: `https://${host}`,
    namespace,
    embed_model: EMBED.model,
    records_upserted: records.length,
    records_in_namespace_after: after,
    pruned,
    record_bytes: bytes,
    probes: probeResults,
  };
  await writeFile(path.join(dir, "index-report.json"), JSON.stringify(report, null, 2) + "\n");
  console.log(`Wrote ${path.join(dir, "index-report.json")}`);
  console.log(`\nSet on Convex (dev): npx convex env set PINECONE_API_KEY … ; npx convex env set PINECONE_INDEX_HOST https://${host} ; npx convex env set PINECONE_NAMESPACE ${namespace}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
