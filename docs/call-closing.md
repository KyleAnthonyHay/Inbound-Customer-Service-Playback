# Guarded call closing

Development change, November 2, 2026. Production has not been synchronized to this change.

## Observed failure

The latest development browser call used the previous speaker/reasoner configuration. Its transcript shows “Thanks.” followed by “Thanks, that's helpful,” and ends with the caller's “Nope,” the speaker's “Okay,” and an immediate native `endCall`. No branded farewell was spoken. The [sanitized record](call-reviews/latest-closing-regression.sanitized.json) retains the spoken lines and final tool events without assistant credentials or private call-control URLs.

The transcript also recorded **six** retry attempts rather than the sample script's one prior attempt. The reasoner therefore treated the error-specific retry procedure as exhausted. This explains that run's diagnostic branch; it is not evidence of random routing under identical inputs. The recording has not been audited to determine what was actually spoken.

## Change

- `endCall` is now a protected function tool that prepares closing and returns the farewell, rather than the immediate native model tool. The speaker can receive and speak the result before any disconnect request.
- An internal Convex job waits for a branded farewell in signed transcript/conversation events and a subsequent assistant speech-stopped state. At least eight seconds must have elapsed since closing was requested. Time alone, an opening greeting, a bare acknowledgment, missing speech evidence, or an ongoing utterance cannot authorize disconnect.
- Caller speech pauses the check until a final transcript is available. A brief courtesy sign-off can finish normally; a new request cancels the pending closing. Old jobs cannot act on a newer closing request. Requests are deduplicated, and an uncertain HTTP control write is never retried automatically.
- A successful consented simulated handoff uses the same guarded closing path. The browser's blind 15-second handoff stop was removed. Availability checks and declined offers do not themselves schedule closing.
- The speaker may delegate silently. Both prompts check recent assistant speech and keep acknowledgments out of the substantive reply. An interrupted caller sentence does not require a new acknowledgment.
- Acknowledging a single advice answer does not replace the broad further-help check. Explicit leave requests remain immediate closing intent.

The private control capability stays in internal scheduler arguments. It is never stored in public call history, returned to the model, or accepted as a model-supplied argument. Text tests cannot schedule voice control.

Vapi documents the two models' different transcript views in [conversation design](https://docs.vapi.ai/gpt-live/design) and HTTP control plus generated-speech limitations in [GPT-Live configuration](https://docs.vapi.ai/gpt-live/configuration). Submitting speech guidance is not proof of playback, so the new handler waits for evidence instead of treating the prompt or a fixed timeout as sufficient.

## Validation

- 103 local tests, TypeScript and targeted ESLint passed. Closing cases cover greetings versus farewells, ongoing speech, missing stop evidence, caller interruption, courtesy replies, old requests, deduplication, private capabilities and one-shot HTTP control.
- Three [text controls](text-tests/guarded-closing-2026-11-02/) tested reported recovery, a definition question and an explicit leave request. All returned the branded farewell via the protected function's text-only path. The initial definition conversation closed after acknowledging the answer without a broad further-help question; that failure is retained.
- A [focused advice retest](text-tests/guarded-closing-advice-retest-2026-11-02/) after the recent-message rule change included the broad further-help question with its answer, then returned the branded farewell only after the caller declined. All four conversations are marked done and their isolated logs were cleaned. Total reported text cost: **$0.1080**.
- The development backend was deployed, and saved development speaker/reasoner prompts were read back against source. The function tool replaced native immediate hang-up. A before/after comparison verified the production model was unchanged.

No automated voice sessions were launched. These checks do not prove live prosody, acknowledgment frequency, transcript delivery order or disconnect timing. If final transcript/speech evidence never arrives, the checker stops after a bounded number of checks and logs the unverified ending; it does not issue a blind hang-up. A manual development voice check remains necessary.

## Follow-up: browser goodbye without disconnect

The [next recorded development call](call-reviews/goodbye-without-disconnect.sanitized.json)
said “Thank you,” successfully requested closing, spoke the branded goodbye,
then remained connected long enough for an idle check-in. Its stored closing
state had an empty farewell and no assistant-stopped timestamp. The scheduled
check exhausted its attempts; the final ended reason was customer-ended-call.
The tool succeeded at requesting closing, not at disconnecting the call.

