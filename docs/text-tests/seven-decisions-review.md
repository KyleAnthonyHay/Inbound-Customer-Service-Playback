# Seven diagnostic/update decisions — November 2, 2026

**Subsequent activation:** This report preserves the earlier local-candidate run. The combined development build is now deployed/synced; see the [integration and final rerun](../dev-integration/README.md).

**7/7 focused conversation cases passed their defined diagnostic/routing and update-prerequisite checks.** This is one small text run, not a measured production reliability rate, a clean score for every utterance, or voice validation. The candidate is local and has not been activated on the saved assistants.

The earlier comparable diagnostic score was **3/4**, not 4/5. Those four diagnostic paths now passed **4/4**. The seven-case set consists of those four wording/symptom variations, the existing clear wrong-output control, and two new controls: a direct human request and an already-current installation with an unexplained symptom. It is not seven unrelated product defects.

## Results

| Case | Result | Verified behavior |
| --- | --- | --- |
| False subscription expiration, A | Pass | Verified active demo status, independently asked installed version, found the historical matching fix, asked for OS, waited for a complete assessment, recommended a non-guaranteed targeted update and obtained scripted symptom confirmation. |
| False subscription expiration, B | Pass | Checked billing provider and account context, independently asked installed version, found matching release evidence, waited for OS verification and complete assessment, then obtained scripted symptom confirmation. |
| Stuck download progress, A | Pass | Independently asked version, found the 8.5.2 historical fix, held advice while OS was missing, rechecked the assessment and asked for the original download outcome. |
| Stuck download progress, B | Pass | Tried one documented recovery attempt; after caller reported failure, independently asked version, found the historical fix, verified OS before advice and obtained scripted outcome confirmation. |
| Clear wrong output | Pass | Followed the explicit MacBook Speakers/interface selection evidence, with no release/current-version call or update recommendation. |
| Direct human request — new | Pass | Immediately checked availability and completed the accepted simulated handoff. No docs, account, personalization or version detour. |
| Already-current unexplained symptom — new | Pass | Investigated version, recognized the current-version blocker and absence of a supported targeted update, offered a specialist, and completed the simulated handoff after acceptance. Did not insist on OS questions for an update path already ruled out. |

Counts: **7 conversations, 26 turns, zero request failures**. All seven isolated tool logs were closed and cleanup was verified. Vapi reported **$0.4255** in text-model usage. No reservations, real contacts, phone calls or voice simulations were created.

## What changed

The shared prompt now separates two decisions within one conversation:

1. **Investigation:** use a specific missing fact or available source when it can change the next support step. Clear account/configuration evidence takes priority. Unexplained behavior can justify historical version evidence. Inconclusive evidence or an unavailable essential fact leads to a specialist offer; direct human requests still route immediately.
2. **Update advice:** candidate notes alone are insufficient. The release tool must report complete version/OS prerequisites, with no missing information or blockers, and the agent must review whether the actual note matches the symptom. An update is described as an attempt, followed by caller confirmation of the original symptom.

The release helper now returns structured `updateAssessment` data: known installed/platform/OS facts, applicable OS-minimum result, missing information, blockers and `prerequisitesComplete`. Keyword hits are labeled candidates requiring applicability review; they are no longer described as a confirmed fix that should immediately lead to an update.

The comparator also returns the live iOS/iPadOS minimum OS, so the agent can re-evaluate missing OS information without a redundant separate current-app lookup. The dispatcher forwards platform/OS arguments. Matching still searches all 11 stored releases; the older 8.5.2 fix was retrieved in both stuck-progress cases.

The user removed timing as a prerequisite. No timing/readiness question occurred in this run. The agent briefly described app closure before update advice and remains bound to honor caller-volunteered constraints.

## Evidence for the structured check

All four update paths first returned `prerequisitesComplete=false` with `osVersion` missing. Each asked the caller for OS details, called the comparator again with the confirmed value, and waited for `prerequisitesComplete=true` before recommending an update. The caller supplied iPadOS 18 on an iPad Air 5; live Apple metadata reported current Playback 8.6.4 and an iOS minimum of 15.6.

The current-version control returned `prerequisitesComplete=false`, an already-current blocker and no newer release candidates. The agent offered a specialist rather than updating or chasing missing OS data that could not enable an update. This directly exercises the requested “I cannot establish a supported answer” fallback.

Source applicability remains a reasoning task: the helper uses keyword matches, so the complete-prerequisite flag does not prove an exact symptom match or guarantee recovery. OS evaluation covers the current iOS/iPadOS App Store requirement. macOS requirements and external hardware are **not** approved by applying that iOS minimum; they remain unverified by this helper and may require applicable documentation/specialist review.

The structured assessment is tool evidence plus a shared-prompt gate. It does not physically prevent a model from speaking an unsupported recommendation. This run demonstrates compliance in these cases, not deterministic enforcement of every future utterance.

## Remaining review notes

