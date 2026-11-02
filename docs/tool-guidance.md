# Tool selection and conversation policy

Updated November 2, 2026. The user approved the full tool-description audit for
development. Descriptions express when a capability helps, what it returns, and
essential prerequisites. The shared prompt governs dialogue, support boundaries,
uncertainty, consent and completion. Choose useful actions from the conversation;
do not encode a fixed sequence or tailor policy to individual test scripts.

## Complete tool inventory

| Tool | Selection purpose and contract |
| --- | --- |
| `get_planning_center_service_context` | Demo service questions, or proactive service/song context that informs support. One fixed Regal Playback Demo organization; real read-only API. Not hardware, licensing or download verification. Reuse context and honor rate limits. |
| `search_playback_docs` | Ground factual questions and support decisions in official help articles/User Guide results. Known platform/setup improves relevance; searching is allowed before clarification. Applicable existing results can support later guidance. |
| `get_current_playback_app_info` | Current published version, release date and reported minimum OS metadata from Apple's API, with warnings. |
| `get_relevant_changes_since_version` | Compare a known installed version with documented newer changes, optionally focused on a symptom. Includes current App Store lookup; no redundant current-version call is normally needed. |
| `lookup_demo_customer` | Account-specific status/entitlements affect diagnosis or routing. At least one provided demo ID/email/name; simulated data, not identity verification. |
| `check_team_availability` | Human requested or specialist involvement is useful. Simulated availability lookup; not consent and not a transfer. |
| `get_callback_slots` | Explore or arrange a callback, whether requested directly or offered. Exact-time availability, alternatives, returned slot IDs and local times; no booking. |
| `reserve_callback` | Explicitly confirmed returned slot and callback details. Writes simulated booking; success only on `ok=true`. |
| `initiate_handoff` | Caller requested/accepted transfer and availability confirmed. Rechecks availability, returns simulated success/failure, contacts no real staff. |
| `endCall` | Built-in voice tool; wrap-up is governed by shared prompt. No new custom definition. Text harness substitutes a goodbye because no voice call exists. |

## Local diagnostic/update candidate

The current local candidate separates choosing a useful next investigation from
the prerequisites for update advice. A clear configuration explanation is handled
first; unexplained symptoms may justify relevant historical release evidence.
Direct human requests still route immediately, and inconclusive evidence still
leads to an offer of specialist review. No timing/readiness question is required.

The release helper returns keyword-matched **candidates**, not confirmed causes.
`updateAssessment` marks missing information, blockers and whether the version/OS
prerequisites are complete. The prompt requires a complete assessment and actual
note applicability before update advice, then caller-reported outcome confirmation.
The helper checks the live iOS/iPadOS OS minimum; it does not turn that minimum
into a macOS requirement or verify external audio hardware.

This candidate is not activated on the saved agents. See the
[seven-decision review](text-tests/seven-decisions-review.md) for local runtime,
tests, results and the development auto-deploy incident/restoration. The older
synced policy and observations below remain historical context.

## Policy consolidation

- Personalization remains proactive, with relevance judged by the agent. A fault
  does not automatically require a lookup, and facts should advance support
  rather than decorate an answer. All customers still share the same demo org.
- Device facts come from retrieved sources. The platform must be established
  before device-specific advice; there is no hard ban on searching earlier.
- Existing applicable documentation can support subsequent steps without
  another identical search. New questions, insufficient results or freshness
  needs justify further retrieval.
- One general human-support fallback applies across topics. An unclear request
  can be clarified; an answer left uncertain by missing/conflicting necessary
  evidence, unsupported needs or scope boundaries gets a specialist offer.
  Exhausting a checklist is not required. Missing optional personalization alone
  does not block documented support. Coverage intents are not runtime branches.
- Consent and successful results remain mandatory for actions. Goodbye and
  completion behavior live in one ending section. Duplicate farewell directives
  were removed from booking/handoff tool results.
- The handoff holding message now describes a request, without announcing a
  connection before success. All handoffs/callbacks remain simulated.
- If the team cannot take the transfer, the agent states current unavailability,
  offers a callback and asks when the caller is next available, reusing any
  preferences already supplied. Booking still requires a checked slot and
  explicit confirmation.

## Verification and limits

The development text harness exercises the actual reasoner and deployed tools.
It uses model credits but creates no voice calls. Reviewed reports, including
unsuccessful observations and any retests, are linked from
[the text-test review](text-tests/README.md). Local mocked tests are distinct
from real Planning Center/Apple reads in these transcripts.

The saved development assistant is synced after review. Production changes
and automated voice simulations remain outside this work. Text evidence does
not validate speaker delegation, recognition, interruptions or voice lifecycle,
and is not the user's ten later manual presentation conversations.
