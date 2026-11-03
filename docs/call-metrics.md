# Per-call evaluation and measurement

Development only. No new voice calls are required to collect artifacts from completed calls.

## Intent and outcomes

The ten scripts supplied November 3 map to the existing private case IDs:

| Script | Expected primary intent | Target handling |
|---|---|---|
| 01 Click and guide playing together | routing | Agent |
| 02 Routing changed after reconnecting | routing | Agent |
| 03 Wrong audio device selected | routing | Agent |
| 04 Active subscription shows expired | version | Agent |
| 05 iPad and Focusrite compatibility | compatibility | Agent |
| 06 USB connection compatibility and routing | compatibility | Specialist |
| 07 Songs missing in wrong organization | account-access | Agent |
| 08 Missing content permission | account-access | Specialist/admin |
| 09 Song recovery and Planning Center | song-loading | Agent |
| 10 Song still will not load | song-loading | Specialist |

These are **seven agent targets and three specialist targets**, not seven proven containments. Script 9 also exercises secondary `service-plan` intent. Free-form calls can instead classify as `service-plan`, `human-request`, `callback`, `out-of-scope` or `unknown`; they are not forced into the five coverage groups.

Scenario titles describe test situations; they are not runtime intent labels. For example, borrowing a mixer describes the caller's circumstances. The underlying goal can be `compatibility` (whether the equipment supports the intended use), with `routing` as a valid secondary goal when the caller also asks about separating audio paths. The main/original goal stays primary; other substantive caller goals can coexist in `secondaryIntents`. A diagnostic step or an assistant-offered action alone does not add a caller intent.

In a call's activity panel, open **Call measurements** and select its expected scenario. This can be done during or after the call. The assignment is stored only in Convex. Scenario IDs, expected labels and target outcomes are never supplied to the conversation or the post-call classifier. Expected-intent accuracy compares that scenario's explicit expectations with the blind primary/secondary classification; unlabeled calls are N/A, not failures.

Most scenarios require their dominant expected intent as primary. Script 6 combines USB compatibility with audio separation, so either `compatibility` primary (with routing optional) or `routing` primary **with `compatibility` secondary** is a valid match. A routing-only prediction misses its compatibility goal; an unrelated or unknown primary remains incorrect even if compatibility appears among secondary labels. These accepted combinations live in private evaluator metadata and the shared `matchesScenarioIntent` helper, not the runtime classifier or troubleshooting prompt. Raw predictions remain unchanged. The metric does not certify that every secondary label is correct or complete; reviewers must check those against actual caller goals. Other scenarios retain strict dominant-primary matching.

The assistant attaches one versioned Vapi Structured Output, `playback_call_review_v1`. After the call, it extracts primary/secondary intents, resolution (`resolved`, `unresolved`, `unknown`), escalation (`none`, `requested`, `handoff`, `callback`) and supporting evidence. It reads actual dialogue and tool results, not reviewer scripts. This is model-inferred evidence for review, not proof that physical equipment was repaired. Fictional role-play outcomes remain fictional.

Resolution requires confirmation of the guided fix or an accepted, supported informational answer for all substantive requests. A generic thank-you, the agent's own success claim, endCall, transfer or callback alone is insufficient. A successful escalation can be correctly handled while the original issue remains unresolved. Successful handoff/callback logs independently override a mistaken `none` escalation; an unverified model claim of completion is downgraded to requested. These actions are simulated.

Containment is confirmed resolution without a requested/completed human escalation. An unresolved call is not contained. Missing resolution evidence stays unknown. Closing quality is separate: a call can resolve the support issue and still have a broken goodbye/disconnect.

The history quality card uses the **latest 200 calls, including archive**, explicitly labeled as a bounded window. It shows:

- Expected-intent accuracy = classifications matching the scenario's accepted intent combination / reviewed, explicitly scenario-labeled calls.
- Containment = confirmed contained calls / reviewed completed calls.
- Resolution = confirmed resolved calls / reviewed completed calls.
- Coverage = reviewed completed calls / all completed calls in the window.

Unknown outcomes remain in the reviewed denominator, conservatively; pending/not-evaluated calls are excluded and coverage is shown. Phone/browser/harness outcome breakdowns remain separate. Archive/restore does not affect membership. The historical paginated call log remains complete beyond this dashboard window.

## Counts, timings and cost

### Editable demo panel

The development Activity panel has a separate **Demo calls** view. Convex `demoCallSets` holds one explicitly selected completed, reviewed voice call per curated scenario, initially copied from `manual-voice-initial-ten-2026-11-03`. Initialization is idempotent: it never resets later edits. Selected calls are hidden from the working Past calls list; their source records and Archive behavior remain intact. The recent unarchived history overview explicitly includes demo calls and is separate from the demo-only scorecards.

