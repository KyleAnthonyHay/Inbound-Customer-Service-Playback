/**
 * Upserts the saved Vapi assistant from the shared definition so the browser
 * demo and the inbound phone number use identical instructions and tools.
 *
 * Usage: npm run sync:assistant        (dev pair, .env.local)
 *        npm run sync:assistant:prod   (prod pair, .env.production.local)
 * Requires: VAPI_PRIVATE_KEY, NEXT_PUBLIC_CONVEX_SITE_URL, optional VAPI_TOOL_SECRET,
 *           optional NEXT_PUBLIC_VAPI_ASSISTANT_ID (to update instead of create),
 *           optional VAPI_ASSISTANT_NAME ("Playback Support (dev)" / "(prod)").
 * Dev and prod assistants are built from the same definition; only the webhook URLs, secret
 * and name differ, so `npm run release` keeps prod identical to what was tested on dev.
 */
import { buildAssistant } from "../src/lib/assistant";

const key = process.env.VAPI_PRIVATE_KEY;
const siteUrl = process.env.NEXT_PUBLIC_CONVEX_SITE_URL ?? "";
if (!key) {
  console.error("Set VAPI_PRIVATE_KEY in .env.local");
  process.exit(1);
}
if (!siteUrl) console.warn("NEXT_PUBLIC_CONVEX_SITE_URL is empty: syncing with endCall only (no webhook tools).");
const assistant = buildAssistant({
  toolServerUrl: siteUrl ? `${siteUrl.replace(/\/$/, "")}/vapi/tools` : "",
  toolSecret: process.env.VAPI_TOOL_SECRET,
  name: process.env.VAPI_ASSISTANT_NAME,
});
const id = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;

async function main() {
// Preserve recordings, saved output IDs and unrelated inline outputs on repeated syncs.
let artifactPlan: Record<string, unknown> = {};
if (id) {
  const existing = await fetch(`https://api.vapi.ai/assistant/${id}`, { headers: { Authorization: `Bearer ${key}` } });
  if (!existing.ok) throw Error(`Cannot read assistant before sync: HTTP ${existing.status}`);
  const saved = await existing.json() as { artifactPlan?: Record<string, unknown> };
  artifactPlan = saved.artifactPlan ?? {};
}
const outputs = Array.isArray(artifactPlan.structuredOutputs) ? artifactPlan.structuredOutputs as Array<{ name?: string }> : [];
const newNames = new Set(assistant.artifactPlan.structuredOutputs.map(o => o.name));
const res = await fetch(`https://api.vapi.ai/assistant${id ? `/${id}` : ""}`, {
  method: id ? "PATCH" : "POST",
  headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
  body: JSON.stringify({ ...assistant, artifactPlan: { ...artifactPlan, ...assistant.artifactPlan,
    structuredOutputs: [...outputs.filter(o => !o.name || !newNames.has(o.name)), ...assistant.artifactPlan.structuredOutputs] } }),
});
const body = await res.json();
if (!res.ok) {
  console.error("Vapi sync rejected: HTTP", res.status);
  process.exit(1);
}
console.log(`${id ? "Updated" : "Created"} assistant ${body.id} (${body.name}) -> ${siteUrl || "no webhook"}`);
if (!id) console.log(`Add NEXT_PUBLIC_VAPI_ASSISTANT_ID=${body.id} to the env file you synced with.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
