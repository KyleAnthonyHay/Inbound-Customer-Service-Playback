# Candidate C final integration — development text POC

Seven fresh first-opening conversations, **31 actual reply turns**, reported text cost **$0.9183**. Seven attempted/evaluable chats; no retry, replacement or cherry-picking. Candidate A/B evidence preserved. Existing harness, deployed DEV tools, fixed private caller profiles. No source/fixture/backend/saved-assistant edit, production action or voice call.

## Initial ambiguity and subsequent behavior

The identical ambiguous account opening still produced inconsistent behavior: neutral context clarification in **1 of 2** fresh conversations. The initial Playback assumption remains unresolved. These are individual observations, not statistical reliability estimates.

| Branch | Initial neutral clarification | Post-fact behavior |
| --- | --- | --- |
| account-playback | **FAIL**: immediately searched Playback docs and gave Switch Organizations steps before knowing application/provider. | Applicable steps happened to match private Playback background. Caller explicitly identified Playback/iPad and confirmed songs appeared after selecting Northgate. Agent accepted result and closed. Eventual resolution does not repair failed initial clarification. |
| account-planning | **PASS**: asked where the caller saw the selected account/missing songs, without embedding Playback or invoking tools. | Named Planning Center after caller disclosed Safari/website. Did not substitute Playback organization navigation or claim access changed. However, offered unspecified specialist review rather than directing arbitrary website login/access to its own account/admin owner. Caller independently chose their own Planning Center admin from private profile; agent accepted and closed. Admin-owner guidance therefore remains unproven/unsatisfied, despite correct provider distinction. |
| account-clear-playback | **PASS**: direct documented switch, no redundant application question. | Caller confirmed original song-visibility goal, further-help/endCall/farewell followed. |

In failed account-playback, actual returned search metadata contains evidenceScope=product-documentation and establishesCallerContext=false. This was a correctly deployed new result; the model still treated the ambiguous request as a Playback task. No missing tool metadata explains this observed failure.

Planning branch exact response after clarification: “Planning Center access and plan visibility are outside what I can change in Playback, so a specialist can help review the account or permissions. Would you like me to connect you with one now?” No account/tool write occurred. This is a limitation statement and specialist offer, not a demonstrated plan/login fix or independently suggested own-admin route.

## Regular regression outcomes

| Case | Turns | Cost | Assessment |
| --- | ---: | ---: | --- |
| 05-supported-setup | 3 | $0.0771 | PASS conditional advice; 4i4 described before model confirmed. |
| 06-borrowed-mixer | 6 | $0.2316 | PASS unverified USB boundary and specialist/callback. |
| 09-loading-recovery | 5 | $0.1397 | PASS third-attempt recovery plus API answer; reused initial API context. |
| 10-loading-unresolved | 7 | $0.2357 | QUALIFIED PASS safe specialist/callback; browser-number readback last4 only. |
| account-clear-playback | 3 | $0.0785 | PASS clear-context direct path. |
| account-planning | 4 | $0.0758 | PASS neutral question/provider distinction; QUALIFIED admin-owner guidance not followed. |
| account-playback | 3 | $0.0799 | FAIL initial context prerequisite; eventual applicable simulated repair. |

05 gave Premium/MultiOuts and powered-hub conditions and answered the listening goal without an unwanted setup walkthrough. It described tested 4i4 capability before asking which Focusrite model the caller owned; caller then confirmed that model. Conditional advice is supported; do not claim independently verified physical installation.

06 acknowledged unverified exact Mackie USB routing, maintained conditional general capability and offered specialist review. No unqualified AutoPan substitute appeared this round. It did not claim the unlisted mixer incompatible or simulate a successful repair.

09 distinguished Audio Files Missing, guided the two remaining retries after one previous attempt, obtained caller-confirmed success at the third total attempt, and answered the follow-up other-songs question using the initial successful live Planning Center API read. Unlike A/B it reused available context rather than making a second API lookup.

