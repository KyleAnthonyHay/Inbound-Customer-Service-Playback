# Baseline review: account access and song loading

Eight independent **text reasoner POCs**, two openings for each of cases 7–10, under one frozen configuration. The existing `text:cases` harness was used without code, prompt, backend, saved-assistant or production changes. No voice sessions were created. Reviewer expectations stayed outside the conversation; caller follow-ups used the predeclared private facts, readable settings and genuine unknowns.

All eight runs were finished or deliberately stopped with `done: true`, and all eight isolated tool logs were cleaned. Reported text model cost: **$1.3670**. Configuration hash: `3fd1aec2c32f7231b7cf032f5f5d76772c9b999bc4cbf94bf47e589a04fd941a`.

## Outcomes

| Run | Assessment | Actual behavior | Turns | Reported cost |
|---|---|---|---:|---:|
| [07 organization v1](baseline-access-loading/07-organization-v1.json) | Pass | Asked which organization was selected; after Personal account, guided the documented side-menu organization switch. Caller reported church songs appearing only after selecting Northgate. Further-help check, caller decline and endCall followed. | 4 | $0.0964 |
| [07 organization v2](baseline-access-loading/07-organization-v2.json) | Pass | Began with a Library observation, then organization selection. When the novice did not know where to find the organization, retrieved and explained the side menu, guided selecting Northgate, and obtained simulated recovery confirmation. Normal text closing followed. | 7 | $0.1987 |
| [08 permission v1](baseline-access-loading/08-permission-v1.json) | Tool/action flow passed; callback wording qualified | Explained admin-controlled Team Sharing, offered specialist help after caller repeated the admin message, checked unavailable team, looked up the requested callback, collected number and name, performed full readback and obtained approval, then successfully reserved and called endCall. Pre-approval wording and final spoken confirmation need attention (below). | 9 | $0.2418 |
| [08 permission v2](baseline-access-loading/08-permission-v2.json) | Correct diagnosis/admin referral; proactive review target unmet | Used the known name after the fixture had no email available, retrieved Sam's actual simulated missing-Team-Sharing membership, and accurately referred permission enabling to the church admin. After “I can't change that myself,” it repeated the limitation and moved to further-help/closing without offering specialist review. No permission grant, app-repair claim, transfer or callback was fabricated. This is safe admin guidance, not a completed handoff or resolution. | 6 | $0.1548 |
| [09 recovery v1](baseline-access-loading/09-loading-recovery-v1.json) | Pass | Used the opening's prior single retry and exact Audio Files Missing message, guided the remaining two attempts, and received fictional recovery only afterward. The caller then requested other Sunday plan songs; agent answered Do It Again / What A Beautiful Name (with returned keys), reusing the one earlier Planning Center result. endCall followed explicit caller completion. | 5 | $0.1313 |
| [09 recovery v2](baseline-access-loading/09-loading-recovery-v2.json) | Pass, minor efficiency note | Clarified song and error after a vague opening, then guided the documented three-attempt recovery. Caller reported the first additional retry failing and the next succeeding, consistent with the private total-three fixture. Plan follow-up reused retrieved metadata and normal closing followed. It did not establish the earlier retry count before giving the general three-try instruction; the clear-opening variant handled that more precisely. | 6 | $0.1496 |
| [10 unresolved v1](baseline-access-loading/10-loading-unresolved-v1.json) | Material applicability failure; stopped | Despite Audio Files Missing and three failed retries, prescribed generic Download Error remove/re-add and then alternate-key recovery. The caller declined deletion with the predeclared service/download constraint. No suitable supported recovery or specialist offer emerged by the clear second wrong-branch instruction, so the run was stopped without coaching it toward the expected escalation or claiming recovery. | 5 | $0.1323 |
| [10 unresolved v2](baseline-access-loading/10-loading-unresolved-v2.json) | Pass for appropriate escalation | After confirming the exact message and three failed attempts, asked about the source-stated recent-download condition. The caller genuinely did not know. Agent avoided the unverified delete-all step, offered specialist review, checked availability, then performed callback preference/contact collection, full readback and explicit approval. Successful reserve_callback and endCall followed, with returned local time confirmation. | 9 | $0.2621 |

