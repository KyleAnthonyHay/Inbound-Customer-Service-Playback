# Final combined-candidate routing pass — November 3, 2026

Six fresh conversations used `final-routing-suite.json` and the existing Vapi Chat `text:cases` harness. Shared source remained frozen: every hash in `final-config.json` matched at completion. This reviewer made no source, prompt, shared fixture, backend or saved-assistant edits.

These are manually steered developer text POCs. Caller replies were limited to declared novice facts and relevant observations, with fictional recovery reported only after the matching guided action. No voice calls or actual Playback device operations were performed.

## Per-variant grades

| Run | Turns | Support outcome | Evidence / qualifications | Reported text cost |
|---|---:|---|---|---:|
| [01-click-guide-v1](final-routing/01-click-guide-v1.json) | 7 | **Resolution/containment pass with instruction-repair qualification** | Helped locate Buses after a novice navigation question, learned both buses were Output 1, but initially told the caller to choose a different available output feeding its own channel. Caller genuinely did not know which to choose and supplied no fix hint. Agent then asked the actual menu choices, received only the predeclared enabled mono Output 2, specifically guided Guide → 2 / Done, and obtained confirmation. Further-help check and endCall/farewell followed. | $0.1844 |
| [01-click-guide-v2](final-routing/01-click-guide-v2.json) | 5 | Resolution/containment pass | Retrieved routing docs, investigated actual bus assignments instead of treating an external control location as proof of a hardware fault. After both Output 1 values and enabled mono Output 2 were observed, specifically guided Guide → 2 / Done and obtained independent-control confirmation. No premature specialist offer. | $0.1425 |
| [02-reconnect-v1](final-routing/02-reconnect-v1.json) | 6 | Resolution/containment pass | Helped locate General → Audio Device after uncertainty, checked PlayAUDIO12, inspected all current bus assignments, then used Assign Multiple Busses to restore the music to 3/4. Included Drums, which was already correct, but preserved Click 1 / Guide 2. Full confirmation and ending followed. | $0.1603 |
| [02-reconnect-v2](final-routing/02-reconnect-v2.json) | 8 | Resolution/containment pass, slower walkthrough | Clarified the vague symptom, checked selected PlayAUDIO12 and current assignments, then guided Bass, Keys and Guitars individually to 3/4. Caller confirmed only the bus just changed until all three actions were complete; full music recovery was not claimed after the first partial fix. Further-help check and endCall/farewell followed. | $0.2033 |
| [03-audio-device-v1](final-routing/03-audio-device-v1.json) | 5 | Resolution/containment pass | Initial question bundled platform and selected device; caller gave Mac and genuine setting-location uncertainty. Agent guided Settings → General → Audio Device, learned MacBook Speakers selected with Focusrite listed, instructed selecting Focusrite, and obtained sound confirmation. No cable/board-map gate or premature handoff. Full text ending followed. | $0.1613 |
| [03-audio-device-v2](final-routing/03-audio-device-v2.json) | 5 | Resolution/containment pass | Checked Mac and expected church output, inspected Audio Device, guided the listed Focusrite selection and obtained sound confirmation. Full further-help/endCall/farewell sequence observed. | $0.1640 |

Cohort total: **$1.0158**, **36** caller/agent turns, **zero** transport failures.

All six support goals reached their predeclared simulated outcomes without a human handoff or callback. This is not six flawless first responses: 01-v1 needed repair of a vague instruction, and 02-v2 took a deliberately serialized walkthrough. Do not label these as a statistical reliability rate or six presentation voice conversations.

## Remaining precision/efficiency issues

1. **01-v1's first action instruction still pushed a technical choice onto the novice.** It said, “choose a different available output that goes to its own channel on your interface or sound desk.” The caller answered only “I'm not sure which output I should choose.” The agent then asked for visible choices and selected the predeclared mono Output 2. This is a genuine conversational repair, not a caller-supplied diagnosis or destination hint. The eventual support outcome passed, but initial instruction precision was imperfect.
2. **02-v1 unnecessarily included an already-correct Drums assignment** in its bulk operation. This did not change the target outcome or disturb Click/Guide, but the operation could have named only the incorrect buses.
3. **02-v2 used one instrument per turn**, yielding eight turns instead of six. This was supported, manageable guidance, not an invalid path; the reviewer maintained partial state rather than prematurely reporting all music fixed.
4. Some initial questions bundled related observations or asked for a setting before complete navigation. When the novice genuinely did not know where it was, the agent supplied useful navigation and continued rather than escalating.
5. 01-v1 retrieved the shared Planning Center context but did not use it in the subsequent routing guidance. It remained an optional unused read, not a prerequisite or an API-value demonstration.

## Regressions checked

- The previous 01-v2 premature external escalation did **not** recur. Both openings investigated Playback routing, and neither called availability or a handoff tool.
- Neither no-audio opening required a cable-to-board map. Both reached the selected-device fix.
- No obsolete Aux/Guide creation instructions were suggested; existing buses were reused and unrelated music/Click/Guide routes preserved.
- **Zero stock request-start lead-ins appeared in all 36 raw projected replies.** All six completed endings called endCall and returned the complete branded farewell without a separate “Hold on,” “Just a sec,” or similar start line. No replies were stripped or rewritten for scoring. This corroborates text-tool message suppression, not native voice timing/disconnect.

## Cleanup and scope

All six reports have `done: true`, `cleanupComplete: true`, `failure: null`. A final read-only Convex check verified each generated text-test call ID had no call row, zero transcript rows and zero activity rows. No callback reservations occurred, so no scheduling records required cleanup. No real call history, production state, customer or staff contacts were modified.

Saved development-agent activation, including tool `.messages` readback, is owned by the parent after all final cohorts finish. This reviewer did not activate or deploy anything. A fresh manual voice call remains necessary to validate GPT-Live delivery and actual disconnect.
