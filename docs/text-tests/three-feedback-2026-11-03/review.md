# Three feedback changes — November 3, 2026

Implemented together on development, then validated with the existing text harness. Production was not changed. There were five focused text conversations, 26 caller/agent turns, no transport failures and **$0.8405 reported text inference cost**. These are manually steered reasoning/tool POCs, not voice simulations or a reliability estimate. Private caller expectations were not agent inputs.

## 1. Reuse organization/account information

The reported voice call already completed `lookup_demo_customer({orgId:"480113"})` before asking for email and subsequently saying it was unnecessary. The fix spans the tool contract, reasoner and speaker:

- A successful organization lookup is enough for organization subscription information. Reuse it; do not collect another identifier to reconfirm the same result.
- Person-specific membership and permissions remain separate. Use a provided unique name, customer ID or email when that evidence matters. An unresolved person is not proof of missing permissions; knowing an Organization ID is not proof of membership.
- The speaker delegates identifiers and waits for the reasoner's result instead of inventing another account question during the lookup.
- Results now explicitly include `accountContext.scope`, `accountContext.identityVerified:false`, `organizationResolution` and `memberResolution`. Member states distinguish `not_checked`, `matched`, `person_not_found`, `ambiguous` and `person_found_not_member`. Usable organization information survives a missing or conflicting person match. `diagnosisScope`/`accessScope` identify whether an answer includes a matched member. Record matching remains fictional, not authentication; no account grants or authentication system were added.

The actual resolver has deterministic tests for org-only, matched member, unknown/ambiguous person, known person outside the selected organization, invalid/absent identifiers and legacy records without membership data. Both Convex queries have strict response validators. The bounded demo name directory cannot silently declare a unique person from a truncated scan.

[Four deployed read-only contract checks](account-contract-smoke.json) verified active organization facts across the org-only, matched Sam, unrelated Olivia and unknown-person cases, with no identity-verification claim.

[Case 4's fresh text conversation](account-review.md) reused one org-only lookup, never requested name/email, collected actual app/OS versions, checked update prerequisites and obtained fictional recovery. A separate [known-member control](../2026-11-03T11-06-36-261Z-known-member-no-redundant-email.json) used Sam's provided name/Organization ID to explain the actual Team Sharing restriction without another email request. It respected the caller choosing their own admin.

## 2. Separate scenario labels from underlying intents

“Borrowed mixer” is fixture context, not an intent. The selector now says **USB connection compatibility and routing**; the stable scenario ID remains unchanged. The UI shows primary and secondary intents separately.

The observed voice review had routing primary plus compatibility secondary. The private expected-scenario matcher now accepts that combination, as well as compatibility primary with routing optional. Routing alone or an unrelated/unknown primary does not satisfy this mixed case. Other scenarios retain their existing primary expectation. Backend overview and UI use the same matcher, and the metric is labeled **expected intent accuracy** rather than implying all secondary predictions are scored for completeness.

The blind post-call extraction instructions describe caller goals and distinguish compatibility from routing, allowing substantive secondary goals without treating every diagnostic action as another intent. Expected scenario IDs/outcomes remain outside the classifier and live agent prompts. Stored predictions were not rewritten, and no historical review inference was launched.

[The actual stored mixed review now matches](historical-intent-check.json). A server-render check of that real record verified distinct primary/secondary labels, the new scenario title and the accepted combination. Unit tests exercise both valid orderings, missing compatibility, unrelated/unknown primaries, strict other scenarios and unlabeled denominators through the real overview handler.

## 3. Group callback details, retain confirmation

The blanket one-observation question rule now applies to troubleshooting, with a clear exception for related scheduling details:

1. Ask missing availability and time zone together.
2. Ask missing name and callback number together; reuse existing facts. On a partial answer, ask only for the missing part. Phone caller-ID remains an offered number requiring approval.
3. After tool-verified availability and known contact details, propose the date/time, zone and number, and obtain explicit approval.
4. Reserve only after that approval; confirm only after the successful write, then return the confirmed time and branded farewell once.

Reasoner, speaker, tool description and availability-result guidance agree on this flow. Question grouping does not remove the readback or authorize a reservation.

Both [fresh callback paths](callbacks-review.md) grouped availability/zone and name/number. Case 10 deliberately supplied only its timezone; the agent retained it and asked only for the missing day/time. Both made exactly one correct-number reservation after approval, then returned booking confirmation and farewell. Two own demo bookings were verified, removed and their slots reopened; actual user bookings were unchanged. [Cleanup proof](callback-cleanup-proof.json).

The [known-details/cancellation control](../2026-11-03T11-04-50-177Z-callback-consent.json) reused the provided time/zone/name/number without collecting them again. It checked availability, proposed a booking, then honored cancellation with no `reserve_callback`. It did ask for booking approval despite the caller initially requesting availability only; no reservation or notification was claimed or written.

## Verification and activation

- **166 local tests passed**, including seven new account-context cases and mixed-intent matching/overview regressions. TypeScript, ESLint and whitespace checks passed.
- Development Convex push succeeded. Four live query contracts and the actual stored review were checked read-only.
- Source was frozen across the five text conversations; cohort proofs retain hashes and real replies. Three adaptive runs have explicit isolated-log cleanup proofs; the two scripted controls completed their runner cleanup without errors and created no bookings.
- The saved development assistant was updated with speaker/reasoner instructions, function definitions/messages and the revised owned post-call reviewer definition. Readback verified those values and preserved tool servers, voice, greeting and unrelated structured outputs. A production assistant fingerprint remained unchanged. [Activation proof](activation.json).
- No automated voice call, production deployment, actual customer contact, historical-call deletion or historical prediction rewrite occurred.

## Qualifications

The requested regressions passed, not every utterance was perfect. Case 10 read back the newly supplied browser number only as “ending in 0150”; the caller approved the sole unambiguous number, and the exact full number was stored. That is an abbreviated readback despite wording distinguishing full browser numbers from approved caller-ID last four. It also repeated a recovery-result check already answered in the opening. Case 6 initially answered conditionally before verifying the model. Case 4 paraphrased a renewal date as “active through.” These observations remain in the detailed reports and were not hidden with reruns.

Phone caller-ID phrasing, GPT-Live speaker behavior, actual heard audio and autonomous hangup are not validated by these text checks. A read-only review of the user's latest voice calls found returned closing text but no recorded complete farewell before the user hung up; these three changes do not establish that voice lifecycle is fixed. No voice session was launched to test it.
