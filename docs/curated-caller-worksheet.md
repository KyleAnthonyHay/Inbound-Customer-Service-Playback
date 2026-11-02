# Curated caller worksheet

Ten cases across five intents. Target handling: seven agent resolutions and three human/admin reviews. These are test expectations, not completed results.

Use this worksheet for development text checks and later manual voice conversations. Text checks do not validate speech recognition, speaker delegation, interruption handling or call lifecycle. No automated voice calls are authorized.

## Caller and reviewer roles

- Start with one opening below; do not read the reviewer facts or expected fix to the support agent.
- Answer the question actually asked, using the available scenario facts. Do not volunteer the diagnosis or coach the agent toward the expected tool.
- Report an observation after the relevant instruction. Simulated recovery is caller input, not observed device telemetry.
- If the agent asks for an unspecified fact, record the gap instead of inventing evidence. The intended outcome does not force the agent to claim success.
- Expected facts and handling are never injected into the text agent prompt. The two phrasing variants start fresh, isolated conversations.
- Review tool arguments, returned sources, reasoning expressed in the response, consent and the final outcome. Preserve failures and detours.

## 1. Separate click and guide

Intent: **routing** · Intended handling: **agent**

**Opening A**

> Click and guide are coming through one channel in our in-ears, but we need independent control. I'm on an iPad with Playback Premium and a four-output USB interface. Outputs 1 and 2 feed separate in-ear mixer channels; 3 and 4 carry the music. We have time before rehearsal.

**Opening B**

> Our musicians can't turn down the spoken guide without also turning down the click. Playback is on an iPad with Premium and a four-output USB interface: two separate in-ear feeds on 1 and 2, music on 3 and 4. How do we separate them? We're not live.

**Facts available to the caller — reveal when relevant**

Playback 8.6.4. Click and Guide are separate buses, both assigned to output 1. All physical connections are already described; no hardware fault is asserted.

**Reviewer expectation — do not feed to the agent**

Retrieve documentation, inspect or clarify bus assignments, guide distinct appropriate outputs, obtain simulated caller confirmation. No arbitrary universal channel mapping or legacy bus-creation steps.

## 2. Restore routing after reconnecting

Intent: **routing** · Intended handling: **agent-target**

**Opening A**

> After unplugging and reconnecting our USB interface, the music from Playback is scattered across outputs 3, 4, 5, 6 and more. We normally send all music through the stereo pair 3 and 4, with click on 1 and guide on 2. I'm on a Mac with Premium, a PlayAUDIO12, and time to troubleshoot.

**Opening B**

> Our tracks used to come into the desk as one stereo music feed on 3/4. Since reconnecting the PlayAUDIO12, different instruments are arriving on 5/6, 7/8 and 9/10 too. Click and guide belong on 1 and 2. Can you help restore our routing in Playback on the Mac? Premium is active and rehearsal is tomorrow.

**Facts available to the caller — reveal when relevant**

Playback 8.6.4. Audio Device is PlayAUDIO12. Current Buses: Drums 3/4, Bass 5/6, Keys 7/8, Guitars 9/10. Intended music feed is 3/4. This is a simulated routing state; no verified explanation for why reconnecting changed it.

**Reviewer expectation — do not feed to the agent**

Check the selected device/current bus assignments, retrieve applicable guidance, restore the caller's stated music routing without claiming the reset cause or reconfiguring third-party hardware.

## 3. Select the correct audio device

Intent: **routing** · Intended handling: **agent**

**Opening A**

> Playback is running and I can see the meters moving, but there's no sound through our USB interface. I'm on a MacBook with Playback 8.6.4. Rehearsal isn't until tomorrow.

**Opening B**

> The song is playing on the Mac, but our sound desk isn't getting anything from the connected audio interface. Playback's meters move normally. We're using version 8.6.4 and have time to check it.

**Facts available to the caller — reveal when relevant**

The interface is a Focusrite 4i4, connected and powered through a powered USB hub. Settings > General > Audio Device currently says MacBook Speakers. The interface is also listed. No cable or mixer repair is required in this simulated fixture. The make/model was supplied in follow-ups during the first phrasing run.

**Reviewer expectation — do not feed to the agent**

Find documented audio-device selection guidance and ask/check actual selection before identifying the cause. Simulated caller confirms sound after selecting the interface.

## 4. False subscription-expired message

Intent: **version** · Intended handling: **agent**

**Opening A**

> I'm Jordan, demo customer DEMO-1001. Playback says Cloud Pro expired, but our subscription is paid and active. Can you help? I'm on an iPad and we're not in a service.

**Opening B**

> Our demo account DEMO-1001 has an active Cloud Pro plan, but the iPad app keeps showing Cloud Pro expired. I'm Jordan. We have time before rehearsal; why does the app think we've expired?

**Facts available to the caller — reveal when relevant**

Caller reports installed version 8.6.1 when asked; this overrides the synthetic record's last-known 8.6.2 note. Active status is verified through the demo lookup. The plan was purchased through MultiTracks on the website, not Apple; that fact was supplied in follow-ups during the first phrasing run. Version 8.6.1 is a simulated pre-fix assumption, not a confirmed affected-version range.

**Reviewer expectation — do not feed to the agent**

Check simulated account status and installed version; retrieve documented false-expiration fix introduced in 8.6.3, consider live current-version metadata/coverage gaps, recommend a safe targeted update and obtain simulated caller confirmation. Do not renew or charge the customer.

## 5. Documented iPad/interface setup

Intent: **compatibility** · Intended handling: **agent**

**Opening A**

> Can Playback work with our setup? We have a USB-C iPad on supported iPadOS, Playback Premium, a Focusrite 4i4, an official Apple USB-C adapter and a powered USB hub. We want click and guide separately plus stereo music.

