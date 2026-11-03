# Candidate D prerequisite-gate access cohort

Six fresh first-opening development text conversations on the same fixtures. **Both ambiguous locked-track openings again received neutral, tool-free location clarification.** The explicit Playback/admin control skipped redundant location questions and offered review. App and console branches remained appropriately separate; regular07 recovered and regular08 completed a properly approved callback.

**Remaining limitation:** regular04 over-collected warning-screen context after already establishing the app, exact warning and active organization. It was stopped at turn4 without inventing unspecified popup/click behavior or prompting the expected version check. The intended recovery path was not reached in that trace. This is recorded alongside the successful paths, not retried.

Reported inference cost **$0.7732**, 28 caller turns, 16 tool calls. Configuration hash `a889982c60cb65384d78c379e1fb15e2a736f6f1474c69dcd7a54ff3a0cb8462`. No voice, production, implementation, backend, saved-assistant or deployment changes by this reviewer. All A/B/C results remain unchanged.

| Run | Neutral gate / context | Plain language and missing-information handling | Original goal / observed core outcome | Turns / cost |
| --- | --- | --- | --- | --- |
| locked-app | **Pass**: asks screen/device before app-specific question or tool | Explained admin boundary after real admin message; no song title invented | Review offered; respected own-admin choice; no access grant claimed | 4 / $0.0988 |
| locked-console | **Pass**: asks location/message before any technical assumption | Plain console-specific help boundary | Respected own-operator choice; no account query, console procedure or credential request | 3 / $0.0683 |
| locked-clear-app | **Pass**: uses explicit Library/iPad/admin context | Clear permission limitation, optional review | Access remains pending admin; own-admin choice honored | 2 / $0.0454 |
| 04 false expiration | App/context established, but continued repeated screen-placement questions | Ordinary words, but did not adapt to two statements that caller could not name screen | **Not reached**: stopped after4 with no version/release evidence, update, recovery or farewell | 4 / $0.1035 |
| 07 organization | Clarified Library versus other missing-song location | Initial email friction; recovered to guided side-menu/picker inspection when unknown | **Recovered**: explicit song-visibility check after selecting Northgate, caller confirmed | 7 / $0.2202 |
| 08 permission | Clarified Library list versus download location | Org-only status kept distinct from member permission; unknown email replaced by known admin report | **Escalation completed**: optional review → approved full-readback callback, no claim rights fixed | 8 / $0.2370 |

## Ambiguous pair and clear control

Both ambiguous calls began identically: “The track is locked, and I can't use it. Can you help me unlock it?”

The app branch first asked: “Where do you see that the track is locked—what screen or device are you looking at when it happens?” The console branch first asked: “Where are you seeing that the track is locked, and what does the message or lock label say?” Both used **zero tools**, no presumed Playback screen and no guessed permission meaning.

After the app caller established Playback Library/iPad, documentation retrieval and an app-specific song question followed. The fixed profile does not supply a particular locked-song title, so none was invented. The caller instead repeated the relevant existing admin message: correct church selected, Team Sharing needs enabling, no authority to change it. The agent explained the admin limitation, offered specialist review and accepted the caller's own-admin choice. No lookup, access change or fictional repair was claimed.

After the console caller identified a sound-console channel padlock and said Playback played normally, the agent said unlocking needed console-specific help and offered review. The caller chose their own console operator. It neither asked for MultiTracks account details nor invented LV1 instructions, credentials or a successful unlock. Its only tool was `endCall`.

The explicit clear control already supplied Playback Library/iPad and the missing permission explanation. It did not receive location questions. The agent explained that the organization admin must enable access and offered a specialist. The caller chose their own admin and the agent closed. This remains pending admin action, not a resolved access restriction.

## Regular04: observed over-clarification, no fabricated UI facts

The sequence was:

1. The caller reported paid Cloud Pro but Playback on the iPad said expired. The agent asked for Organization ID.
2. The caller supplied only480113. `lookup_demo_customer` returned active organization-only subscription facts, identity unverified and member not checked; documentation was also retrieved. Agent asked whether the warning was in Playback About or elsewhere.
3. Caller: “It's inside Playback and says Cloud Pro expired. I'm not sure what that screen is called.” Agent asked whether a Settings page or pop-up was behind it.
4. Caller: “I'm not sure what screen it's on. The message I can read is Cloud Pro expired.” Agent asked whether tapping the warning opens another page or stays on screen.

The fixture supplies the exact app warning and readable app/OS versions, but no named warning screen, popup arrangement or warning-tap result. Those UI facts were not invented to move the conversation toward the desired diagnosis. No caller prompt suggested version checking or updating. The run was stopped here to preserve the concrete repeated-context issue; it is **not** proof that every further reply would fail or that a real caller could never describe the UI. The observed trace did not reach the useful, readable version evidence or original-goal verification that earlier candidates reached. It received no artificial success report or `endCall` pass.

As in prior rounds, “active through March14,2027” was an imprecise paraphrase of a record that says active and **renews** then. No name/email request followed merely to reconfirm organization-level subscription.

## Regular07 and08

**07:** The agent first clarified that songs were missing from the Library. It then requested the sign-in email. The fixed profile does not supply an email, so the caller honestly did not know it. The agent recovered to documented side-menu organization inspection, obtained Personal account, guided Switch Organizations, requested the available church name, and instructed selecting Northgate. Only after that did the caller report songs visible. The agent explicitly checked the original song goal. It did not require a remembered email, grant privileges or force human help. The initial email request was avoidable friction compared with the readily readable organization selection.

**08:** After Library location was confirmed, the agent requested and looked up organization480113. It correctly distinguished an active church plan from unresolved caller Team Sharing permission. Its subsequent email question served that narrower member-permission question, rather than merely rechecking the organization subscription. The caller's email was not a supplied fact; no convenient address was invented. The caller repeated the known admin report and lack of authority to change it. The agent accepted that reported limitation, explained the admin's required action and proactively offered specialist review. It did not pretend that the org-only lookup verified caller rights.

The accepted path used unavailable team → callback availability and time-zone collection together → missing name/number together → complete proposal containing **Sam Okafor, full +1 202 5550148 number, Wed Nov4,3:30PM EST** → explicit approval → successful `reserve_callback` → `endCall` with DB-backed local confirmation and branded farewell. No caller repair of the readback, premature booked claim or fabricated access restoration occurred.

## Language, endings and teardown

The observed text replies contained no duplicate standalone acknowledgment or platform holding prefix. “Team Sharing seat” still adds an unnecessary term beyond permission in08, but surrounding language explained that an admin must enable access. The main missing-information repair in07 worked; in04 the agent kept probing unspecified screen context rather than moving to other accessible evidence or an uncertainty fallback.

Five naturally completed conversations invoked `endCall` and returned one full branded farewell. The stopped04 did not. Text does not establish audio timing, Live speaker phrasing, interruption behavior or actual phone disconnection.

All six runs are `done:true` and `cleanupComplete:true`. The one own callback was verified confirmed in development, then only this cohort's six generated `text-poc` UUIDs were passed to guarded cleanup. Exactly one own booking was removed, its exact slot reopened, and no own callback remained. Five non-text historical callback rows were compared before/after and were unchanged. All nine source hashes and all four fixture hashes match `gate-config.json` at completion.

Detailed evidence is in `gate-access/cleanup-proof.json`. No new chats or automatic retests are planned. Inference is stopped; remaining limitations are reported for the parent to assess.
