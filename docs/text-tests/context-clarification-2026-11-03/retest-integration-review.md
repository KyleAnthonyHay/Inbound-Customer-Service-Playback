# Candidate B integration retest — development text POC

Seven fresh first-opening chats, 32 actual reply turns, reported cost **$0.9711**. Seven attempts, seven evaluable conversations, no replacement or retry. Candidate A outputs preserved. The same private profiles and fixed outcomes were used; adaptive replies were chosen after actual agent questions. No source/fixture/backend edits, saved-assistant changes, voice calls or production changes.

## Context result

Candidate B remains inconsistent on **identical ambiguous account openings**: neutral application/location clarification succeeded in **1 of 2** fresh branches. Do not report this as a complete fix.

| Branch | Initial clarification | Behavior after caller facts |
| --- | --- | --- |
| account-playback | FAIL: immediately searched Playback docs and gave Side Menu > Switch Organizations before provider was known. | Caller could follow the applicable switch, explicitly identified Playback/iPad and confirmed songs appeared. Agent accepted that outcome and ended normally. This is eventual success with a failed initial context prerequisite. |
| account-planning | PASS: “What device are you using, and where do you see the account that’s currently selected?” No tool or embedded Playback assumption. | Caller named Planning Center website in Safari. Agent correctly distinguished it from Playback and said it cannot change that website’s account/plan access. It offered specialist review; caller chose their own church Planning Center admin. Agent accepted, asked further help and ended. No fictitious MultiTracks lookup, Playback switch, API access change or callback write. |
| account-clear-playback | PASS clear control: immediate documented organization switch, no needless app/location clarification. | Caller confirmed songs appeared, declined more help; endCall/farewell. |

Planning branch boundary wording was plain and honest, though offering a generic Playback specialist for arbitrary Planning Center administration was unnecessary. The caller’s own admin choice came from the private profile, not an agent-suggested admin route. Do not claim the agent independently explained that preferred admin route or solved access.

## Regular regression results

| Case | Turns | Cost | Assessment |
| --- | ---: | ---: | --- |
| 05-supported-setup | 3 | $0.0789 | PASS conditional capability advice; no setup walkthrough. |
| 06-borrowed-mixer | 7 | $0.2849 | QUALIFIED specialist/callback success; ungrounded AutoPan fallback assertion earlier. |
| 09-loading-recovery | 5 | $0.1425 | PASS recovery and requested API answer; redundant repeated API read. |
| 10-loading-unresolved | 7 | $0.2340 | PASS safe specialist/callback. |
| account-clear-playback | 3 | $0.0775 | PASS direct clear-context control, no redundant app question. |
| account-planning | 4 | $0.0756 | PASS neutral initial question and correct provider boundary; caller chose own Planning Center admin. |
| account-playback | 3 | $0.0777 | FAIL initial neutral clarification; applicable assumed-provider path eventually resolved simulated library goal. |

05 identified the exact Focusrite model, tested support/four outputs, powered-hub requirement and conditional Premium/MultiOuts capability. It answered the listening goal without unrequested setup. It also made an unnecessary Planning Center lookup in this equipment advice conversation. It did not independently verify all physical connections, which is not required for conditional advice.

06 identified the model as absent from the tested list and acknowledged unverified USB routing. However, it then said “otherwise, Auto-Pan can still split them into two feeds” before exact iPad/USB support was established. This is an overbroad alternative, not a verified connection solution. Caller maintained genuine uncertainty and unavailable owner; the agent then correctly withdrew assurance and offered specialist review. Retain the grounding caveat despite a correct eventual escalation.

06 and10 paired availability/timezone and missing name/number questions, verified tomorrow Nov4 slots before calling them available, separately proposed complete date/time/EST and browser number, waited for explicit approval, reserved exactly once, then called endCall and returned complete booking confirmation/farewell. DEV confirmed booking data was independently inspected. 06 wrote 202-555-0146, a ten-digit US representation of the supplied +1 202 555 0146 (country prefix omitted, not byte-identical); the readback used the same ten digits and caller approved. 10 wrote the exact supplied +1 202 555 0150. Both tools reported ok=true/bookingId/bookingCreated=true and teamNotified=false. Underlying compatibility/loading remain unresolved; successful callback is not technical resolution.

