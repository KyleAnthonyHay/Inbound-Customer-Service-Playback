/**
 * Step 2 of the manual ingestion (offline): from the raw download produce
 *   <slug>.snapshot.html   readable copy, screenshots in place from ./images, labelled as a source snapshot
 *   <slug>.txt             extracted text with the heading hierarchy and image placeholders
 *   chunks.jsonl           the records that get upserted to Pinecone (text + flat metadata)
 *   manual-manifest.json   images (source URL, local file, caption, section, chunk ids, position), videos, links
 *   build-report.json      counts and per-chunk sizes, for review
 *
 *   npm run manual:build                 (docs/source-snapshots/playback-user-guide)
 *   npm run manual:build -- <snapshotDir>
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArticle, type Block } from "./parse-article";
import { chunkSections, renderItems, sectionize } from "./chunk";
import type { ManualManifest } from "../../src/lib/manual/types";

const dir = process.argv[2] ?? path.join("docs", "source-snapshots", "playback-user-guide");
const slug = path.basename(dir);

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

type FetchManifest = { sourceUrl: string; finalUrl: string; fetchedAt: string; images: Array<{ index: number; url: string; file?: string; bytes?: number }> };

async function main() {
  const html = await readFile(path.join(dir, "raw", "article.html"), "utf8");
  const fetchManifest = JSON.parse(await readFile(path.join(dir, "fetch-manifest.json"), "utf8")) as FetchManifest;
  // The fetch step keeps attribute values as written (&amp;), the parser decodes them.
  const norm = (u: string) => u.replace(/&amp;/g, "&");
  const byUrlRaw = new Map(fetchManifest.images.map((i) => [norm(i.url), i]));
  const byUrl = { get: (u: string) => byUrlRaw.get(norm(u)) };
  const imageId = (src: string) => {
    const hit = byUrl.get(src);
    return hit ? `img-${String(hit.index).padStart(2, "0")}` : `img-missing-${src.slice(-12).replace(/\W/g, "")}`;
  };

  const article = parseArticle(html);
  const docTitle = article.title;
  const retrievedAt = fetchManifest.fetchedAt.slice(0, 10);
  const sourceUpdatedAt = article.sourceUpdatedAt?.slice(0, 10) ?? "unknown";
  const sections = sectionize(article.blocks, docTitle);
  const { chunks, images } = chunkSections(sections, {
    docTitle,
    docSlug: slug,
    sourceUrl: fetchManifest.sourceUrl,
    retrievedAt,
    sourceUpdatedAt,
    imageId,
  });
  for (const img of images) {
    const hit = byUrl.get(img.source_url);
    img.file = hit?.file ?? null;
    img.bytes = hit?.bytes ?? null;
  }

  // Images that the parser placed in no chunk (should be none) still go to the manifest.
  const placed = new Set(images.map((i) => i.source_url));
  const unplaced = article.blocks.filter((b): b is Extract<Block, { kind: "image" }> => b.kind === "image" && !placed.has(b.src));

  const sectionPathAt = (blockIndex: number) => {
    let best = sections[0];
    for (const s of sections) if (s.startIndex <= blockIndex) best = s;
    return best?.path.join(" > ") ?? docTitle;
  };
  const videos = article.blocks.flatMap((b, i) => (b.kind === "video" ? [{ src: b.src, section_path: sectionPathAt(i) }] : []));
  const outboundLinks = article.blocks.flatMap((b, i) =>
    "links" in b ? b.links.map((l) => ({ text: l.text, url: l.url, section_path: sectionPathAt(i) })) : []
  );

  const manifest: ManualManifest = {
    kind: "manual-manifest",
    doc_title: docTitle,
    doc_slug: slug,
    source_url: fetchManifest.sourceUrl,
    source_updated_at: sourceUpdatedAt,
    retrieved_at: fetchManifest.fetchedAt,
    built_at: new Date().toISOString(),
    snapshot_html: `${slug}.snapshot.html`,
    extracted_text: `${slug}.txt`,
    chunks_file: "chunks.jsonl",
    chunk_count: chunks.length,
    image_count: images.length + unplaced.length,
    images: [
      ...images,
      ...unplaced.map((b, i) => ({
        id: imageId(b.src),
        source_url: b.src,
        file: byUrl.get(b.src)?.file ?? null,
        alt: b.alt,
        caption: b.alt,
        section_path: sectionPathAt(article.blocks.indexOf(b)),
        chunk_ids: [],
        block_index: article.blocks.indexOf(b) + i * 0,
        width: b.width,
        height: b.height,
        bytes: byUrl.get(b.src)?.bytes ?? null,
      })),
    ],
    videos,
    related_articles: article.relatedArticles.map((l) => ({ title: l.text, url: l.url })),
    outbound_links: outboundLinks,
  };

  // ---- readable HTML snapshot -------------------------------------------------
  const imgTag = (b: Extract<Block, { kind: "image" }>) => {
    const meta = manifest.images.find((i) => i.source_url === b.src);
    const src = meta?.file ?? b.src;
    const cap = meta?.caption || meta?.alt || "";
    return `<figure id="${esc(meta?.id ?? "")}"><img src="${esc(src)}" alt="${esc(b.alt)}" loading="lazy">${
      cap ? `<figcaption>${esc(cap)}</figcaption>` : ""
    }<figcaption class="src">${esc(meta?.id ?? "")} · <a href="${esc(b.src)}" rel="noreferrer">original URL</a>${meta?.file ? "" : " (not downloaded)"}</figcaption></figure>`;
  };
  const inline = (text: string, links: { text: string; url: string }[]) => {
    let out = esc(text).replace(/\n/g, "<br>");
    for (const l of links) {
      const t = esc(l.text);
      if (t && out.includes(t)) out = out.replace(t, `<a href="${esc(l.url)}" rel="noreferrer">${t}</a>`);
    }
    return out;
  };
  const renderList = (items: string[], ordered: boolean, links: { text: string; url: string }[]) => {
    let out = "";
    let depth = -1;
    const open = (d: number) => {
      while (depth < d) {
        out += ordered && depth === -1 ? "<ol>" : "<ul>";
        depth++;
      }
    };
    const closeTo = (d: number) => {
      while (depth > d) {
        out += ordered && depth === 0 ? "</ol>" : "</ul>";
        depth--;
      }
    };
    for (const it of items) {
      const d = Math.floor((it.match(/^ */)?.[0].length ?? 0) / 2);
      if (d > depth) open(d);
      else closeTo(d);
      out += `<li>${inline(it.trim(), links)}</li>`; // multi-line items keep their <br>s via inline()
    }
    closeTo(-1);
    return out;
  };
  const bodyHtml = article.blocks
    .map((b) => {
      switch (b.kind) {
        case "heading":
          return `<h${b.level + 1}${b.anchor ? ` id="${esc(b.anchor)}"` : ""}>${esc(b.text)}</h${b.level + 1}>`;
        case "paragraph":
          return `<p${b.emphasis ? ' class="em"' : ""}>${inline(b.text, b.links)}</p>`;
        case "list":
          return renderList(b.items, b.ordered, b.links);
        case "callout":
          return `<aside class="callout">${inline(b.text, b.links)}</aside>`;
        case "image":
          return imgTag(b);
        case "video":
          return `<p class="video">Embedded video (not downloaded): <a href="${esc(b.src)}" rel="noreferrer">${esc(b.src)}</a></p>`;
      }
    })
    .join("\n");
  const snapshotHtml = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(docTitle)} — source snapshot</title>
