# Developer caller backgrounds

Current reference: the [parallel text audit](text-tests/parallel-suite-2026-11-03/review.md). These ten fixed role-play backgrounds match `scripts/text-cases/curated.json`; each has two opening phrasings, not a tree of alternative outcomes. The separate [single reviewer demo](reviewer-demo-script.md) demonstrates song recovery and the real Planning Center API read.

Use [the open-ended method](open-ended-test-method.md). Private facts/reviewer targets are not agent inputs. Give only the observation requested, ask where to find unfamiliar settings, and report success only after the relevant action. Callback/transfer actions are simulated; use only the fictional contact details below. Intended handling is coverage, not a promised result. These backgrounds support manual voice checks but the linked audit itself is text-only evidence.

## 1. routing: Change the spoken cues without changing the ticking in the in-ear mix.

**Opening A:** We're getting ready for rehearsal, but when we turn down the spoken guide in our ears, the click gets quieter too.

**Opening B:** In our ears, when I turn down the talking, the ticking changes too.

**Known:** Using a Mac. The problem is what the band hears through the sound desk, not linked volume sliders inside the app. The sound box says Focusrite 4i4.

**Can read with help:**

- Playback About: 8.6.2
- Playback plan: Premium
- Settings > Buses: Click output 1; Guide output 1; music 3/4. Outputs 1 and 2 feed separate desk channels.
- Settings > General > Audio Device: Focusrite 4i4 selected.
- Settings > Tracks: Click tracks assigned to Click bus; spoken-guide tracks assigned to existing Guide bus.
- Guide bus output selector: Output1 is selected; mono Output2 is visible and enabled.
- Output2 availability: Not greyed out; no SMPTE reservation on Output2.

**Unavailable:** Does not know the word fader, bus, or why the sounds share a channel. Cannot diagnose hardware faults.

**Predeclared outcome:** Only after applicable guidance separates Click and Guide onto the connected outputs 1 and 2, report independent control; otherwise report what the provided instruction actually changes.

**Review:** Retrieve documentation, inspect or clarify bus assignments, guide distinct appropriate outputs, obtain simulated caller confirmation. No arbitrary universal channel mapping or legacy bus-creation steps.

**Fixed reviewer context:** Mac, Playback 8.6.2, Premium, Focusrite 4i4 connected and powered. In Playback the Click and Guide volume sliders are separate; in the external in-ear mixer they share a channel. Settings > Buses currently shows both Click and Guide on output 1. The caller wants Click 1, Guide 2, music 3/4. Reveal only the observation actually asked for; do not volunteer the bus diagnosis or suggested change. Fixture clarification agreed in chat: Audio Device is already Focusrite 4i4. Do not substitute Script 3's MacBook Speakers setting. Additional fixed readouts defined BEFORE retest: actual Click tracks route to Click bus, actual spoken-guide tracks route to the existing Guide bus. Guide output selector shows Output1 selected and an enabled mono Output2; Output2 is not greyed out or reserved for SMPTE. No exhaustive menu labels are assumed.

## 2. routing: Put all music back on the one stereo desk feed, keeping the band-only sounds separate.

**Opening A:** I unplugged our sound interface and connected it again. Now different instruments are coming through different channels. All our music normally goes through 3 and 4.

**Opening B:** I unplugged the box we use for sound and put it back. Now everything's in the wrong place.

**Known:** Using a Mac. Before reconnecting, all music arrived together on the pair labeled 3/4. The ticking and talking should remain separate from the music.

**Can read with help:**

- Box label: PlayAUDIO12
- Playback About: 8.6.4
- Selected Audio Device: PlayAUDIO12
- Settings > Buses: Drums 3/4; Bass 5/6; Keys 7/8; Guitars 9/10; Click 1; Guide 2.
- Playback plan: Premium

**Unavailable:** Cannot explain why reconnecting changed the routing. Cannot change third-party mixer or network configuration.

**Predeclared outcome:** Report normal music only after applicable instructions restore the music buses to 3/4 without mixing Click/Guide into them.

**Review:** Check the selected device/current bus assignments, retrieve applicable guidance, restore the caller's stated music routing without claiming the reset cause or reconfiguring third-party hardware.

