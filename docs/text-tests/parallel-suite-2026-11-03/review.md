# Parallel development text audit — November 3, 2026

Three reviewers covered the ten selected situations across five intent groups. Each situation used two ordinary opening phrasings and one fixed private caller background. The existing `text:cases` harness ran isolated conversations, with at most two concurrent requests per reviewer. There were three reviewers, not ten independent agents.

These are manually steered **text reasoning/tool proofs of concept**, not blinded simulations, a production success-rate estimate, or the ten presentation voice conversations. Only actual caller utterances entered the support agent; private expected outcomes and reviewer notes did not. No automated voice calls or staff/customer contacts were made. Planning Center reads use the real bounded demo connection; account records, recoveries and handoffs are fictional. Callback bookings write real development demo records and are removed after verification.

## Method and retained evidence

The [baseline](baseline-config.json), [first combined retest](retest-config.json) and [final combined candidate](final-config.json) each pin the relevant source hashes. Every round starts fresh conversations; no conversation crosses a prompt/tool revision. A completed script alone is not a pass. Reviewers inspected replies and tool results, followed only applicable instructions, and stopped clear failures without supplying the missing diagnosis or desired tool call.

The baseline Script 1 profile omitted actual track-to-bus assignments and the available output choices. Both baseline openings were therefore fixture-blocked, not failed model diagnoses or successful recoveries. Those readouts were defined before the next round. Advice cases 5/6 also explicitly define pre-connection advice, rather than a current no-audio fault. The final second opening of case 6 explicitly mentions the borrowed USB socket. These fixture changes prevent a controlled numerical old/new reliability comparison.

| Round | Evidence | Principal findings |
| --- | --- | --- |
| Baseline, routing | [Six conversations](routing-review.md) | Four recovery targets met; two Script 1 fixture gaps retained. |
| Baseline, version/compatibility | [Six conversations](version-compatibility-review.md) | Supported version recovery; advice/setup detours, a missing Premium condition on an offered multi-output route, and delayed specialist offers. |
| Baseline, access/loading | [Eight conversations](access-loading-review.md) | Five core passes; premature booking language, a missing specialist offer, and generic download fixes applied to the wrong named error. |
| First retest, routing | [Six conversations](routing-retest-review.md) | Five recoveries; one premature external-hardware escalation. |
| First retest, version/compatibility | [Six conversations](version-compatibility-retest-review.md) | Three core targets met, one partial advice result and two retained misses. A successful callback included verified booking confirmation after its write. |
| First retest, access/loading | [Eight conversations](access-loading-retest-review.md) | All eight intended outcomes reached, one qualified by misuse of a Planning Center organization ID as a MultiTracks ID. |
| Final combined candidate, routing | [Six conversations](routing-final-review.md) | All six recovery targets reached. One output-choice instruction needed repair after novice uncertainty; one walkthrough took eight turns. |
| Final combined candidate, version/compatibility | [Six evaluable conversations](version-compatibility-final-review.md) | All six core targets reached. One advice path needed a normal pre-use clarification; a zero-turn transport failure and its fresh replacement are both retained. |
| Final combined candidate, access/loading | [Eight conversations](access-loading-final-review.md) | Seven intended outcomes reached; one premature organization referral exposed a hard category-filter bug. |
| Focused retrieval follow-up | [Two fresh organization conversations](organization-retrieval-review.md) | Both recovered through documented organization switching without caller hints, then endCall/farewell. Original failure retained. |

**Totals:** 63 attempts, 62 conversations with replies, and one retained zero-turn transport failure. The three full rounds contain 60 evaluable conversations; the focused follow-up adds two. There were 380 caller/agent turns. Reported text inference cost totals **$10.9348**: baseline $3.5201, first retest $3.3808, final $3.7415, focused follow-up $0.2924. The failed request supplied no usage report, so its zero local accumulator is not proof of zero upstream cost. These figures are text-test credits, not a monthly voice-call cost estimate. [Machine-readable accounting](summary.json).

The final full round reached 19 of 20 intended outcomes, with the qualifications above. After the retrieval fix, both affected-case openings passed in fresh conversations. The other 18 full-round conversations were not rerun after that narrow category change; retrieval regression tests cover the unchanged platform/version gates and relevant ranking behavior. Do not combine those separate configurations into a claim of 20 flawless conversations on the final activated configuration.

