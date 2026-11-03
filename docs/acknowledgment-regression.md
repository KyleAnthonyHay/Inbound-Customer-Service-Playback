# Duplicate acknowledgment regression

The November 2 development call repeated acknowledgments in the spoken layer:
“Okay, got it,” then later “Thanks.” followed by “Thanks, that's helpful.”
Its reasoner output did not contain the repeated Thanks. A reasoner-only text
check cannot establish whether the GPT-Live speaker change fixes this.

`npm test` now includes a regression using those actual spoken excerpts and
controls for synonymous filler, a single acknowledgment followed by substance,
fresh caller turns, quoted words and the branded goodbye. The test verifies
that the checker catches the known defect; it is not a new passing voice call.

Check an exported final transcript without creating a call or using credits:

```sh
npm run test:acknowledgments -- docs/call-reviews/latest-closing-regression.sanitized.json
```

The old call intentionally returns exit code 1 with three findings:
“Okay, got it”; “Thanks” followed by “Thanks”; and “Okay” followed by “No problem.”
The same command accepts safe call-review `dialogue`, voice-test `transcript`,
and text POC `turns` exports. Findings use one-based dialogue message positions.
It rejects unsupported, empty and failed reports. Future authorized voice-test
runs also save these findings and return failure if duplicates are found.

This is a conservative check of acknowledgment **openings** across assistant
segments responding to one caller turn. It does not judge all repetitive
language, tone, audio, overlap, or whether a fragmented caller utterance was
incorrectly split into turns. A clean result still needs listening review.
New caller speech resets the allowance. The branded sign-off passes by itself;
a separate acknowledgment before it is now a `closing-prelude` failure.

## Focused development check

The separate [text fixture](../scripts/text-cases/acknowledgment-regression.json)
uses a novice song-loading caller. Start it through the existing phased harness:

```sh
npm run text:cases -- start <empty-directory> scripts/text-cases/acknowledgment-regression.json --first-opening
```

Inspect each response before submitting the next caller observation. For a
manual dev voice replay, use the same fixed facts: iPad; Graves Into Gardens
won't open; already tried once. Read “Audio Files Missing” when asked. After
guided retries, the second total attempt fails and the third opens the song.
Answer the further-help question with “No, that's everything. Thank you.”
Don't volunteer a fix or report recovery before the matching instruction.

Success requires at most one acknowledgment per caller turn across the holding
line and answer, a substantive next question/step, completed caller speech, and
the branded goodbye before disconnecting. Audit the exported final dialogue,
then listen for duplicates or overlap absent from the transcript. This does not
add to the ten curated conversations. No automated voice run is authorized by
adding this test.

## Observed results

- Local suite: 108 tests passed; TypeScript and targeted ESLint passed.
- Recorded failing call: three findings, exit code 1 as expected.
- [Fresh four-turn text POC](text-tests/acknowledgment-regression-2026-11-02/acknowledgment-regression-v1.json):
  no matching duplicate openings, exit code 0. It asked for the error, used the
  prior retry count, asked about further help and returned the branded goodbye
  through `endCall`. Reported text cost: $0.0471; isolated logs cleaned up.
  The text transport also returned “This'll just take a sec” before its first
  question and “Hold on a sec” before goodbye; these are not acknowledgment
  duplicates, and their presence is not evidence of what the voice speaker says.
- Fresh voice replay: pending. No new voice calls or production changes were made.

The subsequent [closing/context update](call-closing.md#follow-up-browser-goodbye-without-disconnect)
adds the separate-thank-you regression, actual last-two-message context and
browser audio-completion tests. Its focused text retest also has no matching
duplicate acknowledgments; fresh voice behavior remains a manual check.
