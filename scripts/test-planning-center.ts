import { test } from "node:test";
import assert from "node:assert/strict";
import { DEMO_ORGANIZATION_NAME, getPlanningCenterServiceContext } from "../src/lib/tools/planningCenter";
import { buildToolDefinitions } from "../src/lib/vapiTools";
import { SYSTEM_PROMPT } from "../src/lib/assistant";
import { TOOL_META } from "../src/lib/tools/meta";

// All IDs, schedules, songs and credentials below are MOCKS, never actual API results.
const config = { applicationId: "mock-app", secret: "mock-secret", organizationId: "900001", serviceTypeId: "900002", userAgent: "Regal Playback Demo (https://playback-support.vercel.app)" };
const now = () => Date.parse("2026-11-02T12:00:00Z");
const r = (type: string, id: string, attributes: Record<string, unknown>, relationships = {}) => ({ type, id, attributes, relationships });
const org = r("Organization", config.organizationId, { name: DEMO_ORGANIZATION_NAME, time_zone: "America/New_York", secret: "private-org-setting", owner_name: "DO NOT RETURN" });
const plan = r("Plan", "900003", { title: "Fictional Sunday Service", sort_date: "2026-11-08T14:00:00Z", dates: "Nov 8, 2026" });
const serviceTime = r("PlanTime", "900004", { starts_at: "2026-11-08T15:00:00Z", time_type: "service" });
const song = r("Item", "900005", { item_type: "song", title: "Fictional Morning Light", sequence: 2, key_name: "D" }, {
  song: { data: { type: "Song", id: "900006" } }, arrangement: { data: { type: "Arrangement", id: "900007" } },
});
const included = [r("Song", "900006", { title: "Fictional Morning Light", lyrics: "not returned" }), r("Arrangement", "900007", { name: "Demo arrangement" })];
const baseline = () => [{ data: org }, { data: [plan] }, { data: [serviceTime] }, { data: [song, r("Item", "900008", { item_type: "header", title: "Welcome" })], included }];
type Reply = { body: unknown; status?: number; headers?: Record<string, string> };
function harness(replies: Reply[]) {
  const requests: Array<{ url: string; init?: RequestInit }> = [];
  const fetcher = (async (url, init) => {
    requests.push({ url: String(url), init });
    const reply = replies.shift();
    assert.ok(reply, "Unexpected extra network request");
    return new Response(JSON.stringify(reply.body), { status: reply.status ?? 200, headers: reply.headers });
  }) as typeof fetch;
  return { requests, run: () => getPlanningCenterServiceContext({ config, now, fetcher }) };
}
const mock = (bodies = baseline()) => harness(bodies.map(body => ({ body })));

test("Planning Center mock: actual-API provenance, fictional content, ordered songs and service start (not plan sort date)", async () => {
  const h = mock();
  const result = await h.run();
  assert.ok(result.ok);
  if (!result.ok) return;
  assert.equal(result.source, "live");
  assert.equal(result.fictionalData, true);
  assert.equal(result.service.startsAt, serviceTime.attributes.starts_at);
  assert.equal(result.songs.length, 1);
  assert.deepEqual(result.songs[0], { itemId: "900005", songId: "900006", title: "Fictional Morning Light", key: "D", arrangement: "Demo arrangement", sequence: 2 });
  assert.match(result.warnings.join(" "), /does not verify/);
  assert.doesNotMatch(JSON.stringify(result), /mock-secret|private-org-setting|DO NOT RETURN|lyrics/);
  assert.equal(h.requests.length, 4);
  for (const req of h.requests) {
    assert.equal(req.init?.method, "GET");
    assert.equal(req.init?.cache, "no-store");
    assert.equal(req.init?.redirect, "error");
    const headers = new Headers(req.init?.headers);
    assert.equal(headers.get("authorization"), `Basic ${btoa("mock-app:mock-secret")}`);
    assert.equal(headers.get("user-agent"), config.userAgent);
    assert.equal(headers.get("x-pco-api-version"), "2018-11-01");
    assert.ok(req.url.startsWith("https://api.planningcenteronline.com/services/v2"));
  }
});