Browser calls now have a local completion path in `useVapiCall`: a successful
protected closing result arms it; an observed branded farewell (including
partial transcripts), actual remote audio after the request, and SDK speech-end
authorize SDK stop after a short quiet window. It does not wait for a final
transcript that may arrive only when the caller speaks again. Resumed audio
pauses the window; a new caller partial blocks it and a substantive final cancels
it. Manual stop, call-end and unmount clear pending work. This is local browser
stop, so the provider may classify it as customer-ended-call; the activity log
identifies the completed requested closing. The server guard remains for other
channels and does not assume browser audio events reach the webhook.

Both prompts now explicitly inspect the last **two** assistant messages and
prohibit standalone acknowledgment before delegation/closing. Tool replies
include `conversationContext.recentAssistantMessages`, projected from the signed
webhook's assistant speech with stored transcript as fallback. A documented
`append-context`/`thinking` control supplies the same reminder to the speaker
without requesting another utterance. Context is the latest available text,
not a claim to capture concurrent speech before it is transcribed. Optional
context failures cannot change a completed tool action into a failure.

The text harness supplies its actual last two replies through the same context
formatter. The [four-turn retest](text-tests/acknowledgment-context-retest-2026-11-02/acknowledgment-regression-v1.json)
reported $0.1056, returned one branded goodbye without duplicate acknowledgments,
and cleaned its isolated log. Text transport still inserted “Just a sec” before
the final tool result; GPT-Live does not speak classic tool-start messages.
The expanded checker catches the recorded separate thank-you before the goodbye.
All 118 tests, TypeScript and targeted lint passed before activation. Browser
completion is covered with simulated SDK events; a fresh manual voice replay
is still needed. No paid voice simulations were launched.

The reported localhost connection-refused screenshot corresponded to no process
listening on port 3000. The Next server was restarted and `/call` returned HTTP
200 and loaded in Chrome. No retained Next error identifies muting as the cause
of the process exit, so that causal claim remains unverified.

Development activation completed: Convex functions pushed successfully; saved
speaker/reasoner prompts matched source on readback; authenticated control was
enabled. The [activation record](text-tests/acknowledgment-context-retest-2026-11-02/development-activation.json)
also verifies the production model was unchanged. A [deployed webhook smoke check](text-tests/acknowledgment-context-retest-2026-11-02/webhook-context-smoke.json)
returned exactly two supplied assistant messages and excluded system text using
an isolated text-only closing request; its logs were removed. The local Next
process now runs detached from the tool terminal; `/call` still returned HTTP
200 after its launcher exited. No production deployment was performed.

## Audit: successful tool request with no UI disconnect

The [subsequent call](call-reviews/closing-ui-trigger.sanitized.json) again requested
closing and spoke the goodbye in two transcript fragments. The server's closing
check expired after roughly 32 seconds, and an idle check-in followed. A manual
HTTP end request was accepted while the caller was also hanging up; the provider
recorded assistant-ended-call. That is not an automatic-closing pass.

The browser had a separate dependency the earlier unit tests bypassed: it armed
closing only inside the SDK `tool-calls-result` handler, and that handler requires
a particular result shape and tool-call ID. The activity panel can show the
successful tool from Convex independently. Seeing the tool row therefore did
not establish that the browser controller was armed. No captured raw SDK trace
establishes which missing/result-shape condition affected that individual run.

`BrowserClosingBridge` now subscribes to this browser call's authoritative
`closingRequestedAt` and arms the controller independently of the SDK result.
It is mounted outside the activity panel's open/closed state. The controller
retains the current caller turn's spoken fragments and audio evidence so a late
server update can complete closing; a new caller turn clears old pre-request
speech. Request timestamps deduplicate reactive updates. The UI records server
confirmation, its current wait phase, and SDK stop request separately.

New regressions start with the server signal rather than directly calling
`arm()`. They cover no SDK result, a delayed signal after farewell/audio, and an
old farewell before a new caller turn. All **121 tests**, TypeScript and targeted
lint passed. The existing dev simulator at `/call?demo=1` now has **Simulate
closing without SDK result**: it uses the actual hook handler/controller and a
stubbed SDK stop, creates no call, and exercises the delayed-signal case. Chrome
verification reached **Call Ended** and settled both the closing request and tool
rows. This is simulated UI evidence, not a fresh passing voice call. No model
change or new paid voice session was needed for this client wiring correction.

The recorded voice style still fails the acknowledgment check: “Okay” followed
by “Thanks for waiting,” plus “Great, okay” before the split branded goodbye.
The checker now recognizes those stacked words and a farewell split across
assistant messages. Its nonzero result is retained; the previous text check is
not evidence that the live speaker has stopped repeating acknowledgments.
