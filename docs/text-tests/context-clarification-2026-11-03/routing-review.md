# Context clarification candidate A — routing review

Six first-opening text POCs, manually steered from fixed private caller facts. Five completed the support goal; one stopped fixture-blocked after its opening. These are not voice-call or native-disconnect evidence. No source, backend deployment, saved assistant or production changes were made by this reviewer.

## Fixture provenance

The original track-app fixture contradicted itself: Buses said existing Guide Output2, while its copied output-selector readout said Output1. This was flagged before any follow-up/readout entered a model conversation. The start command had already created and completed all six opening turns when the parent's pause arrived. Parent subsequently corrected the master/routing suite, but the original run fixture was preserved. Per parent instruction, only track-app stopped after its first reply; it was not silently corrected, continued, or rerun. Its later routing outcome is untested. Its initial context-assumption weakness remains observable independently of the unused contradictory private field.

## Per-run results

| Run | Clarification | Plain language/navigation | Assumption evidence | Original-goal check | Core outcome | Turns | Reported USD |
|---|---|---|---|---|---|---:|---:|
| track-console-v1 | Pass: app versus desk first | Partial: unexplained “fader”/“bus”; usable subsequent page instructions | Partial: sharing Output1 observed, but actual desk Output2 connection not established before choosing it | Pass: independent LV1 control confirmed | Recovered with qualification | 6 | 0.1619 |
| track-app-v1 | Fail: assumes app before obtaining context | Partial/fail: “Tracks mixer” versus “Busses mixer” unexplained | Fail at opening: unconfirmed Playback location | Not reached | Fixture-blocked, not a recovery pass | 1 | 0.0148 |
| track-clear-console-v1 | Pass: reuses explicit LV1 location | Partial: initial vague selection repaired after novice asks where | Partial: sharing Output1 observed; Output2 choice conditional on availability but connection not verified | Pass: LV1 spoken cues independent of ticking | Recovered with qualification | 5 | 0.1391 |
| 01-click-guide-v1 | Pass: asks app versus in-ear mixer | Partial: generic output change needed novice navigation follow-up | Partial: shared output observed, but Output2 desk feed not established | Pass: desk Guide channel independent of Click | Recovered with qualification | 7 | 0.1879 |
| 02-reconnect-v1 | Clear opening; selected-device/current-routing observations used | Partial: needed “How do I change them?”; repaired with tap row/output/Done | Pass: actual selected device and music outputs observed; no invented reconnect cause | Pass: music restored to3/4 and Click/Guide remain separate | Recovered | 6 | 0.1647 |
| 03-audio-device-v1 | Clear issue; Mac and actual Audio Device requested | Pass: actionable Settings > General observation and selection | Pass: actual MacBook Speakers selection observed before correction | Pass: caller hears song through sound system | Recovered | 5 | 0.1597 |

Total: **30 turns; $0.8281 reported text inference cost**. Five valid completed support scenarios recovered; the blocked app branch is excluded from any completed-branch success claim. This small, manually steered sample does not establish a general success rate or deterministic behavior.

## Concrete observations

- Identical ambiguous opening produced materially different first questions. Console variant: “Are you turning down a fader in Playback’s Tracks mixer, or a channel control on your sound desk?” App variant: “Where are you turning that level down in Playback—the Tracks mixer or the Busses mixer?” The latter prematurely narrows both choices to Playback. No private branch context had yet been supplied.
- Clear-console did not ask the location again. It correctly asked actual Buses output observations and used the observed shared Output1. However, its next instruction was “choose a different unused output,” without specifying how or establishing the connected destination. A natural novice question elicited the Guide-row menu and conditional Output2 instruction.
- Regular01 similarly said “Set the Guide bus to an available output other than Output1” before navigation; after “I’m not sure where to change that or which output to choose,” it gave Settings > Buses > Guide and asked what choices were visible. Caller reported enabled Output2. It then selected2 and checked the original desk-control goal.
- Actual fixtures have outputs1/2 connected to separate desk channels, so the guided Output2 action genuinely applies and the reported simulated recoveries are warranted. Nevertheless, the conversations did not independently establish that connection before choosing2. This is a qualification on evidence/assumptions, not proof that a universal2 assignment is safe elsewhere.
- Regular02 corrected Bass, Keys and Guitars to the caller’s stated3/4 goal while preserving Drums3/4, Click1 and Guide2. It repaired missing interaction detail when asked. It did not claim to know why reconnecting changed routing.
- Regular03 inspected the actual selected device, then directed selecting the listed Focusrite. It did not detour into numbered desk connections or prematurely escalate.

Every completed case included a broad further-help question, the caller’s ordinary refusal, a single complete branded farewell, and an `endCall` tool entry. This establishes the text adapter’s closing output only. No standalone duplicate acknowledgement sequence was observed in these replies. No Planning Center lookup, callback, human handoff, disruptive reset or legacy bus-creation procedure was used.

## Cleanup and frozen source

All six run files have `done: true`, `cleanupComplete: true`, and no transport failure. Read-only Convex checks independently verified each generated test call absent, with zero transcript rows and zero events. No callback reservations were created. Only these six generated IDs were cleaned; no other call history was touched. See `routing-cleanup.json`.

All nine source hashes in frozen `config.json` matched at completion. Expected and observed SHA256 values are preserved in `routing-source-hashes.json`. The corrected suite and original embedded track-app fixture are intentionally not represented as the same fixture revision.

## General follow-up

Before a destination-specific menu question, establish observable context without placing all options inside one unconfirmed application. Explain unfamiliar mixer labels briefly in ordinary words and provide the small interaction needed to inspect/change a setting. When independent external feeds are the goal, choose an available output whose actual connected destination is established rather than relying on an example number; then test the original external-control goal. Keep the successful selected-device and music-routing observations concise. These are candidate refinements for the parent, not changes made during this frozen pass.
