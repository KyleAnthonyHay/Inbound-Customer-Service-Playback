# Playback Support Agent

Inbound AI voice support demo for MultiTracks **Playback**: helps callers fix
song-loading and audio-output problems before rehearsal or service. Built for
the Regal AI Product Specialist take-home. Not affiliated with MultiTracks.com.

## Stack

- Next.js 16 (App Router, TypeScript, Tailwind 4)
- Vapi (`@vapi-ai/web` for browser calls; GPT-Live `gpt-live-1` with OpenAI voice)
- Convex for synthetic demo data, bookings, and the live activity log
- Apple iTunes Lookup API (live, public) for current app version
- Planning Center Services API (server-side PAT, separate fictional demo org;
  demo service/songs created and a real read-only check verified locally)

## Run locally

```bash
npm install
cp .env.example .env.local   # fill in the values
npx convex dev               # first run creates/links the Convex deployment
npx convex run seed:run      # seed synthetic demo data
npm run dev
```

- `/` landing page
- `/call` iPhone-style call screen with a collapsible agent-activity panel

## Architecture

```
Browser (/call) ──@vapi-ai/web──▶ Vapi (GPT-Live) ──tool-calls──▶ Convex HTTP action  {site}/vapi/tools
      ▲                                                                 │ (convex/http.ts → convex/vapiTools.ts)
      │ live query callEvents.byCall                                    ├─ search_playback_docs            (bounded KB snapshot)
      └──────────────── Convex ◀── callEvents.log ◀─────────────────────┤─ get_current_playback_app_info   (LIVE Apple lookup)
                         │                                              ├─ get_relevant_changes_since_version (Apple + documented notes)
                         ├─ organizations / customers / orgSongs / teams / callbackSlots / callbacks (SIMULATED)
                         └─ lookup_demo_customer, check_song_access, check_team_availability, get_callback_slots, reserve_callback, initiate_handoff

The webhook lives on the Convex deployment, which is public as soon as `npx convex dev`
runs, so nothing needs deploying or tunnelling to test tools from a real call.
```

- `src/lib/assistant.ts`: the single assistant definition (prompt, model, tools) shared by browser and phone.
- `src/lib/vapiTools.ts`: function-tool schemas Vapi sends to the model.
- `convex/http.ts` + `convex/vapiTools.ts`: the webhook and tool implementations.
- `src/knowledge/playback-kb.json`: source-backed knowledge snapshot with URLs and retrieval dates.
- `convex/`: schema, seed, and functions. Every record is fictional and marked `simulated`.

## Playback User Guide in Pinecone

The official manual (helpcenter.multitracks.com, article 4944485) is a second
knowledge source next to the keyword KB. `search_playback_docs` returns both:
`results` (help-center snapshot, `src/knowledge/playback-kb.json`) and
`manual` (User Guide sections from Pinecone). Without Pinecone env vars the
manual part returns `{ ok: false, reason: "not-configured" }` and the tool
keeps working on the keyword KB alone.

Pipeline (all under `scripts/manual/`, outputs in `docs/source-snapshots/playback-user-guide/`):

| Step | Command | Output |
|---|---|---|
| 1 Download (needs a laptop; the cloud sandbox blocks the help center) | `npm run manual:fetch` | `raw/article.html`, `images/`, `fetch-manifest.json` |
| 2 Build, offline | `npm run manual:build` | `*.snapshot.html` (readable, labelled source snapshot, screenshots in place), `*.txt` (extracted text), `chunks.jsonl`, `manual-manifest.json`, `build-report.json` |
| 3 Index | `npm run manual:index` (`--dry-run`, `--prune`) | Pinecone index + `index-report.json` |
| 4 Validate | `npm run manual:eval` | `retrieval-report.json` (real caller questions vs expected sections) |

- Chunks are one per leaf heading (title + heading path on every chunk), split
  only between blocks so steps, lead-ins and notes stay together; ~630 chars
  average, under 1,200 (96 chunks).
- Text only is embedded (Pinecone integrated `llama-text-embed-v2`, field
  `text`). Screenshots are never embedded or stored as binaries: a chunk carries
  `image_ids`, and `manual-manifest.json` maps each id to source URL, local
  file, caption, section and chunk ids.
