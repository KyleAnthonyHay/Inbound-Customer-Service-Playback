# Baseline cohort: version and compatibility

Development text reasoner POCs only. Six conversations, two independent openings each for cases 4–6, using the existing `text:cases` harness. No saved assistant, shared code, backend implementation, source knowledge or production changes were made. The final frozen-source comparison matched every hash in `baseline-config.json`. No voice calls were created. Caller statements were restricted to the private profiles and ordinary clarification of their goals; versions/settings were read only after relevant navigation. Target outcomes were not agent inputs.

## Outcomes

| Run | Turns | Manual assessment | Reported text cost |
| --- | ---: | --- | ---: |
| [04-false-expired-v1](baseline-version-compatibility/04-false-expired-v1.json) | 7 | Core recovery pass. Active demo subscription checked; actual caller app version 8.6.1 collected; iPadOS unknown elicited guided Settings → General → About; version comparator rerun with iPadOS 18 and prerequisites complete; App Store update guided before fictional success; further-help check, caller decline, endCall and farewell. | $0.1994 |
| [04-false-expired-v2](baseline-version-compatibility/04-false-expired-v2.json) | 10 | Core recovery pass. Same qualified update/recovery/closing sequence after a longer symptom-discovery path and a redundant Restore Purchases attempt. | $0.2876 |
| [05-supported-setup-v1](baseline-version-compatibility/05-supported-setup-v1.json) | 5 | Advice goal answered after an unnecessary configuration question; not a clean goal-adherence/assumption pass. Model, Premium, powered-hub requirement and band/room separation were explained, but the agent assumed accessory ownership and attempted an Audio Device check. | $0.1234 |
| [05-supported-setup-v2](baseline-version-compatibility/05-supported-setup-v2.json) | 7 | Partial advice outcome. After two goal clarifications, it identified the actual Focusrite model and explained tested hardware/four outputs/powered-hub requirement, but never stated or verified Playback Premium. The essential feature-tier condition is missing from the spoken advice. | $0.2677 |
| [06-borrowed-mixer-v1](baseline-version-compatibility/06-borrowed-mixer-v1.json) | 8 | Eventual escalation workflow pass, with a delayed specialist offer. Exact Mackie model retrieved as unverified. Caller inability to verify remaining details elicited specialist offer; unavailable team led to full readback/consented demo reservation, then endCall/farewell. Underlying compatibility remains unresolved. | $0.2588 |
| [06-borrowed-mixer-v2](baseline-version-compatibility/06-borrowed-mixer-v2.json) | 9 | Eventual escalation workflow pass, with weak discovery. It never asked for the readable mixer model, spent questions on USB/socket labels the caller could not verify, then correctly offered review and completed the consented callback flow. Underlying compatibility remains unresolved. | $0.2575 |
| **Total** | **46** | No statistical reliability or voice-parity claim. | **$1.3944** |

## Concrete findings

### Advice requests are being converted into setup/repair work

Case 5 v1 initially explained that a 4i4 is tested with iPad and requires a powered hub. After learning Premium, it asked:

> “In Playback’s Settings, what does the Audio Device setting show with the 4i4 connected through its powered hub?”

The caller had requested capability advice, not configuration, and had not said the hub was connected. After the caller restated that purpose, the agent answered the band/room capability question, but said “Your iPad, powered USB hub, and Focusrite 4i4…” without obtaining accessory facts. The supplied background actually contains the hub, so this did not fabricate a false fixture outcome; it is still an unsupported assumption by the agent.

Case 5 v2 likewise asked for Audio Device before identifying the box. On the explicit clarification that this was an advice question, it gave generic compatible-interface guidance and asked whether further help was needed. The caller then naturally asked how to know whether their box was compatible; only then did the agent ask for the make/model label. The eventual answer described the tested Focusrite 4i4 and powered USB hub but omitted Premium throughout the conversation. Private reviewer knowledge that the caller has Premium does not repair an agent-facing prerequisite omission.

