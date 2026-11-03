# Access cohort: context clarification and ordinary support

Six fresh first-opening development text conversations under the frozen context/plain-language candidate. **The identical ambiguous locked-track pair both failed the location-clarification criterion.** Both assumed Playback and searched its documentation before knowing whether the lock was in Playback or on an external console. They were stopped after that first material miss without giving a corrective location hint. The clear Playback control avoided redundant location questions. All three ordinary support cases completed their intended support path, with qualifications below.

Reported inference cost **$0.7963**, 24 caller turns and 19 tool calls. One own simulated callback was created and removed; all six isolated tool logs are cleaned. No voice calls, source changes, deploys, saved-assistant changes or production actions. Configuration hash: `bd8a553a584e42e2c67b2b8a035f5919fbca0f3b1c7df7792d7edcb41dc76c05`.

## Separate grades

“Core” describes actual observed support behavior, not a claim of real resolution or a voice pass. Stopped runs are not completed support conversations.

| Run | Clarification/context | Plain language | Original-goal check | Core outcome | Turns / cost |
| --- | --- | --- | --- | --- | --- |
| locked-app | **Fail**: assumed Playback/song before location established | Short/simple but wrong premise | Not reached | Stopped; no access grant or member lookup occurred | 1 / $0.0311 |
| locked-console | **Fail**: assumed Playback and offered app-specific error/icon choices | Readable but restricts caller to an unsupported context | Not reached | Stopped; external-console boundary/operator choice not tested after miss | 1 / $0.0170 |
| locked-clear-app | Pass: reused explicit Library/admin facts; no location re-ask | Mostly clear; Team Sharing was already caller terminology | Correctly leaves admin action pending; no claimed unlock | Explained admin boundary; caller chose own church admin; farewell/endCall | 2 / $0.0652 |
| 04 false expiration | Adequate known app context; nonfatal organization-name/person-lookup misuse | Clear setting navigation and update caution | **Pass**: explicitly checked whether original expired warning remained after update | Account active, caller version/OS checked, matching release fix, guided update, fictional recovery | 8 / $0.3042 |
| 07 organization | Pass: asked selected organization, guided how to inspect it when caller did not know | Clear three-line menu and Switch Organizations directions | **Pass**: instructed checking whether church songs appeared after switching | Caller selected existing Northgate membership and reported songs visible | 5 / $0.1612 |
| 08 permission | Pass: elicited observable message, then reused admin's concrete explanation | Mostly clear; “Team Sharing seat” adds an unnecessary term beyond permission | Correctly leaves access unresolved; booked specialist review instead of claiming rights granted | Completed callback with explicit consent; **full-number readback required caller request** | 7 / $0.2176 |

## Identical opening, same wrong assumption

Both ambiguous calls began with exactly:

> “The track is locked, and I can't use it. Can you help me unlock it?”

Neither caller supplied an app, device, lock location, account context or diagnosis.

- `locked-app`: called `search_playback_docs({query:"Playback track locked icon cannot use track unlock song loading"})`, then asked: “What’s the song title shown with the lock in Playback?”
- `locked-console`: called `search_playback_docs({query:"Playback track is locked and can't use it; locked song indicator unlock access download"})`, then asked: “What do you see next to the locked track in Playback—an error message, a download icon, or something else?”

These are questions, but not neutral context clarification: both embed the unsupported Playback premise. The provider-specific documentation search also precedes context. No caller provided the desired “LV1 console” correction to lead a recovery, and no account tools or unlock actions were called before stopping. Therefore this evidence establishes the clarification failure; it does **not** establish that the agent would ultimately give a bad console procedure or fail to recover if corrected.

The clear control began with Playback Library, iPad and the admin's missing Team Sharing explanation already supplied. The agent searched relevant documentation and said that only the organization's admin could enable it. It did not ask where the lock appeared, request irrelevant identifiers, grant privileges or troubleshoot a console. It added conditional sign-back-in advice if the Library did not refresh after the admin change; no such action or successful unlock was simulated. The caller chose their own church admin and declined more help; `endCall` produced the full branded farewell. It did not proactively offer specialist review in that control, but also did not force it or claim the permission was repaired.

## Ordinary cases

**04.** The agent first asked purchase channel, then selected organization. After “Riverbend Community Church,” it erroneously used that organization display name as the `name` person selector in `lookup_demo_customer`. The result correctly returned `person_not_found`, not proof that the organization lacked a subscription. It recovered by asking for the six-digit ID. `lookup_demo_customer({orgId:"480113"})` succeeded with `organization_only`, `identityVerified:false` and member `not_checked`. Thereafter it did not ask for email/name to reconfirm organization status. It reported active status and the renewal date accurately.

The caller read installed8.6.1 only after guided About instructions. The first release-history result identified the documented false-expiration fix and missing OS information; the agent then guided iPadOS inspection. On supplied iPadOS18 it called the release helper again, received complete OS/update prerequisites and explained that updating closes the app. Its instruction explicitly asked whether Cloud Pro still showed expired after reopening. Only after that applicable guided action did the role-player report fictional recovery. The agent accepted that report and closed after the caller declined more help. No duplicate payment, access grant or historical-version assumption occurred. Matching release notes remain candidate evidence, not a universal diagnosis guarantee.

**07.** The caller genuinely did not know where to find the selected organization. The agent retrieved the three-line side-menu guidance, obtained “Personal account,” and instructed Switch Organizations and checking the Library. The role-player reported songs visible only after selecting the already available Northgate organization. No role/seat change or member verification was invented. Closing followed the caller's explicit completion.

**08.** The caller could not supply an invented on-screen popup; instead they repeated the known admin message when asked about the lock. The agent explained the admin boundary and offered specialist review. The caller accepted. The availability tool returned unavailable; it gathered availability plus time zone together, then name plus number together. An open slot was not described as already booked.

The initial approval question read back **Wed, Nov4,3:30PM EST**, Sam's name and only “the number ending in0148.” To obey the fixed caller profile's full-readback rule, approval was withheld and the caller asked: “Could you read back the whole callback number before I confirm?” The agent then read **+1 202 5550148** along with the date/time/zone and asked again. Only then did the caller approve; `reserve_callback` succeeded, followed by `endCall` with DB-backed local confirmation and one branded farewell. This is a successful consented callback with a **caller-requested readback correction**, not an unassisted complete-readback pass. It does not mean the access restriction was resolved.

## Conversation style, cleanup and limits

No observed text reply contained a duplicate standalone acknowledgment or platform default holding prefix. All four conversations continued to a natural close invoked `endCall` and produced one complete branded farewell. The two stopped ambiguous runs intentionally did not reach a goodbye. This says nothing about Live speaker audio, interruption handling, or actual phone disconnection.

All six runs are `done:true` and `cleanupComplete:true`. The one callback was verified against its actual confirmed development row, then only this cohort's generated `text-poc` UUIDs were passed to the guarded admin cleanup. Exactly one own booking was removed, its exact slot was verified open again, and no own callback remained. Five non-text historical callback rows were compared before/after cleanup and were unchanged. No unrelated callback deletion was requested.

`runs-access/cleanup-proof.json` contains all nine frozen-source hash matches, fixture/configuration hashes, per-run costs/cleanup flags, callback teardown and historical-row preservation checks. The source stayed frozen for every inference request. No further conversations are planned by this reviewer.
