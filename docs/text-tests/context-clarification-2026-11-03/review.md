# Context clarification and plain-language evaluation

The balanced **candidate C is activated on development**. It passed neutral clarification on **5/6 ambiguous openings**, reused context in **3/3 clear controls**, and reached the intended support outcomes in **all ten regular scenarios**, with the qualifications below. **One ambiguous account opening still assumed Playback, and plain-language behavior is not uniformly consistent.** This is an improvement with a remaining limitation, not an all-green claim.

Development text POC evidence only. No automated voice sessions or production changes were made. The implementation uses a general context/evidence policy, not a word-to-fix lookup table or a runtime route for a particular script.

## Implementation

The shared reasoner distinguishes caller-established observations from its own interpretation. Context-dependent questions/instructions require the relevant application, screen or equipment location to be established by the caller; likely interpretations, support-line branding and retrieved documentation do not establish it. Clarification must not embed an unconfirmed application/control. Already clear context is reused without a mandatory checklist. A caller's correction updates the working interpretation; an out-of-scope actual goal receives a capability boundary rather than a different in-scope solution.

Both speaker and reasoner use everyday language, preserve necessary on-screen labels with short explanations, help with starting navigation, and do not assume a caller understands a term just because they repeated/agreed with it. The reasoner checks the original listening/task goal after an action; “Done” alone is not success.

Documentation results now carry `evidenceScope: product-documentation` and `establishesCallerContext:false`. This means the search result is not evidence about the caller's location, even when the caller has independently established that location. It does **not** require another question in clear cases. A regression test checks the evidence boundary. The search description and returned applicability note preserve the same distinction.

A regular permission case exposed a missed optional review offer. The general account-authority rule now clarifies that naming an administrator or giving their instructions alone is not an offer of help. Callers choosing their own administrator/operator are respected; no forced transfer or callback is added.

## Fixed test design

Nine context tests, each with one opening, cover three families. Within each ambiguous pair, the first caller sentence is identical and the differing background is private reviewer material:

| Family | First interpretation | Second interpretation | Clear control |
| --- | --- | --- | --- |
| Track / shared volume | Guide tracks assigned to Click inside Playback; correct the track-to-bus assignments. | Volume changed on LV1 console; Playback buses share an output; inspect the relevant app routes and confirm the console result. | Caller explicitly identifies the LV1 console and Playback setup. |
| Locked track | Playback Library content access/Team Sharing; human/admin permission boundary. | Caller reports a locked external-console control; no invented console unlock procedure or account action. | Caller explicitly identifies Playback Library and the admin's permission message. |
| Wrong account | Playback personal/church organization selection. | Planning Center in Safari, beyond the bounded demo API's account-administration capability. | Caller explicitly identifies Playback and Personal account. |

The external-console lock is a fictional caller observation, not a verified assertion that a particular LV1 unlock feature exists. The agent must clarify and honor the support boundary instead of inventing that feature/procedure.

Each round also runs the **ten regular curated scenarios**, one opening each, through the existing `text:cases` harness. Three reviewers handle disjoint groups; the harness sends at most two requests concurrently per reviewer. Only actual chosen caller utterances are inputs. Unknowns stay unknown, guidance precedes fictional recovery, explicit readback/approval precedes demo bookings, and outcomes are not manufactured to match a target. These are manually steered conversations, not blinded autonomous simulations or a statistical reliability estimate.

Scoring separates: neutral clarification before a context-dependent step; respecting subsequent correction; avoiding repeated clarification in clear controls; original-goal confirmation; initial plain-language/navigation quality versus repair; supported recovery or appropriate boundary handling; and ordinary regression outcomes. Eventual recovery cannot erase an initial provider assumption. A stopped failure, transport failure or fixture problem is never a passing end-to-end case.

## Retained iterations

| Candidate | Change / evidence | Findings |
| --- | --- | --- |
| A | Initial general plain-language/location policy. [Routing](routing-review.md), [access](access-review.md), [integration](integration-review.md). | Broad wording was insufficient: both locked and both account openings assumed Playback; one track opening narrowed the question prematurely. Regular support paths completed with qualifications. One copied private selector readout blocked the app-track flow after its first turn. |
| B | Neutral questions cannot embed guessed context; corrections supersede earlier assumptions. [Routing](retest-routing-review.md), [access](retest-access-review.md), [integration](retest-integration-review.md). | Both track and both lock ambiguities clarified; one account opening still assumed Playback. Clear controls reused context. Regular 01 transport failure remained inconclusive; regular 08 safely referred to admin but omitted the expected review offer. |
| C | Explicit documentation evidence scope; general admin-owner/offer distinction. [Routing](final-routing-review.md), [access](final-access-review.md), [integration](final-integration-review.md). | Track/lock ambiguity branches and clear controls behaved correctly; one account opening still assumed Playback despite the correct deployed metadata. All regular core support paths completed; some style/grounding qualifications remain. |
| D | Caller-established relevant context is a prerequisite, rather than a likelihood judgment. [Routing](gate-routing-review.md), [access](gate-access-review.md), [integration](gate-integration-review.md). | Both track/lock pairs clarify; one account opening still assumes Playback, now the other branch. Regular 04 stalls on repeated unknown screen details; regular 03 redundantly rechecks already explicit app context. Rejected in favor of the balanced C. |

