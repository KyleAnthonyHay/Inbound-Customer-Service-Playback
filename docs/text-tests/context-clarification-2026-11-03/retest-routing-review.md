# Context clarification candidate B — routing retest

Six fresh first-opening conversations used the corrected, fixed routing suite and candidate B source. Candidate A files remain intact. These are manually steered text POCs, not voice delivery, audio-timing or native-disconnect evidence. The reviewer changed no source, fixture, deployment, saved assistant or production configuration.

Five conversations completed the original support goal. Regular01 stopped on a transport error before recovery: it is inconclusive, not a model pass or model failure. No run was retried or replaced.

## Per-run results

| Run | Context clarification / clear-context reuse | Simple language/navigation | Evidence before assuming | Original-goal check | Core outcome | Turns | Reported USD |
|---|---|---|---|---|---|---:|---:|
| track-console-v1 | Pass: asks Playback versus other equipment before diagnosis; retains LV1 correction | Partial: initially unexplained buses, repaired with “separate audio lane”; unnecessarily repeats both supplied track assignments | Partial: actual separate buses, shared output and available2 observed; own LV1 channel for2 asserted without establishing its connected destination | Pass: explicitly asks independent in-ear control; caller confirms after output change | Recovered, with evidence/efficiency qualifications | 11 | 0.3087 |
| track-app-v1 | Pass: asks where/what app or screen; then follows confirmed Playback context | Partial: Busses/master fader labels not explained when asked, but usable navigation supplied | Pass: treats same-bus cause as a hypothesis, observes actual Guide assignments after low-risk slider test fails | Pass: both Guide rows changed to existing Guide, then independent spoken-cue/click volume confirmed | Recovered | 8 | 0.2465 |
| track-clear-console-v1 | Pass: no redundant location question; checks selected Audio Device | Partial: Buses label used without a brief explanation; specific page and row are actionable | Partial: actual shared output observed, but2 availability/connection not established before assigning2 | Pass: independent LV1 spoken cues confirmed after change | Recovered, evidence qualification | 5 | 0.1380 |
| 01-click-guide-v1 | Pass: asks Playback versus mixer/headphones and follows desk answer | Partial then repaired: explains bus as a separate feed and supplies Settings > Buses > Guide | Sound through last saved reply: actual Guide1/Click1 observed, next asks available outputs | Not reached | Transport-inconclusive | 5 | 0.1296 |
| 02-reconnect-v1 | Clear opening; no irrelevant context clarification | Partial: first bus-settings request needed navigation; repaired; three music buses changed serially | Pass: actual current outputs observed, caller’s3/4 destination retained; “may have recalled” remains a hypothesis, not a confirmed cause | Pass: all music on3/4 and Click/Guide still separate confirmed | Recovered | 7 | 0.1926 |
| 03-audio-device-v1 | Clear issue; asks actual computer and device selection | Partial then repaired: initial “where ... connection selected” vague; Settings > General > Audio Device supplied after novice uncertainty | Pass: actual MacBook Speakers selection observed before choosing listed Focusrite | Pass: song audible through sound system confirmed | Recovered | 5 | 0.1357 |

Total: **41 successfully recorded turns; $1.1511 reported text inference cost**. Any provider charge associated with the failed request is unavailable from this trace and is not included. The five completed outcomes should not be generalized into a reliability rate.

## Branch fidelity and remaining weaknesses

Both identical ambiguous track openings now elicit context questions before selecting a fix. Console: “Where are you turning that track down—inside the Playback mixer, or on another piece of equipment?” App: “Where are you adjusting that track—what app or screen are you looking at when the click and guide change together?” Unlike candidate A’s blocked app opening, neither restricts the answer to two Playback mixer modes.

After the console caller says LV1 rather than Playback, the agent investigates the applicable Playback source routing instead of trying an in-app level change as the console solution. It asks actual Tracks assignments and actual Buses outputs, then available outputs. However, it repeats both track assignment observations individually after the caller already supplied them together. This contributes to11 turns. Its final instruction says Output2 “will put Guide on its own LV1 channel” without establishing the actual connected desk destination. Output2 is indeed connected in this fixed fixture, so the resulting simulated recovery applies; the conversation nevertheless does not justify that certainty for an arbitrary setup.

The app branch first tests the existing separate Busses sliders. Under its actual fixture that does not fix the issue: the caller reports “Lowering the Guide slider hasn't changed the spoken cues at all. The Click slider still changes them both.” The agent then asks the actual Settings > Tracks Guide assignment. The caller reads **Guide Dynamic and Guide Non Dynamic**, both Click; the agent changes **both** to the existing Guide bus and asks whether spoken cues change while Click stays steady. Caller reports that original app-control goal only after this applicable action. The agent neither creates a new bus nor changes hardware outputs. This distinguishes the genuine app branch from the console branch.

Clear-console reuses the supplied LV1/Mac/Premium/4i4 context; it does not ask where the control is. Its direct Output2 assignment shares the unverified-output/connection qualification above. It does check the actual selected device and shared output before acting.

Regular02 restores Bass, Keys and Guitars one at a time, preserving Drums3/4, Click1 and Guide2. Intermediate caller confirmations name only the instrument just changed; all-music recovery is reported only after the final music bus is corrected. Regular03 selects the listed Focusrite only after observing MacBook Speakers, then obtains actual simulated sound recovery.

Regular01’s attempted sixth input was the requested available-output observation. The request failed with `fetch failed`; the harness saved no sixth turn and automatically stopped/cleaned the run. The last saved agent reply asks which other Click outputs are available. No later result, closing or recovery is claimed. The attempted input is preserved in `retest-routing-attempted-phase6.json`; saved run evidence remains five turns. There was no automatic retry.

All five completed conversations include broad further-help, a normal caller refusal, the full single branded farewell and an `endCall` entry. This is text-adapter evidence only. No duplicate acknowledgement sequence, disruptive reset, legacy bus-creation step or human/callback action appeared. Regular01 performed one Planning Center lookup; its conversation stopped before usefulness could be assessed. Other runs did not call Planning Center.

## Cleanup, frozen-source and fixture proof

All six run files have `done: true` and `cleanupComplete: true`. Independent read-only checks show every generated test call absent with zero transcript rows and zero events. No callbacks were created. Only this cohort’s generated IDs were cleaned; original history and other cohorts were untouched. See `retest-routing-cleanup.json`.

All nine source files and all four suite fixture hashes match `retest-config.json` after completion. Proof with expected/actual SHA256 values is in `retest-routing-source-hashes.json`. The app fixture’s existing Guide Output2 and selector Output2 are consistent in these fresh B runs; no private fact was changed during a conversation.

Candidate B improves the observed initial context disambiguation and enables the genuine app branch recovery. It does not eliminate jargon/navigation repairs, redundant serial questions, unverified output-destination assumptions or transport failures. These limitations remain distinct from the confirmed original-goal outcomes.