09 correctly guided two further retries after one previous attempt, obtained simulated success on the third total attempt, answered the caller’s Planning Center question using actual live demo API result and ended normally. It unnecessarily repeated the successful initial Planning Center lookup. 10 respected unknown recent-download state and ready-content constraint, avoided deletion, and followed valid specialist/callback path.

All seven completed with text endCall and complete branded farewell. This does not validate live speaker wording, audio, interruptions or native disconnect. Known-account-name reuse and phone caller-ID branches remain untested.

## Exact conversations

### 05-supported-setup

Test ID: text-poc-a048b9fa-2aec-4239-a76a-2ac427dbb174. Fingerprint: ae358699c46dd6824462e5e5a0c1a99b0943d95b8763509604dab9d7e0bdb32e.

**Turn 1 — caller:** Can you help me check whether our iPad and Focusrite will work with Playback? We want the band to hear click and spoken cues while the audience hears the music.

**Agent:** Playback can send music to the audience and click plus spoken cues to the band on separate outputs; with Playback Premium, MultiOuts lets you route the dedicated Click and Guide buses independently. Which Focusrite model do you have?

**Tools:** search_playback_docs, get_planning_center_service_context.

**Turn 2 — caller:** The label on the box says Focusrite 4i4.

**Agent:** The Focusrite 4i4 is tested with Playback on iPad, and it needs a powered USB hub. With Playback Premium, its four outputs can keep music separate from the click and Guide cues; is there anything else I can help you with today?

**Tools:** None.

**Turn 3 — caller:** No, that answers my question. Thank you.

**Agent:** Thanks so much for calling MultiTracks Playback support. Have a great day, and goodbye!

**Tools:** endCall.


### 06-borrowed-mixer

Test ID: text-poc-7fcc72c3-c4dc-415e-983e-cebb367d620d. Fingerprint: ae358699c46dd6824462e5e5a0c1a99b0943d95b8763509604dab9d7e0bdb32e.

**Turn 1 — caller:** We've borrowed a mixer with a USB socket. Can we plug our iPad straight into it for Playback and keep click and guide out of the audience's music?

**Agent:** Yes—if that mixer’s USB connection works as a class-compliant audio interface with multiple outputs, Playback can send the music separately from click and guide. What’s the mixer’s model, so I can check whether it supports the separate feeds you need?

**Tools:** search_playback_docs.

**Turn 2 — caller:** The label says Mackie ProFX12v3.

**Agent:** The ProFX12v3 isn’t on Playback’s tested-interface list, so I can’t confirm its USB routing; it would need to be class-compliant and present separate playback outputs to the iPad. If it does, you can keep click and guide on a separate mixer channel from the music; otherwise, Auto-Pan can still split them into two feeds—would you like help checking the mixer’s available USB outputs?

**Tools:** search_playback_docs.

**Turn 3 — caller:** I don’t know those connection details. It’s borrowed, and the owner isn’t available to check.

**Agent:** Without the mixer’s USB routing details, I can’t safely confirm that it can keep the click and guide off the audience mix. Would you like me to see if a Playback specialist is available to review the borrowed-mixer setup with you?

**Tools:** None.

**Turn 4 — caller:** Yes, please.

**Agent:** Nobody is available to transfer right now, but I can schedule a specialist callback. When are you available, and what time zone are you in?

**Tools:** check_team_availability.

**Turn 5 — caller:** Tomorrow at 3 PM would work. I’m in Eastern time.

**Agent:** Wed, Nov 4, 3:00 PM EST is available. What’s your name and the best callback number?

**Tools:** get_callback_slots.

**Turn 6 — caller:** Jamie Demo. The number is +1 202 555 0146.