<style>
:root{color-scheme:light dark;--fg:#1a1a1a;--bg:#fff;--muted:#666;--line:#ddd;--note:#f4f1ea;--banner:#fff6d6}
@media(prefers-color-scheme:dark){:root{--fg:#eee;--bg:#111;--muted:#aaa;--line:#333;--note:#1e1c17;--banner:#2a2410}}
body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif}
main{max-width:860px;margin:0 auto;padding:16px 16px 64px}
.banner{background:var(--banner);border:1px solid var(--line);border-radius:8px;padding:12px 16px;margin:16px 0 32px;font-size:14px}
.banner strong{display:block;font-size:13px;letter-spacing:.06em;text-transform:uppercase;margin-bottom:4px}
h1{font-size:2rem;margin:.6em 0 .3em}h2{font-size:1.5rem;margin:2em 0 .4em;border-top:1px solid var(--line);padding-top:1em}
h3{font-size:1.2rem;margin:1.6em 0 .3em}h4{font-size:1.05rem;margin:1.3em 0 .3em}
figure{margin:1.2em 0}figure img{max-width:100%;height:auto;border:1px solid var(--line);border-radius:6px;display:block}
figcaption{font-size:13px;color:var(--muted);margin-top:4px}figcaption.src{font-size:12px}
aside.callout{background:var(--note);border-left:3px solid #c9a227;padding:10px 14px;margin:1em 0;border-radius:4px}
p.em{color:var(--muted);font-style:italic}p.video{color:var(--muted)}
a{color:inherit}
</style></head><body><main>
<div class="banner"><strong>Source snapshot</strong>
Downloaded copy of the official MultiTracks help-center article, kept for the Playback support knowledge base. Not affiliated with MultiTracks.com.<br>
Source: <a href="${esc(fetchManifest.sourceUrl)}">${esc(fetchManifest.sourceUrl)}</a><br>
Article last updated (per source page): ${esc(sourceUpdatedAt)}${article.author ? ` · Written by ${esc(article.author)}` : ""}<br>
Downloaded: ${esc(fetchManifest.fetchedAt)} · ${manifest.image_count} screenshots saved locally in <code>images/</code> (the original image URLs are signed and expire).<br>
${esc(article.description)}
</div>
<h1>${esc(docTitle)}</h1>
${bodyHtml}
</main></body></html>
`;

  // ---- extracted text -----------------------------------------------------------
  const textLines: string[] = [
    `${docTitle}`,
    `Source snapshot of ${fetchManifest.sourceUrl}`,
    `Article last updated: ${sourceUpdatedAt}. Downloaded: ${fetchManifest.fetchedAt}.`,
    `Images are referenced as [Image img-NN] and stored in images/ (see manual-manifest.json).`,
    "",
  ];
  for (const b of article.blocks) {
    switch (b.kind) {
      case "heading":
        textLines.push("", `${"#".repeat(b.level + 1)} ${b.text}`, "");
        break;
      case "paragraph":
        textLines.push(b.text, "");
        break;
      case "list":
        textLines.push(...renderItems(b.items, b.ordered), "");
        break;
      case "callout":
        textLines.push(`> ${b.text.replace(/\n/g, "\n> ")}`, "");
        break;
      case "image": {
        const meta = manifest.images.find((i) => i.source_url === b.src);
        textLines.push(`[Image ${meta?.id ?? "?"}${b.alt ? `: ${b.alt}` : ""}]`, "");
        break;
      }
      case "video":
        textLines.push(`[Video: ${b.src}]`, "");
    }
  }
  const extractedText = textLines.join("\n").replace(/\n{3,}/g, "\n\n");

  const report = {
    doc_title: docTitle,
    source_url: fetchManifest.sourceUrl,
    source_updated_at: sourceUpdatedAt,
    retrieved_at: fetchManifest.fetchedAt,
    blocks: article.blocks.length,
    block_kinds: article.blocks.reduce<Record<string, number>>((m, b) => ((m[b.kind] = (m[b.kind] ?? 0) + 1), m), {}),
    sections: sections.length,
    chunks: chunks.length,
    chunk_chars: { min: Math.min(...chunks.map((c) => c.char_count)), max: Math.max(...chunks.map((c) => c.char_count)), avg: Math.round(chunks.reduce((a, c) => a + c.char_count, 0) / chunks.length) },
    by_scope: chunks.reduce<Record<string, number>>((m, c) => ((m[c.scope] = (m[c.scope] ?? 0) + 1), m), {}),
    by_category: chunks.reduce<Record<string, number>>((m, c) => ((m[c.category] = (m[c.category] ?? 0) + 1), m), {}),
    images: manifest.image_count,
    images_in_chunks: images.length,
    images_without_file: manifest.images.filter((i) => !i.file).length,
    extracted_text_chars: extractedText.length,
    chunk_list: chunks.map((c) => ({ id: c.id, chars: c.char_count, scope: c.scope, category: c.category, images: c.image_count, path: c.section_path })),
  };

  await writeFile(path.join(dir, `${slug}.snapshot.html`), snapshotHtml);
  await writeFile(path.join(dir, `${slug}.txt`), extractedText);
  await writeFile(path.join(dir, "chunks.jsonl"), chunks.map((c) => JSON.stringify(c)).join("\n") + "\n");
  await writeFile(path.join(dir, "manual-manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
  await writeFile(path.join(dir, "build-report.json"), JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify({ ...report, chunk_list: undefined }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
