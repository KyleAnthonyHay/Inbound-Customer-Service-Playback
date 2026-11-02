# Specialist offer and call ending — November 2

The latest inbound phone trace completed a simulated handoff but did not call native endCall until the caller continued and accepted again, about a minute later. The browser fallback did not cover that phone call. It also offered a later callback instead of proactively offering a specialist when the caller could not inspect the needed connection.

Changes:

- When needed setup information cannot be checked, offer a specialist now. Help find simple facts first; do not require the caller to invent the specialist option. Callback remains a fallback after unavailable staffing, or a caller-requested option.
- A successful availability-rechecked handoff explicitly returns conversationComplete, endCallRequired and nextAction=endCall. The speaker finishes the simulated-handoff announcement and branded goodbye, then delegates ending without another caller turn. A lookup or failed handoff does not complete the workflow.
- Successful live handoffs schedule one internal server-side end-call fallback after 15 seconds, allowing time for the farewell. It uses the signed webhook's private per-call control URL, restricted to the matching call on Vapi HTTPS hosts. It skips already-ended calls, never retries uncertain control writes, and records command acceptance separately from actual disconnection. No control URL appears in tool results or public history. The browser fallback now allows the same grace period instead of cutting speech off after 400 milliseconds.

Reviewed text evidence (three conversations, eleven turns; manually steered ordinary caller replies, not blinded simulations):

| Case | Observed result |
| --- | --- |
| [Unknown connection](specialist-handoff-2026-11-02/unknown-connection-v1.json) | Offered a specialist after caller could not inspect the iPad; after acceptance checked availability, initiated one simulated handoff and used the branded goodbye. No callback substituted. |
| [Cannot inspect / decline](specialist-handoff-2026-11-02/cannot-inspect-v1.json) | Offered a specialist without a caller request. Declining that option caused no transfer, booking or forced goodbye. |
| [Busy team](specialist-handoff-busy-2026-11-02/human-unavailable-v1.json) | Checked availability before offering callback; declining booked nothing. Original development team status restored in finally. |

All isolated text logs were cleaned. Text model usage: $0.1404. The successful text handoff returns endCallRequired=true but schedules no live control because there is no voice call. The text adapter substitutes the goodbye for native endCall; this is **not evidence of an actual disconnect**.

83 local tests passed, including nine new tests for scheduling, availability/failure guards, deduplication, control URL restrictions, the exact mocked HTTP end-call command, already-ended calls and safe handling of provider rejection/timeout. TypeScript and targeted ESLint passed. A deployed dev invocation exercised the missing-call guard without sending a control command or creating a call.

Remaining quality observations: a compound setup question and a brief routing explanation before one specialist offer remain in the traces. These cases passed their focused routing/consent criteria, not a claim of perfect dialogue.

No automated voice or phone call was placed. A fresh manual browser/phone call must still verify the complete audible goodbye and actual disconnection. Provider HTTP acceptance alone is not completion. Official references: [GPT-Live live call control](https://docs.vapi.ai/gpt-live/configuration#live-call-control), [control URL and end-call command](https://docs.vapi.ai/calls/call-features).

Activation: development and production Convex functions deployed without reseeding or deleting history. Both saved assistants were synced. The production speaker/reasoner were read back and matched source, native endCall is attached, live control is enabled with its default per-call capability authentication, and the existing phone number still routes to the production assistant. An unsigned production webhook was rejected; a signed availability-only check returned handoffStarted=false. Its isolated verification log was removed. No production team, callback or account fixtures were changed.