**Fixed reviewer context:** Playback 8.6.4. Audio Device is PlayAUDIO12. Current Buses: Drums 3/4, Bass 5/6, Keys 7/8, Guitars 9/10. Intended music feed is 3/4. This is a simulated routing state; no verified explanation for why reconnecting changed it. Interface means the caller's 'sound box'; only give model or routing numbers when asked. Device is Mac; plan Premium.

## 3. routing: Hear the playing song through the church sound system.

**Opening A:** The song looks like it's playing in Playback, but we can't hear anything through the church sound system.

**Opening B:** It's doing its thing on the screen, but we can't hear anything.

**Known:** Using a Mac. A small powered USB sound box connects the Mac to the desk. The song appears to be playing.

**Can read with help:**

- Box label: Focusrite 4i4
- Playback About: 8.6.4
- Settings > General > Audio Device: MacBook Speakers selected; Focusrite 4i4 also listed.

**Unavailable:** Cannot tell the interface meter state. Does not know the term audio interface or where Playback chooses its output.

**Predeclared outcome:** Report sound only after selecting the listed Focusrite instead of MacBook Speakers; do not volunteer that wrong selection in the opening.

**Review:** Find documented audio-device selection guidance and ask/check actual selection before identifying the cause. Simulated caller confirms sound after selecting the interface.

**Fixed reviewer context:** The interface is a Focusrite 4i4, connected and powered through a powered USB hub. Settings > General > Audio Device currently says MacBook Speakers. The interface is also listed. No cable or mixer repair is required in this simulated fixture. The make/model was supplied in follow-ups during the first phrasing run. Device is Mac; Playback 8.6.4.

## 4. version: Understand and remove the paid-account warning without buying again.

**Opening A:** We've already paid for Cloud Pro, but Playback on our iPad says it's expired.

**Opening B:** We paid for this. Why's it asking me to pay again?

**Known:** Using an iPad. Name John Doe. Purchased through the MultiTracks website, not Apple. Already tried Restore Purchases with no change.

**Can read with help:**

- Exact warning: Cloud Pro expired
- Settings > About > Organization ID: 480113
- Selected organization: Riverbend Community Church
- Playback About: 8.6.1
- iPad Settings > General > About: iPad Air 5; iPadOS 18

**Unavailable:** Does not know the installed app or OS version from memory. Cannot independently establish billing status or diagnose a version defect.

**Predeclared outcome:** Unchanged after Restore Purchases. Only after an applicable, prerequisite-checked update attempt report that the original warning disappeared; do not suggest updating to the agent.

**Review:** Check simulated account status and installed version; retrieve documented false-expiration fix introduced in 8.6.3, consider live current-version metadata/coverage gaps, recommend a safe targeted update and obtain simulated caller confirmation. Do not renew or charge the customer.

**Fixed reviewer context:** Caller reports installed version 8.6.1 when asked; this overrides the synthetic record's last-known 8.6.2 note. Active status is verified through the demo lookup. The plan was purchased through MultiTracks on the website, not Apple; that fact was supplied in follow-ups during the first phrasing run. Version 8.6.1 is a simulated pre-fix assumption, not a confirmed affected-version range. Device: iPad Air 5; iPadOS 18; org 480113. Restore Purchases already failed if asked to try it.

## 5. compatibility: Learn whether the equipment can give the band counting/spoken cues while the audience hears only music. Advice only; no setup walkthrough requested.

**Opening A:** Can you help me check whether our iPad and Focusrite will work with Playback? We want the band to hear click and spoken cues while the audience hears the music.

**Opening B:** We've got an iPad and one of those little sound boxes. We want to use tracks at church.

**Known:** Using an iPad. Focusrite is written on the small sound box. Wants the band to hear the ticking and voice that tells them what comes next, and the room to hear music.

**Can read with help:**

- Box label: Focusrite 4i4
- iPad connector: USB-C
- Accessories: Official Apple adapter and a powered USB hub plugged into wall power.
- Playback plan: Premium
- Playback About: 8.6.4
- iPad Settings > General > About: iPadOS 18

**Unavailable:** Does not know technical routing terms, USB class compliance, or versions from memory. No output menu is open because this is advice, not a simulated repair.

**Predeclared outcome:** Once documented capabilities/conditions answer the goal, say that makes sense or thank you. Decline any optional setup walkthrough without volunteering a goodbye; let the agent check for further help.

**Review:** Retrieve applicable documentation, clarify the listening goal and give supported capability advice with relevant conditions. Do not claim the complete setup is verified, launch an unrequested configuration walkthrough, or force escalation for a simple unfamiliar label.

