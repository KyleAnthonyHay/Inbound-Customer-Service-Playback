**For Jordan and Alex:** [Concise test sheet](jordan-voice-tests.md). The developer fixtures below keep facts and expected outcomes separate from natural caller openings.

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

> Um, I can't turn down my guide without turning up the click.

**Opening B**

> Click and guide are together in our ears. We can't change them separately.

**Facts available to the caller — reveal when relevant**

Mac, Playback 8.6.2, Premium, Focusrite 4i4 connected and powered. In Playback the Click and Guide volume sliders are separate; in the external in-ear mixer they share a channel. Settings > Buses currently shows both Click and Guide on output 1. The caller wants Click 1, Guide 2, music 3/4. Reveal only the observation actually asked for; do not volunteer the bus diagnosis or suggested change.

**Reviewer expectation — do not feed to the agent**

Retrieve documentation, inspect or clarify bus assignments, guide distinct appropriate outputs, obtain simulated caller confirmation. No arbitrary universal channel mapping or legacy bus-creation steps.

## 2. Restore routing after reconnecting

Intent: **routing** · Intended handling: **agent-target**

**Opening A**

> I unplugged that sound box and plugged it back in. Now the music is coming out all over the place.

**Opening B**

> Since we plugged everything back in, the instruments are showing up on different channels. It wasn't like that before.

**Facts available to the caller — reveal when relevant**

Playback 8.6.4. Audio Device is PlayAUDIO12. Current Buses: Drums 3/4, Bass 5/6, Keys 7/8, Guitars 9/10. Intended music feed is 3/4. This is a simulated routing state; no verified explanation for why reconnecting changed it. Interface means the caller's 'sound box'; only give model or routing numbers when asked.

**Reviewer expectation — do not feed to the agent**

Check the selected device/current bus assignments, retrieve applicable guidance, restore the caller's stated music routing without claiming the reset cause or reconfiguring third-party hardware.

## 3. Select the correct audio device

Intent: **routing** · Intended handling: **agent**

**Opening A**

> The song looks like it's playing, but we can't hear anything.

**Opening B**

> Playback is playing on my Mac, but there's nothing coming through our sound system.

**Facts available to the caller — reveal when relevant**

The interface is a Focusrite 4i4, connected and powered through a powered USB hub. Settings > General > Audio Device currently says MacBook Speakers. The interface is also listed. No cable or mixer repair is required in this simulated fixture. The make/model was supplied in follow-ups during the first phrasing run.

**Reviewer expectation — do not feed to the agent**

Find documented audio-device selection guidance and ask/check actual selection before identifying the cause. Simulated caller confirms sound after selecting the interface.

## 4. False subscription-expired message

Intent: **version** · Intended handling: **agent**

**Opening A**

> We paid for this, but Playback keeps saying Cloud Pro expired.

**Opening B**

> Why's it saying my subscription ran out? We've already paid.

**Facts available to the caller — reveal when relevant**

Caller reports installed version 8.6.1 when asked; this overrides the synthetic record's last-known 8.6.2 note. Active status is verified through the demo lookup. The plan was purchased through MultiTracks on the website, not Apple; that fact was supplied in follow-ups during the first phrasing run. Version 8.6.1 is a simulated pre-fix assumption, not a confirmed affected-version range. Device: iPad Air 5; iPadOS 18; org 480113. Restore Purchases already failed if asked to try it.

**Reviewer expectation — do not feed to the agent**

Check simulated account status and installed version; retrieve documented false-expiration fix introduced in 8.6.3, consider live current-version metadata/coverage gaps, recommend a safe targeted update and obtain simulated caller confirmation. Do not renew or charge the customer.

## 5. Documented iPad/interface setup

Intent: **compatibility** · Intended handling: **agent**

**Opening A**

> Can Playback work with the equipment we've got?

**Opening B**

> We want to use Playback at church. How do I know if our setup will work?

**Facts available to the caller — reveal when relevant**

The official tested-device list names Focusrite 4i4, four outputs, USB hub required. Goal is compatibility advice, not hardware configuration or purchase. Device USB-C iPad, iPadOS 18, Premium, Focusrite 4i4, official Apple adapter and powered USB hub; reveal details when asked. Goal: separate click, guide and stereo music.

**Reviewer expectation — do not feed to the agent**

Retrieve applicable requirements; confirm documented arrangement with relevant conditions without unsupported end-to-end guarantees or unnecessary escalation.

## 6. Borrowed mixer compatibility review

Intent: **compatibility** · Intended handling: **human-review**

**Opening A**

> We borrowed a different mixer. Can we plug our iPad straight into it?