- Applicability/efficiency note, not an automatic failure: false-expiration A tried Restore Purchases while the purchase channel was still unknown. Official documentation describes this as a common Apple in-app subscription recovery step. A quick initial attempt is defensible in that uncertain context; checking the purchase channel first could avoid an unnecessary step. Once the caller disclosed website billing, the agent recognized the mismatch and moved on rather than repeating it. There is no documented basis here to claim it restores a known website-billed subscription.
- Both stuck-progress paths fetched Planning Center context that did not explain this multi-song device symptom. It was not used as proof of downloads, licensing or a device state.
- Stuck-progress B included a remove/re-add attempt before version investigation. The source documents that recovery mechanism, the caller did not report a constraint, and failure led to the next useful diagnostic fact. The script did not claim that attempt worked.
- The account record's last-known version was not substituted for caller confirmation. Versions were revealed only in answer to agent questions; no caller suggested that updating or version history might be the answer.

The other ten-case intent audit was not rerun wholesale for this focused request. Its legacy routing, unsupported factual extensions and delayed specialist-offer findings remain historical issues; this 7/7 result does not declare all those issues fixed.

## Local runtime and the development watcher incident

The intended test runtime was a temporary authenticated, text-only local proxy:

- Release comparison and current-app metadata ran from the local source against the actual Apple API.
- Documentation/manual retrieval, demo customer lookup, shared fictional Planning Center context and simulated handoffs used existing development tools.
- The proxy bound only to loopback behind an explicit temporary HTTPS tunnel, required a separate temporary secret, refused voice-shaped requests and disabled callback reservations.
- The caller outcomes were scripted. Neither Playback hardware nor real customer subscription changes were exercised.

**An existing `convex dev` watcher auto-published the candidate tool edit before it was noticed.** This contradicted the intended local-only approach. The watcher was paused, the earlier release helper and dispatcher behavior were restored to development, and a signed read-only request verified the candidate assessment was absent from the deployed response. The candidate source was then restored locally while the watcher remained paused. The watcher was subsequently stopped to prevent another automatic publication. Production was not targeted. No saved assistant configuration was edited; read-only before/after hashes match for both development and production assistants.

The focused tests used the local proxy, so restoration of the deployed helper did not replace the candidate implementation under test. Each run records both its prompt/tool configuration hash and the local release implementation hash; the runner refuses mixed/replaced source mid-conversation.

The normal text harness defaults to **deployed development tools**, which currently have the earlier response contract. To exercise this candidate, use the authenticated local proxy as below. Restarting `convex dev` will publish pending local backend changes; that is an activation step, not required to inspect these results.

## Validation and artifacts

All **61 local tests**, TypeScript, targeted ESLint and whitespace checks pass. New mocked tests cover missing facts, a single-number OS version, an insufficient OS, unknown current version, no candidates, already-current installations, avoiding iOS/macOS conflation and safe temporary text-tool configuration. The pre-existing historical-release regression still passes. Mocked checks remain distinct from the actual model/API results above.

- [Structured review](seven-decisions/review.json)
- [Seven actual transcripts](seven-decisions/run-01/)
- [Prompt/tool/release implementation snapshot](seven-decisions/definition.json)
- [Saved-agent and log-cleanup verification](seven-decisions/final-checks.json)
- [Development restoration record](seven-decisions/development-restoration.json)
- Fixtures: `scripts/text-cases/seven-decisions.json`; adaptive caller replies: `scripts/text-cases/replies/seven-run-01-02.json` through `seven-run-01-06.json`.

## Reproduction without publishing

1. Keep development auto-deploy watchers stopped while editing/testing an undeployed tool candidate.
2. Generate a new temporary secret in a private environment file outside the repository. Set `TEXT_POC_TOOL_SECRET` to it and `TEXT_POC_RELEASE_HASH` to the SHA-256 of `src/lib/tools/releases.ts`. The secret must differ from the saved webhook secret.
3. Run `npx tsx --env-file=.env.local --env-file=<temporary-env-file> scripts/local-text-tools.ts`. It listens on loopback port 8787, permits development forwarding only, and does not alter a saved assistant.
4. Explicitly tunnel that listener over HTTPS, with request inspection disabled. Add `TEXT_POC_TOOL_SERVER_URL=https://<temporary-host>/vapi/tools` to the temporary environment file. Do not put the real webhook secret in the tunnel configuration.
5. Start a fresh run with `npx tsx --env-file=.env.local --env-file=<temporary-env-file> scripts/text-cases.ts start <empty-output-directory> scripts/text-cases/seven-decisions.json`.
6. Inspect each actual question and answer from fixture facts using the runner's `reply` command. Expected fixes/reviewer notes stay local; do not send them as caller hints. Set `done: true` to close each isolated run.
7. Stop the temporary proxy and tunnel and delete the temporary credential file after verification. Do not run a saved-assistant sync or backend deployment as part of this local check.

No testing UI was added. These are text reasoning/tool checks, separate from the user's later ten manual presentation voice conversations.

Review clarification: Restore Purchases was reclassified from an “inappropriate step” to a potentially unnecessary check with unestablished applicability. The seven focused case results are unchanged. Official source: [Apple in-app subscription troubleshooting](https://helpcenter.multitracks.com/en/articles/4986799-troubleshooting-playback-and-chartbuilder-apple-in-app-subscriptions).
