# Editable demo calls panel — development

The Activity drawer now has a separate Demo calls view initialized from the original ten manually selected browser voice role-plays. Membership is persisted in Convex `demoCallSets`; the source calls and immutable `evaluationRuns` snapshot are preserved.

Initial scores: expected intent match **10/10 (100%)**, containment **7/10 (70%)**, overall resolution **7/10 (70%)**. These are the original calls, not a voice retest of later prompt changes.

Browser verification on localhost:

- Ten scenario slots and the three independent scorecards render.
- Removing scenario 6 changes the cohort to nine; containment and resolution become 7/9 (78% rounded), and the removed call appears in the working history.
- Choosing that preserved call and saving restores the original ten and 100%/70%/70%.
- The replacement picker explains when no other eligible call exists; it requires an independently assigned scenario and a completed voice review, regardless of score.
- Open call shows the original stored transcript.

`verification.json` records the readback assertions. Source labels, reviews and archive state match `baseline.json`; all original exported snapshot fields and metrics match after normalizing the safe export's flattened review fields. All ten source call IDs remain selected after testing.

Validation: 176 unit tests passed; typecheck, lint and diff whitespace checks passed. Convex development schema/functions deployed successfully. No voice calls, paid model inference or production writes were performed for this UI change.