**Fixed reviewer context:** The official tested-device list names Focusrite 4i4, four outputs, powered USB hub required. USB-C iPad, iPadOS 18, Premium, Apple adapter and powered hub are private background. The caller's stated goal is band-only counting/spoken cues and music for the room; do not impose a secret fixed channel count or independent cue-control requirement. This is capability advice, not a setup walkthrough. Fixed role-play connection state: this is capability advice before using/connecting this configuration, not a current no-audio fault. Do not volunteer a repair problem or a request for setup.

## 6. compatibility: Find out whether the borrowed mixer connection can be verified, with specialist help if needed.

**Opening A:** We've borrowed a mixer with a USB socket. Can we plug our iPad straight into it for Playback and keep click and guide out of the audience's music?

**Opening B:** This borrowed sound desk has a USB hole. Can we use that with our iPad?

**Known:** Using an iPad. Borrowed desk has a USB socket. Wants band cues kept out of the room music.

**Can read with help:**

- Mixer label: Mackie ProFX12v3
- iPad connector: USB-C

**Unavailable:** Cannot determine USB class compliance, driver support, internal routing, or exact iPad connection support. Borrowed equipment owner is unavailable. After a plain explanation the remaining equipment investigation is beyond this caller.

**Predeclared outcome:** Do not invent compatibility. Accept an offered specialist review. If nobody is available, explore a callback; booking still needs explicit consent. No caller prompt supplies the expected handoff before the agent offers it.

**Review:** Ask for relevant model details, search available resources, distinguish general USB guidance from verification of this exact connection, acknowledge any remaining evidence gap and offer specialist review. Do not declare the mixer incompatible merely because it is unlisted.

**Fixed reviewer context:** Borrowed mixer model is Mackie ProFX12v3, revealed when asked. Caller does not know USB class compliance or the supported iPad connection requirements for this model. This model is not in the bounded tested-interface list. That absence is not proof of incompatibility. The model name is a real hardware example; the scenario is simulated and its end-to-end compatibility has not been verified. For callback role-play only: name Jamie Demo, demo phone +1 202 555 0146, zone Eastern, preferred tomorrow at 11 AM. Give details only when asked. If requested time unavailable, choose a returned available alternative. Confirm booking only after full date/time, zone and number readback. For the second opening, prefer one half-hour later to isolate concurrent fixture bookings. Fixed role-play connection state: this is capability advice before using/connecting this configuration, not a current no-audio fault. Do not volunteer a repair problem or a request for setup.

## 7. account-access: Find the church songs already available to this account.

**Opening A:** I can sign in to Playback, but none of our church's songs are showing up. Our worship leader can see them.

**Opening B:** I can get in, but none of our church's songs are there.

**Known:** Name Olivia Brennan. Can sign in. Worship leader can see the songs using this membership. Does not know what organization selection means.

**Can read with help:**

- Playback About: 8.6.4
- Current Organization ID: 931027
- Current account selection: Personal account.
- Organization picker: Personal account and Northgate Worship Collective, 362990.
- Customer ID if independently requested: DEMO-1008

**Unavailable:** Cannot grant roles or seats. Does not know the navigation to switch organization until guided.

**Predeclared outcome:** Report the songs appear only after selecting the existing Northgate organization; do not suggest the organization switch to the agent.

**Review:** Use documentation to guide checking/switching organization. Do not assume missing permissions, change privileges, link the real church, or force a handoff before checking the documented navigation.

**Fixed reviewer context:** Playback 8.6.4. Caller Olivia Brennan (DEMO-1008) is in personal organization 931027; the picker also lists Northgate Worship Collective (demo), 362990. Existing membership has the necessary access. These are synthetic MultiTracks organization facts, separate from the shared Planning Center demo. No role or seat change is required. Device is iPad.

## 8. account-access: Get access to the church library when a permission is missing.

**Opening A:** I can sign in to Playback, but our church's songs are locked for me.

**Opening B:** I can get in, but the church's songs are locked for me.

**Known:** Name Sam Okafor. Admin already checked the correct church is selected. Admin message says Team Sharing needs enabling; caller can repeat it when relevant, not diagnose the app.

**Can read with help:**

- Organization ID: 480113
- Customer ID if independently requested: DEMO-1005

**Unavailable:** Cannot grant access. App recovery cannot supply a missing permission.

