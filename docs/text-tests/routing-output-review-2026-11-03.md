# Click/Guide routing regression — November 3

**Follow-up:** the blanket physical-output mapping prerequisite introduced here was subsequently removed after it blocked Script 3's basic Audio Device check. See the [no-audio/callback follow-up](audio-device-callback-review-2026-11-03.md). The evidence below records the earlier candidate and its limits.

## Observed voice failure

The caller wanted independent levels at the sound desk. The agent proposed creating a Guide bus and then adjusting a bus fader even after the caller said the Guide bus already existed and both Guide and Click were assigned to Output 1. Separate bus names do not separate a shared physical feed.

The actual call's two documentation tool results contained the legacy article ID and its Aux-bus creation procedure. Stored tool outputs were clipped, so they were used only to confirm that exposure, not reconstruct complete results. Independent retrieval inspection confirmed the old article could rank first. The [official notice](https://helpcenter.multitracks.com/en/articles/5224107-how-to-route-click-guide-to-separate-busses-in-playback) explicitly limits that procedure to versions before 7.6. The [current routing article](https://helpcenter.multitracks.com/en/articles/4439220-how-to-track-bus-routing-in-playback) documents dedicated Click/Guide buses and bus-to-output selection. The retrieved User Guide's Buses Settings section also documents choosing an output and pressing Done.

## Changes

- Added source-stated version bounds to the legacy article. Its procedures are withheld for unknown, invalid and 7.6+ versions. Only a caller-confirmed applicable old version can retrieve those steps. Withheld metadata contains no executable procedure; current documentation remains available without a routine version question.
- Refreshed current routing guidance to distinguish tracks, buses and physical outputs. Example channel numbers remain examples, not universal defaults.
- The reasoner must establish the external connections and current assignments before choosing a destination, preserve working routes, accept concrete corrections over earlier ambiguous answers, and avoid recreating existing buses. An arbitrary spare output or an in-app level adjustment is not a substitute for the caller's external-control goal.

## Text evidence and retained failure

The existing `text:cases` harness ran two focused developer checks, separate from the ten presentation voice conversations. Reviewer facts and expected outcomes remained private. No voice sessions were created.

The [initial candidate](routing-output-regression-2026-11-03/01-click-guide-v1.json) avoided bus creation but told the caller to choose any different available output before establishing its physical destination. That run was stopped and retained as an incomplete/failed prerequisite check, not given a convenient caller answer to manufacture a pass. Its already-separated control offered specialist review, though its downstream-cause wording was too definite.

The [retest](routing-output-retest-2026-11-03/01-click-guide-v1.json) used an ordinary symptom-only opening and adaptive replies limited to the private caller profile:

1. Asked how Playback was connected.
2. After learning Mac / Focusrite 4i4 / Premium and the sound-desk goal, asked which outputs fed the desk.
3. After learning that Outputs 1 and 2 fed separate desk channels and music used 3/4, guided Settings → Buses and asked for current Click/Guide selections.
4. After both were reported as Output 1, instructed changing Guide to Output 2 and pressing Done, then checked independent control.
5. Only after that guidance did the fictional caller report successful independent adjustment. The agent then asked the further-help question and waited.
6. After the caller declined further help, it called endCall and returned the branded farewell. A separate holding line remained; this is not clean voice-closing evidence.

The [already-separated control](routing-output-retest-2026-11-03/already-separated-v1.json) offered specialist review without reassigning outputs or creating buses. It used an inference about the remaining external path, rather than verifying a particular hardware defect. This does not validate mixer diagnosis.

Some text responses still contained holding lines (for example “Just a sec”); this check does not establish that voice acknowledgments, interruptions or disconnect are fixed. Simulated caller success is not actual equipment telemetry. A fresh manual dev voice check is required.

## Local/deployed checks

146 unit tests, TypeScript and ESLint passed. Added retrieval regressions cover unknown/current/invalid versions, the exact 7.6 boundary, applicable pre-7.6 instructions and ranking current guidance for the reported symptom. A deployed, authenticated, isolated documentation-tool check returned the current article first and withheld the obsolete one. Its temporary tool log was removed. Text reports retain actual tool results and reported model costs; ending a scripted run alone is not a pass.

The saved development assistant's reasoner instructions and documentation-tool schema were updated and [read back successfully](routing-output-activation-2026-11-03.json). Speaker and artifact settings were preserved; a full production-assistant fingerprint matched before/after. Fresh calls are needed to evaluate the revised prompt without the old call's retrieved legacy instructions. The first candidate reported $0.1297 and the retest $0.2071 in text model usage; all four isolated text logs were cleaned up.