**Agent:** Shall I book Jamie Demo for Wed, Nov 4, 3:00 PM EST at 202-555-0146 to review the borrowed mixer setup?

**Tools:** None.

**Turn 7 — caller:** Yes, please book that.

**Agent:** Your demo callback is confirmed for Wed, Nov 4, 3:00 PM EST. Thanks so much for calling MultiTracks Playback support. Have a great day, and goodbye!

**Tools:** reserve_callback, endCall.


### 09-loading-recovery

Test ID: text-poc-c9748815-5f3e-476e-a254-134853b64127. Fingerprint: ae358699c46dd6824462e5e5a0c1a99b0943d95b8763509604dab9d7e0bdb32e.

**Turn 1 — caller:** I'm getting ready for rehearsal on our iPad, but Graves Into Gardens won't open. I've pressed Try Again once and it's still stuck.

**Agent:** What exact message do you see while Graves Into Gardens is stuck loading?

**Tools:** search_playback_docs, get_planning_center_service_context.

**Turn 2 — caller:** It says Audio Files Missing.

**Agent:** Tap Try Again two more times; on the third attempt, Playback automatically runs a different recovery routine. Does Graves Into Gardens open after that?

**Tools:** None.

**Turn 3 — caller:** The first extra try still failed, but the following try worked. It’s opened now.

**Agent:** Is there anything else I can help you with today?

**Tools:** None.

**Turn 4 — caller:** Yes, could you check Planning Center and tell me what other songs are on Sunday’s demo plan?

**Agent:** Sunday’s demo plan also has Do It Again in B-flat and What A Beautiful Name in D. Is there anything else I can help you with today?

**Tools:** get_planning_center_service_context.

**Turn 5 — caller:** No, that’s everything I needed. Thank you.

**Agent:** Thanks so much for calling MultiTracks Playback support. Have a great day, and goodbye!

**Tools:** endCall.


### 10-loading-unresolved

Test ID: text-poc-4b758586-94ad-49e1-9f0e-5cccc39f97a0. Fingerprint: ae358699c46dd6824462e5e5a0c1a99b0943d95b8763509604dab9d7e0bdb32e.

**Turn 1 — caller:** Graves Into Gardens won't open on our iPad. I've pressed Try Again three times, and it still hasn't worked.

**Agent:** What exact message appears on the iPad when Graves Into Gardens fails to open?

**Tools:** search_playback_docs, get_planning_center_service_context.

**Turn 2 — caller:** It says Audio Files Missing.

**Agent:** Was this song recently downloaded in one of your past setlists?

**Tools:** None.

**Turn 3 — caller:** I’m not sure.

**Agent:** Since we can’t verify that, I don’t want to remove local setlists because they’d all need to download again. A specialist can review the missing-audio issue now; would you like me to connect you?

**Tools:** None.

**Turn 4 — caller:** Yes, please. Service is about to start, and our other songs are downloaded and ready, so I can’t remove those downloads.

**Agent:** Nobody is available to transfer right now, and I won’t have you remove the other downloaded songs before service. I can schedule a specialist callback; when are you available, and what time zone are you in?

**Tools:** check_team_availability.

**Turn 5 — caller:** Tomorrow at 4 PM would work. I’m in Eastern time.

**Agent:** Wed, Nov 4, 4:00 PM EST is open. What’s your name and the best callback number?

**Tools:** get_callback_slots.

**Turn 6 — caller:** John Doe. The number is +1 202 555 0150.

**Agent:** Shall I book Wed, Nov 4, 4:00 PM EST for John Doe at +1 202 555 0150, to review the missing audio files for Graves Into Gardens?

**Tools:** None.

**Turn 7 — caller:** Yes, please book that.

**Agent:** Your demo callback is confirmed for Wed, Nov 4, 4:00 PM EST. Thanks so much for calling MultiTracks Playback support. Have a great day, and goodbye!

**Tools:** reserve_callback, endCall.


