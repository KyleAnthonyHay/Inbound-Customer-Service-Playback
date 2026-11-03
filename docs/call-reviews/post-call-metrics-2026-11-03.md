# Development post-call measurement check — November 3

This is post-call extraction evidence from **three existing development browser calls**, not fresh voice tests or three of the ten curated voice passes. The authenticated Vapi `POST /structured-output/run` endpoint ran with `previewEnabled: true` and the transient `playback_call_review_v1` schema. Previews did not update Vapi call artifacts or start voice calls. These small inference runs consume model credits; no new OpenAI key was used.

Expected outcomes were held outside the extraction request. The request contained only the saved call ID and the output definition. Raw assistant snapshots and webhook credentials were never printed or saved.

| Existing conversation | Observed primary / secondary | Resolution | Escalation | Assessment |
|---|---|---|---|---|
| iPad song recovery, then Sunday plan lookup | song-loading / service-plan | resolved | none | Caller confirmed recovery after retries and accepted the two other songs. Correct support outcome; the recorded failed goodbye/disconnect remains a separate lifecycle defect. |
| Direct request for a professional; nobody available; caller only available now | human-request / none | unresolved | requested | No transfer or callback completed. Correct after the refinements below. |
| “Hmm,” followed by greeting only | unknown / none | unknown | none | Insufficient evidence; not counted as a confirmed resolution or containment. |

The initial human-request preview returned `unknown` resolution. The general definition was clarified: an explicit unmet request is unresolved even when the underlying technical problem is unknown. A second preview corrected resolution but listed an assistant-offered callback as secondary intent. The definition was then clarified to count caller-raised needs, not merely offered actions. The focused retest returned `human-request`, no secondary intents, `unresolved`, `requested`. The initial failures are retained here; this is not evidence of deterministic classification.

Final artifact reads measured 20 dialogue messages / 3 support tools / 5 reasoner delegations for the recovery call; 13 / 1 / 2 for the human request; and 2 / 0 / 0 for the greeting-only call. There were respectively 6, 4 and 1 non-overlapping timestamp-based reply-delay samples. These are transcript-based estimates, not phone audio or model first-token timings.

The three reviewed preview classifications and concise, manually checked evidence summaries were saved to their existing Convex call records with `reviewSource: reviewed-preview`. Expected scenario labels remain unset, so these calls do not contribute to intent accuracy. Historical call/transcript/event content was preserved. Other old calls were not automatically sent through paid extraction.

The local UI was exercised with a clearly named `text-poc-metrics-ui-20261103` fixture: collapsed measurements, expanded fields, private scenario selection, and reactive “Correct · expected routing” readback all worked. The disposable fixture and its two transcript lines were removed afterward. No real call history was deleted.

Development Convex functions were pushed with type checking. The saved development assistant's Structured Output definition was read back after an artifact-plan-only update; its conversation model/server fields were unchanged. A full production-assistant fingerprint before/after matched. The ordinary assistant sync now preserves existing artifact settings and unrelated outputs. Prospective end-of-call scheduling and safe artifact projection have automated coverage, but a new manual dev voice call is still needed to establish automatic capture on a fresh phone/web call.

Validation: 140 local tests passed, TypeScript and ESLint passed. Backend tests cover deduplication, private labels, safe projections, bounded scheduling, escalation verification and denominator behavior. The counts and labels do not assert that the ten manual presentation conversations passed.
