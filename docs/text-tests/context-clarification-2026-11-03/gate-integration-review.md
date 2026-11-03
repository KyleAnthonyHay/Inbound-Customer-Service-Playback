# Candidate D gate integration — development text POC

Seven fresh first-opening chats, **33 actual reply turns**, reported text cost **$1.0159**. Seven attempted/evaluable conversations, no retries or replacements. Fixed fixtures and original A/B/C outputs preserved. Adaptive caller utterances used only declared novice facts and relevant responses. No source/fixture/backend/saved-assistant changes, production action or voice call. Inference stopped after this planned cohort.

## Context gate finding

The explicit context prerequisite remains **inconsistent**. Identical ambiguous account openings produced neutral initial clarification in **1/2** conversations, reversing which branch passed in B/C. This shows the rule is not reliably followed; it is not evidence that one real provider is inherently handled better, because its private identity is not supplied until follow-up. Do not claim a deterministic fix or combine selected good first replies across candidates.

| Branch | Initial behavior | After clarification/facts |
| --- | --- | --- |
| account-playback | PASS: neutral “Where are you seeing the account that’s selected right now—what screen or app are you looking at?” No tools. | Caller disclosed Playback/iPad. Agent then searched docs and gave the organization switch. Caller followed and confirmed songs appeared. Further-help/endCall/farewell completed. |
| account-planning | FAIL: immediately searched Playback docs and instructed Switch Organizations before knowing the provider. | Caller naturally corrected “Planning Center in Safari, not Playback.” Agent recognized it cannot manage Planning Center but redundantly asked Playback-versus-Planning again. Caller answered the missing-account goal once more. Agent then explained its boundary and named a Planning Center administrator, while still offering an unnecessary generic specialist review. Caller chose their own admin; agent accepted and closed. No account or callback write. |
| account-clear-playback | PASS: direct documented organization switch, no needless app/location question. | Caller confirmed song visibility, further-help/endCall/farewell followed. |

Planning branch corrected-goal response at turn3: “I can’t manage Planning Center accounts or access to church plans from here. A Planning Center administrator can add the right account; would you like me to arrange a specialist review?” Thus the own-admin route was eventually named, but only after wrong initial guidance and a redundant clarification. This is not a clean first-pass context success or a login/access repair.

## Regular regression results

| Case | Turns | Cost | Assessment |
| --- | ---: | ---: | --- |
| 05-supported-setup | 3 | $0.0809 | PASS conditional capability advice, no setup walkthrough. |
| 06-borrowed-mixer | 6 | $0.2283 | PASS honest unverified capability boundary and callback. |
| 09-loading-recovery | 5 | $0.1604 | PASS third-total-retry recovery and API answer; reused initial context. |
| 10-loading-unresolved | 7 | $0.2226 | PASS safe specialist/callback. |
| account-clear-playback | 3 | $0.0788 | PASS clear-context direct path. |
| account-planning | 5 | $0.1470 | FAIL initial context prerequisite; eventual boundary/admin-owner recovery with redundant clarification. |
| account-playback | 4 | $0.0979 | PASS neutral initial clarification, applicable organization guidance and simulated resolution. |

05 identified the Focusrite model after conditional class-compliant/4i4 capability discussion, gave relevant Premium/MultiOuts and powered-hub conditions, and answered the listening goal without an unrequested configuration walkthrough. This is conditional capability advice, not independently verified physical installation.

06 identified exact Mackie USB capability as unverified in bounded docs, maintained conditions rather than declaring it incompatible, and offered review without an AutoPan workaround. Callback questions grouped availability/timezone and name/number, proposed the verified Nov4 3PM EST slot/full ten-digit number, waited for approval, reserved once and called endCall with complete confirmation/farewell. Stored callbackNumber was “202 555 0146,” the US ten-digit representation of supplied +1 202 555 0146; country prefix omitted, not byte-identical. The proposal used those same digits and caller approved. Full Jamie Demo name persisted. Underlying compatibility unresolved.