Use **Open call** for its original transcript and measurements, **Swap call** for another reviewed voice call already labeled with the same test scenario, or **Remove from demo** to empty that slot without deleting the call. An empty slot has **Choose call** to restore or replace it. Candidate lists inspect the latest 100 calls carrying that scenario label and do not filter by a positive score. Expected scenario labels remain outside model inputs.

Intent accuracy, strict containment and overall resolution recalculate from this selection only, showing each numerator and reviewed denominator. Removing calls changes the denominator; incomplete or missing source records and changed labels are flagged and excluded. Unknown outcomes remain in the reviewed denominator as unresolved. With no reviewed calls, rates are unavailable rather than 0% or 100%. The original immutable evaluation snapshot remains unchanged by selection edits. These are manual browser voice role-plays, not telephone trials or a voice retest of later prompt changes. Production selection writes are disabled.

### Fixed presentation cohort

The [initial ten manual browser voice results](call-reviews/curated-voice-results-2026-11-03/review.md) are stored separately from the moving dashboard in the development `evaluationRuns` table. Each immutable admin-created snapshot preserves explicit call IDs, independently assigned scenario labels, native review values, accepted intent comparisons, source dates, metric definitions and each numerator/denominator. `evaluationRuns:capture` derives values from stored calls and rejects missing/duplicate scenarios, text/harness/active calls and absent reviews; it never edits source history. `evaluationRuns:get` reads the fixed snapshot by key. Both functions are internal and development-only.

The initial cohort has expected-intent match 10/10, strict containment 7/10 and overall resolution 7/10. Its three successful simulated callbacks are not technical resolutions. Conditional resolution among calls without human escalation is 7/7, using a different denominator. A slide labeled “within containment” must not use the overall ÷10 formula. These calls preceded the latest feedback fixes and do not constitute a new voice retest.

Every newly ended development voice call queues a bounded artifact fetch: initially after 10 seconds, with up to four retries while post-call data becomes available. The end-of-call webhook also projects results immediately when present. Repeated completion events queue only once; repeated saves replace the same call's measurements. Production and `text-poc-*` fixture IDs are excluded. Existing history is preserved; no automatic paid historical inference backfill runs.

Measurements come from the final Vapi artifact, not UI receipt timestamps:

- Dialogue-message count, split caller/agent. These are transcript message fragments, not sentences or semantic turns. System/tool messages are excluded.
- Support-tool invocation count, deduplicated by tool-call ID. Internal `delegate` calls are counted separately as reasoner delegations.
- Logged tool failures and average backend tool-execution duration, with sample count. These cover our webhook tools, not every internal Vapi operation.
- Average, p50 and p95 caller-end-to-first-assistant-message delay, with sample count and sum. Consecutive assistant fragments do not create extra samples; tool waits remain inside the interval. Overlapping speech is counted separately and excluded from nonnegative delay samples.
- First reply delay and call-start-to-first-assistant-message (greeting) delay. Missing timestamps stay absent; a later answer cannot stand in for an untimed greeting or first reply.
- Call duration, reported USD cost and incomplete-usage flag when Vapi supplies one. This is call cost, not the complete monthly platform/telephony/implementation bill.

**Phone limitation:** the desired metric is **answer-to-first-audio**, from the telephony answer event to the assistant's first audible output on that leg. It differs from model request-to-first-token time (TTFT), dial-to-answer and browser connection time. Transcript timestamps provide only a greeting-delay estimate starting at Vapi's call start. They do not prove handset playback timing. We do not store invented answer-to-first-audio or TTFT numbers.

[Vapi's GPT-Live guidance](https://docs.vapi.ai/gpt-live/testing#latency) says per-turn latency is not currently measured by voice simulations and classic transcriber/TTS metrics do not describe GPT-Live. Use timestamps and recordings to inspect delivery. Exact phone audio timing needs a verified answer/audio time source or a recording aligned to the phone leg; this implementation labels estimates and exposes missing measurements rather than treating browser/text timing as phone evidence.

Native Structured Outputs incur post-call inference credits. Artifact fetches only read saved results. A failed or absent extraction remains partial/error and visible rather than silently passing. The saved assistant configuration must be synchronized in each explicitly authorized deployment environment before future calls receive the output definition.

## Validation

`scripts/test-call-metrics.ts` exercises timestamp conversion, fragments, overlaps, missing evidence, tool/delegation deduplication, outcome definitions, catalog matching, ground-truth isolation and one-time development scheduling. Intent regressions cover both accepted compatibility/routing orderings for the mixed scenario, rejection of missing compatibility or unrelated primaries, unchanged strict-primary matching elsewhere, scenario-label rejection and unlabeled-call exclusion. No voice simulation is launched.

Three existing development calls are used for narrowly scoped native Structured Output previews: resolved loading + plan lookup; an uncompleted direct-human request; and a greeting-only call. These validate post-call extraction, not live voice behavior or the ten presentation conversations. Expected review results and observed outputs are recorded separately from classifier inputs in the accompanying review evidence.