test("Planning Center mock: missing configuration makes no request", async () => {
  let calls = 0;
  const result = await getPlanningCenterServiceContext({ config: { ...config, secret: "" }, fetcher: async () => { calls++; throw Error(); } });
  assert.equal(result.ok, false);
  assert.equal("reason" in result && result.reason, "not-configured");
  assert.equal(calls, 0);
});

for (const attrs of [{ ...org, id: "999999" }, { ...org, attributes: { name: "Unrelated real church" } }]) {
  test(`Planning Center mock: organization mismatch stops before plan reads (${attrs.id})`, async () => {
    const h = harness([{ body: { data: attrs } }]);
    const result = await h.run();
    assert.equal(result.ok, false);
    assert.equal("reason" in result && result.reason, "organization-mismatch");
    assert.equal(h.requests.length, 1);
    assert.doesNotMatch(JSON.stringify(result), /Unrelated real church/);
  });
}

for (const [status, reason] of [[401, "unauthorized"], [403, "forbidden"], [404, "not-found"], [503, "upstream-unavailable"]] as const) {
  test(`Planning Center mock: HTTP ${status} fails safely`, async () => {
    const h = harness([{ body: { error: "mock-secret private upstream details" }, status }]);
    const result = await h.run();
    assert.equal("reason" in result && result.reason, reason);
    assert.equal("status" in result && result.status, status);
    assert.equal(h.requests.length, 1);
    assert.doesNotMatch(JSON.stringify(result), /mock-secret|private upstream/);
  });
}

test("Planning Center mock: Retry-After is surfaced without immediate retries", async () => {
  const h = harness([{ body: {}, status: 429, headers: { "Retry-After": "37", "X-PCO-API-Request-Rate-Limit": "7", "X-PCO-API-Request-Rate-Count": "8", "X-PCO-API-Request-Rate-Period": "40 seconds" } }]);
  const result = await h.run();
  assert.equal("reason" in result && result.reason, "rate-limited");
  assert.equal("retryAt" in result && result.retryAt, new Date(now() + 37000).toISOString());
  assert.equal(result.rateLimit?.limit, 7);
  assert.equal(h.requests.length, 1);
});

test("Planning Center mock: HTTP-date Retry-After is honored", async () => {
  const h = harness([{ body: {}, status: 429, headers: { "Retry-After": new Date(now() + 15000).toUTCString() } }]);
  const result = await h.run();
  assert.equal(result.rateLimit?.retryAfterSeconds, 15);
});

test("Planning Center mock: successful response exhausting dynamic quota prevents next request", async () => {
  const h = harness([{ body: { data: org }, headers: { "X-PCO-API-Request-Rate-Limit": "2", "X-PCO-API-Request-Rate-Count": "2", "X-PCO-API-Request-Rate-Period": "9 seconds" } }]);
  const result = await h.run();
  assert.equal("reason" in result && result.reason, "rate-limited");
  assert.equal("retryAt" in result && result.retryAt, new Date(now() + 9000).toISOString());
  assert.equal(h.requests.length, 1);
});

test("Planning Center mock: empty upcoming plans returns a gap without fixtures", async () => {
  const h = harness([{ body: { data: org } }, { body: { data: [] } }]);
  const result = await h.run();
  assert.equal("reason" in result && result.reason, "no-upcoming-plan");
  assert.equal(h.requests.length, 2);
});

test("Planning Center mock: numeric rate period from verified real response is honored", async () => {
  const h = harness([{ body: { data: org }, headers: { "X-PCO-API-Request-Rate-Limit": "100", "X-PCO-API-Request-Rate-Count": "100", "X-PCO-API-Request-Rate-Period": "20" } }]);
  const result = await h.run();
  assert.equal("reason" in result && result.reason, "rate-limited");
  assert.equal("retryAt" in result && result.retryAt, new Date(now() + 20000).toISOString());
  assert.equal(h.requests.length, 1);
});

