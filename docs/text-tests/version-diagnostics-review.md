# Version diagnosis and release-history comparison — November 2, 2026

**Subsequent policy change:** The user removed time availability as a required check after this comparison. The current local prompt assumes callers can troubleshoot, asks no timing/readiness questions, briefly explains disruptive effects, and honors volunteered constraints. Installed/current-version and compatibility checks remain required. The results below preserve the earlier requirement and configuration as historical evidence; they have not been retroactively rescored, and the current timing wording was not used in these model runs.

Implemented locally and tested, with remaining behavior failures. These changes are **not synced to either saved assistant**. Do not treat this report as a passing activation or voice validation.

## What changed and why

The failed baseline subscription traces verified an active demo account, searched general documentation, tried Apple Restore Purchases without knowing the billing provider, and offered escalation after it failed. Neither asked for the installed version before escalation; both found the 8.6.3 false-expiration fix only after the caller volunteered 8.6.1.

The shared prompt now prioritizes clear account/configuration evidence, then considers version-specific defects when account/configuration and documented behavior leave a symptom unexplained. It distinguishes useful missing diagnostic facts from evidence unavailable to the support line, rather than treating an unsuccessful general-doc search as the end of documentation. Historical account notes do not verify the caller's current installed version. This remains a general diagnostic principle, without symptom lists or mandatory update checks.

The documentation-search description now points to release history when relevant. It accurately distinguishes help articles/manual retrieval from `get_relevant_changes_since_version`, which retrieves release notes. The release tool description emphasizes matching across **all available history**, including historical fixes, and avoiding routine comparisons for clear configuration explanations. Current-app guidance distinguishes current-version metadata from platform requirements.

The release helper already searched all 11 stored releases; it had no latest-three limit to remove. A new mocked regression test proves that the 8.5.2 stuck-download-bar fix remains discoverable from 8.5.0 even though it is older than the three newest stored releases. This is bounded stored history, not a claim of complete published-history coverage.

Before recommending an update, the prompt requires verified installed/current versions, applicable device/platform/OS compatibility and time to update/test. It prohibits guarantees, requires confirming the original symptom afterward, and preserves reported metadata/history gaps. No backend deployment or API implementation change was needed for this work.

## Method and provenance

- Preserved the original 20 saved conversations and their baseline configuration. The two new control fixtures ran in four conversations under that same old configuration before any prompt change.
- Replayed all 20 original opening messages exactly, plus two phrasings each of an unfamiliar stuck-progress symptom and an explicit wrong-Audio-Device control: **24 final conversations, 76 turns, zero request failures**.
- Follow-ups answered actual questions from fixed fixture facts, rather than blindly replaying answers to different questions. Reviewer notes and expected fixes were not sent to the model. This is an adaptive fixture comparison, not a verbatim replay of every caller turn or a randomized causal experiment.
- The silent-interface follow-up in the final run explicitly described the Mac's left/right outputs, matching the information used in baseline variant B; baseline A had only described missing interface outputs. Its faster recovery cannot be attributed solely to the prompt change.
- Added supplemental platform facts for update checks: iPad Air 5 / iPadOS 18. The caller supplies them when asked; these were not present in the original subscription baseline. For the unfamiliar fixture, version 8.5.0 is a simulated pre-fix assumption, not proof that all installations on that version exhibit the defect.
- Caller-reported recovery is **scripted**, not real device telemetry. Permission cases checked callback availability and declined booking. All handoffs/staffing/customer records are simulated; zero callback reservations were made.
- Actual read-only tool requests used the development backend: Planning Center returned fictional Regal Playback Demo planning metadata; Apple supplied current-version/OS metadata. Documentation was the stored official-source snapshot and Pinecone manual retrieval, not live web search. Returned current version was 8.6.4; stored release notes end at 8.6.3, a reported coverage gap.
- Transient Vapi Chat configurations used the local shared instructions/tools. No phone calls or voice simulations were launched, and neither saved agent nor backend was updated.

## Earlier appropriate investigation — separate from outcomes