- Every chunk is tagged `scope` (in-scope / adjacent / out-of-scope) and
  `category`, so retrieval can cite the manual without widening support scope
  (song loading, audio output, bounded first-time setup). Out-of-scope hits come
  back as titles under `manual.outOfScope`.
- Env: `PINECONE_API_KEY`, `PINECONE_INDEX` (default `playback-support-kb`),
  `PINECONE_NAMESPACE` (default `playback-user-guide`) for the scripts;
  `PINECONE_API_KEY`, `PINECONE_INDEX_HOST`, `PINECONE_NAMESPACE` on the Convex
  deployment (`npx convex env set …`) for the live tool. Starter (free) plan,
  aws/us-east-1. The index script never deletes an index; `--prune` only removes
  stale ids of this document.

## Vapi configuration

- `NEXT_PUBLIC_VAPI_PUBLIC_KEY`: Vapi public key (browser-safe).
- `NEXT_PUBLIC_VAPI_ASSISTANT_ID`: optional saved assistant. When blank, `/call`
  starts an inline assistant with the same definition. Inline mode cannot carry
  the tool secret, so leave `VAPI_TOOL_SECRET` empty in that mode.
- `NEXT_PUBLIC_CONVEX_SITE_URL`: Convex HTTP base; the tool webhook is
  `{site}/vapi/tools`. Set `VAPI_TOOL_SECRET` both locally and on the
  deployment (`npx convex env set VAPI_TOOL_SECRET …`).
- `npm run sync:assistant` creates/updates the saved assistant from code
  (needs `VAPI_PRIVATE_KEY`, server-only).

Verified against Vapi docs (2026-10-30): GPT-Live does not support knowledge
bases or the Query tool; transfers are unsupported on browser calls; a spoken
goodbye does not end the call, so the `endCall` tool is attached.

## Handoff and transfer sound, per channel

- **Browser**: when `initiate_handoff` succeeds, the page plays a short transfer
  tone locally (Web Audio, `src/lib/cues.ts`: two beeps, then US ringback) and shows
  "Transferring…" on the phone screen. The assistant then says goodbye and
  calls `endCall`; if it has not ended the call 12 s after the handoff, the
  page ends it. Verified with the dev simulation at `/call?demo=1`.
- **Phone**: Vapi cannot play an audio file into a GPT-Live call and real
  transfers are blind-only on Twilio/Vapi SIP, which this demo does not use.
  The handoff is therefore spoken only, then `endCall`. This limitation is
  stated rather than worked around.

## Opening, "are you a robot?", and no unexplained silence

