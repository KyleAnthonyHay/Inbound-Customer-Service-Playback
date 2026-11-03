# Single reviewer demo — text POC

Reviewed November 2, 2026, America/New_York. This is one sample conversation, separate from the ten curated developer cases. No voice call or saved-assistant change was made for these checks.

The [caller script](../reviewer-demo-script.md) combines one rehearsal-song problem with one Planning Center follow-up. It supplies ordinary observations and exact responses, not a diagnosis or an instruction to the agent to use a particular recovery tool. Private expected outcomes remain outside agent inputs in `scripts/text-cases/reviewer-demo.json`.

## Final conversation

[Source transcript and safe tool results](reviewer-demo-final-2026-11-02/reviewer-song-loading-v1.json): five caller turns, no API/transport failure, **$0.0532** reported text cost. The isolated tool log was removed successfully.

- The agent proactively invoked `get_planning_center_service_context` once. Its successful live Planning Center Services API result identified **Regal Playback Demo**, the November 8 plan, and three songs. This was an actual read of fictional demo content, not real church data.
- It invoked `search_playback_docs` once. The returned official download-error guide supports the error-specific Try Again procedure. Given the caller's one prior attempt, it correctly requested two more.
- The caller reported the predeclared simulated recovery after following those instructions. No app, download, or audio device was actually operated.
- On the explicit Planning Center follow-up, the agent reused the existing result. It named **Do It Again / B-flat** and **What A Beautiful Name / D**, matching returned metadata. A second lookup was unnecessary. The plan was not described as access to a real customer's church.
- It asked the further-help question and, after the caller finished, returned the complete branded goodbye.

## Draft finding and revision

The [initial check](reviewer-demo-2026-11-02/reviewer-song-loading-v1.json) also completed in five turns, costing **$0.0514**, but first recommended three retries without establishing the caller's prior attempt. The caller then clarified the count; the agent corrected its next step. This is recorded as a diagnostic ambiguity, not an independent perfect pass.

The final opening includes the caller's ordinary observation that they already pressed Try Again once. It does not supply a cause or suggest the third-attempt recovery. The final run separately tested the setlist follow-up. Both reports and their cleanup flags are retained. Combined reported text cost: **$0.1046**.

## Limits

One reviewed final text conversation does not establish statistical stability. Text excludes the live speaker, audio, interruptions, acknowledgment timing and native `endCall`. Vapi request-start holding text appeared in the text transport and was not counted as proof of spoken acknowledgment quality. No automated voice suite was run. The caller's manual voice check remains necessary before treating the public demo as final delivery.

No application prompt or production configuration was changed to make this script pass. The ten-case suite remains unchanged and has not been run as part of this task.