| Check | Saved baseline | Final run | Interpretation |
| --- | --- | --- | --- |
| Ask installed version before premature escalation, false-expired case | 0/2 | 1/2 | B asked at turn 2 and compared at turn 3. A still offered escalation at turn 2 and needed the same unsolicited version hint at turn 3. |
| Investigate version independently, unfamiliar stuck-progress case | 0/2 | 2/2 | Both final variants asked at turn 1 and found the matching historical 8.5.2 note at turn 2. Baseline variants escalated without investigating version. |
| Combined independent version investigation | 0/4 | 3/4 | A diagnostic-selection result, not four safe update recommendations. |
| Verify actual audio-device selection, original silent-interface case | A never; B turn 4 | Both turn 2 | Both final variants used the reported Mac-only outputs to select the interface; see the follow-up qualification above. |
| Follow explicit wrong-output evidence first | 2/2 | 2/2 | Both old and final controls selected the already-listed interface without a release lookup. The supplied old version did not distract the agent. |

Both final unfamiliar variants retrieved the actual 8.5.2 matching note. Finding a later version is not itself proof of an individual root cause or recovery.

## Unnecessary lookups — separate from diagnostic passes

- **Original 20 cases:** release-comparison calls fell from 7 to 2. The two subscription comparisons were relevant in both configurations, although baseline and final A were caller-assisted. Five baseline comparisons were unnecessary for the immediate decision: click/guide A+B, silent-interface A+B, and the already-live unresolved-loading B. None of those five comparisons recurred in the final run.
- **New explicit wrong-output control:** zero release/current-version calls in both baseline variants and both final variants. This control stayed passing; it did not improve from a failure.
- **Final unfamiliar cases:** two relevant release comparisons. Together with the two subscription calls, there were four final release comparisons, all relevant to the symptom once the installed version was supplied.
- **Final current-app calls:** three, each retrieving minimum OS information absent from the comparator's output. These are justified compatibility checks, not redundant current-version-only lookups. Subscription A omitted this compatibility check entirely.
- General-doc search calls in the original 20 fell from 29 to 27 in the final original subset (31 including the four new controls). This is a raw retrieval count, not an automatic inefficiency score; later searches can supply new menu paths or requirements.
- The final run stopped using service context for compatibility and organization navigation. Both unfamiliar cases still fetched service metadata that did not explain a multi-song download defect. Both loading-recovery variants still recited all three demo song titles. These remain relevance/style costs, separately from the version result.

## Pass/fail changes and update prerequisites

Use the diagnostic and update-safety columns separately; a scripted successful outcome does not erase an earlier failure.

| Variant | Independent diagnosis, baseline → final | Final pre-update gate | Final caller outcome |
| --- | --- | --- | --- |
| False-expired A | Fail → **Fail** | **Fail:** recommended updating without verifying OS/device compatibility; also inferred available time from “not in a service.” | Scripted recovery after a caller-supplied version hint. |
| False-expired B | Fail → **Pass** | **Pass:** caller confirmed 8.6.1 and iPad Air 5/iPadOS 18; tools verified current 8.6.4/minimum OS; caller had already said there was time. | Requested and received scripted symptom confirmation. |
| Unfamiliar A | Fail → **Pass** | **Pass:** verified 8.5.0/current 8.6.4, iPad Air 5/iPadOS 18 compatibility, and used rehearsal-tomorrow context with time to test. | Requested and received scripted download recovery. |
| Unfamiliar B | Fail → **Pass** | **Fail:** versions and compatibility checked, but “we're not live” was treated as enough time to update/test without establishing that time. | Requested and received scripted download recovery. |

Strict pre-update prerequisites passed in **2/4 final update paths**. Neither old unfamiliar path reached an update; both old subscription paths recommended updating after the hint without verifying OS compatibility. Those baseline paths did not establish safe update behavior. All four final recommendations avoided promising that an update would definitely fix the caller's device; all four asked for the original symptom's outcome. Separately, loading-recovery B said “your setlist should be ready” after only one song recovered, which overstates the confirmed scope.

## Wider-case review and regressions