**Opening B**

> Before rehearsal, can you check whether our gear is a documented fit? It's a USB-C iPad with Premium, a Focusrite 4i4 connected through the Apple adapter and powered hub. We need separate click, separate guide and a stereo track feed.

**Facts available to the caller — reveal when relevant**

The official tested-device list names Focusrite 4i4, four outputs, USB hub required. Goal is compatibility advice, not hardware configuration or purchase.

**Reviewer expectation — do not feed to the agent**

Retrieve applicable requirements; confirm documented arrangement with relevant conditions without unsupported end-to-end guarantees or unnecessary escalation.

## 6. Borrowed mixer compatibility review

Intent: **compatibility** · Intended handling: **human-review**

**Opening A**

> We use Playback on an iPad, but we've borrowed a different soundboard. It has a USB socket. Can we plug the iPad directly into that for our tracks?

**Opening B**

> Can you check if our iPad can run Playback straight into a borrowed mixer over USB, without a separate audio interface? We haven't used this mixer before.

**Facts available to the caller — reveal when relevant**

Borrowed mixer model is Mackie ProFX12v3, revealed when asked. Caller does not know USB class compliance or the supported iPad connection requirements for this model. This model is not in the bounded tested-interface list. That absence is not proof of incompatibility. The model name is a real hardware example; the scenario is simulated and its end-to-end compatibility has not been verified.

**Reviewer expectation — do not feed to the agent**

Ask for relevant model details, search available resources, distinguish general USB guidance from verification of this exact connection, acknowledge any remaining evidence gap and offer specialist review. Do not declare the mixer incompatible merely because it is unlisted.

## 7. Select the correct organization

Intent: **account-access** · Intended handling: **agent**

**Opening A**

> I can sign into Playback on my iPad, but our church's purchased songs aren't showing. They were there when our worship leader used it. How do I get to them?

**Opening B**

> My iPad login works, but Playback opens an empty library instead of our church's songs. The worship leader can see them with my account. What should I check?

**Facts available to the caller — reveal when relevant**

Playback 8.6.4. Side menu currently shows Taylor Personal Demo; organization picker also lists North Harbor Demo Church. Caller already belongs to that organization with necessary access. These MultiTracks organization observations are fictional and separate from the shared Planning Center organization. Actual role/seat changes are not needed.

**Reviewer expectation — do not feed to the agent**

Use documentation to guide checking/switching organization. Do not assume missing permissions, change privileges, link the real church, or force a handoff before checking the documented navigation.

## 8. Permission or seat assignment

Intent: **account-access** · Intended handling: **human-admin-review**

**Opening A**

> I'm in the correct church organization in Playback. Our administrator checked and says I haven't been assigned the permission or Team Sharing seat to access our purchased songs. Can you enable it for me?

**Opening B**

> The church admin confirmed my Playback organization is right, but I still need an access permission and seat assigned. Could you grant that so I can use our songs?

**Facts available to the caller — reveal when relevant**

The issue requires an administrative access change; no navigation or software fix will grant the permission. The caller has not initially asked for a human. No real account changes are authorized or possible.

**Reviewer expectation — do not feed to the agent**

Explain the limitation and possible need for the church admin, offer human/specialist review, and follow the consented handoff or callback path. Do not pretend a demo customer lookup is identity verification or an access grant.

## 9. Audio Files Missing recovery

Intent: **song-loading** · Intended handling: **agent**

**Opening A**

> We're getting ready for Sunday and one of the songs won't load in Playback. I'm on an iPad and have time before rehearsal. Can you help?

**Opening B**

> I'm preparing the service setlist on my iPad, but one song refuses to download. We're not live yet. What should I check?

**Facts available to the caller — reveal when relevant**

Song is Graves Into Gardens. Exact message is Audio Files Missing. Playback 8.6.4. Caller has tapped Try Again once. Reveal facts only in response to relevant questions. The simulation reports recovery after the documented third retry, not after an arbitrary unrelated instruction.

**Reviewer expectation — do not feed to the agent**

Retrieve applicable official guidance, distinguish this error from generic Download Error, use helpful real demo service context without assuming ownership, guide the documented retry count, and confirm caller-reported recovery.

## 10. Unresolved Audio Files Missing

Intent: **song-loading** · Intended handling: **human-review**

**Opening A**

> Graves Into Gardens won't download on my iPad. Playback 8.6.4 says Audio Files Missing. I've already used Try Again three times and it still fails. We're minutes from service, so I can't remove songs or clear our downloaded setlists.

**Opening B**

> We're about to start and Graves Into Gardens still shows Audio Files Missing in Playback on the iPad. Three retries haven't helped. I'm on 8.6.4 and we cannot risk deleting or redownloading our other material right now.

**Facts available to the caller — reveal when relevant**

Three retries have failed. The caller declines content deletion/clearing/re-download changes before service. Other content is ready and must stay intact. No safe applicable documented recovery remains in this fixture; root cause is not asserted.

**Reviewer expectation — do not feed to the agent**

Respect prior failed steps and timing, consult documentation, acknowledge inability to resolve with suitable supported steps, offer specialist review and follow availability/handoff/callback after acceptance.

## Evidence and source boundaries

Playback help articles/release notes are bundled snapshots; the User Guide is a text index in Pinecone. Planning Center and Apple calls are actual read-only API requests. Customer records, organization observations, staffing, handoffs and caller-reported fixes are simulated. A missing mixer model on a tested list is not proof of incompatibility.

The reconnecting fixture supplies current and intended bus assignments but does not establish why they changed. Caller version 8.6.1 is a simulated older-version assumption; release notes document the fix in 8.6.3 without enumerating every affected version.

The live text runs and manual reviews are under `docs/text-tests/curated-variations/`. These do not replace the ten manual presentation voice conversations.
