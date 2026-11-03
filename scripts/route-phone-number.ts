/**
 * Routes the live phone number through Convex so the web phone can mirror calls live.
 *
 * GPT-Live sends no in-progress webhook, so the number is set to ask Convex which assistant
 * answers (assistant-request to /vapi/events). Convex marks the call live and replies with
 * the prod assistant. `--revert` attaches the assistant to the number directly again.
 *
 * Usage: npx tsx --env-file=.env.production.local scripts/route-phone-number.ts [--revert] [--dry-run]
 * Requires: VAPI_PRIVATE_KEY, NEXT_PUBLIC_CONVEX_SITE_URL, VAPI_TOOL_SECRET,
 *           NEXT_PUBLIC_VAPI_ASSISTANT_ID; optional VAPI_PHONE_NUMBER (default +18782779342).
 */
const key = process.env.VAPI_PRIVATE_KEY;
const site = (process.env.NEXT_PUBLIC_CONVEX_SITE_URL ?? "").replace(/\/$/, "");
const secret = process.env.VAPI_TOOL_SECRET;
const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;
const number = process.env.VAPI_PHONE_NUMBER ?? "+18782779342";
const revert = process.argv.includes("--revert");
const dryRun = process.argv.includes("--dry-run");

type PhoneNumber = { id: string; number?: string; assistantId?: string | null; server?: { url?: string; headers?: Record<string, string> } };

async function vapi<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`https://api.vapi.ai${path}`, { ...init, headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" } });
  if (!res.ok) throw Error(`Vapi ${init?.method ?? "GET"} ${path}: HTTP ${res.status} ${await res.text()}`);
  return res.json() as Promise<T>;
}

const describe = (p: PhoneNumber) => `${p.number}: assistant ${p.assistantId ?? "none"}, server ${p.server?.url ?? "none"}`;

async function main() {
  if (!key || !site || !secret || !assistantId) throw Error("Set VAPI_PRIVATE_KEY, NEXT_PUBLIC_CONVEX_SITE_URL, VAPI_TOOL_SECRET and NEXT_PUBLIC_VAPI_ASSISTANT_ID");
  const phone = (await vapi<PhoneNumber[]>("/phone-number")).find(p => p.number === number);
  if (!phone) throw Error(`No Vapi phone number ${number}`);
  console.log(`Before: ${describe(phone)}`);
  const server = { url: `${site}/vapi/events`, timeoutSeconds: 10, headers: { "x-demo-secret": secret } };
  // Routed: no fixed assistant, so Vapi sends assistant-request to the server URL.
  const patch = revert ? { assistantId, server } : { assistantId: null, server };
  if (dryRun) return console.log(`Dry run, would PATCH ${JSON.stringify({ ...patch, server: { ...server, headers: { "x-demo-secret": "***" } } })}`);
  const after = await vapi<PhoneNumber>(`/phone-number/${phone.id}`, { method: "PATCH", body: JSON.stringify(patch) });
  console.log(`After:  ${describe(after)}`);
  if (!revert && after.assistantId) throw Error("Vapi kept the fixed assistant, so assistant-request will not be sent. Run with --revert to restore.");
}

main().catch(e => { console.error(e instanceof Error ? e.message : e); process.exit(1); });
