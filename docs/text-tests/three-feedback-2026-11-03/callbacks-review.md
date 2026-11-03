# Callback grouping regression — development text POC

Two independent first-opening conversations, manually steered after inspecting each actual reply. Existing text harness and deployed DEV tools; no voice calls, saved-assistant changes or production changes. No retries or replacement runs. Private profiles remained reviewer material; caller facts entered only when relevant questions were asked.

## Results

| Case | Turns | Reported model cost | Outcome |
| --- | ---: | ---: | --- |
| 06 borrowed mixer | 7 | $0.3054 | Callback grouping, full browser-number readback, consent, exact booking and endCall pass. Underlying compatibility remains unresolved. |
| 10 unresolved loading | 8 | $0.2395 | Grouping and partial-answer retention pass; booking/ending pass with abbreviated browser-number readback qualification. Underlying loading problem remains unresolved. |

Total reported text cost **$0.5449**, 15 actual reply turns, 2 attempted and 2 evaluable conversations.

## Focused findings

- Both asked availability and timezone together after unavailable-transfer results. Both later asked missing name and callback number together. Neither claimed staff had been notified.
- Case 10 intentionally answered only Eastern time. The next reply asked only day/time, retained the timezone, and never asked it again. It then requested missing name and number together.
- Case 06 checked the selected tomorrow 2PM slot before calling it available. Case 10 gathered contacts before checking the selected tomorrow 2:30PM slot, then proposed the verified slot. Both date conversions were Wednesday November 4 and correct for November 3 execution.
- Both preserved a separate booking proposal and explicit approval. Exactly one reserve_callback occurred per conversation, after approval, with the exact full demo number supplied. Both returned ok=true, bookingId, bookingCreated=true, teamNotified=false; each was verified against persisted confirmed DEV callback data before cleanup.
- Both then called endCall and returned the booking confirmation plus complete branded farewell once in the final text reply. No duplicated acknowledgements in these replies. Text adapter reports voiceCall=false; it does not validate GPT-Live phrasing, audible completion, interruption handling or native disconnect.

### Qualifications and uncovered branches

Case 10 proposed the newly supplied browser number only as “the number ending in 0150.” It unambiguously referred to the sole supplied number; the reviewer approved naturally without requesting a repaired readback. The written policy distinguishes full browser-number readback from agreed caller-ID last-four handling, so this is **not a flawless full-number readback**. Retain this qualification even though the exact full number was written correctly, consent followed the proposal, and the paired-field regression passed. No rerun or coached fix was used.

Case 10 unnecessarily asked whether the song opened after the opening had already said all three attempts failed; caller repeated the fixed failure and supplied the service/download constraint. This is not a clean demonstration of retaining all diagnostic facts, although subsequent callback partial-answer retention was correct.

Case 06 starts with a conditional “Yes—if…” before exact-model verification and discusses possible outputs generically. It subsequently states the exact mixer is unverified and offers specialist review when the caller cannot investigate. This test does not independently verify Mackie hardware compatibility.

Neither conversation had a known account name before the callback; therefore these two runs validate collecting both missing contacts together, **not reuse of a previously retrieved account name**. Phone caller-ID behavior is also untested because the harness uses browser-style blank caller ID. No new inference was added for uncovered branches.

## Exact adaptive conversations

### 06-borrowed-mixer

Test ID: text-poc-613912a3-11bb-471c-8a1f-1559b5c58d52. Configuration fingerprint: 16fd3b4d80e8663af2f7df047378f1ecb04df162a38639df9c2b9e2f74e1c84e.

**Turn 1 — caller:** We've borrowed a mixer with a USB socket. Can we plug our iPad straight into it for Playback and keep click and guide out of the audience's music?

**Agent:** Yes—if that mixer works as a class-compliant USB audio interface, Playback can send separate outputs so click and guide stay in your in-ears while music goes to the audience. You’ll need Playback Premium for MultiOuts and a mixer with enough USB output channels; what’s the mixer model?

**Tools:** search_playback_docs.

**Turn 2 — caller:** The label says Mackie ProFX12v3.

**Agent:** The Mackie ProFX12v3 isn’t on Playback’s tested-and-confirmed interface list, so I can’t verify its iPad compatibility or separate USB outputs from our documentation. If it appears to the iPad as a class-compliant interface with at least two independent outputs, you can keep click and guide on one feed and music on another; otherwise its USB connection may provide only a stereo feed.