10 retained the three failed attempts, asked a relevant recent-download question, avoided destructive recovery where the prerequisite was unknown and later respected the caller’s ready-download/service constraint. Specialist/callback was appropriate; underlying song failure remained unresolved.

Both 06 and10 paired availability/timezone and name/number collection, checked exact next-day slots before saying available, kept proposal/approval separate, reserved once only after explicit approval, called endCall and returned complete booking confirmation/farewell. Both exact full supplied demo numbers and full caller names were independently verified in confirmed DEV booking records. 06 proposal shortened Jamie Demo to Jamie but persisted the full name. 10 proposal used only fresh browser-number last4 (“ending in0150”) despite no caller ID, a retained full-number-readback qualification. The sole supplied number was unambiguous and caller naturally approved under the prior evaluation criterion; no repaired readback/coaching was requested. This is not a flawless browser-number readback pass.

Reservations returned ok=true/bookingId/bookingCreated=true/teamNotified=false. Simulated bookings are not technical resolution or actual staff contact. All seven final replies contained text endCall/farewell, but text checks do not validate GPT-Live speaker wording/audio, interruptions or native disconnect. Known-account-name reuse and phone caller-ID branches remain outside this cohort.

## Exact adaptive conversations

### 05-supported-setup

Test ID: text-poc-81833c5e-c0bf-4db2-917b-e209e51310a8. Fingerprint: 0a1217ca8b794d2712ab64dfc33cb82aa7d7d2230ed875d3225ed7f10c0779eb.

**Turn 1 — caller:** Can you help me check whether our iPad and Focusrite will work with Playback? We want the band to hear click and spoken cues while the audience hears the music.

**Agent:** A Focusrite 4i4 is tested with iPad Playback and can provide separate feeds, but it needs a powered USB hub; with Playback Premium, you can send click and guide to the band and music to the audience on different outputs. Which Focusrite model do you have?

**Tools:** search_playback_docs.

**Turn 2 — caller:** The label on the box says Focusrite 4i4.

**Agent:** The 4i4 will work with iPad Playback for those separate feeds, provided it’s connected through a powered USB hub and your organization has Playback Premium for MultiOuts. Is there anything else I can help you with today?

**Tools:** None.

**Turn 3 — caller:** No, that answers my question. Thank you.

**Agent:** Thanks so much for calling MultiTracks Playback support. Have a great day, and goodbye!

**Tools:** endCall.


### 06-borrowed-mixer

Test ID: text-poc-623f7cb9-5f06-450b-9142-5fc85143f1a6. Fingerprint: 0a1217ca8b794d2712ab64dfc33cb82aa7d7d2230ed875d3225ed7f10c0779eb.

**Turn 1 — caller:** We've borrowed a mixer with a USB socket. Can we plug our iPad straight into it for Playback and keep click and guide out of the audience's music?

**Agent:** Possibly—if that mixer’s USB connection works as a class-compliant audio interface with multiple outputs, Playback can send your music separately from click and guide; MultiOuts also requires Playback Premium. What’s the mixer’s model?

**Tools:** search_playback_docs.

**Turn 2 — caller:** The label says Mackie ProFX12v3.

**Agent:** The ProFX12v3 isn’t on Playback’s tested interface list, so I can’t verify that its USB port provides the separate outputs you need. If it is class-compliant and exposes multiple outputs to the iPad, Playback Premium can route music apart from click and guide; would you like a specialist to review that mixer connection with you?

**Tools:** search_playback_docs.

**Turn 3 — caller:** Yes, please. I don’t know those connection details, and the owner isn’t available to check.

**Agent:** Nobody is available to transfer right now, but I can schedule a specialist callback to review the ProFX12v3 connection. When are you available, and what’s your time zone?

**Tools:** check_team_availability.

**Turn 4 — caller:** Tomorrow at 3 PM would work. I’m in Eastern time.

**Agent:** Wed, Nov 4, 3:00 PM EST is open. What’s your name and the best callback number?

**Tools:** get_callback_slots.