09 differentiated Audio Files Missing, guided two additional retries after one initial attempt and obtained simulated success at the third total attempt. It proactively read the live demo Planning Center context and later reused that result for the explicitly requested other songs (Do It Again, What A Beautiful Name), with no repeat API request. Caller accepted and ended normally.

10 retained three prior failures, asked the recent-download condition, avoided deletion where history was unknown and later respected the fixed pre-service constraint. It offered appropriate review, grouped callback questions, read full Nov4 4PM EST/name/full +1 number, waited for approval, reserved once and returned endCall confirmation/farewell. Exact supplied number/full name persisted. Underlying song failure unresolved.

Both callbacks were independently verified confirmed in DEV before cleanup; tool returns ok=true/bookingId/bookingCreated=true/teamNotified=false. Simulated booking is not technical resolution or staff contact. All seven completed text endCall/farewell, which does not establish voice parity, audible completion, interruptions or native disconnect. Known-account-name reuse and phone caller-ID remain untested in this cohort.

## Exact adaptive conversations

### 05-supported-setup

Test ID: text-poc-c8df92fd-6dbe-4c8b-94d7-ffc8b417a68a. Fingerprint: a889982c60cb65384d78c379e1fb15e2a736f6f1474c69dcd7a54ff3a0cb8462.

**Turn 1 — caller:** Can you help me check whether our iPad and Focusrite will work with Playback? We want the band to hear click and spoken cues while the audience hears the music.

**Agent:** A class-compliant Focusrite can work with an iPad, and the tested Focusrite 4i4 provides four outputs but needs a powered USB hub. With Playback Premium, you can send Click and Guide to separate band feeds and music to other outputs; which Focusrite model do you have?

**Tools:** search_playback_docs.

**Turn 2 — caller:** The label on the box says Focusrite 4i4.

**Agent:** The Focusrite 4i4 is tested with Playback on iPad and gives you four outputs, as long as it’s connected through a powered USB hub. With Playback Premium, you can route Click and Guide to band feeds and music to separate audience outputs; is there anything else I can help you with today?

**Tools:** None.

**Turn 3 — caller:** No, that answers my question. Thank you.

**Agent:** Thanks so much for calling MultiTracks Playback support. Have a great day, and goodbye!

**Tools:** endCall.


### 06-borrowed-mixer

Test ID: text-poc-135fab3c-cd0e-4aef-a4fe-184c5ea03d57. Fingerprint: a889982c60cb65384d78c379e1fb15e2a736f6f1474c69dcd7a54ff3a0cb8462.

**Turn 1 — caller:** We've borrowed a mixer with a USB socket. Can we plug our iPad straight into it for Playback and keep click and guide out of the audience's music?

**Agent:** Possibly—if that mixer’s USB connection works as a class-compliant audio interface with your iPad, Playback can send separate outputs; MultiOuts and independent bus routing require Playback Premium. What’s the mixer’s make and model?

**Tools:** search_playback_docs.

**Turn 2 — caller:** The label says Mackie ProFX12v3.

**Agent:** The ProFX12v3 isn’t on Playback’s tested interface list, so I can’t confirm its iPad USB routing. If its USB connection is class-compliant and Playback sees at least two outputs, Premium can route click and guide to a separate feed for in-ears while the music goes to the house; would you like a specialist to verify that mixer setup?

**Tools:** search_playback_docs.

**Turn 3 — caller:** Yes, please. I don’t know those connection details, and the owner isn’t available to check.

**Agent:** Nobody is available to transfer right now, but I can schedule a Playback specialist callback to review the ProFX12v3 and your iPad setup. When are you available, and what time zone are you in?

**Tools:** check_team_availability.

**Turn 4 — caller:** Tomorrow at 3 PM would work. I’m in Eastern time.

**Agent:** Wed, Nov 4, 3:00 PM EST is available. What’s your name and the best number for the specialist to call?

**Tools:** get_callback_slots.

**Turn 5 — caller:** Jamie Demo. The number is +1 202 555 0146.

**Agent:** Shall I book the Playback specialist callback for Jamie Demo at Wed, Nov 4, 3:00 PM EST, at 202 555 0146?

