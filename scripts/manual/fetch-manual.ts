/**
 * Step 1 of the manual ingestion: download the official Playback User Guide
 * exactly as served (HTML + every image it references) into a source snapshot.
 *
 *   npm run manual:fetch            (default URL below)
 *   npm run manual:fetch -- <url>   (another help-center article)
 *
 * Writes docs/source-snapshots/playback-user-guide/
 *   raw/article.html      the page as served, untouched
 *   images/NN-<hash>.<ext> every <img>/<source> it references, bytes untouched
 *   fetch-manifest.json   source URL, fetch time, HTTP status, per-image status and local path
 *
 * No parsing or chunking happens here; that is scripts/manual/build-snapshot.ts,
 * which works from the saved files so the parse can be re-run offline.
 * Needs network access to helpcenter.multitracks.com and downloads.intercomcdn.com
 * (blocked from the cloud dev container; run from a laptop).
 */
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const DEFAULT_URL = "https://helpcenter.multitracks.com/en/articles/4944485-playback-user-guide";
const url = process.argv[2] ?? DEFAULT_URL;
const slug = url.split("/").pop()?.replace(/^\d+-/, "") ?? "article";
const outDir = path.join("docs", "source-snapshots", slug);
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15";

type ImageEntry = { index: number; url: string; status: number; contentType?: string; bytes?: number; file?: string; error?: string };

function extFor(contentType: string | undefined, url: string) {
  const fromType = contentType?.split(";")[0].trim();
  const map: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/gif": "gif", "image/webp": "webp", "image/svg+xml": "svg" };
  if (fromType && map[fromType]) return map[fromType];
  const m = url.match(/\.(png|jpe?g|gif|webp|svg)(?:[?#]|$)/i);
  return m ? m[1].toLowerCase().replace("jpeg", "jpg") : "bin";
}

/** Every image URL the page references, in document order, de-duplicated. */
function imageUrls(html: string, base: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const add = (raw: string | undefined) => {
    if (!raw) return;
    let abs: string;
    try {
      abs = new URL(raw.trim(), base).toString();
    } catch {
      return;
    }
    if (abs.startsWith("data:") || seen.has(abs)) return;
    seen.add(abs);
    out.push(abs);
  };
  for (const m of html.matchAll(/<(?:img|source)\b[^>]*>/gi)) {
    const tag = m[0];
    add(tag.match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1]);
    const srcset = tag.match(/\bsrcset\s*=\s*["']([^"']+)["']/i)?.[1];
    if (srcset) for (const part of srcset.split(",")) add(part.trim().split(/\s+/)[0]);
  }
  return out;
}

async function main() {
  const fetchedAt = new Date().toISOString();
  console.log(`Fetching ${url}`);
  const res = await fetch(url, { headers: { "user-agent": UA, accept: "text/html,application/xhtml+xml" }, redirect: "follow" });
  const html = await res.text();
  if (!res.ok) {
    console.error(`HTTP ${res.status} for ${url}`);
    process.exit(1);
  }
  await mkdir(path.join(outDir, "raw"), { recursive: true });
  await mkdir(path.join(outDir, "images"), { recursive: true });
  await writeFile(path.join(outDir, "raw", "article.html"), html);
  console.log(`Saved raw/article.html (${html.length} chars, HTTP ${res.status}, final URL ${res.url})`);

  const urls = imageUrls(html, res.url || url);
  console.log(`Found ${urls.length} image URL(s)`);
  const images: ImageEntry[] = [];
  for (const [i, imgUrl] of urls.entries()) {
    const entry: ImageEntry = { index: i + 1, url: imgUrl, status: 0 };
    try {
      const r = await fetch(imgUrl, { headers: { "user-agent": UA, referer: url } });
      entry.status = r.status;
      if (r.ok) {
        const buf = Buffer.from(await r.arrayBuffer());
        const contentType = r.headers.get("content-type") ?? undefined;
        const hash = createHash("sha1").update(imgUrl).digest("hex").slice(0, 10);
        const file = `images/${String(i + 1).padStart(2, "0")}-${hash}.${extFor(contentType, imgUrl)}`;
        await writeFile(path.join(outDir, file), buf);
        Object.assign(entry, { contentType, bytes: buf.length, file });
        console.log(`  ok   ${file} (${buf.length} B) <- ${imgUrl}`);
      } else {
        console.log(`  FAIL HTTP ${r.status} <- ${imgUrl}`);
      }
    } catch (e) {
      entry.error = e instanceof Error ? e.message : String(e);
      console.log(`  FAIL ${entry.error} <- ${imgUrl}`);
    }
    images.push(entry);
  }

  const manifest = {
    kind: "source-snapshot",
    sourceUrl: url,
    finalUrl: res.url || url,
    fetchedAt,
    httpStatus: res.status,
    htmlFile: "raw/article.html",
    htmlChars: html.length,
    imageCount: urls.length,
    imagesSaved: images.filter((x) => x.file).length,
    images,
  };
  await writeFile(path.join(outDir, "fetch-manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
  console.log(`Wrote ${path.join(outDir, "fetch-manifest.json")}: ${manifest.imagesSaved}/${manifest.imageCount} images saved`);
  if (manifest.imagesSaved !== manifest.imageCount) process.exitCode = 2;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
