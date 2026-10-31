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
Browser (/call) ──@vapi-ai/web──▶ Vapi (GPT-Live) ──tool-calls──▶ POST /api/vapi/tools
      ▲                                                                 │
      │ live query callEvents.byCall                                    ├─ search_playback_docs            (bounded KB snapshot)
      └──────────────── Convex ◀── callEvents.log ◀─────────────────────┤─ get_current_playback_app_info   (LIVE Apple lookup)
                         │                                              ├─ get_relevant_changes_since_version (Apple + documented notes)
                         ├─ customers / teams / callbackSlots / callbacks (SIMULATED)
                         └─ lookup_demo_customer, check_team_availability, get_callback_slots, reserve_callback, initiate_handoff
```

- `src/lib/assistant.ts`: the single assistant definition (prompt, model, tools) shared by browser and phone.
- `src/lib/vapiTools.ts`: function-tool schemas Vapi sends to the model.
- `src/lib/tools/registry.ts`: server-side implementations, dispatched by name.
- `src/knowledge/playback-kb.json`: source-backed knowledge snapshot with URLs and retrieval dates.
- `convex/`: schema, seed, and functions. Every record is fictional and marked `simulated`.

## Vapi configuration

- `NEXT_PUBLIC_VAPI_PUBLIC_KEY`: Vapi public key (browser-safe).
- `NEXT_PUBLIC_VAPI_ASSISTANT_ID`: optional saved assistant. When blank, `/call`
  starts an inline assistant with the same definition. Inline mode cannot carry
  the tool secret, so leave `VAPI_TOOL_SECRET` empty in that mode.
- `NEXT_PUBLIC_APP_URL`: public base URL; Vapi must reach `/api/vapi/tools`
  over HTTPS, so local dev needs a tunnel or a deployed preview.
- `npm run sync:assistant` creates/updates the saved assistant from code
  (needs `VAPI_PRIVATE_KEY`, server-only).

Verified against Vapi docs (2026-10-30): GPT-Live does not support knowledge
bases or the Query tool; transfers are unsupported on browser calls; a spoken
goodbye does not end the call, so the `endCall` tool is attached.

## Handoff and transfer sound, per channel

- **Browser**: when `initiate_handoff` succeeds, the page plays a short transfer
  tone locally (Web Audio: two beeps, then US ringback) and shows
  "Transferring…" on the phone screen. The assistant then says goodbye and
  calls `endCall`; if it has not ended the call 12 s after the handoff, the
  page ends it. Verified with the dev simulation at `/call?demo=1`.
- **Phone**: Vapi cannot play an audio file into a GPT-Live call and real
  transfers are blind-only on Twilio/Vapi SIP, which this demo does not use.
  The handoff is therefore spoken only, then `endCall`. This limitation is
  stated rather than worked around.

## Simulation boundaries

Transfers, support-team availability, callback slots, and customer records
are simulated. Bookings are saved in this demo's Convex database only and do
not reach MultiTracks' real support systems. The activity panel labels each
event as **Live API**, **Docs**, or **Simulated**.

## Testing

See `docs/test-matrix.md` for the scenario matrix, metrics definitions, and results.
