# Playback Support Agent

Inbound AI voice support demo for MultiTracks **Playback**: helps callers fix
song-loading and audio-output problems. Built for the Regal AI Product
Specialist take-home. Not affiliated with MultiTracks.com.

## Stack

- Next.js 16 (App Router, TypeScript, Tailwind 4)
- Vapi web SDK (`@vapi-ai/web`) for browser calls
- Planned: Vapi inbound phone number, Convex backend, custom retrieval tools

## Run locally

```bash
npm install
cp .env.example .env.local   # then fill in NEXT_PUBLIC_VAPI_PUBLIC_KEY
npm run dev
```

- `/` landing page
- `/call` iPhone-style call screen. Tap **Call** to start a real Vapi browser call.

## Vapi configuration

- `NEXT_PUBLIC_VAPI_PUBLIC_KEY` is the Vapi *public* key (browser-safe).
- `NEXT_PUBLIC_VAPI_ASSISTANT_ID` is optional. When blank, calls use the
  inline GPT-Live assistant in `src/lib/assistant.ts`
  (`model.provider: openai`, `model.model: gpt-live-1`, OpenAI voice).
- GPT-Live does not support Vapi knowledge bases or the Query tool; retrieval
  will be a custom function tool. Transfers are not supported on browser calls.

## Simulation boundaries

Transfers, support-team availability, and callbacks in this demo are
simulated. Nothing contacts MultiTracks' real support systems.
