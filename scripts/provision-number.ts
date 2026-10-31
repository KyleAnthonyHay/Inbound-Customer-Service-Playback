/**
 * Gives the saved assistant an inbound phone number, so callers can dial it.
 *
 * Usage: npm run provision:number
 * Requires: VAPI_PRIVATE_KEY and NEXT_PUBLIC_VAPI_ASSISTANT_ID (run `npm run sync:assistant` first).
 * Optional: VAPI_NUMBER_AREA_CODE (e.g. 512) for a free Vapi number in that area code.
 * Optional, to use your own Twilio number instead: TWILIO_PHONE_NUMBER (E.164),
 *           TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN.
 *
 * Safe to re-run: if a number already points at the assistant it is reused;
 * an existing number for the same Twilio line is re-pointed instead of duplicated.
 */
const key = process.env.VAPI_PRIVATE_KEY;
const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;
if (!key || !assistantId) {
  console.error("Set VAPI_PRIVATE_KEY and NEXT_PUBLIC_VAPI_ASSISTANT_ID in .env.local (npm run sync:assistant creates the assistant).");
  process.exit(1);
}

type PhoneNumber = { id: string; number?: string; sipUri?: string; provider: string; assistantId?: string; status?: string };

async function vapi<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`https://api.vapi.ai${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Vapi ${init.method ?? "GET"} ${path} failed (${res.status}): ${JSON.stringify(body)}`);
  return body as T;
}

function done(n: PhoneNumber, verb: string) {
  const number = n.number ?? "(number still being assigned; re-run in a minute)";
  console.log(`${verb} ${number} -> assistant ${assistantId} [${n.provider}${n.status ? `, ${n.status}` : ""}]`);
  if (n.number) console.log(`Add NEXT_PUBLIC_INBOUND_NUMBER=${n.number} to .env.local (and your hosting env) to show it on the landing page.`);
}

async function main() {
  const existing = await vapi<PhoneNumber[]>("/phone-number?limit=100");
  const twilioNumber = process.env.TWILIO_PHONE_NUMBER;

  const attached = existing.find((n) => n.assistantId === assistantId && (!twilioNumber || n.number === twilioNumber));
  if (attached) return done(attached, "Already attached:");

  if (twilioNumber) {
    const same = existing.find((n) => n.number === twilioNumber);
    if (same) {
      const n = await vapi<PhoneNumber>(`/phone-number/${same.id}`, { method: "PATCH", body: JSON.stringify({ assistantId }) });
      return done(n, "Re-pointed");
    }
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    if (!sid || !token) throw new Error("TWILIO_PHONE_NUMBER is set, so TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are needed too.");
    const n = await vapi<PhoneNumber>("/phone-number", {
      method: "POST",
      body: JSON.stringify({ provider: "twilio", number: twilioNumber, twilioAccountSid: sid, twilioAuthToken: token, assistantId, name: "Playback Support (demo)" }),
    });
    return done(n, "Imported");
  }

  const areaCode = process.env.VAPI_NUMBER_AREA_CODE;
  const n = await vapi<PhoneNumber>("/phone-number", {
    method: "POST",
    body: JSON.stringify({ provider: "vapi", assistantId, name: "Playback Support (demo)", ...(areaCode ? { numberDesiredAreaCode: areaCode } : {}) }),
  });
  done(n, "Created");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
