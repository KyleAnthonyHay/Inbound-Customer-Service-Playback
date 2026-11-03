# Demo call: "We paid, but it says expired"

A two-minute call that shows Penny looking up a church's account by its Organization ID, checking the live App Store version, and finding the release that fixes the problem. Everything is fictional; no Playback knowledge is needed.

Say each line when Penny asks for it. Wait for her to ask; don't offer the fix yourself.

| You say | What Penny should do |
| --- | --- |
| 1. "Playback on our iPad says our Cloud Pro expired, but we already paid for it." | Asks what you see or how you paid. |
| 2. "We paid on the MultiTracks website. I'm John Doe, and our Organization ID is 480113." | **Account lookup.** Finds Riverbend Community Church, says Cloud Pro is active and renews March 14, 2027, so you don't need to pay again. |
| 3. "It's Playback 8.6.1." (when asked for the version) | **Live version check.** Sees 8.6.4 is current on the App Store and that 8.6.3 fixed this false "expired" message. |
| 4. "iPadOS 18." (if asked) | Confirms your iPad can run the update and asks you to update, then tell her what happens. |
| 5. "I updated and the message is gone. Quick question: is Way Maker in our library?" | **Song library lookup.** Says Riverbend hasn't bought Way Maker (it has songs like Graves Into Gardens and Goodness of God). Does not offer to buy it for you. |
| 6. "No, that's everything. Thanks!" | Full goodbye, then hangs up. |

If she asks where to find something, say **"I'm not sure, where would I find that?"** and she will walk you through it.

## Try a second account (optional, 1 minute)

Call again with the same opening, but give **Organization ID 517204** (name **Priya Natarajan**). That church's Cloud Pro really did expire on September 2, 2026. Penny should say so plainly and not tell you to update the app. This shows the answer comes from the account, not from a script.

## What's real and what's simulated

- **Real:** the App Store version lookup, the Playback release notes and Help Center guide, and the reasoning across them.
- **Simulated:** the churches, subscriptions and song libraries (a fictional demo database), and the app update itself.

Evidence: this path is curated scenario 4, which was resolved and contained in the ten-call voice review ([results](call-reviews/curated-voice-results-2026-11-03/review.md)) and in both text runs of the [parallel text audit](text-tests/parallel-suite-2026-11-03/review.md). Text checks of this exact script are in [text-tests/reviewer-api-demo-2026-11-03](text-tests/reviewer-api-demo-2026-11-03/). The song-recovery and Planning Center demo is still available in [reviewer-demo-script.md](reviewer-demo-script.md).