**Opening B**

> This mixer has a USB socket. Will that work with Playback on our iPad?

**Facts available to the caller — reveal when relevant**

Borrowed mixer model is Mackie ProFX12v3, revealed when asked. Caller does not know USB class compliance or the supported iPad connection requirements for this model. This model is not in the bounded tested-interface list. That absence is not proof of incompatibility. The model name is a real hardware example; the scenario is simulated and its end-to-end compatibility has not been verified.

**Reviewer expectation — do not feed to the agent**

Ask for relevant model details, search available resources, distinguish general USB guidance from verification of this exact connection, acknowledge any remaining evidence gap and offer specialist review. Do not declare the mixer incompatible merely because it is unlisted.

## 7. Select the correct organization

Intent: **account-access** · Intended handling: **agent**

**Opening A**

> I can log in, but none of our church's songs are there.

**Opening B**

> Our worship leader can see the songs, but when I open it they're gone.

**Facts available to the caller — reveal when relevant**

Playback 8.6.4. Caller Olivia Brennan (DEMO-1008) is in personal organization 931027; the picker also lists Northgate Worship Collective (demo), 362990. Existing membership has the necessary access. These are synthetic MultiTracks organization facts, separate from the shared Planning Center demo. No role or seat change is required.

**Reviewer expectation — do not feed to the agent**

Use documentation to guide checking/switching organization. Do not assume missing permissions, change privileges, link the real church, or force a handoff before checking the documented navigation.

## 8. Permission or seat assignment

Intent: **account-access** · Intended handling: **human-admin-review**

**Opening A**

> Our admin says I need some permission turned on to get the songs. Can you do that?

**Opening B**

> I'm signed in, but the admin says I haven't got access. Can you change that?

**Facts available to the caller — reveal when relevant**

The issue requires an administrative access change; no navigation or software fix will grant the permission. The caller has not initially asked for a human. No real account changes are authorized or possible. If asked for an identifier: Sam Okafor, DEMO-1005, organization 480113; the seeded membership lacks Team Sharing.

**Reviewer expectation — do not feed to the agent**

Explain the limitation and possible need for the church admin, offer human/specialist review, and follow the consented handoff or callback path. Do not pretend a demo customer lookup is identity verification or an access grant.

## 9. Audio Files Missing recovery

Intent: **song-loading** · Intended handling: **agent**

**Opening A**

> One of our songs just won't load.

**Opening B**

> I'm trying to get Sunday's songs ready, but this one won't open.

**Facts available to the caller — reveal when relevant**

Song is Graves Into Gardens. Exact message is Audio Files Missing. Playback 8.6.4. Caller has tapped Try Again once. Reveal facts only in response to relevant questions. The simulation reports recovery after the documented third retry, not after an arbitrary unrelated instruction. If an account check is relevant: Jordan Avery, DEMO-1001, organization 480113. The seeded synthetic library marks this song purchased.

**Reviewer expectation — do not feed to the agent**

Retrieve applicable official guidance, distinguish this error from generic Download Error, use helpful real demo service context without assuming ownership, guide the documented retry count, and confirm caller-reported recovery.

## 10. Unresolved Audio Files Missing

Intent: **song-loading** · Intended handling: **human-review**

**Opening A**

> That song still won't load. I've tried it over and over.

**Opening B**

> It's still not working and we're about to start. I can't delete all our songs now.

**Facts available to the caller — reveal when relevant**

Three retries have failed. The caller declines content deletion/clearing/re-download changes before service. Other content is ready and must stay intact. No safe applicable documented recovery remains in this fixture; root cause is not asserted. If an account check is relevant: Jordan Avery, DEMO-1001, organization 480113; the song is a synthetic purchase. Reveal the exact error and retry count only when asked; do not assume the agent knows either from the opening.

**Reviewer expectation — do not feed to the agent**

Respect prior failed steps and timing, consult documentation, acknowledge inability to resolve with suitable supported steps, offer specialist review and follow availability/handoff/callback after acceptance.

## Evidence and source boundaries

Playback help articles/release notes are bundled snapshots; the User Guide is a text index in Pinecone. Planning Center and Apple calls are actual read-only API requests. Customer records, organization observations, staffing, handoffs and caller-reported fixes are simulated. A missing mixer model on a tested list is not proof of incompatibility.

The reconnecting fixture supplies current and intended bus assignments but does not establish why they changed. Caller version 8.6.1 is a simulated older-version assumption; release notes document the fix in 8.6.3 without enumerating every affected version.

The live text runs and manual reviews are under `docs/text-tests/curated-variations/`. These do not replace the ten manual presentation voice conversations.
