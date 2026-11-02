# Conversation friction — November 2

Development is synced and localhost is serving `/call`. [Jordan's concise sheet](../jordan-voice-tests.md) is the caller-facing document. [Configuration read-back](conversation-friction-activation.json) verifies the saved dev definition, native `endCall` attachment and localhost HTTP 200. Production was not written; no voice calls were launched.

## Changes

- **Clarification:** unknown device/configuration stays unknown. Ask openly when it matters, reuse supplied facts, gather one observation at a time, explain unfamiliar controls and check the caller's result. Conversation guidance moved ahead of diagnostic policy; a final reply check reinforces these general principles without a symptom-specific decision tree.
- **Holding language:** removed the speaker's requirement to announce a lookup before every delegation. Simple answers can receive a short acknowledgment; genuine work can receive one truthful holding line. The reasoner should not add another.
- **Closing:** closing intent takes priority over the speaker's small-talk permission. It must delegate an end request; the reasoner must call native `endCall` after the caller declines further help. A resolution alone permits a short “anything else?”; “please wait” does not end the conversation. No browser keyword-disconnect workaround was added.
- **Tests:** twenty curated openings now use ordinary speech. Reviewer facts stay outside requests, and follow-ups answer the actual question. The runner pins speaker/reasoner instructions, tool definitions and the text adapter, and allows twelve turns so natural clarification is not squeezed into a leading script.
- **Caller sheet:** ten cases grouped by intent, with a natural opening, labeled facts (including exact versions/IDs) and a concrete action/result beside each. No separate answer-bank section.

## Results — outcomes and dialogue quality are separate

| Evidence | Result |
|---|---|
| Local checks | 73/73 tests; TypeScript, targeted ESLint and whitespace checks pass. |
| [Eight complete candidate conversations](natural-conversation-final-2026-11-02/) | 8/8 expected **scripted task outcomes**: six reported fixes and two successful simulated handoffs. All four routing cases still had a technical/alternative-choice detour; this was not a clean dialogue pass. |
| [First clarification retest](plain-question-retest-2026-11-02/) | Two no-sound paths asked simple questions; two click/guide paths retained technical choices. Stopped at the clarification checkpoint and preserved the failures. |
| [Final five conversations](plain-question-final-2026-11-02/) | Four routing paths reached caller-confirmed fixes; the human control executed handoff. Three unknown-device openings were neutral; the known-Mac path reused Mac. No competing technical-choice questions in these final traces. |
| Final repair behavior | “I don't know what a fader is” received “the slider you drag up or down.” That run still had an avoidable app-volume detour before locating the external-mixer problem. This remains a quality limitation, not proof of perfect consistency. |
| Exact routing/device steps | Both click/guide runs reached **Guide → 2, Click stays 1** after asking what outputs showed. Both no-sound runs selected **Focusrite 4i4 instead of MacBook Speakers**. |
| Wait / closing controls | “Please stay on” received “take your time”; four resolved conversations accepted “that's everything” with a brief goodbye and no further lookup. This proves text intent handling only. |

Caller-reported recovery was scripted after the applicable action. These runs did not operate Playback or verify physical audio. The final five use the final saved prompt; the earlier eight use its preceding candidate. They are not combined into a single final-version pass rate.

## Diagnostic checks and extra work

The candidate subscription case checked the organization record, purchase channel and selected organization before asking for installed **8.6.1**. It then obtained iPad/iPadOS **18**, compared once, retrieved current **8.6.4** and minimum iPadOS **15.6**, found the **8.6.3** false-expiration note and recommended a targeted attempt without promising recovery. The tool assessment had no missing facts/blockers. The caller then reported the warning gone.

No version/release or account lookups were required in the clear wrong-output paths. Both human controls skipped device, documentation and service-plan checks and actually called `initiate_handoff` after availability. The permission offer waited for acceptance. No service-list retrieval was forced into unrelated routing.

Documentation was sometimes searched before platform clarification, then again after Mac or the interface was known. Changed context can justify these searches; the initial broad lookup was avoidable in some runs. Final exact-phrase click/guide still spent a turn on app-volume controls. These are dialogue/efficiency findings, separate from successful scripted resolution. Classic Chat's configured tool-start lines appear in these transcripts; they are not evidence of live speaker holding behavior.

## Voice verification still required

**Actual hang-up and spoken holding-line delivery are unverified.** Text Chat omits native `endCall` and adapts it to a goodbye; it also omits GPT-Live speaker delegation. The saved dev speaker/reasoner rules and tool attachment were checked, but a spoken goodbye is not a disconnect test. Vapi recommends checking call messages for `endCall` and the ended reason, alongside the recording for delivery ([official testing guidance](https://docs.vapi.ai/gpt-live/testing), [conversation guidance](https://docs.vapi.ai/gpt-live/design)).

For the next manual browser call: use Jordan's case 1, answer naturally, then say “No, that's everything.” Check that the call disconnects through `endCall`, rather than silence timeout. On another turn say “Give me a second, please stay on”; it should give you room. Listen for repeated lookup announcements during simple answers. No automated/billable voice simulation was run, respecting the existing testing boundary.

## Audit trail

All isolated text records were cleaned up; saved transcripts remain. There were no request failures. Vapi reported text usage:

| Run | Conversations / turns | Reported cost |
|---|---:|---:|
| [Transport exploration](natural-conversation-2026-11-02/) | 8 / 15 | $0.2246 |
| Complete candidate | 8 / 47 | $0.4876 |
| Clarification checkpoint | 5 / 9 | $0.1647 |
| Final focused run | 5 / 28 | $0.3671 |
| **Total** | **26 / 99** | **$1.2440** |

The transport exploration changed Chat tool-start rendering between phases and is explicitly excluded from pass counts. That experiment was reverted. The stronger configuration fingerprint now prevents mixing adapter changes. These are development text POCs, not the ten manual voice conversations for the presentation.
