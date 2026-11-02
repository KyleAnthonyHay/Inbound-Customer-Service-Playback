# Ten natural test conversations

Use the **opening only** to start. Everything else is private background, not a speech to read out. Answer the question actually asked, in your own words. If you don’t know a technical term or where a setting is, ask for help finding it. Don’t invent unlisted settings or output numbers.

The outcomes below are targets to evaluate, not answers to feed the agent. These are fictional scenarios; reported fixes are simulated. Jordan’s [quick try-out](jordan-voice-tests.md) remains separate.

## Audio routing

### 1. The voice and ticking change together

**Start:** “In our ears, when I turn down the talking, the ticking changes too.”

**Background:** You mean the sound desk, not the app’s volume sliders. You use a Mac and a Focusrite 4i4. You want to adjust the spoken cues separately.

**Read if guided:** Playback **8.6.2**; Premium. In **Buses**, Click shows **1** and Guide shows **1**. Outputs 1 and 2 feed separate desk channels; music uses 3/4.

**Success:** It discovers the shared output and guides **Guide → 2, Click stays 1**, then checks whether you can change them separately. Only after that change, report that it works.

### 2. Reconnecting scattered the music

**Start:** “I unplugged the box we use for sound and put it back. Now everything’s in the wrong place.”

**Background:** You use a Mac. The music used to arrive together on desk channels **3/4**; now instruments arrive separately. The band’s ticking and spoken cues should stay separate from the music.

**Read if guided:** Sound box / selected Audio Device: **PlayAUDIO12**. Playback **8.6.4**; Premium. Buses: Drums **3/4**, Bass **5/6**, Keys **7/8**, Guitars **9/10**; Click **1**, Guide **2**.

**Success:** It guides all the music back to **3/4**, leaving Click 1 and Guide 2. Drums is already correct. Report normal sound only after the other music rows are corrected.

### 3. Playing on screen, no sound

**Start:** “It’s doing its thing on the screen, but we can’t hear anything.”

**Background:** You use a Mac connected through a small USB sound box to the sound system. You don’t know what an “audio interface” means.

**Read if guided:** Box label: **Focusrite 4i4**. Playback **8.6.4**. **Audio Device** shows **MacBook Speakers**; Focusrite 4i4 is also listed. The box is powered and connected.

**Success:** It helps change **MacBook Speakers → Focusrite 4i4**. After that instruction, report that sound returns. It checks your result.

## Subscription / app version

### 4. Paid, but the app says expired

**Start:** “We paid for this. Why’s it asking me to pay again?”

**Background:** You use an iPad and paid through the MultiTracks website. Restore Purchases already failed. Your name is **Jordan Avery**.

**Read if guided:** Warning: **Cloud Pro expired**. Organization **480113**, Riverbend Community Church. Playback **8.6.1**; iPad Air 5; iPadOS **18**. You don’t remember versions from memory—let the agent help you find them.

**Success:** It verifies the simulated active subscription, investigates version, finds the **8.6.3 false-warning fix**, checks update requirements and suggests an update as an attempt. After that supported update, report the warning gone. It checks recovery rather than asking you to pay again.

## Equipment / compatibility

### 5. Can we use our equipment?

**Start:** “We’ve got an iPad and one of those little sound boxes. We want to use tracks at church.”

**Background:** You want the band to hear the ticking and voice telling them what comes next; the audience should hear music. You’re checking the idea, not asking for a setup walkthrough.

**Read if guided:** Box label: **Focusrite 4i4**. iPad connector: **USB-C**. Accessories: Apple adapter and powered USB hub. Plan: Premium. Playback **8.6.4**; iPadOS **18**.

**Success:** It clarifies your listening goal and explains the documented capability and relevant conditions. You don’t need to pretend to change settings. Once answered, respond naturally; it should check whether you need anything else.

### 6. Borrowed mixer, uncertain connection

**Start:** “We’ve borrowed a different mixer. Can we plug our iPad into it?”

**Background:** You want band-only counting/spoken cues and music for the room. You can read a model label, but can’t work out advanced USB requirements. If the discussion becomes too technical, say you’re not comfortable figuring out the connections yourself.

**Read if guided:** Mixer: **Mackie ProFX12v3**. iPad connector: **USB-C**. Other compatibility details are genuinely unknown.

**Success:** It explains what it cannot verify and offers a specialist, without declaring the mixer incompatible or pushing different equipment. Accept the offer. If offered a callback, use **tomorrow, 11 AM Eastern; +1 202-555-0123** (fictional), and confirm the read-back.

## Account access

### 7. Church songs are missing

**Start:** “I can get in, but none of our church’s songs are there.”

**Background:** Your name is **Olivia Brennan**. The worship leader can see the songs with your existing membership. You don’t know what “organization selection” means.

**Read if guided:** iPad; Playback **8.6.4**. Selected account: **personal, 931027**. The picker also lists **Northgate Worship Collective, 362990**. Customer ID if needed: **DEMO-1008**.

**Success:** It helps switch from the personal account to **Northgate** and asks whether the songs appear. Report them visible after the switch; no permission change is needed.

### 8. An admin permission is missing

**Start:** “I can get in, but the church’s songs are locked for me.”

**Background:** Your name is **Sam Okafor**. The admin checked that the church account is correct and said **Team Sharing needs enabling** for you. Mention that history when relevant; don’t diagnose an app defect.

**Read if guided:** Organization **480113**; customer ID **DEMO-1005**. Device/version information is not needed to grant permission.

**Success:** It explains that an admin must change access, offers human help and waits for acceptance. It must not claim it enabled permission. If offered a callback, use **tomorrow, 11 AM Eastern; +1 202-555-0123** (fictional), and confirm the details.

## Song loading

### 9. Retry gets the song open

**Start:** “One of Sunday’s songs just won’t open.”

**Background:** You use an iPad. The song is **Graves Into Gardens**. You’ve pressed the retry button **once**, but don’t know the recovery procedure.

**Read if guided:** Error: **Audio Files Missing**. Playback **8.6.4**. Account if relevant: Jordan Avery, organization **480113**.

**Success:** It finds the documented procedure and guides **two more Try Again attempts, three total**. Before the third total attempt it still fails; after the third, report that it opens. It checks the result.

### 10. Retries failed; don’t risk ready songs

**Start:** “My song still won’t open. I’ve tried again a few times.”

**Background:** You use an iPad. **Graves Into Gardens** has failed after **three retries**. If removing content comes up, explain that service is starting and you can’t risk your ready downloads.

**Read if guided:** Error: **Audio Files Missing**. Playback **8.6.4**; iPadOS **18**. Account if relevant: Jordan Avery, organization **480113**.

**Success:** It respects the failed attempts and your limit, offers a specialist when no suitable supported step remains, and follows your acceptance. Don’t report an invented fix. If offered a callback, use **tomorrow, 11 AM Eastern; +1 202-555-0123** (fictional), then confirm the details.

---

**Every normal completion:** the agent checks whether you need anything else and waits. Finish naturally when you’re done; no exact sign-off wording is required. The call should actually disconnect. Text tests cannot prove that final voice behavior.

**Every human outcome:** a completed simulated handoff or confirmed callback is success; an availability check alone is not. Transfers do not reach real staff.
