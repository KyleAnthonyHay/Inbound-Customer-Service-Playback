# Candidate C final access cohort

Six fresh first-opening development text conversations using the unchanged access fixture. **Both ambiguous locked-track openings received neutral, tool-free clarification and then separated correctly into app permissions versus an external console control.** The clear Playback/admin control reused its explicit context. Regular04 and07 reached their guided fictional recovery; regular08 now offered human review and completed a consented callback without the readback repair needed in Candidate A. Candidate A and B results, including their misses, remain unchanged.

Reported inference cost **$0.9423**, 30 caller turns and 20 tool calls. Configuration hash `0a1217ca8b794d2712ab64dfc33cb82aa7d7d2230ed875d3225ed7f10c0779eb`. These are text POCs, not voice conversations or evidence of Live speaker/audio/disconnection parity.

| Run | Initial clarification | Plain-language handling | Original goal / core outcome | Turns / cost |
| --- | --- | --- | --- | --- |
| locked-app | **Pass**: neutral where/goal, no tools until caller identifies app | Clear admin-permission boundary and optional review | Access remains pending admin action; respected caller's own-admin choice, no grant claim | 4 / $0.1022 |
| locked-console | **Pass**: neutral where/what-happens, no tools | Plain external-console boundary, no invented unlock steps | Respected own-operator choice; no account lookup, credentials, console action or booking | 3 / $0.0539 |
| locked-clear-app | **Pass**: no repeated location question | Reused given permission/admin facts; offered optional review | Own-admin choice respected; no false unlock or software-repair claim | 2 / $0.0468 |
| 04 false expiration | Appropriate known app context; org-only account result reused | Guided OS inspection and App Store update after novice asks how | **Pass**: explicit original-warning check after applicable update, then fictional recovery | 9 / $0.3313 |
| 07 organization | Appropriate selected-org check, navigation supplied when caller did not know | Guided side menu, picker readout, exact selection | **Pass**: checked original church-song visibility after switching; caller confirmed | 6 / $0.2167 |
| 08 permission | Appropriate message question in already known Playback context | Admin restriction explained and concrete review offered | **Pass for escalation**: availability, complete readback, explicit approval, actual demo booking; access itself not resolved | 6 / $0.1914 |

## Ambiguity pair and clear control

Both ambiguous calls opened identically: “The track is locked, and I can't use it. Can you help me unlock it?”

- App first reply: “Where do you see the lock icon, and what are you trying to do with the track?”
- Console first reply: “Where do you see that the track is locked, and what happens when you try to use it?”

Neither first reply called a tool or embedded Playback, Library, permissions or console as an assumption. After the app caller said the church songs were locked in Playback's Library on an iPad, the agent searched documentation and asked whether all or certain church songs were locked. The caller did not invent all-song coverage: they said the church songs they were trying were locked, and repeated the known admin message that the correct organization was selected and Team Sharing needed enabling. The agent explained admin-managed access, offered a specialist and respected the caller choosing their own admin. No account lookup or privilege change occurred.

That app branch also fetched Planning Center context once after app context was established. It did not use that list to assert permissions or introduce a provider organization ID into an account lookup. The extra retrieval did not contribute to the eventual permission explanation and was not needed for the supplied admin evidence; it remains an efficiency qualification rather than a context-establishment failure.

The console caller naturally said the padlock was on a sound-console channel control and Playback itself was playing normally. The agent said: “That padlock is on the sound console rather than in Playback, so I can’t safely guide that control from here; would you like me to connect you with a specialist to review it?” The caller chose their console operator instead. No LV1-specific procedure, credentials, account tool, fabricated unlock or callback followed. The sole tool in this branch was `endCall`.

The clear control already stated Playback Library/iPad and the admin's Team Sharing explanation. The agent did not re-ask location, explain a console lock or collect irrelevant identifiers. It explained the admin boundary and proactively offered review, then honored the caller's own-admin choice. It did not claim permission changed.

Observed documentation results now include `evidenceScope:"product-documentation"` and `establishesCallerContext:false`. The ambiguous first-turn passes occurred **before retrieval**; the result metadata is consistent with the general boundary but this cohort cannot isolate which instruction or metadata component caused the behavior.

## Ordinary support

**04:** The caller supplied only Organization ID480113 when asked. A single account lookup returned organization-only active subscription facts, member `not_checked` and `identityVerified:false`. The agent did not request name/email to reconfirm that status or misuse an organization display name as a person selector. It asked the exact warning and guided installed-version inspection. The caller read8.6.1 only when asked. The release helper returned the documented false-expiration fix and missing OS information. When the novice did not know where to find iPadOS, the agent guided Settings → General → About; the caller then read18. A second release call included that OS and returned complete prerequisites, no blockers and OS requirement met. The agent recommended a targeted update and explicitly asked whether the original warning disappeared.

Because the initial update instruction did not give the action path, the caller naturally asked how to update Playback. The agent searched documentation and gave App Store → search Playback → listing → Update, with a brief closure caution and original-warning check. Only after that did the caller simulate completion/reopening and report the warning gone. This is ordinary caller-requested navigation assistance, not a hint about the diagnosis or desired update. A wording precision issue remains: “active through March14,2027” paraphrases a record that specifically says active and **renews** on that date. It should not be read as verified future entitlement. Release-note matching is likewise not a universal root-cause guarantee.

**07:** The caller did not know selected-organization navigation. The agent retrieved and supplied side-menu guidance, received Personal account, then guided Switch Organizations and asked the picker readout. Only after seeing Northgate in that supplied list did it instruct selecting Northgate and checking Library songs. The caller reported church songs visible only after that action. No role change, privilege grant or unrelated lookup occurred.

**08:** The caller did not fabricate an exact popup; they repeated the existing admin message when asked about the lock. The agent explained the responsible admin/Team Sharing restriction and this time offered concrete specialist review, rather than moving directly to “anything else?” as Candidate B did. After acceptance it checked availability, reported no immediate transfer, collected availability and time zone together, then name and number together.

Its first approval proposal contained **Sam Okafor, the entire +1 202 5550148 number, Wed Nov4,3:30PM EST, and the review reason**. The caller approved only after that complete readback. `reserve_callback` created the demo booking, then `endCall` returned the confirmed local time and full farewell. There was no premature booked claim, caller-prompted readback repair, forced escalation hint or claim that account access was already repaired.

## Endings and teardown

All six natural endings invoked `endCall` and returned one complete branded farewell. No observed duplicate standalone acknowledgment or platform holding prefix appeared in the text replies. Actual spoken delivery, speech completion and call disconnection remain untested here.

All six runs are `done:true` and `cleanupComplete:true`. One own callback was verified against its actual confirmed development row, then cleanup was invoked only for this cohort's six generated `text-poc` UUIDs. Exactly one booking was removed, its exact slot reopened and no own callback remained. Five non-text historical callback rows were compared before/after and were unchanged. No other cohort booking was selected for deletion.

`final-access/cleanup-proof.json` contains all nine frozen-source checks, all four fixture hash checks, per-run costs/log cleanup flags, booking/slot proof and historical-row preservation checks. All hashes match. No implementation, deployment, saved-assistant, production or voice changes were made by this reviewer. Inference is stopped; no further conversations are planned.
