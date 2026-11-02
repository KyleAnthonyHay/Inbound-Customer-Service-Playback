# Regal Playback conversation test plan

Updated November 2, 2026. During implementation, use lightweight **text reasoning
proofs of concept** to validate behavior quickly. The user will manually test
the voice agent later, curating ten presentation conversations across roughly
five intents. No automated voice sessions are requested or authorized. No text
testing page or other UI was added.

## Fast development checks through text

`npm run text:test` opens an interactive terminal conversation. Pass a scenario
file to run its scripted turns instead, for example:

```bash
npm run text:test -- scripts/scenarios/planning-center-song-loading.json
```

The harness uses the existing server-only Vapi private key and the `/chat`
endpoint, not `/call`. No separate OpenAI API key is required. Each transient
text configuration derives its reasoner model, effort, instructions and function
tools from the voice definition; it never changes the saved voice assistant.
Only the transport adapter changes: blank caller ID and a text-channel label,
no speaker/audio configuration, and a goodbye instead of the voice-only endCall.
The harness refuses production targets, isolates tool logs per text test and
exports only the reply/tool evidence, never Vapi's echoed credential-bearing
assistant object. Text inference still has token charges, recorded when Vapi
reports them; there are no voice-session charges from this harness.

Vapi documents [Chat-mode GPT-Live simulations as unsupported](https://docs.vapi.ai/gpt-live/testing).
The harness exercises the **reasoner**, not the full GPT-Live speaker, speech
recognition, delegation, timing, interruption handling or voice call lifecycle.
It is useful POC evidence, not proof that spoken behavior is identical. See
[Vapi Chat documentation](https://docs.vapi.ai/chat/quickstart).

Reports are labeled `text-reasoner-proof-of-concept` under `docs/text-tests/`.
They explicitly say no voice call was created and are not presentation voice
evidence. Do not count them as the user's ten manually tested voice conversations.

The first checks and prompt retests are complete; see the
[text POC review and source transcripts](text-tests/README.md). They identified
and corrected excessive questioning and a platform-before-docs ordering issue
before manual voice testing.

## Personalization requirement

The deployed development agent has a unique, read-only action that retrieves
the next service and songs from the real Planning Center Services API on its free
Services tier. It uses one shared demo organization for every synthetic customer.
The API has been verified locally and through the deployed dev webhook; this is
actual API evidence, separate from mocked unit tests and voice conversations.

The service event is simulated. Its song titles and arrangements are catalog
metadata. A caller's reported download/audio success is scripted simulation
input, not verified Playback device telemetry. See
[integration and verification evidence](planning-center-integration.md).

## Evidence audit

There are eleven existing JSON reports under `docs/voice-tests/`, covering four
distinct scenario names: song-loading-older-version, off-topic,
mac-dante-ethernet-adapter and production-weekday-callback-smoke. They predate the
Planning Center activation and do not establish current personalization behavior
or ten distinct scenario types. The production report is historical evidence;
the fresh suite targets only the development environment.

## Selected cases for manual voice testing

The user selected ten conversations across five intent groups, including the
audio-device-selection case as the final addition. The list is grouped by intent
below; earlier candidate lists are superseded. The target mix is seven agent-resolved
conversations and three correct escalations, with actual outcomes established
after testing. These are coverage labels, not runtime routing branches.

The earlier automated candidate file `scripts/voice-test-suite.json` and caller
scripts remain reference material, not the selected suite or an instruction to
run automated voice calls. The added success-criterion field makes each case
reviewable. These intended outcomes are not measured results or new routing rules.

| # | Intent group | Use case | Problem / short description | Intended handling | Success criterion |
| --- | --- | --- | --- | --- | --- |
| 1 | Routing issues | Separate click and guide | Both are heard on one in-ear channel; reviewer fixture has both buses assigned to the same output. | Agent | Retrieves applicable routing guidance, establishes current assignments, guides separation to appropriate available outputs, and caller confirms independent control. |
| 2 | Routing issues | Routing changes after reconnecting | Music tracks, excluding click and guide, normally feed outputs 3/4. After reconnecting or resetting, they are spread across outputs 3, 4, 5, 6, 7, 8, 9, 10 and beyond. This is the user's described symptom; the cause is unverified. | Agent (target) | Checks the selected device and actual bus assignments, retrieves applicable routing guidance, and guides restoring the confirmed music-output arrangement on 3/4 while retaining separate click/guide routing. Caller confirms recovery. Do not invent why reconnection changed routing or assume a universal channel map. |
| 3 | Routing issues | Wrong audio device selected | Playback is running but silent through the interface; reviewer fixture has laptop speakers selected instead. | Agent | Retrieves audio-device guidance, asks the caller to check the selection, guides selecting the interface, and caller confirms audio returns. |
| 4 | Version issues | False subscription-expired message | An active demo subscriber sees Cloud Pro expired on an older version, proposed as 8.6.1. | Agent | Checks simulated status and installed version, retrieves the documented fix introduced in 8.6.3, recommends a safe update and obtains simulated caller confirmation of recovery. |
| 5 | Setup compatibility | Clearly documented setup | USB-C iPad with Premium, Focusrite 4i4, Apple adapter and powered hub; separate click/guide plus stereo music. | Agent | Retrieves applicable requirements and gives a grounded answer covering the relevant setup without unsupported guarantees. |
| 6 | Setup compatibility | Borrowed mixer connection cannot be verified | Caller wants to connect an iPad directly to a borrowed mixer's USB socket; exact model is supplied when asked. | Human review | Asks relevant model details, checks resources, distinguishes general USB guidance from confirmation of this model, and offers specialist review if uncertainty remains. No unsupported incompatibility claim. |
| 7 | Account access / permissions | Wrong organization selected | Caller is signed in but cannot see the expected organization's content. | Agent | Uses documented organization-selection guidance and caller confirms the expected content is available; no privilege change. |
| 8 | Account access / permissions | Permission or seat missing | Access requires an actual permission or seat assignment. | Human/admin review | Explains the access requirement and agent limitation, offers specialist review and follows the consented escalation path. A church administrator may need to grant access. |
| 9 | Song loading / content availability | Documented recovery succeeds | A song will not load; when asked, caller reports Audio Files Missing. | Agent | Retrieves the documented recovery procedure, guides appropriate retries and receives simulated confirmation that the song loads. The scenario uses recovery on the third retry. |
| 10 | Song loading / content availability | Documented recovery fails | Same real error persists after retries; clearing local downloads is unsuitable shortly before service. | Human review | Recognizes that no suitable supported next step remains, avoids forced destructive changes or an invented diagnosis, and offers/follows the consented specialist path. |

The selected ten target seven agent resolutions and three escalations. Actual
outcomes must be recorded separately after each manual conversation. The
reconnection symptom and intended outputs are now specified; device/interface
details for the text fixture are below; the underlying reset/reconnection cause
is not established. Intended agent resolution is not a guarantee.

### Concrete fixtures and caller worksheet

The cases and two phrasing variants are in `scripts/text-cases/curated.json`.
[The caller worksheet](curated-caller-worksheet.md) separates opening statements,
facts revealed as needed and reviewer-only expectations. Playback 8.6.4, Mac,
PlayAUDIO12 and the observed bus assignments define the simulated reconnecting
fixture; these are test assumptions, not claims about the user's actual device.

Compatibility pair:

- **Documented setup:** a USB-C iPad with Playback Premium, Focusrite 4i4,
  official Apple USB-C adapter and powered USB hub. Caller asks whether this can
  provide separate click/guide outputs and a stereo music pair. The
  [supported-interface list](https://www.multitracks.com/products/playback/supported/)
  lists Focusrite 4i4 with four outputs and a required USB hub; the
  [USB connection guide](https://helpcenter.multitracks.com/en/articles/4466444-how-do-i-connect-my-usb-audio-interface-to-playback)
  documents the powered-hub/Apple-adapter setup. Agent should verify the
  requirements rather than guarantee the entire sound system.
- **Borrowed mixer specialist review:** an iPad user borrows a different
  soundboard and asks whether its USB socket can take Playback audio directly.
  The simulated model is Mackie ProFX12v3, revealed when asked. The caller cannot
  confirm class compliance or the model's iPad connection requirements, and
  this mixer is absent from the bounded tested-interface list. That absence is
  not proof of incompatibility. The agent should seek details and resources and,
  if it cannot establish the exact connection, offer specialist review rather
  than guessing or declaring it unsupported. The fixture does not claim that
  the real mixer is incompatible or that its manufacturer has no documentation.

The user rejected Bluetooth as too basic a question and the site-specific Dante
proposal as too technical for the demo, then accepted the borrowed-mixer case.
Historical development reports are retained; neither rejected proposal belongs
to the selected ten manual cases.

These are simulated fixtures, not claims about the user's actual gear
or newly verified hardware tests. No purchases, settings changes or calls occur
when defining them.

### Current phrasing checks

Two fresh conversations per case have been completed through the existing text
reasoner and real development tools. The twenty-conversation
[phrasing audit](text-tests/curated-phrasing-review.md) records actual outcomes,
including remaining consistency issues. Start a fresh run with
`npm run text:cases -- start <dir>`.
Reviewer facts/expected fixes are saved with the reports but never sent to the
agent. Follow-ups are authored after inspecting the agent's actual question,
then submitted with `npm run text:cases -- reply <dir> <replies.json>`.

The run captures the shared prompt/tool-definition fingerprint and refuses to
mix a changed configuration into an existing conversation. Each conversation
has an isolated tool-log ID, eight-turn cap, safe result projection and cleanup.
No voice session or saved-agent update is created by this runner. Model credits
and actual read-only API requests still apply. Transport completion is not a
behavioral pass; review source/tool use and each final outcome separately.

Reviewer-known causes and expected fixes above must stay out of the caller's
opening and agent prompt. The caller supplies observations and exact messages
naturally as the agent asks. Verify actual documentation/tool use in the trace.
The subscription release notes establish the false-expiration fix in 8.6.3 but
do not enumerate every affected version; 8.6.1 remains a simulation assumption.

The recovery guidance is sourced from the official
[download-error guide](https://helpcenter.multitracks.com/en/articles/13452943-troubleshooting-playback-download-errors),
which describes a different recovery attempt on the third retry for Audio Files
Missing and treats clearing local downloads as a last resort. Caller-reported recovery
is simulated conversation input, not observed Playback device telemetry. These
are test expectations, not new case-specific agent rules.

An unavailable-team callback can be exercised within an escalation case without
adding a separate intent. If selected, arrange and restore an unavailable
**simulated dev** fixture when the user is ready; do not change production or
rely on random staffing. Callback booking requires checked time/zone/number and
explicit confirmation; it writes a demo booking and contacts no real staff.

Additional tests may follow failures. Ten **completed conversations** are required
before claiming the conversation-count requirement; failed launches, unit tests,
HTTP webhook checks and planned scenarios do not count as conversations.

## Review and presentation evidence

For each fresh report, record the actual caller/agent transcript, tool calls,
ended reason, classified intent, resolution, escalation and containment. Review
the transcript rather than treating the harness finishing as a pass. Scripted
caller answers may not match the agent's question; flag that limitation and
retest or use a manual conversation when it affects validity.

For the personalization cases, confirm the agent actually chooses the tool,
speaks only returned service/song facts, uses the same shared context across
customer identities, and does not imply verified licenses, imports or routing.
Report failure modes and subsequent retests transparently.

Populate `docs/test-matrix.md` from observed fresh reports. Calculate intent
accuracy and containment using the documented denominators; a correct escalation
is successful but is not contained. Preserve source report links for presentation
claims. Do not invent metrics, pass/fail counts or customer outcomes.