test("Planning Center mock: rehearsal times are not reported as a service", async () => {
  const h = harness([{ body: { data: org } }, { body: { data: [plan] } }, { body: { data: [r("PlanTime", "900009", { starts_at: "2026-11-08T14:00:00Z", time_type: "rehearsal" })] } }]);
  const result = await h.run();
  assert.equal("reason" in result && result.reason, "missing-service-time");
});

test("Planning Center mock: empty song list and missing metadata remain explicit", async () => {
  const bodies = baseline();
  bodies[3] = { data: [], included: [] };
  const result = await mock(bodies).run();
  assert.ok(result.ok);
  if (!result.ok) return;
  assert.equal(result.songs.length, 0);
  assert.match(result.warnings.join(" "), /no song items/);
});

test("Planning Center mock: earliest actual service chosen across multi-time plans, with song order preserved", async () => {
  const laterPlan = r("Plan", "900010", { title: "Second fictional plan", sort_date: "2026-11-09T12:00:00Z" });
  const earlierTime = r("PlanTime", "900011", { starts_at: "2026-11-07T15:00:00Z", time_type: "service" });
  const firstSong = { ...song, id: "900012", attributes: { ...song.attributes, sequence: 1 } };
  const h = harness([{ body: { data: org } }, { body: { data: [laterPlan, plan] } }, { body: { data: [serviceTime] } }, { body: { data: [earlierTime] } }, { body: { data: [song, firstSong], included } }]);
  const result = await h.run();
  assert.ok(result.ok);
  if (!result.ok) return;
  assert.equal(result.service.planId, laterPlan.id);
  assert.equal(result.songs[0].itemId, "900012");
  assert.ok(h.requests[4].url.includes("/plans/900010/items"));
});

test("Planning Center mock: pagination retains scope and never follows an arbitrary next URL", async () => {
  const h = harness([{ body: { data: org } }, { body: { data: [], links: { next: "https://untrusted.example/steal-auth" } } }, ...baseline().slice(1).map(body => ({ body }))]);
  const result = await h.run();
  assert.ok(result.ok);
  assert.ok(h.requests[2].url.endsWith("per_page=100&offset=100"));
  assert.ok(h.requests.every(req => !req.url.includes("untrusted")));
});

test("Planning Center mock: malformed payload and unbounded data fail closed", async () => {
  const bad = harness([{ body: { data: { type: "Organization" } } }]);
  assert.equal("reason" in (await bad.run()), true);
  const large = harness([{ body: { data: org } }, { body: { data: Array.from({ length: 6 }, (_, i) => ({ ...plan, id: String(900020 + i) })) } }]);
  const result = await large.run();
  assert.equal("reason" in result && result.reason, "data-limit");
});

test("Planning Center mock: transport errors do not leak credentials", async () => {
  const result = await getPlanningCenterServiceContext({ config, now, fetcher: async () => { throw new Error("mock-secret Authorization Basic private"); } });
  assert.equal("reason" in result && result.reason, "upstream-unavailable");
  assert.doesNotMatch(JSON.stringify(result), /mock-secret|Authorization/);
});

test("Planning Center local wiring: parameter-free read tool, live label, bounded support prompt", () => {
  const defs = buildToolDefinitions({ serverUrl: "https://example.invalid/vapi/tools", secret: "mock-webhook-secret" });
  const def = defs.find(t => "function" in t && t.function.name === "get_planning_center_service_context");
  assert.ok(def && "function" in def);
  if (!def || !("function" in def)) return;
  assert.deepEqual(def.function.parameters.properties, {});
  assert.equal(TOOL_META.get_planning_center_service_context.source, "live");
  assert.match(SYSTEM_PROMPT, /fictional demo organization's Planning Center/);
  assert.match(SYSTEM_PROMPT, /do not silently substitute fixtures/);
  assert.match(SYSTEM_PROMPT, /not evidence of track ownership/);
  assert.doesNotMatch(JSON.stringify(def), /mock-app|mock-secret/);
});