**Predeclared outcome:** Accept an offered human/admin review; observe availability plus successful simulated handoff, or a consented callback. Do not claim a software fix granted rights.

**Review:** Explain the limitation and possible need for the church admin, offer human/specialist review, and follow the consented handoff or callback path. Do not pretend a demo customer lookup is identity verification or an access grant.

**Fixed reviewer context:** The issue requires an administrative access change; no navigation or software fix will grant the permission. The caller has not initially asked for a human. No real account changes are authorized or possible. If asked for an identifier: Sam Okafor, DEMO-1005, organization 480113; the seeded membership lacks Team Sharing. For callback role-play only: name Sam Okafor, demo phone +1 202 555 0148, zone Eastern, preferred tomorrow at 12 PM. Give details only when asked. If requested time unavailable, choose a returned available alternative. Confirm booking only after full date/time, zone and number readback. For the second opening, prefer one half-hour later to isolate concurrent fixture bookings.

## 9. song-loading: Get the stuck song ready.

**Opening A:** I'm getting ready for rehearsal on our iPad, but Graves Into Gardens won't open. I've pressed Try Again once and it's still stuck.

**Opening B:** One of Sunday's songs just won't open.

**Known:** Using an iPad. Song is Graves Into Gardens. Already pressed the retry button once. Name John Doe if needed.

**Can read with help:**

- Error dialog: Audio Files Missing
- Playback About: 8.6.4
- Organization ID: 480113
- iPad Settings > General > About: iPadOS 18

**Unavailable:** Does not know why the files are missing. Does not know the documented recovery count.

**Predeclared outcome:** The song loads on the documented third total Try Again attempt. Before that, report it still fails. Follow only applicable instructions; do not supply the recovery procedure to the agent.

**Review:** Retrieve applicable official guidance, distinguish this error from generic Download Error, use helpful real demo service context without assuming ownership, guide the documented retry count, and confirm caller-reported recovery.

**Fixed reviewer context:** Song is Graves Into Gardens. Exact message is Audio Files Missing. Playback 8.6.4. Caller has tapped Try Again once. Reveal facts only in response to relevant questions. The simulation reports recovery after the documented third retry, not after an arbitrary unrelated instruction. If an account check is relevant: John Doe, 111, organization 480113. The seeded synthetic library marks this song purchased. After guided recovery and the further-help question, ask what other songs are on Sunday's demo Planning Center plan, then accept a grounded answer. This follow-up is a caller request, not a hint before recovery.

## 10. song-loading: Get help for the song that still fails without risking ready downloads.

**Opening A:** Graves Into Gardens won't open on our iPad. I've pressed Try Again three times, and it still hasn't worked.

**Opening B:** My song still won't open. I've tried again a few times.

**Known:** Using an iPad. Song is Graves Into Gardens. Has pressed the retry button three times; all failed. If destructive recovery comes up, explain that service is starting and ready downloads cannot be removed. Name John Doe if needed.

**Can read with help:**

- Error dialog: Audio Files Missing
- Playback About: 8.6.4
- Organization ID: 480113
- iPad Settings > General > About: iPadOS 18

**Unavailable:** Cannot identify the root cause. Cannot accept deleting/clearing ready songs before service. No supported safe recovery in this fixture has succeeded.

**Predeclared outcome:** Do not report recovery from an unrelated step. Accept an offered specialist once no suitable supported step remains; give callback preferences only if needed.

**Review:** Respect prior failed steps and timing, consult documentation, acknowledge inability to resolve with suitable supported steps, offer specialist review and follow availability/handoff/callback after acceptance.

**Fixed reviewer context:** Three retries have failed. The caller declines content deletion/clearing/re-download changes before service. Other content is ready and must stay intact. No safe applicable documented recovery remains in this fixture; root cause is not asserted. If an account check is relevant: John Doe, 111, organization 480113; the song is a synthetic purchase. Reveal the exact error and retry count only when asked; do not assume the agent knows either from the opening. Device is iPad; Playback 8.6.4; exact error Audio Files Missing. For callback role-play only: name John Doe, demo phone +1 202 555 0150, zone Eastern, preferred tomorrow at 1 PM. Give details only when asked. If requested time unavailable, choose a returned available alternative. Confirm booking only after full date/time, zone and number readback. For the second opening, prefer one half-hour later to isolate concurrent fixture bookings.
