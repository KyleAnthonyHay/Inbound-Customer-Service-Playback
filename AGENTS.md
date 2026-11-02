<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Voice-agent development and quick text checks

This project builds a voice agent. Use the existing text harness while developing
and validating reasoning, personalization, support scope and tool use. Do not
build a separate chat UI for these checks.

- Run focused scripted checks with `npm run text:test -- <scenario-file>`, for
  example `scripts/scenarios/planning-center-song-loading.json`,
  `scripts/scenarios/planning-center-audio-output.json`, or
  `scripts/text-scenarios/human-first.json`.
- `npm run text:test` without a scenario starts an interactive terminal chat.
  For unattended agent work, pass a scenario file so the command can finish.
- The ten selected cases and two opening phrasings each are in
  `scripts/text-cases/curated.json`; `docs/curated-caller-worksheet.md` is the
  human-readable worksheet. For a full phrasing audit, `npm run text:cases --
  start <empty-output-directory>` starts twenty isolated text conversations.
  Add `scripts/text-cases/curated.json --first-opening` after the output directory
  for ten conversations. Use the private caller profiles: known facts, facts
  readable with guidance, and genuine unknowns. Do not make novice callers
  remember versions or supply technical diagnoses. Read `docs/open-ended-test-method.md`.
  Inspect the actual replies before supplying adaptive follow-ups with
  `npm run text:cases -- reply <run-directory> <replies.json>`. Reviewer notes
  are never agent inputs. Mark finished runs with `done: true` to clean up their
  isolated tool logs. Follow-ups may extend through twelve turns; do not turn
  the expected fix into a leading caller hint and then report an unassisted pass.
- The harness uses Vapi Chat and the existing private Vapi key in ignored
  `.env.local`. No separate OpenAI API key is needed. It derives the same reasoner
  model, effort, support instructions and function tools from the voice definition,
  with only a text transport/end-of-conversation adapter. It refuses production
  targets and does not create voice calls or modify the saved voice assistant.
- Text inference consumes model credits. Use the smallest relevant POC cases,
  inspect their actual transcripts and tool results, and iterate when a concrete
  failure justifies a retest. Tool effects on demo data are real; callback/handoff
  behavior remains simulated, and no real customer should be contacted.
- Reports are saved under `docs/text-tests/`. Review them for actual behavior;
  finishing a script is not a pass. Never export the raw Vapi assistant response,
  which can contain webhook credentials. Never print or commit API secrets.
- Planning Center context is one shared Regal Playback Demo service/song list
  for all synthetic customers. The agent should recognize useful personalization
  opportunities proactively, without waiting for a setlist request, and reuse
  context already retrieved. Do not require the lookup for every loading/audio
  issue or force irrelevant song details into device diagnosis. Direct human
  requests and out-of-scope topics should not be delayed by personalization.
  Preserve the bounded support scope. Tool descriptions explain selection,
  outcomes and essential prerequisites; the shared prompt holds conversation
  policy. Prefer general principles over rules tailored to individual test cases.
  Uncertainty and scope boundaries share one general specialist-review fallback;
  the five intent groups are coverage labels, not a fixed runtime routing tree.
  Missing optional personalization alone should not block documented support.
- Text POCs validate reasoning/tools, not GPT-Live speaker delegation, audio,
  timing, interruptions, recognition or voice call lifecycle. Do not claim voice
  parity or count these as the ten presentation voice conversations.
- Jordan has one simple usability try-out, separate from the ten developer
  conversations across five intents. Detailed text coverage belongs to the coding
  agent; it must be labeled text POC evidence. Voice checks remain manual.
  Do not launch `voice:test`,
  `voice:test:prod`, `scripts/voice-test-all.sh`, or paid voice simulations unless
  the user explicitly authorizes those runs. Production changes require separate
  authorization; current activation/testing is development-only.

Read `docs/conversation-test-plan.md` for the workflow and
`docs/text-tests/README.md` for the existing findings and retests. Run the ordinary
local checks (`npm test`, `npm run typecheck`) appropriate to code changes as well.
