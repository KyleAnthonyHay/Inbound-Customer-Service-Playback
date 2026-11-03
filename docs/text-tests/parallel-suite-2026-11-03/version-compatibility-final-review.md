# Final combined candidate: version and compatibility cohort

Seven attempted conversations, six evaluable logical variants for cases 4–6. One original case 5 v2 request had a zero-turn transport failure; its exact opening/private facts were evaluated in a fresh, separate replacement. The failure was retained, not overwritten or counted as a behavioral pass.

All model calls finished before the source hash check at `2026-11-03T07:23:28.616Z`, which matched `final-config.json`. See [completion proof](final-version-compatibility/cohort-completion-proof.json). No further inference or shared-source edits were made by this reviewer after that checkpoint. The root may separately document a subsequent focused retrieval change; these transcripts describe this frozen candidate.

Development Vapi Chat/text-harness evidence only. No voice calls, production changes or real staff contacts. Reviewer expectations stayed private. Caller outcomes were reported only after applicable guidance; unfamiliar app/OS readings required navigation. There was no technical diagnosis, update hint, routing answer or tool suggestion supplied to force the expected recovery.

## Per-variant outcomes

| Logical variant / report | Turns | Assessment | Reported cost |
| --- | ---: | --- | ---: |
| [04-false-expired-v1](final-version-compatibility/04-false-expired-v1.json) | 8 | Core recovery pass. Checked active demo account; collected actual app 8.6.1 and guided iPadOS 18; qualified release comparison, guided App Store update, fictional recovery, further-help question, endCall/farewell. Redundant Restore Purchases attempt remains an efficiency caveat. | $0.2317 |
| [04-false-expired-v2](final-version-compatibility/04-false-expired-v2.json) | 11 | Core recovery pass. Clarified actual warning/purchase origin; asked for account email, then successfully offered Organization ID when that undefined fixture fact was unavailable; checked active account and current device/version/OS; qualified update, fictional recovery, proper closing. No premature referral. | $0.4230 |
| [05-supported-setup-v1](final-version-compatibility/05-supported-setup-v1.json) | 4 | Core capability-advice pass. Identified 4i4, stated four-output/Premium/powered-hub conditions, and answered band/room capability without an Audio Device walkthrough or claiming the actual connection was tested. Proper further-help/closing. | $0.1023 |
| [05-supported-setup-v2 original](final-version-compatibility/05-supported-setup-v2.json) | 0 | **Transport failure, not evaluable.** `fetch failed`; harness finished/cleaned its own generated text ID. No response/usage-cost report was received, so the zero accumulator is not evidence of zero upstream cost. | Unreported |
| [05-supported-setup-v2 replacement](final-version-compatibility-replacement05v2/05-supported-setup-v1.json) | 6 | Core advice goal met after one natural mode clarification. Identified model and band/room goal, stated and confirmed Premium for independent bus routing; then unnecessarily asked for current Audio Device. Caller clarified pre-use advice rather than setup; agent answered conditional hub/Premium capability and closed correctly. Initial mode assumption remains a caveat. | $0.1926 |
| [06-borrowed-mixer-v1](final-version-compatibility/06-borrowed-mixer-v1.json) | 6 | Correct uncertainty/escalation workflow. Identified Mackie immediately, stated unverified exact USB capability and relevant conditions, offered expert review without asserting incompatibility; unavailable team → exact-time lookup → full contact/time readback → explicit approval → successful demo reservation → verified confirmation in endCall/farewell. Underlying compatibility remains unresolved. | $0.2009 |
| [06-borrowed-mixer-v2](final-version-compatibility/06-borrowed-mixer-v2.json) | 6 | Same correct review/callback workflow for explicit USB-socket opening. No Auto-Pan/analogue substitution. Underlying compatibility remains unresolved. | $0.2149 |
| **Totals** | **41 evaluable replies** | **7 attempts / 6 evaluable variants / 1 preserved transport failure.** Six core targets met, with qualifications above; this is not a production reliability estimate or a clean score for every utterance. | **$1.3654 reported** |

## Replacement mapping and transport isolation

The original `final-version-compatibility/05-supported-setup-v2.json` is untouched and still records `failure: fetch failed`, zero turns, `done:true`, `cleanupComplete:true`. A new generated text-test ID was used in a separate folder. The replacement contains exactly the original v2 opening and private `reviewOnly` material, with the same configuration fingerprint. The one-opening subset is numbered v1 by the harness, so its folder/report must be mapped back to **logical case 5 v2**, not counted as another v1 success.

