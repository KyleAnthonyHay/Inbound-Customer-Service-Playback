# No-audio prerequisite and callback completion regression

## Observed failure

The third manual script escalated without checking Playback's selected Audio Device because the caller could not identify which interface outputs fed the desk. The newly added blanket physical-destination prerequisite caused this regression. It has been removed: Playback-side device selection and ordinary documented routing guidance do not require a cable-to-board map. Further context should be requested only when it changes a supported next step.

The same voice call checked team availability and then callback slots. It never invoked `reserve_callback` or `endCall`, but announced a booking and spoke the goodbye anyway. The browser caller had not supplied a callback number. The slot lookup was successful; it did not create a reservation, notify a team or disconnect the call.

## Changes

- Both speaker and reasoner now distinguish availability from completion. Confirming that “12” means noon is not approval of a full booking. The caller's date/time, zone and number must be read back and approved before invoking `reserve_callback`; success requires `ok=true` and a booking ID.
- Availability tool results explicitly return `bookingCreated=false` / `teamNotified=false`. Browser calls signal that a number is still required. Missing-number reservation attempts return a useful prerequisite error rather than throwing.
- A successful reservation returns `endCallRequired=true` and also arms the existing guarded closing observer when the voice call provides a valid private control capability. Failed reservations and availability lookups do not arm it. This waits for farewell and speech-completion evidence; it is not an immediate/timed blind hang-up. The explicit `endCall` request remains part of the normal flow, deduplicated by the existing closing helper.
- Development-only admin cleanup can remove a generated `text-poc-<UUID>` booking and release its test slot without releasing a slot belonging to another confirmed booking. It cannot target normal voice call IDs or production. History deletion remains separate and does not cancel ordinary callback bookings.

## Actual text POCs

Used the existing text harness, with private caller facts, no new chat UI and no voice sessions. These validate reasoner decisions and tool effects, not GPT-Live speaker delivery or actual audio disconnection.

| Check | Observed result | Evidence |
|---|---|---|
| No sound on Mac, novice cannot locate settings | Guided Settings → General → Audio Device. Caller read MacBook Speakers and listed Focusrite 4i4; agent instructed selecting Focusrite, then asked for sound confirmation. Fictional caller reported sound only after that step. No cable/desk mapping or escalation was requested. Further-help check and explicit endCall followed. | [Six-turn conversation](audio-device-callback-2026-11-03/03-audio-device-v1.json) |
| Unavailable specialist → positive callback | Availability check, exact-time lookup, requested name/number, full date/time/zone/number readback, explicit caller approval, successful reserve_callback, then endCall and branded farewell. | [Four-turn conversation](audio-device-callback-2026-11-03/callback-completion-v1.json) |
| Caller says check time, do not book | Looked up the time and explicitly said nothing had been booked. After cancellation/goodbye, called endCall without reserve_callback. | [Negative consent control](2026-11-03T06-47-18-230Z-callback-consent.json) |

The positive callback's actual synthetic Convex booking was verified as confirmed. Its one isolated test booking was then removed and the slot verified open again; no real staff/customer contact occurred. [Write/cleanup proof](audio-device-callback-2026-11-03/booking-proof.json). Both phased text tool logs were cleaned after completion. Reported model costs were $0.2435 for the audio case and $0.0950 for the positive callback; the negative control retains its reported cost in its own report.

Some replies still contained holding/filler lines. This is not a clean acknowledgment or live-voice lifecycle pass. The reported Script 1 failure remains historical limitation evidence; these checks do not establish that all ten scripts now pass.

## Activation and checks

150 local tests, TypeScript and ESLint passed. Tests cover availability versus completion, missing callback numbers, guarded closing only on reservation success, capability redaction, cleanup isolation and preservation of another booking's slot. Existing guarded-closing tests still require actual farewell/speech completion and protect interruptions.

Development Convex code was deployed with type checking. Both saved-agent instruction sets and the two availability-tool descriptions were updated and [read back](audio-device-callback-2026-11-03/activation.json). Existing artifact settings were retained; the production assistant fingerprint was unchanged. Use a fresh manual dev call to validate actual speaker behavior and post-farewell disconnect. No automated voice calls were created.
