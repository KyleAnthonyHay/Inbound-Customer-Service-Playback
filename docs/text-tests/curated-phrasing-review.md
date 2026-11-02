# Curated phrasing review — November 2, 2026

**Not uniformly consistent yet.** Twenty actual text conversations exercised the ten selected cases with two fresh opening phrasings each. Six case pairs met the reviewed core objective in both variants; four exposed material inconsistencies or missed diagnostic opportunities. There are also style and efficiency notes.

All **20 conversations / 67 turns** finished without failed API requests, under one unchanged prompt/tool configuration. All isolated tool logs were cleaned up. Vapi reported **$0.9384** in text-model usage. No voice calls were created.

## Reviewed case outcomes

| Case | Phrasing results | Evidence / qualification |
| --- | --- | --- |
| 1. Separate click and guide | A: met objective. B: initially wrong procedure. [A](curated-variations/2026-11-02-phrasing/01-click-guide-v1.json) · [B](curated-variations/2026-11-02-phrasing/01-click-guide-v2.json) | Both eventually resolved, but B applied pre-7.6 bus-creation instructions before checking the version and corrected only after challenge. |
| 2. Routing after reconnecting | Both met core objective. [A](curated-variations/2026-11-02-phrasing/02-reconnect-v1.json) · [B](curated-variations/2026-11-02-phrasing/02-reconnect-v2.json) | Restored the caller-specified music output arrangement from documented guidance. No verified explanation for why reconnection changed it. |
| 3. Wrong audio device | A: premature escalation. B: resolved with detours. [A](curated-variations/2026-11-02-phrasing/03-audio-device-v1.json) · [B](curated-variations/2026-11-02-phrasing/03-audio-device-v2.json) | A never checked Audio Device selection. B eventually found the setting after multiple bus/hub checks. |
| 4. False subscription expiration | Both needed a caller version hint. [A](curated-variations/2026-11-02-phrasing/04-false-expired-v1.json) · [B](curated-variations/2026-11-02-phrasing/04-false-expired-v2.json) | Both tried Apple Restore Purchases without knowing the billing provider, then offered escalation. Supplying 8.6.1 unprompted triggered the documented fix; that is assisted recovery, not independent diagnosis. |
| 5. Documented compatibility | Both met core objective. [A](curated-variations/2026-11-02-phrasing/05-supported-setup-v1.json) · [B](curated-variations/2026-11-02-phrasing/05-supported-setup-v2.json) | Confirmed the documented Focusrite/powered-hub arrangement; B added a redundant OS question and unnecessary service lookup. |
| 6. Borrowed mixer | A: delayed offer. B: appropriate review. [A](curated-variations/2026-11-02-phrasing/06-borrowed-mixer-v1.json) · [B](curated-variations/2026-11-02-phrasing/06-borrowed-mixer-v2.json) | Both asked for the exact mixer and ultimately completed a simulated handoff. A suggested trying the unverified connection and offered review only after another request for confirmation. |
| 7. Wrong organization | Both met core objective. [A](curated-variations/2026-11-02-phrasing/07-organization-v1.json) · [B](curated-variations/2026-11-02-phrasing/07-organization-v2.json) | Guidance led to caller-reported library recovery. Service-context reads did not help this account-navigation decision. |
| 8. Missing permission/seat | Both met core objective. [A](curated-variations/2026-11-02-phrasing/08-permission-v1.json) · [B](curated-variations/2026-11-02-phrasing/08-permission-v2.json) | Respected admin boundary and offered human help. Billing was busy, so checked callback availability; no reservation after caller declined. |
| 9. Loading recovery | Both met core objective. [A](curated-variations/2026-11-02-phrasing/09-loading-recovery-v1.json) · [B](curated-variations/2026-11-02-phrasing/09-loading-recovery-v2.json) | Used the real documented error and retry procedure; caller reported simulated success. Both recited the full three-song plan, and A asked two questions together. |
| 10. Loading unresolved | Both met core objective. [A](curated-variations/2026-11-02-phrasing/10-loading-unresolved-v1.json) · [B](curated-variations/2026-11-02-phrasing/10-loading-unresolved-v2.json) | Respected prior failures/timing and completed consented simulated handoffs without forcing deletion. |

## What the labels mean

The structured review records 15 variants meeting the core case criteria and five with a material issue. This is a qualitative review of a small, curated text sample, not a statistical reliability estimate, production resolution rate or voice pass rate. A later correct answer does not erase an earlier wrong instruction or an essential unsolicited caller hint.

Expected fixes and reviewer notes were not sent to the agent. Only opening text and subsequent caller replies were sent. Follow-ups were written after inspecting the actual question. Additional caller facts supplied during the run included the silent-interface make/model and website billing for the subscription case; those have been added to the worksheet for future replay. Some runs include explicit corrective or unsolicited clues, identified above rather than treated as independent successes.

## General improvements indicated by the evidence

1. Respect source applicability before instructions. Keep useful older sources, but do not apply version-specific procedures before the version is known or outside their documented range.
2. Clarify basic missing diagnostic evidence before concluding no supported resolution exists. In this sample, installed version and actual Audio Device selection mattered; these should remain general diagnostic judgments, not hard-coded scenario branches.
3. Pair an unresolved, unverified answer with a specialist offer. A hardware experiment should not silently replace that offer.
4. Keep proactive service context brief and relevant, with one clear next question. Multiple successful paths still had unnecessary context lookups or full-setlist recitals.

The saved support agent, tool descriptions, backend functions and production deployment were not changed during this audit. These are findings and candidate general improvements, not a claim that the issues have been fixed.

## Provenance and limits

- Help articles and release notes came from stored official-source snapshots; manual sections came from the live Pinecone index.
- Planning Center and Apple responses were actual read-only API requests. Demo customer records, organization observations, staffing and handoffs are simulated.
- Reported song recovery, routing recovery and subscription recovery are scripted caller observations, not Playback device telemetry.
- Permission variants checked an available callback time but declined booking. They do not verify positive callback-reservation completion.
- Vapi tool holding messages may appear alongside the final text response. This harness does not test the GPT-Live speaker, speech recognition, interruptions, timing or voice end-call behavior.
- These twenty development checks are separate from the user’s ten later manual presentation conversations.

## Reproduce and inspect

- [Caller worksheet](../curated-caller-worksheet.md)
- [Selected plan](../conversation-test-plan.md)
- [Structured review](curated-variations/2026-11-02-phrasing/review.json)
- Case definitions: `scripts/text-cases/curated.json`.
- Start a fresh text run: `npm run text:cases -- start <empty-output-directory>`.
- Submit reviewed follow-ups: `npm run text:cases -- reply <run-directory> <replies.json>`.
- The current follow-ups are under `scripts/text-cases/replies/`. They capture this particular conversation path; inspect new replies before replaying them, since wording can change the questions.

Local validation: all 57 existing unit tests, TypeScript, targeted ESLint and whitespace checks pass. Actual model behavior findings above remain separate from those local checks.