**Tools:** search_playback_docs.

**Turn 3 — caller:** I don’t know those details. It’s borrowed and the owner isn’t available to check.

**Agent:** Because we can’t verify how that borrowed mixer presents its USB outputs to the iPad, I can’t promise it will keep click and guide out of the audience mix. Would you like me to check whether a Playback specialist can review this with you now?

**Tools:** None.

**Turn 4 — caller:** Yes, please.

**Agent:** Nobody is available to take a transfer right now, but I can schedule a specialist callback. When are you available, and what’s your time zone?

**Tools:** check_team_availability.

**Turn 5 — caller:** Tomorrow at 2 PM would work. I’m in Eastern time.

**Agent:** Wed, Nov 4, 2:00 PM EST is available. What’s your name and the best number for the specialist to call?

**Tools:** get_callback_slots.

**Turn 6 — caller:** Jamie Demo, and the number is +1 202 555 0146.

**Agent:** Shall I book the specialist callback for Jamie Demo at +1 202 555 0146 on Wed, Nov 4, 2:00 PM EST?

**Tools:** None.

**Turn 7 — caller:** Yes, please book that.

**Agent:** Your demo callback is confirmed for Wed, Nov 4, 2:00 PM EST. Thanks so much for calling MultiTracks Playback support. Have a great day, and goodbye!

**Tools:** reserve_callback, endCall.


### 10-loading-unresolved

Test ID: text-poc-5f0e779b-c35d-4b00-984f-fc1f718f63c0. Configuration fingerprint: 16fd3b4d80e8663af2f7df047378f1ecb04df162a38639df9c2b9e2f74e1c84e.

**Turn 1 — caller:** Graves Into Gardens won't open on our iPad. I've pressed Try Again three times, and it still hasn't worked.

**Agent:** What exact message appears when Graves Into Gardens fails to open after you tap Try Again?

**Tools:** search_playback_docs, get_planning_center_service_context.

**Turn 2 — caller:** It says Audio Files Missing.

**Agent:** Audio Files Missing should run its alternate recovery on the third Try Again attempt, so the next step is to check whether the song opens now.

**Tools:** None.

**Turn 3 — caller:** It still won’t open after those three tries. Service is about to start, and our other songs are downloaded and ready, so I can’t remove those downloads.

**Agent:** Since the alternate recovery didn’t restore Graves Into Gardens and you can’t clear the ready downloads before service, a specialist can review it without risking the other songs. Would you like me to see if one is available now?

**Tools:** None.

**Turn 4 — caller:** Yes, please.

**Agent:** No Playback specialist is available to transfer right now, but I can schedule a callback. When are you available, and what time zone are you in?

**Tools:** check_team_availability.

**Turn 5 — caller:** I’m in Eastern time.

**Agent:** What day and time would work best for the callback?

**Tools:** None.

**Turn 6 — caller:** Tomorrow at 2:30 PM works for me.

**Agent:** What’s your name and the best callback number?

**Tools:** None.

**Turn 7 — caller:** John Doe. The number is +1 202 555 0150.

**Agent:** Shall I book a callback for John Doe on Wed, Nov 4, 2:30 PM EST at the number ending in 0150?

**Tools:** get_callback_slots.

**Turn 8 — caller:** Yes, please book that.

**Agent:** Your demo callback is confirmed for Wed, Nov 4, 2:30 PM EST. Thanks so much for calling MultiTracks Playback support. Have a great day, and goodbye!

**Tools:** reserve_callback, endCall.

## Cleanup and freeze evidence

[callback-cleanup-proof.json](callback-cleanup-proof.json) records confirmed writes before deletion, slot availability after deletion, isolated-log cleanup and source hashes. cleanupTextTest was invoked only for the two generated text-poc IDs above and returned 1 for each. Both runs have done=true and cleanupComplete=true, zero remaining tool logs, zero remaining own bookings, and their November 4 2:00PM/2:30PM slots reopened. The pre-existing actual user bookings for script6 and script10 retained the same IDs, confirmed status and slots.

All ten source hashes in config.json matched before testing and at completion (2026-11-03T11:06:35.700Z). Only the callback subset fixture, cohort outputs, proof and this review were written.
