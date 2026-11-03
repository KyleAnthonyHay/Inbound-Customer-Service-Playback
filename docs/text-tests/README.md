**Latest feedback update:** [Account reuse, mixed intent labels and grouped callback questions](three-feedback-2026-11-03/review.md) records the three subsequent changes, five focused text conversations, local checks and development activation. The [earlier parallel ten-case audit](parallel-suite-2026-11-03/review.md) retains its original configurations and findings. Text results do not establish voice delivery or disconnect.

**Current workflow:** [Open-ended developer conversations](../open-ended-test-method.md), with [the completed ten-conversation review](open-ended-review.md). The findings below are historical; Jordan now has one informal usability try-out, not a ten-call script.

# Text reasoning proof-of-concept review

## No-audio prerequisite and callback completion follow-up

The [follow-up review](audio-device-callback-review-2026-11-03.md) supersedes the blanket external-output mapping prerequisite from the routing change below. A novice no-audio case now checks Playback's selected device; callback availability, reservation and guarded closing are distinct, with positive/negative text evidence and development activation readback. Fresh voice disconnect remains a manual check.

## Click/Guide output routing regression

The [November 3 review](routing-output-review-2026-11-03.md) retains the reported voice failure, an incomplete first text candidate, and a corrected output-routing retest. Version-restricted legacy procedures are now gated in retrieval. Text checks do not establish live speaker or audio behavior.

## Post-call measurements

[Call metrics](../call-metrics.md) defines the ten expected scenario labels, blind structured-output review, denominator rules and phone timing limits. Native post-call previews on three existing calls are [recorded separately](../call-reviews/post-call-metrics-2026-11-03.md); they do not create voice calls or validate live voice behavior.

## Planning Center simulation and real access

The [two-turn access check](2026-11-03T05-06-32-077Z-planning-center-api-access.json)
used one successful live Services API read, returned the three scheduled songs,
then affirmed read access to the connected demo plan without a second lookup.
Reported text cost: $0.0399. The tool description, success metadata and both
prompts now distinguish fictional scenario content from a real API connection.
Successful data is the working caller context in the simulation; actual failures
must still be reported truthfully. This is development text evidence, not a
passing voice test or a production activation.

Development activation is complete: [saved-agent readback](planning-center-api-access-activation.json)
matched the revised speaker/reasoner prompts and tool description, with production
unchanged. The [deployed webhook check](planning-center-api-access-webhook.json)
confirmed the new successful-result guidance and three songs from a live API
read; its isolated tool log was removed.

## Guarded closing and recent speech

The [closing change and validation](../call-closing.md) replace immediate model hang-up with a protected function that waits for farewell and speech-completion evidence. Three focused text controls and an advice retest retain both the initial premature advice ending and the corrected further-help check. Text does not establish voice timing or acknowledgment quality; the manual voice recheck remains outstanding.

The [duplicate acknowledgment regression](../acknowledgment-regression.md) adds
actual-call excerpt tests and a reusable final-transcript check. It flags three
duplicate openings in the recorded failing call. This verifies detection of the
reported defect; a fresh manual dev voice check must establish the speaker fix.

