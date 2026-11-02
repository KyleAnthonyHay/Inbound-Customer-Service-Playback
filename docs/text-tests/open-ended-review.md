# Open-ended conversation review — November 2

The ten selected situations now start with everyday goals and symptoms. Private backgrounds distinguish known facts, information readable with help and genuine unknowns. No version, diagnosis, output mapping or expected handoff was inserted into an opening. The support agent had to ask, retrieve documentation and interpret the replies. See [the method](../open-ended-test-method.md) and [the updated ten-call sheet](../ten-call-scenarios.md).

## Outcomes, not a perfect quality score

**Ten complete conversations: seven handled and three accepted simulated specialist handoffs.** The seven comprise six scripted caller-reported recoveries and one capability-advice answer. All seven included a normal further-help question. This is not “all dialogue quality passed” or evidence that physical Playback audio was repaired.

| Situation | Actual result |
|---|---|
| Voice and ticking together | Asked what equipment was used and read the separate Click/Guide assignments. Guided a different output; caller reported independent control. Used the unexplained term “talkback.” |
| Reconnecting scattered music | Found the selected interface, helped the novice one row at a time and restored music to 3/4. Caller corrected that Drums was already correct; the agent moved on. No invented reset cause. |
| No sound | Learned that the caller meant the external system, asked for the box label, inspected the selected Audio Device and guided MacBook Speakers → Focusrite. Caller reported sound. |
| Paid/expired warning | Checked active simulated status, tried Restore Purchases before the purchase channel was known, then accepted that it was a website purchase and the step had failed. Independently obtained installed 8.6.1 and helped the caller locate iPadOS 18. Compared once; current version was 8.6.4, prerequisites complete, no missing facts/blockers. Used the 8.6.3 fix as an attempt, explained app closure and asked about the original warning afterward. |
| Equipment idea | Asked what the band/room should hear and helped locate the Focusrite model. Needed the caller to clarify that this was advice, not setup. Then answered documented capability and checked for further help. |
| Borrowed mixer | Helped find its label, but offered alternate connections before specialist review. After the caller expressed discomfort, acknowledged the verification limit, offered a specialist and executed the accepted simulated handoff. **The earlier spoken claim that this run never offered a specialist was inaccurate.** |
| Church songs missing | Helped identify the personal account, located the church entry, guided the switch and checked that songs appeared. No role/permission change or routine version check. |
| Locked songs | Looked up the simulated organization; once the caller shared the admin’s permission finding, explained the admin boundary, offered a specialist, waited for acceptance and executed handoff. The service-plan lookup was unnecessary. |
| Stuck song, recovery | Used real shared Planning Center demo context proactively, but recited all three titles and bundled questions. Discovered the error and corrected for the caller’s one prior retry, guiding two more. Caller reported recovery on the third total attempt. |
| Stuck song, unresolved | Initially assumed a retry count, then accepted the caller’s three failed attempts. Discussed a remaining recovery option, respected the refusal to risk downloads before service, offered help and executed the accepted handoff. |

All three handoff results returned `ok=true`, after actual caller acceptance and availability checks. No real specialist was connected. The support tool does not forward a new ticket or summary to real staff; useful context remains in the simulated conversation.

## Closing checks and configuration changes

The main ten and [direct-request controls](open-ended-controls-2026-11-02/) used the first candidate. Direct human routing skipped diagnostic/personalization detours; explicit goodbye did not trigger another question.

Two main-run callers thanked the agent after its further-help question, and the agent treated those as sign-offs. The initial wording was too rigid about thank-you phrases. Final guidance preserves the required normal question and waiting, while using the meaning of the caller’s answer rather than a mandatory phrase. Diagnostic/specialist guidance did not change in that refinement.

Three fresh [final closing controls](open-ended-closing-2026-11-02/) checked the changed behavior: an initial “I can hear it now, thanks” received the further-help question and waited; an advice answer did the same; an explicit leave request was honored immediately. Both normal controls then closed after the caller finished. These are focused decision controls, not extra natural diagnostic conversations.

## Findings retained

Compound questions, technical vocabulary, alternative-connection detours, unnecessary lookups, setlist recital and the assumed retry count remain quality findings. The new method exposed these; they have not been relabeled as perfect passes. Restore Purchases once before learning the purchase channel remains a defensible check, rather than a categorical failure.

No rigid dialogue order was required. Capability advice was judged against the listening goal actually expressed, not a secret channel-count requirement. The older technical wording in that fixture was reconciled for future runs; completed run snapshots and responses were retained unchanged.

## Validation and limits

- **73 local tests**, TypeScript, targeted ESLint and whitespace checks passed.
- [Read-back](open-ended-activation.json) verified the saved dev definition matches final source and has native `endCall`; localhost returned HTTP 200. No production write commands or automated voice calls were made. Backend/schema/tool code was unchanged, so no Convex deployment or re-seed was needed.
- All isolated text logs were closed and cleaned; no request failed. [Metrics](open-ended-review.json): ten main conversations / 72 turns / **$0.8351** reported; two request controls / 2 turns / **$0.0162**; three final closing controls / 5 turns / **$0.0559**. Total reported text cost **$0.9072**.
- This was manually steered text testing with predeclared fictional outcomes, not a blinded autonomous caller or a statistical reliability result. Only the first of two openings per case was exercised in this run.
- Planning Center context and deployed dev tools were real API/tool reads; customer rights and caller recovery were fictional. No app hardware, audio routing or live customer account was operated.
- The reviewed manual call before this change did end through native `endCall`; its conversational ending was abrupt. **The new speaker/closing behavior still needs a manual voice check.** Text excludes the GPT-Live speaker and adapts endCall to a goodbye, so it cannot prove speech delivery, delegation, timing or actual disconnect.

Jordan has a separate [single informal try-out](../jordan-voice-tests.md); he does not need to run the ten developer cases.