| Original case | Baseline → final reviewed behavior |
| --- | --- |
| Click/guide | A remained appropriate; B still gave pre-7.6 bus-creation instructions before knowing applicability. Later correction does not erase that instruction. |
| Routing after reconnect | Both restored the stated 3/4 music routing; neither proved why reconnection changed it. |
| Silent interface | Both final variants reached the Audio Device setting and scripted resolution without release checks. Baseline A escalated; B resolved after detours. Follow-up wording differed as noted above. |
| False subscription expiry | Independent version investigation improved only in B. Both still tried Apple Restore Purchases before learning billing provider; its applicability was unestablished at that point. A quick attempt while billing channel is unknown is defensible; it should be skipped once website billing is known. The baseline failure was premature escalation and the need for a caller-supplied version hint, not this attempt alone. |
| Supported setup | Both answered the compatibility goal. Final B added “Premium is not needed for those output feeds,” unsupported by its retrieved sources; baseline had not added that claim. Mark that factual extension as a regression, not a clean pass. |
| Borrowed mixer | Both final variants acknowledged missing verification but did not offer a specialist until directly requested. B regressed from an earlier appropriate offer; A retained its failure. Neither should treat absence from the tested list as proof of incompatibility. |
| Wrong organization | Both reached scripted library recovery. A produced a malformed repeated sentence; B unnecessarily asked for sign-out even after the caller described an existing organization picker. |
| Missing permission | Both respected the administrative boundary, offered the account team, checked the busy-team callback path, and booked nothing after the caller declined. |
| Loading recovery | Both used the documented third-retry procedure and asked for caller confirmation. Full-setlist recitals remain unnecessary. |
| Loading unresolved | Both respected failed retries/live timing and completed accepted simulated handoffs. |

No single overall green score is presented: independent diagnosis, safe update gating, factual extensions and eventual scripted recovery measure different things. The saved baseline's 15/20 core-case review remains unchanged in its original report. The results above do not establish statistical reliability or voice parity.

## Iteration, costs and validation

The first local revision helped unfamiliar-symptom retrieval but one subscription variant still escalated, and another treated a historical customer note as the installed version. This motivated clarifying the diagnostic/escalation conflict and historical-record freshness, rather than adding a symptom-specific rule.

The first revision had one transport failure before a response was recorded. That failed run remains saved and was not silently counted as a behavioral failure/pass. A separate fresh replacement conversation tested that opening; no uncertain request was automatically retried. The final 24-conversation run had no transport failures.

Recorded text-model costs: new baseline controls $0.1311; first revision $0.9279; explicit replacement $0.0789; final revision $1.0742. **Recorded new usage total: $2.2121** (provider-reported, not a billing reconciliation). The older saved 20-run baseline cost $0.9384 and was reused, not rerun under the old instructions. Every isolated run log was closed and cleaned up.

All **58 local tests**, TypeScript, targeted ESLint and whitespace checks pass. Local tests include mocked Apple/Planning Center responses; those are distinct from actual text-model runs and actual read-only API tool results.

Read-only hash checks verified saved development and production assistants were unchanged. The final local prompt therefore intentionally differs from the saved development assistant. No deploy, assistant sync, phone call, paid voice simulation, real account modification or real device operation was performed.

## Evidence and reproduction

- [Original baseline review](curated-phrasing-review.md) and [saved transcripts](curated-variations/2026-11-02-phrasing/).
- [Old-configuration new controls](version-diagnostics/baseline-controls/).
- [Final 24 transcripts](version-diagnostics/final/) and [run totals](version-diagnostics/run-summary.json).
- Redacted definitions: [baseline](version-diagnostics/baseline-definition.json), [first revision](version-diagnostics/first-revision-definition.json), [final](version-diagnostics/final-definition.json). All transcripts within each run match its definition hash; configurations were never mixed mid-conversation.
- [Saved-agent hash comparison](version-diagnostics/saved-agent-hashes-after.json).
- Fixtures: `scripts/text-cases/version-diagnostics.json`; originals: `scripts/text-cases/curated.json`; controls: `scripts/text-cases/version-controls.json`.
- Run `npm run text:cases -- start <new-empty-directory> scripts/text-cases/version-diagnostics.json`, inspect actual questions, then supply reviewed fixture replies with `npm run text:cases -- reply <directory> <replies.json>`. The `version-final-02` through `version-final-05` reply files record this final path; they are not safe blind scripts for a different path. Mark each run done to clean its isolated logs.

This is a local candidate with demonstrated improvements and documented remaining failures, not a change approved or deployed to the saved voice agents.