The [subsequent browser closing/context fix](../call-closing.md#follow-up-browser-goodbye-without-disconnect)
addresses the observed farewell-without-disconnect and separate thank-you before
goodbye. Its four-turn text check passed with explicit last-two-reply context;
118 local tests passed, and the deployed dev webhook verified context projection.
The saved development agent was synchronized; production was unchanged. Browser
audio completion has simulated event coverage and awaits a fresh manual call.

## Single reviewer demo script

The [five-turn reviewer sample](reviewer-demo-review.md) combines documented song recovery with a live Planning Center API read and reuse of the returned setlist. It is separate from the ten curated developer conversations. The [concise caller script](../reviewer-demo-script.md) supplies ordinary observations without requiring Playback knowledge. Final text cost was $0.0532; voice delivery and disconnect remain manual checks.

These are actual Vapi **Chat API** responses using a transient text configuration
derived from the development voice agent's reasoner, instructions and tools. No
voice sessions were created, no new OpenAI key was used, and no testing UI was
added. Text inference is billable and the reports retain Vapi's reported costs.
These checks are development evidence, not the user's ten later manual voice
conversations for the presentation.

## Latest ten-case phrasing audit

The subsequent [seven diagnostic/update checks](seven-decisions-review.md) passed
their focused criteria using the local candidate release tool: independent version
investigation, complete update prerequisites and three routing controls. The report
records remaining quality issues, limits of the sample, and an unintended dev
auto-publish that was restored. Saved assistants were not changed. This candidate
is not activated; the ordinary harness still targets the earlier deployed tools.

The [curated phrasing review](curated-phrasing-review.md) covers twenty fresh
text conversations, two phrasings for each of the ten user-selected cases.
All requests completed under one unchanged agent configuration and all isolated
logs were cleaned up. Reported model cost was $0.9384. Production and the saved
development agent remained unchanged during this audit.

The behavior is **not uniformly consistent yet**: six case pairs met the core
objective in both variants; four exposed wrong legacy guidance, premature
escalation, dependence on a caller's version hint, or a delayed specialist offer.
The structured qualitative review labels 15 variants as meeting core case
criteria and five as having a material issue, with style/efficiency notes tracked
separately. These are limited text POC findings, not a statistical reliability
estimate or the ten manual presentation conversations. The complete caller
worksheet and actual transcript/tool evidence are linked from that report.

## Current tool-guidance revision — November 2, 2026

All nine custom tool descriptions now emphasize selection purpose, outcomes and
essential prerequisites. Conversation and completion policy is centralized in
the shared prompt. The built-in end-call tool is retained. See
[complete tool inventory and design](../tool-guidance.md).

Reviewed observations from the revised instructions (not a controlled old/new
benchmark):

| Check | Observed behavior and source |
| --- | --- |
| Unsupported/unverified compatibility | Early runs still suggested alternatives instead of a specialist: [initial](2026-11-02T16-42-07-509Z-setup-compatibility.json), [first refinement](2026-11-02T16-43-04-423Z-setup-compatibility.json), [second refinement](2026-11-02T16-43-36-220Z-setup-compatibility.json). After elevating the general human-support policy, [retest](2026-11-02T16-45-09-491Z-setup-compatibility.json) acknowledged unverified Bluetooth support, offered a specialist and completed a simulated handoff after acceptance. It also made an unnecessary Planning Center read; relevance remains a manual-review concern. |
| Uncertainty outside compatibility | With the final general fallback, [a synthetic unknown download code](2026-11-02T16-46-21-015Z-uncertain-answer.json) prompted a documentation lookup, explicit uncertainty and specialist offer, then availability and a simulated handoff on acceptance. No invented meaning or generic troubleshooting detour. |
| Ordinary song loading | [Final-policy check](2026-11-02T16-46-31-662Z-planning-center-song-loading.json) continued documented troubleshooting rather than escalating prematurely, retrieved shared Planning Center context once, and reused its earlier documentation result for the next step. Customer/version lookups also occurred. Caller-reported resolution is simulated. |
| Direct human request | [Check](2026-11-02T16-42-12-152Z-human-first-text-poc.json) used availability and simulated handoff only; no docs or Planning Center lookup. |
| Callback consent | [Final-policy check](2026-11-02T16-46-36-627Z-callback-consent.json) checked the exact requested time and explicitly left it unbooked; no reservation occurred before or after the caller declined. This is not a positive booking-completion test. |
| Unavailable human team | [Controlled dev check](2026-11-02T16-48-25-369Z-unavailable-team.json) temporarily set simulated support staffing to busy, with no active dev call. The agent checked availability, stated support was busy, offered a callback and asked when the caller was available. It checked the requested time, asked for booking consent, and made no reservation after the caller declined. No handoff/Planning Center/docs calls occurred. Original available status was restored in a finally block. |
| Audio output | [Check](2026-11-02T16-42-40-419Z-planning-center-audio-output.json) retrieved the shared plan once, asked for platform, then grounded device guidance in documentation after the caller supplied it. A broad earlier search was allowed. |
| Version and account context | [Check](2026-11-02T16-42-43-843Z-version-entitlement.json) used simulated customer status and release comparison. It identified the documented fix without a redundant standalone App Store call. |

Planning Center and Apple responses in these runs are actual API reads; customer
records and handoffs remain simulated. Local unit tests use mocked APIs. No voice
calls or staff/customer contacts were created. These observations demonstrate
particular runs, not a guarantee of identical model behavior on every turn.

The final cross-topic fallback was followed by the unknown-code, ordinary-loading
and callback-consent checks. Earlier checks above identify their exact reports;
they were not all rerun after every wording change. Only an actual manual voice
check can establish speaker behavior and call lifecycle.

The subsequent unavailable-team wording was verified in its controlled check.
The first twelve tool-guidance text runs reported $0.3853 total; the additional
unavailable-team report retains its own cost. Exported reports were checked for
the configured Vapi and Planning Center credentials; no matches were found.

## Earlier observations and retests — November 2, 2026

The platform-before-search and mandatory-personalization wording below was an
earlier iteration; the current policy above supersedes it.

| Check | Initial finding | Adjustment | Latest observed result |
| --- | --- | --- | --- |
| Natural song-loading personalization | Retrieved context proactively, but listed every song and asked two questions. Scripted caller also omitted the requested error detail. | Limit context to one detail and one question; ask which song first. Correct the scripted caller's next reply. | Retrieved the shared plan once without a setlist request, mentioned Graves Into Gardens, asked which song, then retrieved docs after receiving the error details. |
| Audio-output personalization | Retrieved context proactively, but searched docs before knowing the platform. | Require platform before audio documentation search, in both prompt and tool description. | Retrieved context once, asked iPhone/iPad/Mac, then searched docs after the iPhone/USB-interface reply. |
| Direct request for a person | Negative control for the broader personalization trigger. | No change needed. | Called team availability and simulated handoff; zero Planning Center or docs lookups. |
| Setup compatibility | Baseline suggested alternative equipment and inserted a song-plan detail, without offering a specialist. | Explicitly distinguish documented incompatibility from unverified support, offer a specialist, and skip setlist context for compatibility-only reviews. | Consulted documentation, explained that Bluetooth support was not established, offered a specialist, then checked availability and completed a simulated handoff after acceptance. |

Latest source reports:

- [Song-loading retest](2026-11-02T16-17-00-770Z-planning-center-song-loading.json)
- [Audio-output retest](2026-11-02T16-18-48-449Z-planning-center-audio-output.json)
- [Human-request control](2026-11-02T16-18-52-689Z-human-first-text-poc.json)
- [Compatibility baseline](2026-11-02T16-27-17-899Z-setup-compatibility.json)
- [Compatibility retest](2026-11-02T16-27-36-048Z-setup-compatibility.json)

The compatibility comparison used the same two caller turns before and after the
prompt change. Neither saved response made a 150-millisecond latency claim; an
earlier spoken progress update mentioning such a claim was inaccurate. These two
text runs reported a combined cost of $0.0658 and created no voice calls. The
revised prompt was synced to development only.

Both personalization reports returned **Regal Playback Demo**, the same upcoming
plan and the same three catalog songs for different synthetic customers. The
initial reports remain alongside the retests so findings are transparent.

The scripted callers report resolution; the harness does not observe a real
Playback device. Reports are not automatic pass/fail evaluations. The Vapi text
response may also include tool request-start holding messages that GPT-Live does
not speak verbatim. Voice speaker behavior, delegation, timing, interruptions,
speech recognition and end-call behavior still require manual voice validation.

All 57 local tests and TypeScript checks pass, including four text-harness
contract/security checks. The final support-policy refinements were synced only
to **Playback Support (dev)**; production is unchanged.
