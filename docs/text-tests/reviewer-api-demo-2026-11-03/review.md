# Text checks: reviewer API demo script (2026-11-03)

Text only, no voice calls. Script: [reviewer-api-demo-script.md](../../reviewer-api-demo-script.md), suite: `scripts/text-cases/reviewer-api-demo.json`, code at `23051c0` on dev against the deployed development tools. The caller used the script lines exactly. The one exception: when Penny asked about something the script doesn't cover, the caller answered briefly in character.

| Run | Turns | Result | Reported cost |
| --- | --- | --- | --- |
| [false-expired, run 1](reviewer-api-false-expired-v1.json) | 6 | Pass, one deviation on turn 1 | $0.21 |
| [false-expired, run 2](../reviewer-api-demo-2026-11-03-run2/reviewer-api-false-expired-v1.json) | 8 | Pass, two extra turns | $0.25 |
| [really-expired contrast](reviewer-api-really-expired-v1.json) | 4 | Pass | $0.08 |

All three cleaned up their test records (`cleanupComplete: true`).

## False-expired, run 1

Tools: `search_playback_docs` → `lookup_demo_customer {orgId 480113, name John Doe}` (active Cloud Pro, renews 2027-03-14) → `get_relevant_changes_since_version {8.6.1, iPadOS}` (live App Store current 8.6.4; 8.6.3 fixes the false expired message) → same tool again with `osVersion 18` → `check_song_access {Way Maker, 480113}` (click-guide-only, not purchased) → `endCall`.

| Script row | Happened? |
| --- | --- |
| 1. Asks what you see or how you paid | **No.** Penny searched the docs and told the caller to tap Restore Purchases (an Apple in-app step) before asking how they paid. The caller's line 2 still fit as the answer. |
| 2. Account lookup: Riverbend active, renews Mar 14 2027, no need to pay again | Yes. Said active through March 14, 2027 and "this isn't a payment expiration". Didn't name Riverbend at this point. No email asked. |
| 3. Live version check: 8.6.4 current, 8.6.3 fixed it | Partly. Cited the 8.6.3 fix. The tool fetched 8.6.4 live from the App Store, but Penny didn't say the number. |
| 4. Confirms iPad can run it, asks to update and report back | Yes. |
| 5. Way Maker not purchased, no offer to buy | Yes. Explained that the tracks need a purchase without offering to sell them. Did not list owned songs (see note below). |
| 6. Full goodbye, hang up | Yes, branded goodbye and `endCall`. |

## False-expired, run 2 (stability)

Tools: `lookup_demo_customer {480113, John Doe}` + `search_playback_docs` → `get_relevant_changes_since_version` ×2 (second with `osVersion 18`) → `check_song_access {Way Maker, 480113}` → `endCall`.

| Script row | Happened? |
| --- | --- |
| 1 | Yes. Asked for the Organization ID to check the subscription. |
| 2 | Yes, active through March 14, 2027. **Then asked an off-script question:** which organization name shows in the side menu. The caller said "I'm not sure, where would I find that?". Penny explained where to look, and the caller answered "It says Riverbend Community Church." Penny confirmed it was the active organization. This added 2 turns. |
| 3 | Partly. Cited the 8.6.3 fix but didn't say the current version is 8.6.4. Asked for iPadOS before recommending the update. |
| 4 | Yes. Walked the caller to Settings > General > About. |
| 5 | Yes. Said "isn't in Riverbend's purchased library" and that the tracks need a purchase or rental. Didn't offer to sell them. |
| 6 | Yes. |

## Really-expired contrast

Turn 1: asked for the Organization ID. Turn 2: `lookup_demo_customer {517204, Priya Natarajan}` (expired 2026-09-02). Penny said the plan expired on September 2 and the message is accurate, that purchased songs still download, and offered to connect billing. She **did not** suggest an app update. The caller declined billing; Penny asked "anything else?", then gave the goodbye with `endCall`. This matches `scriptedOutcome`.

## Deviations and notes for the script

- **Row 1 isn't stable:** run 1 opened with Restore Purchases, run 2 asked for the Organization ID. Neither run asked "how did you pay". Line 2 worked as the answer in both runs.
- **Row 2 detour (run 2):** Penny asked the caller to confirm the organization name in the side menu. The demo script has no line for that. Consider adding "It says Riverbend Community Church" as an optional line.
- **Row 3:** Penny never says "8.6.4" out loud in either run, even though the tool returned it live. The demo's live-API moment comes across as the 8.6.3 fix, not the current version number.
- **Row 5:** the script says Penny will mention songs like Graves Into Gardens and Goodness of God. `check_song_access` for Way Maker doesn't return the owned songs, so she can't mention them. Remove that parenthetical or change the tool.
- Penny never asked for an email in any run, always called `check_song_access`, and never offered to buy.
