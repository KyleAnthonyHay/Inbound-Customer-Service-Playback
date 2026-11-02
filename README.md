# Playback Support Agent

Inbound AI voice support demo for MultiTracks **Playback**: helps callers fix
song-loading and audio-output problems before rehearsal or service. Built for
the Regal AI Product Specialist take-home. Not affiliated with MultiTracks.com.

## Stack

- Next.js 16 (App Router, TypeScript, Tailwind 4)
- Vapi (`@vapi-ai/web` for browser calls; GPT-Live `gpt-live-1` with OpenAI voice)
- Convex for synthetic demo data, bookings, and the live activity log
- Apple iTunes Lookup API (live, public) for current app version

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
                         ├─ customers / teams / callbackSlots / callbacks (SIMULATED)
                         └─ lookup_demo_customer, check_team_availability, get_callback_slots, reserve_callback, initiate_handoff

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

## Testing

See `docs/test-matrix.md` for the scenario matrix, metrics definitions, and results.

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