**Tools:** None.

**Turn 6 — caller:** Yes, please book that.

**Agent:** Your demo callback is confirmed for Wed, Nov 4, 3:00 PM EST. Thanks so much for calling MultiTracks Playback support. Have a great day, and goodbye!

**Tools:** reserve_callback, endCall.


### 09-loading-recovery

Test ID: text-poc-08b1f7f4-bc7e-4b8c-ac06-f3cd95bd1646. Fingerprint: a889982c60cb65384d78c379e1fb15e2a736f6f1474c69dcd7a54ff3a0cb8462.

**Turn 1 — caller:** I'm getting ready for rehearsal on our iPad, but Graves Into Gardens won't open. I've pressed Try Again once and it's still stuck.

**Agent:** I can see Graves Into Gardens is first in the demo service plan; what exact message do you see with the Try Again button?

**Tools:** search_playback_docs, get_planning_center_service_context.

**Turn 2 — caller:** It says Audio Files Missing.

**Agent:** Tap Try Again two more times, for three attempts total; on the third, Playback runs a different recovery routine. Does Graves Into Gardens open after that?

**Tools:** None.

**Turn 3 — caller:** The first extra try still failed, but the following try worked. It’s opened now.

**Agent:** Graves Into Gardens is open now, so that recovery worked. Is there anything else I can help you with today?

**Tools:** None.

**Turn 4 — caller:** Yes, could you check Planning Center and tell me what other songs are on Sunday’s demo plan?

**Agent:** Sunday’s demo plan, Faithful Through Every Season, also includes Do It Again and What A Beautiful Name. Is there anything else I can help you with today?

**Tools:** None.

**Turn 5 — caller:** No, that’s everything I needed. Thank you.

**Agent:** Thanks so much for calling MultiTracks Playback support. Have a great day, and goodbye!

**Tools:** endCall.


### 10-loading-unresolved

Test ID: text-poc-ad8d5a40-48e0-4973-97f3-2ff30d635023. Fingerprint: a889982c60cb65384d78c379e1fb15e2a736f6f1474c69dcd7a54ff3a0cb8462.

**Turn 1 — caller:** Graves Into Gardens won't open on our iPad. I've pressed Try Again three times, and it still hasn't worked.

**Agent:** What message appears on screen when you tap Try Again for Graves Into Gardens?

**Tools:** search_playback_docs, get_planning_center_service_context.

**Turn 2 — caller:** It says Audio Files Missing.

**Agent:** Since three tries didn’t recover it, was Graves Into Gardens recently downloaded in one of your past setlists?

**Tools:** None.

**Turn 3 — caller:** I’m not sure.

**Agent:** That last-resort recovery deletes every local setlist download, so I can’t safely recommend it without confirming that history. Would you like me to get a Playback specialist to review it with you?

**Tools:** None.

**Turn 4 — caller:** Yes, please. Service is about to start, and our other songs are downloaded and ready, so I can’t remove those downloads.

**Agent:** No Playback specialist is available to transfer right now, and I won’t ask you to remove the other downloaded songs before service. I can schedule a callback—when are you available, and what time zone are you in?

**Tools:** check_team_availability.

**Turn 5 — caller:** Tomorrow at 4 PM would work. I’m in Eastern time.

**Agent:** Wed, Nov 4, 4:00 PM EST is available. What’s your name and the best number for the specialist to call?

**Tools:** get_callback_slots.

**Turn 6 — caller:** John Doe. The number is +1 202 555 0150.

**Agent:** Shall I book John Doe for Wed, Nov 4, 4:00 PM EST at +1 202 555 0150 to review the missing audio files for Graves Into Gardens?

**Tools:** None.

**Turn 7 — caller:** Yes, please book that.

**Agent:** Your demo callback is confirmed for Wed, Nov 4, 4:00 PM EST. Thanks so much for calling MultiTracks Playback support. Have a great day, and goodbye!

**Tools:** reserve_callback, endCall.


### account-clear-playback

