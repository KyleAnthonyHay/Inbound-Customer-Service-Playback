# Routing combined-candidate retest — November 3, 2026

Six fresh conversations used `retest-routing-suite.json`, the existing `text:cases` harness and the frozen combined candidate. Caller replies remained limited to private facts and applicable simulated outcomes. No code, prompt, fixture, backend or saved-assistant changes were made by this reviewer. Final source hashes matched every entry in `retest-config.json`.

These are text reasoning/tool POCs. They do not validate the GPT-Live speaker, recognition, interruptions, audio timing or native disconnect.

## Per-variant outcomes

| Run | Turns | Core outcome | Observed behavior | Reported text cost |
|---|---:|---|---|---:|
| [01-click-guide-v1](retest-routing/01-click-guide-v1.json) | 9 | Simulated resolution/containment pass, inefficient | Retrieved current routing docs, then checked actual Tracks assignments, current bus outputs, and available Guide output choices. After the newly predefined enabled mono Output 2 was reported, explicitly guided Guide → mono Output 2 / Done and asked whether Click stayed steady. Caller confirmed only after that action. Further-help check, endCall and complete farewell followed. | $0.2505 |
| [01-click-guide-v2](retest-routing/01-click-guide-v2.json) | 4 | **Core diagnostic failure: premature unsupported escalation** | Asked where the level was adjusted, then treated the external sound-desk location as proof the issue was outside Playback. Offered a specialist without any docs lookup or Playback setting inspection. Caller accepted the offered help, team was unavailable, and caller declined a callback without invented contact details. Availability → cancellation → endCall/farewell worked, but the original routing issue remained unresolved. | $0.0734 |
| [02-reconnect-v1](retest-routing/02-reconnect-v1.json) | 6 | Simulated resolution/containment pass | Helped the novice locate Audio Device after “where would I look?”, verified PlayAUDIO12, inspected music bus assignments, and used documented Assign Multiple Busses to restore the music to 3/4. It included Drums, which was already correctly assigned; non-harmful redundancy. Caller confirmation, further-help check, endCall and farewell followed. | $0.1974 |
| [02-reconnect-v2](retest-routing/02-reconnect-v2.json) | 6 | Simulated resolution/containment pass | Clarified the vague symptom, checked selected interface, inspected current assignments, then changed Bass/Keys/Guitars to 3/4 while preserving Click 1 / Guide 2. Caller confirmation and complete text ending followed. | $0.1710 |
| [03-audio-device-v1](retest-routing/03-audio-device-v1.json) | 5 | Simulated resolution/containment pass | Asked Mac platform, guided Settings → General → Audio Device, learned MacBook Speakers selected with Focusrite listed, then instructed selecting Focusrite and checking sound. No board-map prerequisite or human offer. Full further-help/endCall/farewell sequence observed. | $0.1932 |
| [03-audio-device-v2](retest-routing/03-audio-device-v2.json) | 5 | Simulated resolution/containment pass | Same correct selected-device recovery via the second opening. Full text completion sequence observed. | $0.1082 |

**Summary:** five core passes, one core failure, zero fixture-blocked retests and zero transport failures. Total reported text model cost **$0.9937**, 35 caller/agent turns. This is a small developer sample, not a reliability estimate or proof that Script 1 now works consistently.

## Exact remaining failure

In 01-v2, after the caller answered “On the sound desk for our in-ear mix,” the agent said:

> “That points to the sound desk’s in-ear routing rather than a Playback setting, since the talkback and click are changing together. Would you like me to connect you with a Playback specialist to review that setup?”

At this point there had been **no documentation tool call**, no Audio Device observation, no track-to-bus observation, and no bus-to-output observation. It also substituted “talkback” for the caller’s “talking,” which in this fictional scenario means Playback’s prerecorded Guide. The physical location of an adjustment is not evidence that the source app’s routing is correct. The private fixture's actual shared Output 1 configuration was still undiscovered.

The caller was not coached to mention bus assignments or the desired fix after this failure. The offered escalation was followed naturally, then the callback was declined because no callback identity/time facts were defined for this routing scenario. No booking occurred. This is a support-resolution failure with correctly handled cancellation/ending, not a successful containment or proof of an appropriate hardware escalation.

## What changed relative to baseline

- **Provider stock start lines disappeared in raw projected text.** Baseline had 12 replies beginning with the stock lead-ins among 29 replies; the retest had **zero among 35**. Examples counted were “Hold on a sec,” “One moment,” “Just a sec,” “Give me a moment,” and “This'll just take a sec.” Raw outputs were inspected without removing text. All six retest endings called endCall and returned the full branded farewell with no preceding stock start line. This validates the text transport observation; native spoken delivery remains untested.
- Scripts 2 and 3 retained their supported core behavior across both openings. No blanket cable-to-board mapping gate reappeared in the no-audio case.
- Script 1’s previously missing actual Tracks and enabled Output 2 readouts were defined **before** this retest. One variant completed a supported route change; the other exposed premature escalation. Because fixture completeness changed, this is not a controlled numerical success-rate comparison with the two baseline fixture-blocked runs.
- Both Script 1 and script-wording variation still matter. A reviewer cannot choose only the passing opening and call the situation reliable.

## Additional quality notes

- 01-v1 took nine turns and checked rows individually. Its first response asked for track assignments; after the caller said the click tracks said Click and guide tracks said Guide, the agent asserted “Those are the track names” and repeated the checks one row at a time. The caller clarified actual assignments without changing facts. This was recoverable but unnecessarily dismissive/slow.
- 01-v1 initially stated that separate physical outputs are required “to be controlled independently” before establishing where the adjustment happened. That should be qualified to independent external feeds; in-app level control is a separate question.
- The sole Planning Center lookup in this cohort was 01-v1. It did not affect the subsequent routing guidance. This is an unused optional read, not a blocker or an API demonstration pass.
- 02-v1 reselected Drums along with the incorrectly assigned music buses. Since Drums was already on 3/4, it could have preserved that correct assignment without asking the caller to include it.

## Proposed final refinement — not implemented by this reviewer

Scope “the fault is outside Playback” to evidence remaining **after relevant Playback-side observations**, not merely the place the caller adjusts a level or hears the problem. Keep prerecorded Guide distinct from live talkback until clarified. Scope troubleshooting imperatives to actual repair requests; capability advice should remain advice.

An additional wording tension exists in HUMAN SUPPORT: it mandates a short acknowledgment when a specialist offer is declined, while global reasoner instructions prohibit opening acknowledgments because the speaker may already have supplied one. Preserve the broad further-help check without requiring a separate “Okay/No problem” prefix.

## Cleanup and isolation

All six retest reports have `done: true`, `cleanupComplete: true`, `failure: null`. Read-only Convex verification confirmed each generated text-test call ID had no call row, zero transcript rows and zero activity rows after cleanup. No callback reservation occurred in this cohort; no real call records, production state, customer or staff contacts were changed. All frozen source hashes still matched at completion.