## Selected release and accounting

The stricter D did not improve the ambiguous account pair and introduced over-clarification in a regular subscription case. It was not activated. The source was restored **exactly** to the tested C hashes, rather than combining untested pieces of different candidates. [Release-selection proof](release-selection.json).

| Selected C check | Observed result |
| --- | --- |
| Track in Playback versus track/feed on LV1 | Both first clarified context, followed distinct app-assignment versus output-routing paths, and checked the original listening goal. |
| Locked Library content versus locked console control | Both first clarified location, then respected permission/console boundaries. No invented access grant or console unlock procedure. |
| Wrong Playback account versus Planning Center account | One neutral clarification, one incorrect initial Playback assumption. The Planning Center branch honored the later provider clarification and bounded capability, with an owner/referral qualification. |
| Three explicit-context controls | All reused provided location rather than asking it again. |
| Ten regular scenario support outcomes | All reached their intended fictional recovery, accepted information answer or review/callback outcome. This is not perfect compliance on every conversational dimension: regular 01 skipped initial control-location clarification, and jargon/navigation, optional retrieval and number-readback qualifications remain in the reports. |

Four revisions produced **76 attempted text conversations**, **389 recorded caller/agent turns**, one transport-inconclusive run, and one fixture-blocked run. Reported text model cost totals **$11.5056**: A $2.5335, B $2.7487, C $3.1439, D $3.0795. A failed request's missing usage report is not proof of zero upstream cost. All attempts and failed/stopped traces remain saved. [Machine-readable accounting](summary.json).

The gate is still probabilistic: with identical account openings, the branch that assumed Playback changed between C and D, even though private branch facts never entered the initial model request. Adding a blanket gate traded one failure for extra questions elsewhere. The evidence does not support declaring this fully solved by prompting alone.

## Checks, development activation and cleanup

**172 local tests passed**, including the new documentation-evidence boundary regression. TypeScript, ESLint and whitespace checks passed. Development backend documentation metadata was deployed and observed in actual tool responses. After restoring C, all selected source hashes match the tested configuration.

The saved development speaker/reasoner prompts and function definitions/messages were synchronized and read back. Tool servers, voice, greeting and artifact settings were preserved. Production's assistant fingerprint was unchanged. [Activation proof](activation.json). No new voice call was created.

All 76 generated attempts are closed with isolated harness logs cleaned. Reviewers verified their own demo bookings before guarded deletion, reopened only their own slots and checked real user bookings remained unchanged. Caller/operator/admin referrals were not actual messages or customer contacts. Source/fixture hash checks and cleanup proofs are retained per cohort. A remains subject to the explicit fixture erratum below.

The reusable nine-case fixture is `scripts/text-cases/context-clarification.json`; the ten regular cases remain `scripts/text-cases/curated.json`. Both use the existing harness and adaptive private-caller method:

```sh
npm run text:cases -- start <empty-context-output-directory> scripts/text-cases/context-clarification.json --first-opening
npm run text:cases -- start <empty-regular-output-directory> scripts/text-cases/curated.json --first-opening
```

Inspect actual replies before each `text:cases reply` phase. These are development checks, not another manual reviewer script or presentation voice cohort. The test fixture is an evaluation input; its private expected branches are not part of the live agent prompt.

The [fixture erratum](fixture-erratum.json) explicitly corrects an inaccurate “before inference” provenance phrase inherited in configuration metadata. Candidate A's six routing openings finished before that private readout correction; no affected readout entered the model. The app-track A run was stopped fixture-blocked and preserved. All later rounds start with the internally consistent fixture. No conversation silently changes its private facts to produce a success.

Each candidate has a source-hash freeze; every fresh run has its own generated text-test ID and configuration fingerprint. Failures and prior configurations remain in their original folders. No reservation is automatically retried after an uncertain transport result. Only generated test bookings/logs are cleaned; real manual-call history and bookings are preserved.

## Limits

A prompt change is probabilistic guidance, not a runtime guarantee. Identical fresh openings produced different initial decisions; choosing the right provider by coincidence does not satisfy clarification. The regular suite also retains unnecessary lookups, abbreviated number readbacks, occasional jargon/navigation repair and serial questioning. A script finishing is not a clean pass on every quality dimension.

Text validates the reasoner and tools. It does not validate GPT-Live speaker phrasing, recognition, timing, interruptions, actual heard audio or automatic disconnect. No text result is counted as a presentation voice conversation, and the previously stored initial ten-voice-call snapshot remains unchanged.