Test ID: text-poc-d8fbb4ca-0d0d-4f04-a23f-629af2d6bb68. Fingerprint: a889982c60cb65384d78c379e1fb15e2a736f6f1474c69dcd7a54ff3a0cb8462.

**Turn 1 — caller:** I'm in Playback on our iPad. The selected account says Personal account, but I need our church's songs. How do I change the selected organization?

**Agent:** Tap the stack icon in the top-right, then choose Switch Organizations and select your church. If it isn’t listed, your user may not yet be added to that organization.

**Tools:** search_playback_docs.

**Turn 2 — caller:** I selected Northgate Worship Collective from the list, and our church’s songs are showing up now.

**Agent:** Is there anything else I can help you with today?

**Tools:** None.

**Turn 3 — caller:** No, that’s everything. Thank you!

**Agent:** Thanks so much for calling MultiTracks Playback support. Have a great day, and goodbye!

**Tools:** endCall.


### account-planning

Test ID: text-poc-8a940caf-54c4-4025-8312-964e5128934e. Fingerprint: a889982c60cb65384d78c379e1fb15e2a736f6f1474c69dcd7a54ff3a0cb8462.

**Turn 1 — caller:** I'm in the wrong account and can't see our church's songs. How do I change it?

**Agent:** Open Playback’s side menu using the stack icon, then choose Switch Organizations and select your church’s organization. If it isn’t listed, your account may need to be added to that organization.

**Tools:** search_playback_docs.

**Turn 2 — caller:** I’m looking at Planning Center in Safari, not Playback. I don’t see that menu.

**Agent:** That menu is only inside Playback, and I can’t manage Planning Center accounts in Safari. Are you trying to change the organization used by Playback, or the one signed into Planning Center?

**Tools:** None.

**Turn 3 — caller:** The account signed into Planning Center. That’s where I can’t see our church’s plan and songs.

**Agent:** I can’t manage Planning Center accounts or access to church plans from here. A Planning Center administrator can add the right account; would you like me to arrange a specialist review?

**Tools:** None.

**Turn 4 — caller:** I’ll contact our church’s Planning Center admin about the login and access.

**Agent:** Is there anything else I can help you with today?

**Tools:** None.

**Turn 5 — caller:** No, that’s all. Thank you.

**Agent:** Thanks so much for calling MultiTracks Playback support. Have a great day, and goodbye!

**Tools:** endCall.


### account-playback

Test ID: text-poc-86da1fae-b193-4d65-9b29-99a27e6e5559. Fingerprint: a889982c60cb65384d78c379e1fb15e2a736f6f1474c69dcd7a54ff3a0cb8462.

**Turn 1 — caller:** I'm in the wrong account and can't see our church's songs. How do I change it?

**Agent:** Where are you seeing the account that’s selected right now—what screen or app are you looking at?

**Tools:** None.

**Turn 2 — caller:** I’m using Playback on our iPad.

**Agent:** Open the side menu with the stack icon at the top right, then tap Switch Organizations and choose your church’s organization.

**Tools:** search_playback_docs.

**Turn 3 — caller:** I selected Northgate Worship Collective, and the church’s songs are showing up now.

**Agent:** Is there anything else I can help you with today?

**Tools:** None.

**Turn 4 — caller:** No, that’s everything. Thank you.

**Agent:** Thanks so much for calling MultiTracks Playback support. Have a great day, and goodbye!

**Tools:** endCall.

## Cleanup and frozen configuration

[gate-integration-cleanup-proof.json](gate-integration-cleanup-proof.json) records confirmed own writes/taken slots before cleanup, slot reopening and source hashes. callbacks:cleanupTextTest received only generated text-poc-135fab3c-cd0e-4aef-a4fe-184c5ea03d57 and text-poc-ad8d5a40-48e0-4973-97f3-2ff30d635023, returning1 for each. Nov4 3PM/4PM EST slots reopened. All seven runs are done=true/cleanupComplete=true with zero own tool logs; zero own bookings remain. Previously observed non-text user bookings retained IDs/status/slots. All nine gate-config.json hashes matched preflight and completion 2026-11-03T12:14:27.530Z. No extra inference or automatic retry follows this review.