“Pass” describes the stated text support/tool objective. It does not establish audio, speaker delegation, actual device repair or disconnection. The blocked permission and unresolved loading cases remain unresolved issues even when escalation is correctly handled; they are not containments.

## Concrete findings

### Error-section conditions are lost in flat retrieval

Case 10 v1's actual replies:

> “Since the other songs are ready, remove and re-add only Graves Into Gardens: tap Edit, tap its red minus, then Add Song, find it again, and load it.”

After the caller declined download changes before service:

> “Leave the existing downloads alone; try loading Graves Into Gardens in a different key first, then change it back to your needed key after it downloads.”

The retrieved download-errors article lists these generic Download Error procedures near the Audio Files Missing instructions. For Audio Files Missing, the three-retry step and the conditional recent-download/delete-all step have different applicability. The model crossed those section boundaries. It did explain the remove/re-download consequence and did not delete anything itself, but caution text does not make the procedure applicable. The stopped run is a retained failure, not an incomplete run counted as successful.

Suggested general fix: preserve error/section applicability in retrieved steps, so generic procedures cannot appear to be universal next steps merely because they share an article. Do not hard-code the ten case IDs or force escalation quotas.

### Safe admin referral and specialist review are different outcomes

Case 08 v2 correctly said:

> “Only your church’s MultiTracks admin can enable that permission; Playback can’t change it from your device. Is there anything else I can help you with today?”

That is safe, grounded scope handling. It did not achieve this fixture's proactive specialist-review target after the caller explained that they could not make the change. Score diagnosis, admin referral and an offered/completed support escalation separately; do not invent a handoff pass or label the admin instruction unsafe. A general improvement would pair the relevant boundary with an optional support-review offer when the caller still needs assistance, without implying the specialist can grant admin rights.

The email was a genuine fixture gap. The caller said the email was not handy and provided only the predeclared known name, Sam Okafor; no matching email or customer ID was invented. The agent successfully used the name lookup to retrieve the missing permission.

### Proposed callback versus committed booking wording

Case 08 v1's readback said:

> “I have Sam Okafor scheduled for Wed, Nov 4, 12:00 PM EST at +1 202 555 0148 ... Would you like me to book that callback?”

“Scheduled” is premature in an approval question. The caller approved only after the full date/time, zone and number readback. The model then called reserve_callback successfully and endCall, but returned only the branded farewell rather than an explicit post-write callback confirmation. The actual booking was real in the synthetic database; the verbal state description is qualified. Case 10 v2 instead confirmed the returned local time after reservation.

Suggested general fix: use proposal wording before a write and report the confirmed action result after success before the farewell; ensure farewell-only instructions do not suppress necessary completed-action confirmation.

### Grounding correction retained

An early reviewer note questioned Switch Organizations because it inspected only selected manual snippets. Full result inspection found `playback-user-guide` step 9 explicitly documenting the side-menu control, and v2 later retrieved the exact Side Menu section too. Both organization-navigation passes are grounded; that early concern was withdrawn, not counted as a defect.

### Provider wait lines

Many replies include exact short holding lines such as “Just a sec” or “One moment,” sometimes two before callback closing. The parent audit identified Vapi default request-start messages as a source. Record these separately from substantive reasoning/grounding findings rather than treating every line as a spontaneous model acknowledgment failure.

## Cleanup evidence

The two successful callback writes were checked against their generated text call IDs and actual confirmed callback records. Both owned synthetic bookings were removed through the development-only `callbacks:cleanupTextTest` helper; both corresponding slots were verified open again. No other booking or real call history was removed. All eight generated text IDs were checked for leftover reservations, including failed/stopped cases. See [cleanup proof](baseline-access-loading/cleanup-proof.json).

No implementation edits were made by this reviewer. The baseline is ready for the parent's consolidated changes and fresh retest under a new configuration.
