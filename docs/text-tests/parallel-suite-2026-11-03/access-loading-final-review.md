# Access and loading: final combined candidate text POC

Eight independent development text conversations, both openings of curated cases 7–10. This is adaptive novice role-play with private caller facts, not voice evidence. No voice calls, production changes, shared-source edits, or assistant changes were made by this reviewer. Source was frozen for the cohort; `final-access-loading/cleanup-proof.json` records the hashes and teardown.

**Seven conversations reached their intended support outcome; one safely offered a specialist but missed a documented self-service fix.** The miss is retained unchanged. All eight are stopped and their isolated tool logs removed. Reported inference cost: **$1.3603** across 47 caller turns and 33 tool calls. Configuration hash: `63e891d2c9181d1e1bf764004cc9b8055476121519452c2c024533d3a1a32dc2`.

| Run | Turns | Reported cost | Actual outcome |
| --- | ---: | ---: | --- |
| 07 organization v1 | 3 | $0.0819 | Self-service target missed; safe specialist offer after retrieval failed to expose Side Menu instructions. Stopped without coaching. |
| 07 organization v2 | 5 | $0.1451 | Guided Side Menu → Switch Organizations → Northgate; caller reported church songs appeared; `endCall` and branded farewell. |
| 08 permission v1 | 7 | $0.1997 | Used caller-provided admin diagnosis of missing Team Sharing; offered specialist review; consented callback booked and confirmed. No invented account lookup. |
| 08 permission v2 | 6 | $0.1864 | Named customer lookup verified active organization/missing Team Sharing; explained admin action, offered review; callback booked and confirmed. |
| 09 recovery v1 | 5 | $0.1348 | Explicit prior retry counted: instructed two more; caller reported third total succeeded. Reused Planning Center context to answer remaining songs; `endCall`. |
| 09 recovery v2 | 5 | $0.1303 | Exact error elicited, documented three-attempt recovery instructed; caller's private prior attempt plus two additional attempts reached success. Reused plan; `endCall`. |
| 10 unresolved v1 | 7 | $0.2262 | Three retries exhausted; recent-download condition unknown; no applicable safe next action, offered review; consented callback booked and confirmed. |
| 10 unresolved v2 | 9 | $0.2559 | Elicited exact error and already-three-failed retries; preserved genuine unknown about recent download; review/callback completed with collected name and number. |

## Retained organization retrieval miss

07v1 first asked whether songs were missing from the whole Library. After that was confirmed it asked which organization was selected at sign-in. The caller could not find the current selection and asked where to look. Its final response was:

> “Playback shows the organization choice during sign-in, and I can’t verify a documented place to view it after you’re already in. Would you like me to connect you with a specialist to help confirm the church organization and your content access?”

This is a conservative fallback, not unsafe navigation. It does not satisfy the self-service target: the bounded source does document how to inspect and switch organizations after sign-in. It is not a completed handoff or a resolved call. No caller hint about the side menu was injected.

The two actual tool queries were:

1. `Playback signed in but church songs are not showing while another team member can see them; organization selection and permissions`, category `song-loading`.
2. `Playback check selected organization when organization Library is empty and purchased songs missing; Settings About organization`, category `setup`.

The second response had **zero KB articles** and three manual chunks about permissions, the sign-in organization picker and the initial empty setlist. It omitted the Side Menu chunk. `found: 3` is the combined KB/manual count and must not be mistaken for three KB matches. The first search likewise lacked Side Menu instructions.

Read-only diagnosis in `final-access-loading/organization-retrieval-proof.json` reproduces the gap: `searchDocs` hard-filters `article.category`, while the bounded KB has **zero `setup` articles**. The master `playback-user-guide` is categorized `general` and explicitly states: “Side menu (stack icon) shows user name, organization name and ID, Switch Organizations, and Log Out.” Removing the category filter for the same query returns this guide first. By contrast, the manual search already treats category as a preference. A slightly different 07v2 query happened to retrieve the correct Side Menu manual chunk and its behavior was grounded.

Smallest general improvement: keep relevance matching across KB categories and apply the requested category as a small ranking preference, consistent with manual retrieval. Describe category as a hint in tool metadata. Preserve version/platform applicability checks. This fixes a taxonomy exclusion, rather than teaching a case-specific navigation script. Parent will decide and run a focused fresh pair after this frozen round; no implementation change is included here.

## Access, recovery and API behavior

Both 08 variants explained the real admin boundary and proactively offered a concrete human review option. v1 used the caller's actual admin message and did not pretend to have verified the account independently; v2 used `lookup_demo_customer({orgId:"480113",name:"Sam Okafor"})`. Neither claimed app settings could enable restricted account permission. A callback is an escalation outcome, not confirmation that the locked songs were repaired.

Both 10 variants asked whether the song was a recent download in a past setlist. The caller genuinely did not know. The agent did not repurpose generic Download Error key-change/remove-readd procedures for Audio Files Missing, or insist on deleting downloads before service. v1 said: “Without knowing that, I can’t safely suggest the next recovery because it deletes all local setlists and downloads.” v2 offered review “Since we can’t verify whether the safe next recovery applies.” No unperformed recovery was reported as successful. v2's song title was not volunteered by the caller and the booking appropriately summarized the known error rather than inventing a title.

Both 09 variants retrieved the connected Planning Center service once, before recovery, and reused it when the caller later asked about Sunday's other songs. Answers correctly named **Do It Again in B-flat** and **What A Beautiful Name in D**. The agent-facing result contains the organization name plus namespace, service metadata, and song metadata, with provider organization/service/song/item IDs removed. Neither trace calls a customer/rights/access lookup, avoiding the prior round's Planning Center ID → MultiTracks Organization ID confusion. This is evidence for these two text traces, not a guarantee across all future phrasings.

09v2 initially did not state how many retries had already occurred. The agent said “tap Try Again three times”; the role-player's private prior attempt and two guided additional attempts reached the scripted third-total success. It did not force an additional retry after the song opened. That is less count-specific than v1 but does not undermine the observed recovery.

## Consent, endings and cleanup

All four callbacks followed `check_team_availability` → unavailable → `get_callback_slots` → complete date/time/zone/number proposal → explicit caller approval → `reserve_callback` → `endCall`. Proposals used “Shall I book,” not an assertion that the reservation already existed. v1 collected both names/numbers; 08v2 reused the known name, and 10v2 explicitly collected it. Final `endCall.speak` included the DB-backed confirmed local time and one full branded farewell. Example:

> “Your demo callback is confirmed for Wed, Nov 4, 1:30 PM EST. Thanks so much for calling MultiTracks Playback support. Have a great day, and goodbye!”

The ordinary resolved calls also invoked `endCall` and produced one complete branded farewell. No platform default holding prefixes or duplicate standalone acknowledgments appear in the observed text replies. Text cannot establish spoken wording, duplicate Live speaker messages, audio timing, or actual voice disconnection.

The four successful reservations were verified against actual development callback rows, then only this cohort's eight generated `text-poc` IDs were passed to the guarded admin teardown. **Four own callback rows removed, all four exact slots verified open again, no own callbacks remain.** No other cohort's bookings were removed. All eight own tool logs were marked cleaned. Full proof and all frozen source checks are in `final-access-loading/cleanup-proof.json`.