**Turn 5 — caller:** Jamie Demo. The number is +1 202 555 0146.

**Agent:** Shall I book the specialist callback for Jamie at +1 202 555 0146 on Wed, Nov 4, 3:00 PM EST to review the ProFX12v3 connection?

**Tools:** None.

**Turn 6 — caller:** Yes, please book that.

**Agent:** Your demo callback is confirmed for Wed, Nov 4, 3:00 PM EST. Thanks so much for calling MultiTracks Playback support. Have a great day, and goodbye!

**Tools:** reserve_callback, endCall.


### 09-loading-recovery

Test ID: text-poc-53bbb6c4-24b8-48fa-9616-67c2c7cbc2e1. Fingerprint: 0a1217ca8b794d2712ab64dfc33cb82aa7d7d2230ed875d3225ed7f10c0779eb.

**Turn 1 — caller:** I'm getting ready for rehearsal on our iPad, but Graves Into Gardens won't open. I've pressed Try Again once and it's still stuck.

**Agent:** What exact message do you see on the stuck Graves Into Gardens screen?

**Tools:** search_playback_docs, get_planning_center_service_context.

**Turn 2 — caller:** It says Audio Files Missing.

**Agent:** Tap Try Again two more times; on the third attempt, Playback automatically runs a different recovery. Does Graves Into Gardens open after that third try?

**Tools:** None.

**Turn 3 — caller:** The first extra try still failed, but the following try worked. It’s opened now.

**Agent:** Graves Into Gardens is now open for the demo service plan. Is there anything else I can help you with today?

**Tools:** None.

**Turn 4 — caller:** Yes, could you check Planning Center and tell me what other songs are on Sunday’s demo plan?

**Agent:** The Sunday demo plan also has Do It Again in B-flat and What A Beautiful Name in D. Is there anything else I can help you with today?

**Tools:** None.

**Turn 5 — caller:** No, that’s everything I needed. Thank you.

**Agent:** Thanks so much for calling MultiTracks Playback support. Have a great day, and goodbye!

**Tools:** endCall.


### 10-loading-unresolved

Test ID: text-poc-edf5b480-46f7-44ea-8243-34b2fd9bc49e. Fingerprint: 0a1217ca8b794d2712ab64dfc33cb82aa7d7d2230ed875d3225ed7f10c0779eb.

**Turn 1 — caller:** Graves Into Gardens won't open on our iPad. I've pressed Try Again three times, and it still hasn't worked.

**Agent:** What exact message appears above the Try Again button when you select Graves Into Gardens?

**Tools:** search_playback_docs, get_planning_center_service_context.

**Turn 2 — caller:** It says Audio Files Missing.

**Agent:** Since you’ve already tried it three times, Playback has run its built-in recovery for that message. Is Graves Into Gardens a recent download in one of your past setlists?

**Tools:** None.

**Turn 3 — caller:** I’m not sure.

**Agent:** Because the only next documented recovery would erase all local setlists and downloads, I can’t safely recommend it without confirming that detail. Would you like me to get a Playback specialist to review this now?

**Tools:** None.

**Turn 4 — caller:** Yes, please. Service is about to start, and our other songs are downloaded and ready, so I can’t remove those downloads.

**Agent:** Nobody is available to transfer right now, and I won’t suggest deleting your ready downloads before service. I can schedule a Playback specialist callback—when are you available, and what time zone are you in?

**Tools:** check_team_availability.

**Turn 5 — caller:** Tomorrow at 4 PM would work. I’m in Eastern time.

**Agent:** Wed, Nov 4, 4:00 PM EST is available. What’s your name and the best callback number?

**Tools:** get_callback_slots.

**Turn 6 — caller:** John Doe. The number is +1 202 555 0150.

**Agent:** Shall I book Wed, Nov 4, 4:00 PM EST for John Doe at the number ending in 0150?

**Tools:** None.

**Turn 7 — caller:** Yes, please book that.

**Agent:** Your demo callback is confirmed for Wed, Nov 4, 4:00 PM EST. Thanks so much for calling MultiTracks Playback support. Have a great day, and goodbye!