### account-clear-playback

Test ID: text-poc-a1e0a5c7-153f-404a-8fe0-51b686696574. Fingerprint: ae358699c46dd6824462e5e5a0c1a99b0943d95b8763509604dab9d7e0bdb32e.

**Turn 1 — caller:** I'm in Playback on our iPad. The selected account says Personal account, but I need our church's songs. How do I change the selected organization?

**Agent:** Tap the stack icon at the top right, then choose Switch Organizations and select your church’s organization. If it isn’t listed, your signed-in user may not yet have access to that organization.

**Tools:** search_playback_docs.

**Turn 2 — caller:** I selected Northgate Worship Collective from the list, and our church’s songs are showing up now.

**Agent:** Is there anything else I can help you with today?

**Tools:** None.

**Turn 3 — caller:** No, that’s everything. Thank you!

**Agent:** Thanks so much for calling MultiTracks Playback support. Have a great day, and goodbye!

**Tools:** endCall.


### account-planning

Test ID: text-poc-72d99c4a-3971-4468-9b13-9fa5d4bfb709. Fingerprint: ae358699c46dd6824462e5e5a0c1a99b0943d95b8763509604dab9d7e0bdb32e.

**Turn 1 — caller:** I'm in the wrong account and can't see our church's songs. How do I change it?

**Agent:** What device are you using, and where do you see the account that’s currently selected?

**Tools:** None.

**Turn 2 — caller:** I’m looking at the Planning Center website in Safari. That’s where I can’t see our church’s plan and songs.

**Agent:** That’s in Planning Center rather than Playback, so I can’t change that website’s account or plan access; would you like me to connect you with a specialist for review?

**Tools:** None.

**Turn 3 — caller:** I understand. I’ll contact our church’s Planning Center admin about the login and access.

**Agent:** Is there anything else I can help you with today?

**Tools:** None.

**Turn 4 — caller:** No, that’s all. Thank you.

**Agent:** Thanks so much for calling MultiTracks Playback support. Have a great day, and goodbye!

**Tools:** endCall.


### account-playback

Test ID: text-poc-86748724-10ca-4388-bd4a-e7cd3dbea2f3. Fingerprint: ae358699c46dd6824462e5e5a0c1a99b0943d95b8763509604dab9d7e0bdb32e.

**Turn 1 — caller:** I'm in the wrong account and can't see our church's songs. How do I change it?

**Agent:** Open the side menu using the stack icon at the top right, then choose Switch Organizations and select your church’s organization. If it isn’t listed, your church admin may need to add your user account to that organization.

**Tools:** search_playback_docs.

**Turn 2 — caller:** I’m in Playback on our iPad. I selected Northgate Worship Collective from that list and the church’s songs have appeared.

**Agent:** Your church’s library is now selected and available in Playback. Is there anything else I can help you with today?

**Tools:** None.

**Turn 3 — caller:** No, that’s everything. Thank you!

**Agent:** Thanks so much for calling MultiTracks Playback support. Have a great day, and goodbye!

**Tools:** endCall.

## Cleanup and freeze evidence

[retest-integration-cleanup-proof.json](retest-integration-cleanup-proof.json) records actual confirmed own bookings before cleanup, taken slots, reopened slots and source hashes. callbacks:cleanupTextTest was called only for text-poc-7fcc72c3-c4dc-415e-983e-cebb367d620d and text-poc-4b758586-94ad-49e1-9f0e-5cccc39f97a0; each returned1. All seven runs are done=true/cleanupComplete=true, with zero remaining own tool logs or bookings. Nov4 3PM and4PM EST reopened. Pre-existing non-text user bookings retained their IDs/status/slots. All nine retest-config.json source hashes matched at preflight and 2026-11-03T12:06:21.319Z completion.

The concrete remaining clarification failure should guide any further generic change; these are single observations per branch and are not a statistical reliability estimate. Do not overwrite the failed first reply or replace it with the successful identical-opening branch.
