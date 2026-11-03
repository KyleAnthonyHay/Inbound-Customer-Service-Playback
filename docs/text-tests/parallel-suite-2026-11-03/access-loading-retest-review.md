# Combined-candidate retest: access and loading

Eight fresh **text reasoner POCs**, both openings for cases 7–10. The existing harness and strict private caller profiles were used; reviewer expectations were not agent inputs. This is a follow-up observation set, not a blinded or statistically controlled A/B study: adaptive replies followed the actual questions while remaining inside the same predeclared fictional facts.

All eight conversations reached their intended support outcome or appropriate escalation. **Seven had no material support/tool finding; recovery v2 is qualified by an unnecessary cross-system identifier lookup.** One successful callback also used the neutral name `Caller` without collecting a name; this is a completeness note, not an invented identity or failed reservation.

There were **51 reply turns**, reported Vapi text cost **$1.4157**, and no observed platform holding-line prefixes. All eight runs ended normally through `endCall`, and all eight isolated tool logs were cleaned. Four actual synthetic callback records were verified, removed only by their generated text call IDs, and their slots verified open again. No voice call or real staff/customer contact was created.

## Per-run results

| Run | Result | Evidence summary | Turns | Reported cost |
|---|---|---|---:|---:|
| [07 organization v1](retest-access-loading/07-organization-v1.json) | Pass | Helped the novice find the selected organization, established Personal account, guided the documented Switch Organizations control, and obtained recovery confirmation after selecting Northgate. Further-help/decline/endCall followed. | 5 | $0.1454 |
| [07 organization v2](retest-access-loading/07-organization-v2.json) | Pass | Clarified Library rather than setlist, guided organization-name discovery when unfamiliar, then guided the organization switch and obtained simulated recovery before normal closing. | 6 | $0.1710 |
| [08 permission v1](retest-access-loading/08-permission-v1.json) | Pass | Named simulated membership lookup established missing Team Sharing. Explained admin scope and proactively offered specialist review. After unavailable team, checked noon Eastern, collected number, proposed full readback, waited for approval, reserved, called endCall, then spoke confirmed local time plus farewell. | 7 | $0.1704 |
| [08 permission v2](retest-access-loading/08-permission-v2.json) | Pass for scoped review | Exact organization name and locked-song popup text were fixture unknowns. The agent did not invent them or assert a verified membership diagnosis. It tentatively described a possible access restriction, offered specialist review, and completed the consented 12:30 Eastern callback with name/number, full proposal, reservation, endCall and final confirmation. | 7 | $0.1855 |
| [09 recovery v1](retest-access-loading/09-loading-recovery-v1.json) | Pass | After exact Audio Files Missing message, used the known prior single retry and guided only two more. Fictional recovery was reported after the action. The requested Sunday-plan follow-up reused the existing Planning Center result, then closed after further-help check and decline. | 5 | $0.1337 |
| [09 recovery v2](retest-access-loading/09-loading-recovery-v2.json) | Recovery/plan outcome passed; tool-input integrity qualification | Clarified song/error and guided the documented retry routine; the caller reported failure then recovery only after those retries. Reused the earlier service metadata for the two other songs and closed normally. Before recovery guidance, however, it passed a Planning Center organization ID to the MultiTracks song-access tool (details below). | 5 | $0.1296 |
| [10 unresolved v1](retest-access-loading/10-loading-unresolved-v1.json) | Pass; name completeness note | Used exact error and three failed attempts, checked the recent-download prerequisite, and when unknown explicitly avoided the conditional destructive recovery and offered review. Completed approved 1 PM Eastern callback and endCall with correct final confirmation. Used neutral `Caller` as the booking name rather than asking for a name; no identity was invented. | 7 | $0.2109 |
| [10 unresolved v2](retest-access-loading/10-loading-unresolved-v2.json) | Pass | Established three failed attempts, checked the error-specific recent-download condition, and avoided the unsupported delete-all step when unknown. Offered review, checked unavailable team, obtained preference/contact/name, performed full proposal/readback, and only after approval reserved 1:30 Eastern, called endCall and confirmed returned local time. | 9 | $0.2692 |

The permission and unresolved-loading issues remain unresolved technical/access problems; successful escalation is not containment or physical repair. “Pass” means the intended scoped support flow, not a claim of problem resolution in those cases.

## Improvements observed against the baseline

### Error-section applicability

The baseline's 10 v1 crossed from Audio Files Missing into generic Download Error remove/re-add and alternate-key recipes. Neither retest variant did that. Retest v1 explicitly said:

> “The remaining documented recovery deletes every local setlist and requires re-downloading them, but it’s intended only for a song recently downloaded from an older setlist. Since we can’t confirm that, would you like me to connect you with a Playback specialist?”

This used the source condition and a genuine unknown without manufacturing a destructive step or a successful recovery. Both variants respected the predeclared download constraint.

### Proactive specialist review

The baseline's 08 v2 accurately referred the user to their admin but offered no review after the caller could not make the change. Both retest variants offered review. Variant 1 grounded the permission diagnosis in the simulated named membership. Variant 2 used a tentative hypothesis and offered review when exact details were unavailable; it did not pretend an account lookup or grant occurred.

### Callback state and grounded final confirmation

All four callback readbacks used proposal language, for example:

> “Shall I book your callback for Wed, Nov 4, 12:00 PM EST at +1 202 555 0148 ...?”

Each waited for the caller's explicit yes, received `ok=true` / booking ID from `reserve_callback`, then called `endCall`. The endCall tool returned a `speak` string including the confirmed local time from the actual saved booking. Each final reply then said:

> “Your demo callback is confirmed for [returned local time]. Thanks so much for calling MultiTracks Playback support. Have a great day, and goodbye!”

The baseline's premature “scheduled” wording and missing post-write confirmation were not observed in these four retests. The text transport returned `voiceCall=false`; guarded audio disconnection was not exercised.

### Holding lines

No exact Vapi default holding prefixes were observed across the 51 retest replies. This is consistent with explicit empty request-start configuration and is narrower than a claim that live voice delivery, interruptions or all repeated acknowledgments are fixed.

## Remaining finding: identifier provenance

In 09 recovery v2, after a Planning Center context read and before any caller-provided MultiTracks identifier, the agent called:

```json
{"songTitle":"Graves Into Gardens","orgId":"548061"}
```

`548061` was the **Planning Center** demo organization ID, not the caller's MultiTracks Organization ID. `check_song_access` returned `not-found`. The agent continued the valid error-specific recovery and did not falsely deny ownership, but the tool input conflated two providers' identifier namespaces and the lookup was unnecessary to the documented recovery. The recovery outcome does not erase that tool-integrity defect.

Recommended general refinement: keep non-actionable external/provider identifiers out of conversational tool results or explicitly namespace them, and preserve the rule that planning metadata cannot establish MultiTracks identity or content rights. Do not fix this by hard-coding a particular bad number or assuming equal-looking IDs are universally interchangeable.

## Cleanup and configuration evidence

[Cleanup proof](retest-access-loading/cleanup-proof.json) records every run's tool-log completion, the four confirmed owned bookings, exactly four removed test bookings, and all four slots open again. Other bookings and real call history were preserved. All retest source files matched `retest-config.json` at this cohort's completion check. Conversation fingerprint: `0c3d127c0adf851f7751cbb8f915fc2522bffcc6f85ea28a7df93b33b2f1d7ab`.

The parent began its next identifier-provenance refinement only after all twenty combined-candidate conversations were finished and the hashes were verified. No additional model calls were made by this cohort after that change. This reviewer made no shared implementation or configuration edits; only cohort reports and temporary caller-reply files were written.
