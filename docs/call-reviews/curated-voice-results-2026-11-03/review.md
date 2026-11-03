# Initial ten manual voice-test results

**10/10 expected-intent matches (100%), 7/10 contained (70%), 7/10 resolved (70%).** Three calls completed simulated callbacks while the original support issue remained unresolved. Among the seven calls without human escalation, seven resolved: **7/7 (100%)**, a separate conditional denominator.

These are the ten explicitly labeled manual **browser voice** role-plays recorded November 3, 2026. They are not the text POC suite, phone trials, or a post-fix voice rerun. All ten calls predate the latest account-reuse/grouped-callback feedback changes. Outcomes are supported by scripted caller confirmations and accepted information answers, not actual Playback device telemetry.

## Fixed cohort and evidence

Selection: latest completed manual browser/phone call per independently assigned scenario label at the recorded cutoff. All selected calls happened to be browser calls. Exclude unlabeled/greeting-only calls, automated harness calls and `text-poc-*` conversations. No better older run was substituted and no new inference/voice session was launched. Every selected call already had a native post-call review; coverage is **10/10**, unknown resolution **0**.

The selected call IDs, source times, raw primary/secondary predictions, observed outcomes and formulas are retained in [snapshot.json](snapshot.json). The original per-call reviews and transcripts remain unchanged in Convex. Reviewers checked caller confirmation and tool events: no closing tool invocation or callback alone was treated as a resolved issue.

| Script | Expected intent matched | Resolved | Contained | Supporting outcome |
| --- | --- | --- | --- | --- |
| 1. Click/Guide | Yes | Yes | Yes | Shared output observed; Guide changed to Output 2; caller confirmed independent control. |
| 2. Reconnected routing | Yes | Yes | Yes | Music routes restored to 3/4; caller confirmed music correct and Click/Guide separate. |
| 3. Selected audio device | Yes | Yes | Yes | Caller corrected observation to MacBook Speakers; Focusrite selected and caller confirmed audio. |
| 4. False expiration | Yes | Yes | Yes | Active organization, caller app/OS versions and release evidence; caller reported warning gone after update. Redundant email question occurred in this original call. |
| 5. Supported setup advice | Yes | Yes | Yes | Supported-interface/power/Premium conditions answered; caller accepted the information. Actual physical setup was not tested. |
| 6. USB compatibility/routing | Yes, accepted mixed goal | No | No | Exact borrowed mixer connection remained unverified; successful simulated callback. |
| 7. Organization selection | Yes | Yes | Yes | Guided Northgate selection; caller confirmed church songs appeared. |
| 8. Missing permission | Yes | No | No | Missing Team Sharing confirmed; no access grant; successful simulated callback. |
| 9. Recovery and API | Yes | Yes | Yes | Caller reported third-retry recovery; actual Planning Center API result supplied requested songs. |
| 10. Unresolved loading | Yes | No | No | Three retries failed, ready content preserved; successful simulated callback. |

Case 6's stored primary is `routing`, secondary includes `compatibility`. The agreed expected-intent matcher accepts this combined goal. The raw prediction was not rewritten. A strictly primary-only score would be **9/10 (90%)**; the published 100% is the documented **expected-intent match** measure, not certification that every secondary label is complete/correct. Cases 7/8 have debatable secondary song-loading labels; those are outside this primary/accepted-combination score.

## Convex storage

Saved in development table **`evaluationRuns`**:

- Key: `manual-voice-initial-ten-2026-11-03`
- Record ID: `kh7043221zr8rgbf49j6v9r4rd8hgfxy`
- Definition version: `curated-manual-voice-v1`

The record is immutable and contains the exact cohort, raw reviews, expected matches, per-call outcome flags, numerator/denominator/percentage for each metric, source window, definitions, cutoff and limitations. Capture derives scores from stored calls rather than accepting caller-supplied totals. Reusing the key with another cohort is rejected. Admin-only `evaluationRuns:capture`/`get` are development-gated; no new public data endpoint was added. Only the new snapshot was inserted; historical calls, reviews, bookings and transcripts were not changed. Production was not changed. Database readback verified all totals and selected IDs.

## Exact page replacements

Subtitle:

> 10 curated voice conversations · Browser calls

| Card | Value | Description |
| --- | --- | --- |
| Expected intent match | **10/10 · 100%** | Calls matching independently labeled expected support intents ÷ 10. |
| Containment | **7/10 · 70%** | Calls resolved without human escalation ÷ 10. |
| Resolution rate | **7/10 · 70%** | Calls with all substantive support requests resolved or answered ÷ 10. Callback bookings alone do not count as resolution. |

**Remove the “within containment” badge** from the overall-resolution card. Its current label and ÷10 description conflict. If the page instead intends a conditional resolution card, use **7/7 · 100%** and describe it as “Resolved calls among those without human escalation.” Never display 7/10 under that conditional label.

Suggested footnote:

> Scripted browser voice tests, n=10. Three simulated callbacks; results reflect the tested version. Call-ending quality evaluated separately.

Keep the displayed 100% intent value labeled as an expected-intent match, since the agreed mixed compatibility/routing classification is accepted. Keep voice modality explicit; these were not phone-channel trials. The snapshot is fixed and does not track the history dashboard's moving 200-call window.

## Validation and limits

**171 tests passed**, TypeScript and ESLint passed; development Convex push and database capture/readback succeeded. Five new regression tests cover fixed-cohort math, conditional denominators, unknown/abandoned outcomes, resolved-but-escalated outcomes, zero denominators, excluded transports, missing/duplicate scenarios and immutable development-only snapshot writes. Snapshot implementation received a separate read-only review.

These figures evaluate intent and support outcomes only. The transcripts generally stop before a complete branded farewell and the calls ended with `customer-ended-call`. Automatic hangup or complete audible closings are not established; a resolved issue can coexist with poor closing quality. No broader production reliability, phone latency or post-fix voice result is claimed.