**Tools:** reserve_callback, endCall.


### account-clear-playback

Test ID: text-poc-48e5848b-561d-4675-9dff-c7b4e7557684. Fingerprint: 0a1217ca8b794d2712ab64dfc33cb82aa7d7d2230ed875d3225ed7f10c0779eb.

**Turn 1 — caller:** I'm in Playback on our iPad. The selected account says Personal account, but I need our church's songs. How do I change the selected organization?

**Agent:** Open the side menu using the stack icon at the top right, then tap Switch Organizations and select your church’s organization. If it isn’t listed, your user account may need to be added to that organization.

**Tools:** search_playback_docs.

**Turn 2 — caller:** I selected Northgate Worship Collective from the list, and our church’s songs are showing up now.

**Agent:** Is there anything else I can help you with today?

**Tools:** None.

**Turn 3 — caller:** No, that’s everything. Thank you!

**Agent:** Thanks so much for calling MultiTracks Playback support. Have a great day, and goodbye!

**Tools:** endCall.


### account-planning

Test ID: text-poc-a68176c9-55b0-46a0-8b10-11336960e61a. Fingerprint: 0a1217ca8b794d2712ab64dfc33cb82aa7d7d2230ed875d3225ed7f10c0779eb.

**Turn 1 — caller:** I'm in the wrong account and can't see our church's songs. How do I change it?

**Agent:** Where are you seeing the account you’re signed into, and what screen are you on when the church’s songs are missing?

**Tools:** None.

**Turn 2 — caller:** I’m looking at the Planning Center website in Safari. That’s where I can’t see our church’s plan and songs.

**Agent:** Planning Center access and plan visibility are outside what I can change in Playback, so a specialist can help review the account or permissions. Would you like me to connect you with one now?

**Tools:** None.

**Turn 3 — caller:** I understand. I’ll contact our church’s Planning Center admin about the login and access.

**Agent:** Is there anything else I can help you with today?

**Tools:** None.

**Turn 4 — caller:** No, that’s all. Thank you.

**Agent:** Thanks so much for calling MultiTracks Playback support. Have a great day, and goodbye!

**Tools:** endCall.


### account-playback

Test ID: text-poc-45cecfbe-7bbf-4753-83d8-0e2c5a896ee4. Fingerprint: 0a1217ca8b794d2712ab64dfc33cb82aa7d7d2230ed875d3225ed7f10c0779eb.

**Turn 1 — caller:** I'm in the wrong account and can't see our church's songs. How do I change it?

**Agent:** Open the side menu using the stack icon, then choose Switch Organizations and select your church’s organization. If it isn’t listed, you’ll need your church’s account admin to add you to that organization.

**Tools:** search_playback_docs.

**Turn 2 — caller:** I’m in Playback on our iPad. I selected Northgate Worship Collective from that list and the church’s songs have appeared.

**Agent:** That means you’re now in the right organization and its songs are available. Is there anything else I can help you with today?

**Tools:** None.

**Turn 3 — caller:** No, that’s everything. Thank you!

**Agent:** Thanks so much for calling MultiTracks Playback support. Have a great day, and goodbye!

**Tools:** endCall.

## Cleanup/freeze proof

[final-integration-cleanup-proof.json](final-integration-cleanup-proof.json) preserves confirmed own bookings and taken slots before cleanup, reopened slots, source hashes and isolated log removal. callbacks:cleanupTextTest received only own text-poc-623f7cb9-5f06-450b-9142-5fc85143f1a6 and text-poc-edf5b480-46f7-44ea-8243-34b2fd9bc49e; each returned1. Both November4 3PM/4PM EST slots reopened, zero own bookings remain, all seven runs are done=true/cleanupComplete=true with zero own tool logs. Pre-existing non-text user bookings retained IDs/status/slots. All nine final-config.json hashes matched preflight and at completion 2026-11-03T12:10:17.456Z. No further inference is planned.
