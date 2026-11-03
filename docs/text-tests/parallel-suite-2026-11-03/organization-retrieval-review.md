# Focused organization retrieval retest

Two fresh development text conversations, one for each unchanged case07 opening, after the category hard filter became a small preference. Both achieved documented self-service organization switching with novice caller replies and no caller-supplied diagnosis or navigation hint. The original final07v1 miss remains unchanged in its original run/report.

| Run | Turns | Reported inference cost | Outcome |
| --- | ---: | ---: | --- |
| 07 organization v1 | 5 | $0.1664 | Asked how to check organization, received side-menu navigation, selected Northgate only after agent instructed switching, reported songs appeared, then `endCall` and full farewell. |
| 07 organization v2 | 5 | $0.1260 | Agent proactively directed the side-menu check; caller read Personal account and the picker choices; agent guided Northgate selection, songs appeared, then `endCall` and full farewell. |

**Total: $0.2924**, ten caller turns, five tool calls (three documentation searches, two `endCall`). Text POC only: this does not verify Live speaker behavior, audio, or real voice disconnection.

## What changed in observed retrieval

v1 initially searched:

`Playback signed in but organization's songs do not appear, worship leader can see songs; organization selection and membership library troubleshooting` with category `song-loading`.

This returned other cross-category KB matches; it did not immediately expose Side Menu. The agent asked what organization was selected, and the caller naturally asked where to find it. Its next search was:

`Playback how to see selected organization or change organization after sign in organization selection screen` with category `setup`.

That result now included `playback-user-guide` categorized **general**, despite the `setup` category hint. Its ninth source step explicitly gives the side menu/stack icon, organization name and ID, and Switch Organizations. The agent then said:

> “Open the side menu using the stack icon at the top right; your organization name appears there near your name. What name do you see?”

After the caller read “Personal account,” it instructed “Tap Switch Organizations in that same menu and select your church’s organization.” Only after that did the role-player report selecting the existing Northgate organization and seeing the songs.

v2's first query was `Playback songs missing after login select organization or switch organization library` without a category. It returned `playback-user-guide` first. The agent immediately asked what organization appeared in the side menu, guided Switch Organizations, and then explicitly chose Northgate from the caller-read picker choices. No membership/permission changes, account privilege claims, unnecessary specialist handoff, or Planning Center lookup occurred.

These two fresh phrasings show that the documented navigation was reachable and used. They do not establish a universal success rate or isolate all nondeterminism; the first v1 search still required a useful follow-up search.

## Conversation quality, ending and cleanup

Neither text reply stream contains a platform holding prefix or duplicate standalone acknowledgment. Both asked whether anything else was needed after reported recovery, accepted the caller's “No, that's everything. Thank you!”, invoked `endCall`, and returned exactly one complete closing:

> “Thanks so much for calling MultiTracks Playback support. Have a great day, and goodbye!”

Both runs are `done: true` and `cleanupComplete: true`. No callback/handoff tool was called; a development DB query found no callback belonging to either generated test ID. No booking teardown was necessary. `organization-retrieval-retest/cleanup-proof.json` saves all matching frozen source hashes, cleanup flags and cost. Shared source, fixtures, backend, saved assistant, production and voice were not modified by this reviewer.

Frozen configuration hash: `06688e6268e1a4af04bb6377bd61a3450e16a904271ba88f8baeab07162e3e1f`. All eleven owning source files matched `organization-retrieval-config.json` at completion. Cohort is fully stopped, with no additional conversations planned by this reviewer.
