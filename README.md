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

## Tool visibility in the activity panel

Every tool row in the agent-activity panel can be expanded (click) to show the exact function name, the arguments Vapi sent, and the JSON the webhook returned (both truncated server-side, logged in `callEvents.args` / `callEvents.output`). Tool calls also appear inline in the live transcript at the moment they happened, so a transcript like "Agent: the next available slot is…" shows which tool produced it.

## Call history (Past calls)

The activity panel ends with a collapsed **Past calls** section, modeled on a chat app's conversation list: newest first, grouped by day, six rows before "Show all", a capped scroll area, and a two-step **Clear past calls** (confirm, then delete) that removes the calls, their transcripts and their tool events. Opening a row replays that call in the panel: its tool rail, stored transcript, and the end-of-call summary when Vapi produced one. Rows are disabled while a call is in progress.

Data comes from Vapi's assistant-level server messages, not the browser, so phone and harness calls are listed too. `buildAssistant()` sets `server.url` to `{CONVEX_SITE_URL}/vapi/events` with `serverMessages: ["status-update", "transcript[transcriptType=\"final\"]", "end-of-call-report"]`; `convex/http.ts` writes them to the `calls` and `transcripts` tables (`convex/calls.ts`). The tool webhook bumps each call's `toolCount`. A call row's title is the first thing the caller said.
