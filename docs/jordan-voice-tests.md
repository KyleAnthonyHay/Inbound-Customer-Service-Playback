# Jordan’s 10 test calls

Open [the dev phone](http://localhost:3000/call). New call for each test. **Read only “Say.” Give the facts when asked.** These are fictional scenarios; fixes are simulated by your replies.

## Audio routing

| Scenario | Say | Facts — only when asked | Success |
|---|---|---|---|
| **1. Click and guide together** | “I can't turn down my guide without changing the click.” | **Device:** Mac. **Playback:** 8.6.2. **Plan:** Premium. **Interface:** Focusrite 4i4. **Where:** same channel in our in-ears, not the app's volume sliders. **Buses:** Click → 1; Guide → 1; music → 3/4. | **Agent resolves:** Guides you to **Buses**; leave Click on **1**, change Guide to **2**. Asks if that separated them. Say **“Yes, that worked.”** |
| **2. Channels changed after reconnecting** | “I plugged our sound box back in. Now the music is coming out all over the place.” | **Device:** Mac. **Playback:** 8.6.4. **Plan:** Premium. **Interface / selected Audio Device:** PlayAUDIO12. **Buses now:** Drums → 3/4; Bass → 5/6; Keys → 7/8; Guitars → 9/10. **Wanted:** all music → 3/4; Click → 1; Guide → 2. | **Agent resolves:** Guides you to send **all music to 3/4**, leaving Click on 1 and Guide on 2. Checks the result. Say **“It's back to normal.”** |
| **3. No sound** | “The song looks like it's playing, but we can't hear anything.” | **Device:** Mac. **Playback:** 8.6.4. **Interface:** Focusrite 4i4, connected through powered hub. **Selected Audio Device:** MacBook Speakers. **Also listed:** Focusrite 4i4. | **Agent resolves:** Tells you to change **Audio Device from MacBook Speakers to Focusrite 4i4**. Checks the result. Say **“We can hear it now.”** |

## App version

| Scenario | Say | Facts — only when asked | Success |
|---|---|---|---|
| **4. Paid subscription says expired** | “We've paid, but Playback says Cloud Pro expired.” | **Device:** iPad Air 5. **Playback:** **8.6.1**. **iPadOS:** **18**. **Name:** Jordan Avery. **Organization ID:** **480113**. **Selected org:** Riverbend Community Church. **Purchase:** MultiTracks website. **Restore Purchases:** already tried; didn't help. | **Agent resolves:** Finds the **8.6.3 subscription-warning fix**, checks version/OS and suggests updating without promising a cure. After that step, say **“The warning's gone.”** It confirms recovery. |

## Setup compatibility

| Scenario | Say | Facts — only when asked | Success |
|---|---|---|---|
| **5. Documented equipment** | “Can Playback work with the equipment we've got?” | **Device:** USB-C iPad. **iPadOS:** 18. **Playback:** 8.6.4. **Plan:** Premium. **Interface:** Focusrite 4i4. **Connection:** Apple adapter + powered USB hub. **Goal:** separate click, separate guide, stereo music. | **Agent resolves:** Checks documentation and explains that this is a documented four-output setup, with its adapter/hub and Premium requirements. No unnecessary handoff. |
| **6. Borrowed mixer** | “We borrowed a mixer. Can we plug our iPad straight into it?” | **Device:** USB-C iPad. **Playback:** 8.6.4. **Mixer:** Mackie ProFX12v3. **Other USB details:** “I don't know.” | **Human review:** If it cannot verify that connection, explains the uncertainty and **offers a specialist**. Does not declare it incompatible just because it is unlisted. Accept the offer. |

## Account access

| Scenario | Say | Facts — only when asked | Success |
|---|---|---|---|
| **7. Wrong organization selected** | “I can log in, but our church's songs aren't there.” | **Device:** iPad. **Playback:** 8.6.4. **Name:** Olivia Brennan. **Customer ID:** DEMO-1008. **Selected org:** personal, **931027**. **Other listed org:** Northgate Worship Collective, **362990**. | **Agent resolves:** Guides you to **switch from the personal organization to Northgate**. Checks the library. Say **“The songs are there now.”** |
| **8. Missing permission** | “Our admin says I need a permission turned on. Can you do that?” | **Name:** Sam Okafor. **Customer ID:** DEMO-1005. **Organization ID:** **480113**, already selected. **Admin confirmed:** Team Sharing permission is missing. | **Human review:** Explains that an **admin must grant access**, offers human help and follows the accepted handoff/callback. Does not claim it changed the permission. |

## Song loading

| Scenario | Say | Facts — only when asked | Success |
|---|---|---|---|
| **9. Retry recovers the song** | “One of our songs won't load.” | **Device:** iPad. **Playback:** 8.6.4. **Song:** Graves Into Gardens. **Error:** Audio Files Missing. **Try Again:** pressed once. **Account:** Jordan Avery; org **480113**. | **Agent resolves:** Finds the documented retry procedure: **two more Try Again taps, reaching three total**. Only then say **“It loaded.”** It confirms recovery. |
| **10. Retries fail** | “That song still won't load. We're about to start.” | **Device:** iPad. **Playback:** 8.6.4. **Song:** Graves Into Gardens. **Error:** Audio Files Missing. **Try Again:** three attempts failed. **Limit:** cannot delete downloads before service. **Account:** Jordan Avery; org **480113**. | **Human review:** Respects failed retries and your limit; **offers a specialist** when no supported step remains. Accept the offer. |

**Every call:** questions should be simple, one at a time, without repeated “one moment” lines. Finish with **“No, that's everything.”** Success includes the call actually disconnecting.

**Human help:** transfers are simulated. If nobody is available, give **“Tomorrow, 11 AM Eastern; +1 202-555-0123.”** Accept an offered alternative if needed; confirm the details. Success is a completed simulated handoff or a confirmed callback, not just checking availability.