The caller did not suggest a diagnosis, tool or routing change. “That makes sense” was an advice acknowledgment, not a report of physical setup success. Both conversations properly followed their final further-help question with endCall after the caller declined.

### Unknown compatibility needs a clear review offer

Case 6 v1 did obtain Mackie ProFX12v3 and searched it. It then said:

> “I can’t confirm the Mackie ProFX12v3 as a tested Playback interface, but if it appears as Playback’s Audio Device and provides separate outputs, Premium can route click and guide away from the tracks feed. Is there anything else I can help you with today?”

That did not verify the requested connection, and it prematurely treated a condition the caller could not check as enough to finish. The caller restated the predeclared genuine unknowns; the agent then offered a specialist. This is a repaired path, not an unassisted clean compatibility response.

Case 6 v2 initially offered headphone/analogue alternatives to a question about USB. It asked the USB-socket label and other visible connections, but never the available make/model label. The caller did not invent a USB type, class compliance or internal routing. After inability to verify was made clear, the agent offered a specialist rather than declaring the device incompatible. No human request was supplied before the offer.

### Callback action sequence worked in both variants

After accepting the specialist offers, both variants performed:

1. `check_team_availability` → no transfer now; no claim that staff were notified or connected.
2. `get_callback_slots` for distinct predeclared times, 11:00 / 11:30 AM Eastern tomorrow.
3. Collected name/number; read back actual date, time, zone and number.
4. Obtained explicit booking approval, then `reserve_callback` with returned slot IDs.
5. Confirmed only successful reservations, then `endCall` and branded farewell.

Both synthetic booking records were verified `confirmed`, then only those generated text-test bookings were deleted through the restricted admin cleanup. Each corresponding slot was verified open afterward. See [callback cleanup proof](baseline-version-compatibility/callback-cleanup-proof.json). Callback completion is successful escalation handling, not evidence the mixer issue was resolved.

### Update checks were grounded and did not depend on a caller diagnosis

Both case 4 variants independently obtained the installed version rather than using historical account notes. On the first comparison, `updateAssessment.prerequisitesComplete=false` because OS version was missing. After novice navigation and the caller’s iPadOS 18 observation, the comparator returned `osRequirementMet=true` and `prerequisitesComplete=true` against live Playback 8.6.4 / minimum iOS 15.6. Only then did the agent guide an update. Fictional success was reported only after that instruction. Variant 2 appropriately called the update a “targeted attempt.” Variant 1’s “exact false message” language is stronger, but the symptom/fix match was present in retrieved release evidence.

## General changes suggested; none implemented by this reviewer

- Distinguish a capability/compatibility question from an active failure or requested setup walkthrough before choosing current-device diagnostic questions.
- For advice, identify the product/model and explain the relevant documented conditions without assuming the caller already owns or has connected every accessory. State feature-tier prerequisites as conditions even when no setup walkthrough is wanted.
- If the actual requested configuration remains unverified and the caller cannot supply the missing evidence, offer specialist review directly. Do not substitute a different connection method or an uncheckable conditional answer followed by a completion question.
- Ask for a readable model label before advanced USB classification/socket details when model-specific evidence is needed. Do not repeat unavailable technical facts as a checklist.
- Preserve the working callback readback → approval → reservation → closing ordering and the qualified update prerequisite checks.

## Fixture and delivery caveats

- Case 6 has no predefined live Audio Device selection or USB-socket label. The caller did not supply invented values. V1’s response that they had not connected it yet was the natural advice-before-use interpretation of “can we plug…”, rather than a technical compatibility fact; the scenario should explicitly state connection state in a future frozen fixture if that distinction is intended to be scored.
- Holding lines such as “Just a sec” and doubled waits were observed around tool calls. The parent identified Vapi’s injected tool-start defaults as a possible concrete source; these phrases are not all classified as reasoning-policy violations here.
- All six runs have `done=true`, `cleanupComplete=true`, and no harness request failure. Every final text response called endCall and contained the branded farewell. This does not establish live speaker acknowledgments, audio completion or actual disconnect.
