# Context clarification candidate C — final routing review

Six fresh first-opening text conversations used the fixed routing suite and candidate C source/development tools. Earlier A/B evidence remains intact, including the B regular01 transport failure. No retries, replacement chats or voice calls were run. The reviewer changed no source, fixture, deployment, saved assistant or production configuration.

All six fixed role-play goals recovered after applicable guidance. This does **not** mean every context question, instruction or assumption passed. Context, language, grounding and original-goal verification are graded separately below. Text results do not establish voice delivery, interruption handling or native disconnection.

## Per-run results

| Run | Caller context / explicit-context reuse | Plain language/navigation | Evidence and assumptions | Original-goal verification | Core role-play outcome | Turns | Reported USD |
|---|---|---|---|---|---|---:|---:|
| track-console-v1 | Pass: asks Playback versus sound-system control, then retains LV1 answer | Usable, with unexplained Buses terminology; no novice repair needed to read named output page | Partial: actual shared output and enabled2 observed; actual2 desk destination not established before choosing it | Pass: after caller confirms only new channel appearance, agent explicitly asks actual Guide-level/Click-level test | Recovered | 7 | 0.2071 |
| track-app-v1 | Pass: asks screen/labels and uses caller-established Playback location | Partial: Busses/master fader/faders initially unexplained; location/definition repaired after novice question | Partial: asserts separate sliders change independently before checking assignments; accepts negative result and then reads actual Guide rows | Pass: both Guide rows reassigned to existing Guide and independent app levels confirmed | Recovered after ineffective first trial | 9 | 0.2593 |
| track-clear-console-v1 | Pass: reuses explicit LV1 context without asking location again | Partial then repaired: explains bus and Settings > Buses; vague output choice needs follow-up | Partial: actual shared output and available2 observed; physical destination not established | Pass: asks LV1 Guide control test; caller confirms Click stays normal | Recovered | 8 | 0.2356 |
| 01-click-guide-v1 | **Fail/qualification:** starts provider-specific Buses questions without first locating the caller’s control; no app-versus-desk clarification before diagnosis | Partial then repaired: explains audio groups and gives Settings > Buses | Partial: actual bus outputs and available2 observed, but shared-output diagnosis is applied before control location is known;2 destination unverified | Pass: independent in-ear levels explicitly asked and actual desk recovery reported after change | Recovered in this fixture despite context weakness | 7 | 0.1926 |
| 02-reconnect-v1 | Pass: first asks actual application, then observes actual selected device/routing | Usable Settings > General > Audio Device and Buses paths; grouped music correction | Pass: actual PlayAUDIO12/current outputs observed; caller’s stated3/4 destination preserved; no invented reconnect cause | Pass: all music restored to3/4, Click/Guide remain separate | Recovered | 6 | 0.1845 |
| 03-audio-device-v1 | Playback named by caller; Mac and actual selection obtained | Partial then repaired: initial settings request lacked navigation; side menu > Settings > General > Audio Device supplied | Pass: MacBook Speakers observed before choosing listed Focusrite | Pass: actual simulated sound-system audibility confirmed | Recovered | 6 | 0.2042 |

Total: **43 recorded turns; $1.2833 reported text inference cost**. No transport error occurred in this C cohort. All successes are fictional role-play outcomes from fixed facts, not equipment telemetry or a general reliability estimate.

## Concrete evidence

The paired track openings are identical. Console first reply: “Where are you turning that track down—the Playback mixer, or a control on your sound system?” App first reply: “What screen are you using when you turn that track down, and what labels do you see for the click and guide there?” The caller establishes LV1 versus Playback before either branch selects its fix. The app question still presupposes a screen, but does not select an unconfirmed named application or mixer layer.

Console observes Click1/Guide1 and available Output2, then directs Guide2. The caller initially reports only that the LV1 now shows Guide on its own channel. The agent does **not** equate that UI observation with success: it asks, “Turn the Guide channel down on the LV1 and confirm that the Click stays at the same level in your ears.” Only after that actual scripted test does the caller report the original goal recovered. This is stronger verification than treating a completed setting change as proof.

App initially directs the Busses layer using unexplained master-fader terminology. The caller asks where that button is; navigation is repaired. It then asserts separate sliders change each part independently. The actual fixture does not recover: the caller reports that Guide changes no spoken cues and Click still changes both. The agent responds to the negative observation by asking Settings > Tracks. Caller reads **Guide Dynamic** and **Guide Non Dynamic**, both assigned Click. The agent explicitly changes **both** to the existing Guide bus, then asks the independent-level test. Caller confirms only after that applicable action. No new bus or hardware-output change is made in this branch.

Clear-console never asks the location again. It initially gives “choose another available output,” and the novice asks which one. It then asks actual menu choices before choosing2 and testing the original LV1 goal. Its initial bus explanation and navigation repair are useful; the additional turn shows these were not accessible in the first response.

Regular01’s first reply remains a context weakness: “In Playback, are the Click and Guide each assigned to their own bus, or do they show on the same bus in Settings > Buses?” It later observes separate bus rows, actual shared outputs and enabled2, then asks independent in-ear levels. In this fixed external-console fixture the resulting Guide2 action applies and caller confirms the actual desk result. Nevertheless, no caller statement established that desk-control location until after the prescribed fix. A correct outcome in this fixture does not validate that initial context assumption across other meanings of the same complaint.

The external-output variants still do not establish actual connected desk destinations before selecting2. The fixture’s physical outputs1/2 really feed separate desk channels, so the scripted recoveries are valid. This is an evidence/assumption limitation, not permission to generalize Output2 as a universal assignment.

Regular02 asks which application is being used, observes PlayAUDIO12 and actual music bus outputs, then restores the music group to the caller’s stated3/4 destination while preserving Click1/Guide2. Regular03 observes MacBook Speakers, selects listed Focusrite, and obtains audibility confirmation. It also retrieves Planning Center context, but no service/song content is used in the device fix; that lookup is not required for this recovery.

All **seven** `search_playback_docs` results actually include `evidenceScope: product-documentation` and `establishesCallerContext: false`. The deployed C metadata therefore reached these runs. Regular01 shows that its presence does not guarantee the model will first establish the relevant control context.

Every run ends with broad further-help, an ordinary caller refusal, one full branded farewell and an `endCall` entry. There are no observed duplicate standalone acknowledgements, callback reservations, transfers, destructive resets or legacy bus-creation instructions. These closing observations concern the text adapter only.

## Cleanup and frozen-source proof

All six run files have `done: true`, `cleanupComplete: true`, and no transport failure. Independent read-only Convex queries verify each generated call absent, with zero transcripts and zero events. No callbacks were created. Only this cohort’s generated IDs were cleaned; prior call history and other cohorts were untouched. See `final-routing-cleanup.json`.

All nine source hashes and all four fixture hashes match `final-config.json` at completion. Expected and actual SHA256 values are stored in `final-routing-source-hashes.json`. No private fact changed during any conversation. No further C inference will be run.