- The greeting introduces the agent as an AI and asks why the caller is calling. The reasoner prompt
  has an OPENING block ("are you a robot?" is answered honestly every time; "can I just speak to a
  human?" goes straight to the handoff flow with no troubleshooting first) and a COMMON CONCERNS block
  (live in service, losing songs or setlists, "I already tried that", cost/subscription, "can you see
  my screen?", "is this recorded?").
- GPT-Live's speaker must say one short transition line before every delegate/tool call ("Absolutely,
  let me pull that up. One moment please.", "Of course. Let me see who's available. One moment
  please." for human requests) and then stay quiet until the reasoner answers. The transfer line is
  "I'll transfer you to our support team now. One moment please. Thanks for calling!" followed by
  `endCall`. Tool `request-start` messages carry the same phrases; in voice calls GPT-Live does not
  speak them (only the speaker's line is heard), in the text test both appear.
- `scripts/voice-test.ts` prints a per-turn timing analysis (silence before the agent's first words,
  whether that was a transition line, the gap after it, and tool-call offsets). Runs on 2026-11-02
  (`docs/voice-tests/2026-11-02T19-4*` to `20-0*`) measured 0.2 to 0.6 s of silence after each caller
  turn (one 1.6 s), with the transition line covering the 1 to 4 s until the reasoner's answer.

## Call sounds and idle handling

Button cues (connected, mute, unmute, hang-up) are synthesized with the Web
Audio API in `src/lib/cues.ts`, ported from the portfolio's voice call; no
audio files or third-party sounds are used. The transfer cue is new.

Idle handling uses Vapi assistant hooks on `customer.speech.timeout`, timed
from the caller's last speech: a nudge at 120 s ("Hey, are you still there?")
and, at 150 s, a spoken goodbye followed by `endCall`. Both reset when the
caller speaks.

## Simulation boundaries

Transfers, support-team availability, callback slots, and customer records
are simulated. Bookings are saved in this demo's Convex database only and do
not reach MultiTracks' real support systems. The activity panel labels each
event as **Live API**, **Docs**, or **Simulated**.

## Synthetic accounts: organizations, subscriptions, song libraries

Account data is fictional and lives in `src/lib/demo/accounts.ts`, which both the Convex seed and the unit tests (`scripts/test-accounts.ts`) import, so the diagnosis logic is tested on the same rows that get seeded.

- **Lookup key is the six-digit Organization ID**, which Playback shows in Settings > About. The organization is where MultiTracks content is purchased and subscriptions are shared (User Guide, "Organizations vs. Users"), so it is the record that answers "did we buy this song" and "is our Cloud Pro active". Six digits are easy to say and transcribe on a phone call; a spoken email address is not. Email is the fallback for callers without the app open; the `DEMO-1001` customer IDs still work for the older scenarios.
- `organizations` hold the plan (`Cloud Pro`, `Cloud`, `Rentals`, `Intro`, `none`) and status (`active`, `past-due`, `expired`, `none`) with renewal, expiry, grace-period and rental-credit fields. `customers` carry a primary `orgId` and `memberships` (role plus the Playback Team Sharing and Rentals permissions from the org's People page). `orgSongs` is each organization's Library: purchased songs, rentals with expiry dates, uploaded Cloud Songs.
- `lookup_demo_customer` (by `orgId`, `email`, `customerId` or `name`) returns the organization, the caller's membership, other organizations they belong to, the library, and a `diagnosis` with a `next` hint: `active`, `past-due`, `expired`, `no-subscription`, `missing-team-sharing`, or `wrong-organization`.
- `check_song_access` (song title plus the same keys) answers whether that organization can load the tracks: `purchased`, `rental-active`, `cloud-song`, `rental-expired`, `click-guide-only` (subscription but never bought), `not-in-library`, or `blocked-permission`.
- The reasoner prompt tells the agent to check the account before giving download steps whenever the symptom smells like entitlement ("Unlock with Rental Credit", no tracks option, empty Library, payment warning), and not to run download troubleshooting on a song the organization cannot access.

| Org ID | Organization | Plan / status | Customer | Situation |
|--------|--------------|---------------|----------|-----------|
| 480113 | Riverbend Community Church | Cloud Pro, active | DEMO-1001 Jordan Avery (admin), DEMO-1005 Sam Okafor (member, no Team Sharing) | Active subscriber sees "Cloud Pro expired" (software); member blocked by permission; "Living Hope" never purchased |
| 517204 | Harbor Light Fellowship | Cloud Pro, expired 2026-09-02 | DEMO-1002 Priya Natarajan | Genuinely expired subscription |
| 362990 | Northgate Worship Collective | Cloud, active | DEMO-1003 Marcus Bell | Healthy; also Olivia's church org |
| 605781 | Grace Chapel | none | DEMO-1004 Elena Cruz | Purchased songs only; "Way Maker" not in library |
| 714318 | Cedar Ridge Church | Rentals, active, 0 credits | DEMO-1006 Tasha Reyes | Rental of "Build My Life" expired, no credits left |
| 829455 | Lakeside Youth Ministry | Cloud Pro, past-due (grace until 2026-11-11) | DEMO-1007 Daniel Kim | Payment failed, features still work |
| 931027 | Olivia Brennan (personal) | Intro, empty | DEMO-1008 Olivia Brennan | Signed into the wrong organization |

Org 480113 additionally includes the shared demo set's three songs as explicitly synthetic purchases, so its loading-recovery scenario is not an ownership failure. Planning Center does not verify those entitlements.

Re-seed with `npx convex run seed:run` (dev) or `npx convex run seed:run --prod`; the seed wipes and re-inserts these tables. Scenarios: `scripts/scenarios/song-not-purchased.json`, `rental-expired-no-credits.json`, `payment-past-due.json`, `missing-team-sharing-permission.json`, `wrong-organization.json`.

Planning Center's [integration plan and setup evidence](docs/planning-center-integration.md)
separate real API transport, the simulated service with catalog song metadata,
and mocked tests.
The new local `get_planning_center_service_context` tool reads only the explicitly
configured demo organization; synthetic customers do not select or authenticate
a church. A real PAT-authenticated read retrieved the November 8 service and its
three songs; credentials remain server-side in ignored local configuration and
the dev Convex environment. The dev backend and saved dev assistant are activated
and their tool webhook is verified; production is unchanged. `npm run planning-center:check -- --read-demo` performs a minimal
real GET-only verification without calls or simulations.

## Testing

See `docs/test-matrix.md` for the scenario matrix, metrics definitions, and results.

For quick implementation checks, `npm run text:test` runs an interactive terminal
conversation through Vapi Chat using the voice agent's shared reasoner definition
and tools. A scenario file can be passed for scripted text turns. This creates no
voice sessions, adds no UI, and needs no separate OpenAI key. Text token usage
still applies. Reports under `docs/text-tests/` are reasoning POCs, not voice-test
results. Jordan’s usability try-out is separate from the ten developer conversations.
See [the testing workflow](docs/conversation-test-plan.md).
The [conversation-friction review](docs/text-tests/conversation-friction-review.md)
records the current clarification/holding/closing changes and the remaining voice checks.

Jordan and Alex can use the [single quick try-out](docs/jordan-voice-tests.md).
The [updated ten-call sheet](docs/ten-call-scenarios.md) provides ordinary openings,
private background and clear success criteria without a fixed dialogue script.
The [latest test review](docs/text-tests/open-ended-review.md) records outcomes and
remaining quality findings.
The [open-ended test method](docs/open-ended-test-method.md) keeps the ten developer
situations conversational, with private caller goals, known/findable facts and
genuine unknowns. [Developer backgrounds](docs/curated-caller-worksheet.md) are
reviewer material, not a script to read to the agent. Start ten text conversations
with `npm run text:cases -- start <dir> scripts/text-cases/curated.json --first-opening`;
omit the flag for both phrasings. Inspect actual replies before adaptive follow-ups.

The combined `dev` build includes the structured version/update assessment,
shared Planning Center personalization, synthetic organization/song-access tools,
and Claude's voice identity/transition behavior. It is deployed to the development
backend and synced to the development saved assistant. Use the ordinary text
harness against these deployed tools; the temporary local proxy is optional for
future undeployed candidates. See the [activation record](docs/dev-integration/README.md)
and [manual voice test sheet](docs/dev-manual-tests.md).

## Scheduling and time zones

Callback scheduling is deliberately strict so the agent cannot substitute a time the caller did not ask for:

- `get_callback_slots` takes the caller's words (`preferredDate` "Monday", `preferredTime` "5 PM", `timeZone` "EST") and resolves them server-side in `convex/time.ts`. The result says whether **that exact time** is open (`requested.available`), why not if it isn't (`in-the-past`, `weekend`, `outside-hours`, `taken`, `no-slot`), the team's hours in the caller's zone, and the nearest open alternatives. Every slot carries a pre-formatted `local` string; the prompts tell the model to speak those and never convert zones itself (US DST ends 2026-11-01, so Monday callbacks in the demo window are EST while today is EDT).
- Team hours are defined in the team's own zone (`hours: { timeZone, start, end }` in `convex/seed.ts`); slots are generated from those, 30 minutes apart, weekdays only, with a few pre-reserved so "slot taken" is testable. Re-seed with `npx convex run seed:run`.
- The reasoner prompt requires: no "that works" before the tool confirms; if the requested time is unavailable, say so and why *before* offering alternatives.

## Caller ID on phone calls

On inbound phone calls Vapi attaches the caller's number to every webhook as `message.call.customer.number` and exposes it to the prompt as `{{customer.number}}`; browser calls have neither.

- The reasoner prompt has a "THIS CALL" block (`Channel: {{call.type}}. Caller ID: {{customer.number}}`) so the model knows which number it is talking to. Vapi fills the variables at call time; on web calls they render empty and the prompt says to ask for a number.
- `convex/http.ts` reads the number with `callInfoOf()` (`src/lib/tools/callerId.ts`) and passes it to every tool. `get_callback_slots` adds `callerId: { number, lastFour }` so the model can offer "the number you're calling from, ending in 4992"; `reserve_callback` accepts `callbackNumber: "caller-id"` and books that number. A browser call that tries "caller-id" gets `missing-number` and is told to ask.
- The number is stored on the call row (`calls.callerNumber`) and shown in Past calls and the live pill as "from +1 (929) 404-4992".
- After `reserve_callback` returns `ok=true` the result carries `next: "Confirm the callback ... then call endCall"` and the prompt tells the reasoner to confirm, wish the caller a good day, and hang up in the same turn. Transfers keep their own handoff flow.

## Tool visibility in the activity panel

Every tool row in the agent-activity panel can be expanded (click) to show the exact function name, the arguments Vapi sent, and the JSON the webhook returned (both truncated server-side, logged in `callEvents.args` / `callEvents.output`). Tool calls also appear inline in the live transcript at the moment they happened, so a transcript like "Agent: the next available slot is…" shows which tool produced it.

## Call history (Past calls)

The activity panel ends with a collapsed **Past calls** section, modeled on a chat app's conversation list: newest first, grouped by day, six rows before "Show all", a capped scroll area, and a two-step **Clear past calls** (confirm, then delete) that removes the calls, their transcripts and their tool events. Opening a row replays that call in the panel: its tool rail, stored transcript, and the end-of-call summary when Vapi produced one. Rows are disabled while a call is in progress.

Data comes from Vapi's assistant-level server messages, not the browser, so phone and harness calls are listed too. `buildAssistant()` sets `server.url` to `{CONVEX_SITE_URL}/vapi/events` with `serverMessages: ["status-update", "transcript[transcriptType=\"final\"]", "end-of-call-report"]`; `convex/http.ts` writes them to the `calls` and `transcripts` tables (`convex/calls.ts`). The tool webhook bumps each call's `toolCount`. A call row's title is the first thing the caller said.

## Environments: dev and prod are separate but identical

| | dev (local work) | prod (the public demo) |
|---|---|---|
| Convex deployment | `ceaseless-rhinoceros-106` (`npx convex dev`) | `earnest-alpaca-725` (`npx convex deploy`) |
| Vapi assistant | "Playback Support (dev)" | "Playback Support (prod)" |
| Env file | `.env.local` | `.env.production.local` (never committed) |
| Web app | `npm run dev` on localhost | https://playback-support.vercel.app (Vercel project `playback-support` (haykyle917 scope)) |
| Tool secret | dev Convex env `VAPI_TOOL_SECRET` | prod Convex env `VAPI_TOOL_SECRET` (different value) |

Both assistants are built from the same `buildAssistant()`; only the webhook URLs, the secret and the name differ. The phone number, when claimed, attaches to the prod assistant. Local testing (browser calls, `npm run voice:test`, `npm run sync:assistant`) touches only the dev pair, so the demo's call history and prompts stay untouched while you work.

**Releasing to prod is one command and must always be used, so the three parts never drift:**

```bash
npm run release
```

It type-checks, runs the tests, pushes the Convex functions to prod (`npx convex deploy`), syncs the prod assistant (`npm run sync:assistant:prod`), and deploys the site (`npx vercel --prod`). Prod seed data: `npx convex run seed:run --prod`. Prod voice test: `npm run voice:test:prod`. Vercel holds the four `NEXT_PUBLIC_*` values for the prod pair; the private key and secrets stay local and in Convex env.

For the combined development build, use the [manual voice test sheet](docs/dev-manual-tests.md). It preserves the ten selected conversations and adds optional coverage for the newer synthetic-account tools.
