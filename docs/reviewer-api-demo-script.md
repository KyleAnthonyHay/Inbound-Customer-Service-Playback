# Demo call: "We paid, but it says expired"

A two-minute call that shows Penny looking up a church's account by its Organization ID, checking the live App Store version, and finding the release that fixes the problem. Everything is fictional; no Playback knowledge is needed.

Say each line when Penny asks for it. Wait for her to ask; don't offer the fix yourself.

| You say | What Penny should do |
| --- | --- |
| 1. "Playback on our iPad says our Cloud Pro expired, but we already paid for it." | Asks for your Organization ID, or suggests Restore Purchases. Either way, answer with line 2. |
| 2. "We paid on the MultiTracks website. I'm John Doe, and our Organization ID is 480113." | **Account lookup.** Finds Riverbend Community Church, says Cloud Pro is active and renews March 14, 2027, so you don't need to pay again. |
| If asked which organization the side menu shows: "It says Riverbend Community Church." | Confirms you're in the right, active organization. |
| 3. "It's Playback 8.6.1." (when asked for the version) | **Live version check.** Checks the current App Store release and finds that 8.6.3 fixed this false "expired" message. |
| 4. "iPadOS 18." (if asked) | Confirms your iPad can run the update and asks you to update, then tell her what happens. |
| 5. "I updated and the message is gone. Quick question: is Way Maker in our library?" | **Song library lookup.** Says Way Maker isn't in Riverbend's purchased library: Cloud Pro covers its click and guide, but the tracks need a purchase. Does not try to sell it to you. |
| 6. "No, that's everything. Thanks!" | Full goodbye, then hangs up. |

If she asks where to find something, say **"I'm not sure, where would I find that?"** and she will walk you through it.

## Try a second account (optional, 1 minute)

Call again with the same opening, but give **Organization ID 517204** (name **Priya Natarajan**). That church's Cloud Pro really did expire on September 2, 2026. Penny should say the message is accurate, that purchased songs still download, and offer billing help instead of an app update ("No thanks, I'll renew it myself" ends it). This shows the answer comes from the account, not from a script.

## What's real and what's simulated

- **Real:** the App Store version lookup, the Playback release notes and Help Center guide, and the reasoning across them.
- **Simulated:** the churches, subscriptions and song libraries (a fictional demo database), and the app update itself.

Evidence: this path is curated scenario 4, which was resolved and contained in the ten-call voice review ([results](call-reviews/curated-voice-results-2026-11-03/review.md)) and in both text runs of the [parallel text audit](text-tests/parallel-suite-2026-11-03/review.md). Three text checks of this exact script passed (two main runs, one second-account run): [review](text-tests/reviewer-api-demo-2026-11-03/review.md). The song-recovery and Planning Center demo is still available in [reviewer-demo-script.md](reviewer-demo-script.md).