[Replacement mapping proof](final-version-compatibility/replacement-map.json) asserts the identical opening/private facts/configuration and retained original. It is metadata, not a conversation. The original failed run's own live history was checked absent and it had no callback booking. No reservation was retried.

## Notable behavior

### Paid-account investigation remained available under both phrasings

Both variants independently used the caller's 8.6.1, not historical record version notes, and guided the novice to iPad Settings → General → About before accepting iPadOS 18. Their final release comparisons had complete prerequisites before the update instruction and fictional recovery. The active account was checked before treating the warning as a version symptom. Neither simply sent the caller to a callback after a generic step failed.

V2 asked whether payment was through Apple or MultiTracks, then correctly distinguished the website purchase. Its request for an account email was legitimate, but the fixture defines an Organization ID/name rather than an email. The reviewer did not invent an account address; the caller said it was not to hand and asked for another way. The agent guided the existing six-digit Organization ID, verified active subscription, and continued. This is a fixture-availability caveat, not a model error for choosing an otherwise supported identifier.

### Capability conditions now stayed attached to the offered routing method

V1 explicitly said the 4i4 has four outputs, needs a powered USB hub on iPad, and that the offered separation uses Premium for MultiOuts. V2 replacement also explicitly tied Premium to independent bus routing, obtained confirmation, and repeated hub/Premium conditions in its final answer. This corrects the earlier omission for the offered multi-output route. It does not impose Premium on every possible basic two-feed/Auto-Pan arrangement or a hidden independent-cue-control requirement.

The replacement's vague opening did not explicitly state advice/pre-use mode. Asking a current Audio Device question at turn 4 was an unnecessary assumption before clarifying that mode. The caller then stated the predeclared fact that the equipment was not connected and only capability advice was wanted. That was ordinary goal clarification, not a technical fix hint. The next reply respected it:

> “This setup supports sending music to the room separately from click and guide for the band through the Focusrite 4i4, using a powered USB hub and Playback Premium.”

Thus this is a repaired conversational path with a remaining initial detour, not evidence of perfect mode inference from a vague sentence. The exact Script 5 v1 opening did not produce that detour.

### Both borrowed USB variants offered review without substituting an analogue path

Both asked the mixer make/model immediately and acknowledged that the exact Mackie USB configuration could not be confirmed from bounded Playback guidance. They did not say that being unlisted proves incompatibility. Both offered a specialist review at turn 2, so the caller did not have to supply a human request or repeatedly state technical unknowns before the offer.

The second opening is now the existing explicit “USB hole” wording, aligning its expressed connection method with the private scenario. That fixture change must be included when comparing it with the earlier vague “can we plug our iPad into it?” variant. Improvement in that variant cannot be attributed solely to prompt changes; the unchanged explicit v1 opening also improved.

### Callback completion stayed distinct from availability

Both case 6 runs used proposal/readback phrasing (“Shall I book…”), with date/time, Eastern zone and the provided demo number. Only after approval did they call reserve_callback. Both bookings were verified `confirmed` in Convex, and both endCall results' `speak` and actual final replies contained the demo callback confirmation plus branded farewell. Availability lookups never became staff-notified or connection claims.

Only those two generated test bookings were removed; their 11:00/11:30 AM slots were verified open afterward. [Cleanup/confirmation proof](final-version-compatibility/callback-cleanup-proof.json). Successful callback handling is not resolution of the underlying hardware question.

## Scope and remaining limitations

- Six evaluable runs ended with endCall and the full farewell; the one zero-turn transport attempt did not produce behavior to grade.
- No known default tool-start filler phrases appeared in the 41 actual replies. No strings were stripped or rewritten after generation.
- V1 still repeated Restore Purchases before being told it had already failed, and the vague compatibility opening still needed a normal scope clarification. These are retained efficiency/interpretation limits.
- Both setup advice and update success remain fictional role-play. The final answers do not verify actual equipment operation or repair telemetry.
- All seven attempted run records have `done:true` and `cleanupComplete:true`. The failed ID had no booking/live history; the two positive booking rows were individually cleaned and their slots reopened. No real call history was deleted.
- This does not test GPT-Live speaker delegation, recognition, timing, interruption handling or actual post-farewell disconnect. No automated voice simulation was run.
