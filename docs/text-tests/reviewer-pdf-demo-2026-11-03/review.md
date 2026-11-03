# Reviewer PDF demo script: text checks (2026-11-03)

Dev deployment after f4a0f60 (release check no longer needs the iPadOS version). Two text runs of `scripts/text-cases/reviewer-pdf-demo.json`; run 2 is in `../reviewer-pdf-demo-2026-11-03-run2`. Both cleaned up and ended with the branded goodbye.

## Run 1 (8 turns)

Questions Penny asked, in order:
1. What six-digit Organization ID do you see in Playback's Settings under About?
2. After tapping Restore Purchases, does the expired message clear?
3. What Playback version number is listed at the bottom of About? (repeated with directions after "How do I navigate to that area?")
4. Is there anything else I can help you with today? (asked again after the Way Maker answer)

Asked for the iPadOS version: **no**. Update advised right after 8.6.1.

Tools: lookup_demo_customer (480113, Cloud Pro active), search_playback_docs, get_relevant_changes_since_version (8.6.1 → 8.6.3 fix; `missingInformation: []`, `prerequisitesComplete: true`, OS check deferred), check_song_access (Way Maker: click-guide-only), get_planning_center_service_context, endCall.

## Run 2 (9 turns)

Questions Penny asked, in order:
1. What's the six-digit Organization ID shown in Playback Settings under About?
2. What's the exact wording of the expiration message on the iPad?
3. What organization name is shown under the user name in the side menu? (repeated with directions after "How do I navigate to that area?")
4. What Playback version is shown at the bottom of Settings > About?
5. Is there anything else I can help you with today?

Asked for the iPadOS version: **no**. Restore Purchases was not suggested in this run.

Tools: lookup_demo_customer, search_playback_docs, get_relevant_changes_since_version (same assessment as run 1), get_planning_center_service_context, check_song_access, endCall.

Note: in run 2 the Way Maker answer did not end with "anything else?"; the caller closed anyway.