| Situation | Latest observed outcome |
| --- | --- |
| 1. Click/Guide | Both separated through the observed available output; one needed a clearer choice instruction. |
| 2. Reconnected interface | Both restored the music buses to 3/4, preserving Click/Guide. |
| 3. Wrong selected device | Both selected the listed Focusrite and obtained fictional sound recovery, without a cable-to-board prerequisite. |
| 4. Active account shows expired | Both checked active status and caller app/OS versions, then obtained fictional recovery after a qualified update. One path repeated Restore Purchases; the other took eleven turns. |
| 5. Supported hardware advice | Both stated the relevant Premium/power conditions; the vague opening still needed one ordinary clarification that advice, not setup, was wanted. |
| 6. Borrowed USB mixer | Both offered appropriate review and completed consented demo callbacks. Exact hardware compatibility remained unverified. |
| 7. Wrong organization | One full-round retrieval miss retained; both fresh post-fix openings guided the existing organization switch and obtained fictional content recovery. |
| 8. Missing permission | Both explained the admin boundary, offered review and completed approved demo callbacks; no access grant was claimed. |
| 9. Loading recovery + API | Both guided applicable retries, obtained fictional recovery, and reused one real Planning Center read to answer the subsequent setlist question. |
| 10. Unresolved loading | Both respected the unavailable/unsuitable recovery conditions and completed approved demo callbacks; the original loading issue remained unresolved. |

## Changes driven by actual failures

- **Suppress the provider's extra default tool acknowledgment.** Every function explicitly sets a blank `request-start` message. A delayed holding line remains for genuinely slow tools. Omitting the entry enabled random platform fillers such as “One moment,” producing an extra acknowledgment around the model's own reply. This is the documented [Vapi empty-content behavior](https://docs.vapi.ai/tools/dynamic-tool-messages). The harness does not strip these replies. First-retest reviewers observed zero stock start fillers across 120 raw replies; text evidence does not establish audible speaker behavior.
- **Distinguish advice, setup and troubleshooting.** Capability advice includes its documented conditions, without launching an unrequested settings walkthrough. Unknown hardware support remains unverified rather than incompatible. Existing app observations, account evidence and release tools can still be investigated before escalating. The location of an external volume adjustment is not proof that Playback routing is correct.
- **Keep recovery instructions tied to their source section.** Generic “Download Error” quick fixes are labeled with their prerequisites, rather than presented as universal recovery for “Audio Files Missing.” The distinction comes from the [official error article](https://helpcenter.multitracks.com/en/articles/13452943-troubleshooting-playback-download-errors).
- **Preserve verified callback confirmation through closing.** Availability is a proposal, not a booking. Only a confirmed callback row for the actual call supplies the time in the endCall response. The returned closing combines that verified confirmation with one branded farewell. Text checks verify action ordering and returned text; audio completion and disconnect remain manual voice checks.
- **Link hardware advice to applicable feature requirements.** Supported-interface results carry the source-backed Premium requirement for independent bus/MultiOut routing. They do not impose Premium on every basic two-feed Auto-Pan goal.
- **Keep provider identities separate.** The Planning Center result exposed to the agent retains useful service/song metadata and the organization name, while omitting provider organization/plan/song IDs. The authenticated helper retains its own bounded identity checks. A [deployed read-only projection check](planning-context-projection-proof.json) confirmed useful data remained and those IDs were absent.
- **Treat search categories as preferences.** The model's `setup` category excluded every KB article because no article had that category; the master user guide containing Switch Organizations was `general`. The KB now keeps positive lexical matches across categories and uses a 0.25 tie preference, consistent with the manual search approach. A category cannot create a match or override stronger lexical relevance, platform eligibility or version gates. The exact failed query now retrieves the source, and both fresh novice role-plays completed the switch. [Original diagnosis](final-access-loading/organization-retrieval-proof.json), [focused evidence](organization-retrieval-review.md).

## Development activation and verification

The development backend was pushed after the focused retrieval change. The saved development voice assistant was updated with the shared speaker/reasoner instructions, function definitions **and each function's messages**. Updating only function descriptions would have left old provider filler enabled. A semantic readback verified all eleven function definitions, exact message arrays and one blank request-start per function. Saved webhook configuration, voice, greeting and artifact plan were preserved. A read-only production fingerprint was unchanged before/after the development update. [Sanitized activation proof](activation.json).

Local verification: **157 tests passed**, `npm run typecheck` and `npm run lint` passed. The retrieval regressions cover the reported query, stronger cross-category navigation matches, tie preference, empty/unrelated queries, platform exclusions and existing legacy-version gates. The canonical [caller worksheet](../../curated-caller-worksheet.md) and `scripts/text-cases/curated.json` now share the tested fixed facts/openings; older sheets are explicitly historical. The separate single reviewer demo remains separate from these ten developer situations.

All 63 attempt records are closed and their isolated harness logs marked cleaned. Reviewers separately verified and removed only their own synthetic callback bookings, reopening those slots. Full-round source hashes matched before subsequent changes; the focused pair also has its own frozen hashes and teardown proof. No real call history was cleared by this testing.

## Limits

The model remains generative. A precise first instruction, short path and appropriate personalization are separate quality dimensions from caller-reported resolution. A safe but premature referral is not a containment pass. A callback can be completed correctly while the original issue remains unresolved. Seven agent targets and three human-review targets describe coverage, not a quota to manufacture.

Manual development voice checks must still establish GPT-Live delegation, recognition, interruption handling, recent-message acknowledgment behavior, final audible farewell and actual browser/phone disconnect. Text `endCall` results do not prove that the user heard the farewell or the voice transport disconnected. Production activation is outside this task.
