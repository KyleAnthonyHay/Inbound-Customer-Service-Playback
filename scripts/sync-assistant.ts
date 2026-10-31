/**
 * Upserts the saved Vapi assistant from the shared definition so the browser
 * demo and the inbound phone number use identical instructions and tools.
 *
 * Usage: npx tsx --env-file=.env.local scripts/sync-assistant.ts
 * Requires: VAPI_PRIVATE_KEY, NEXT_PUBLIC_CONVEX_SITE_URL, optional VAPI_TOOL_SECRET,
 *           optional NEXT_PUBLIC_VAPI_ASSISTANT_ID (to update instead of create).
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
});
const id = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;

async function main() {
const res = await fetch(`https://api.vapi.ai/assistant${id ? `/${id}` : ""}`, {
  method: id ? "PATCH" : "POST",
  headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
  body: JSON.stringify(assistant),
});
const body = await res.json();
if (!res.ok) {
  console.error("Vapi error", res.status, JSON.stringify(body, null, 2));
  process.exit(1);
}
console.log(`${id ? "Updated" : "Created"} assistant ${body.id}`);
if (!id) console.log(`Add NEXT_PUBLIC_VAPI_ASSISTANT_ID=${body.id} to .env.local`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
