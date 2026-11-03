# Combined-candidate retest: version and compatibility

Six fresh development text conversations, both openings for cases 4–6. The candidate/source hashes in `retest-config.json` still matched after all runs. No shared source, fixture, backend, saved assistant or production changes were made by this reviewer. Caller facts remained private; only ordinary caller statements entered the support conversation. No voice calls were created.

Cases 5/6 now explicitly define pre-connection advice, not an active no-audio fault. That resolves the baseline fixture ambiguity; it is a fixture clarification, not new physical test evidence. The second opening of case 6 still omits USB in its opening, so its method constraint is explicitly supplied in the later caller clarification before judging post-clarification adherence.

## Results

| Run | Turns | Observed assessment | Reported text cost |
| --- | ---: | --- | ---: |
| [04-false-expired-v1](retest-version-compatibility/04-false-expired-v1.json) | 8 | Core recovery pass. Active-account lookup; failed Restore Purchases observation; guided caller app/OS readings; comparator prerequisites complete; targeted update; caller-confirmed recovery; further-help check, endCall/farewell. One redundant restore attempt remained. | $0.2163 |
| [04-false-expired-v2](retest-version-compatibility/04-false-expired-v2.json) | 4 | Self-service target missed. After the payment-message clarification and a failed Restore Purchases attempt, it checked team availability and moved to callback without checking organization/account status, app version or release evidence. Stopped at this clear premature escalation rather than providing a version hint or booking over the miss. | $0.0914 |
| [05-supported-setup-v1](retest-version-compatibility/05-supported-setup-v1.json) | 5 | Core advice pass. Identified 4i4, explained conditional adapter/hub and Premium requirements, used the known USB-C connector when exact iPad model was unknown, and answered the requested band/room capability without a setup walkthrough. Correct further-help/closing. | $0.1332 |
| [05-supported-setup-v2](retest-version-compatibility/05-supported-setup-v2.json) | 5 | Partial. Identified model and explained power/adapter conditions, but again asked whether it was selected as Audio Device before the caller clarified pre-use advice. Its final offered four-output routing claim still omitted Premium. Correct closing does not repair that advice omission. | $0.1224 |
| [06-borrowed-mixer-v1](retest-version-compatibility/06-borrowed-mixer-v1.json) | 8 | Correct escalation/booking workflow. Immediate model discovery; acknowledged unverified USB support; after genuine unknowns offered review. Unavailable team → exact-time lookup → contact collection → proposal/readback → explicit approval → reserve_callback → endCall with verified booking confirmation + farewell. Original compatibility remains unresolved. | $0.2841 |
| [06-borrowed-mixer-v2](retest-version-compatibility/06-borrowed-mixer-v2.json) | 4 | Retained goal/scope issue. After acknowledging unverified direct USB, prescribed Auto-Pan, adapter and splitter instead. Caller explicitly clarified the USB-socket goal; it then offered a specialist but still called the alternate adapter/splitter path “the documented reliable option” for this unverified configuration. Stopped rather than manufacturing a successful booking or repair. | $0.1240 |
| **Total** | **34** | Three core targets met; one partial advice outcome; two retained misses. This is qualitative small-sample evidence, not a measured production success rate. | **$0.9714** |

## Improvements with direct evidence

### Tool-start filler removed from actual replies

No default “Hold on a sec,” “Just a sec,” “One moment,” “Give me a moment,” or “This’ll just take a sec” tool-start lines were observed in the 34 raw replies. No output stripping was used. The baseline cohort displayed these frequently, including stacked waits on callback confirmation. This supports the deterministic provider-message change in the text transport; it does not establish live GPT-Live delivery or acknowledgment quality.

### Better goal/model discovery and conditional advice

Both case 6 openings now asked the mixer make/model immediately, instead of asking for current Audio Device or socket symbols. Case 5 v1 supplied the relevant Premium condition before asking for the Focusrite model, then described powered-hub/adapter requirements conditionally rather than assuming accessory ownership. When it asked an exact iPad model, the fixture did not define that model; the caller truthfully supplied only the known USB-C connection, and the agent could answer without inventing an iPad model or demanding a configuration walkthrough.

Case 5 v1’s final answer was:

> “Your USB-C iPad, Playback Premium, and Focusrite 4i4 can provide separate music and band cue feeds when connected through Apple’s USB-C Digital AV Multiport Adapter and a powered USB hub.”

The retrieved help-center result included the Digital AV adapter reference. This is a conditional capability answer, not a claim that the real connection was tested.

### Booking confirmation survives endCall

Case 6 v1 used proposal wording before approval:

> “Shall I book a Playback specialist callback for Jamie Demo at Wed, Nov 4, 11:00 AM EST, at 202 555 0146, to review the Mackie ProFX12v3 connection?”

Only after the caller said “Yes, please book it” did it call reserve_callback, then endCall. The endCall tool’s `speak` and actual final assistant reply both included the verified post-write confirmation:

> “Your demo callback is confirmed for Wed, Nov 4, 11:00 AM EST.”

The branded farewell followed in the same final reply. An actual synthetic booking was verified confirmed, then only this generated text-test booking was removed and its 11 AM slot verified open. See [cleanup and confirmation proof](retest-version-compatibility/callback-cleanup-proof.json). This validates database action/confirmation ordering in text, not an audible disconnect.

## Retained failures and nuance

### The vague paid-account opening still falls off the supported investigation path

Case 4 v2 began by assuming a song-loading attempt (“What song are you trying to load…”), although the caller only described being asked to pay again. The caller clarified the exact Cloud Pro expired message without supplying a technical diagnosis. After device identification and one failed Restore Purchases attempt, the agent said:

> “Since Restore Purchases didn’t clear it, a Playback specialist should review the subscription confirmation; nobody is available to transfer right now, but I can schedule a callback. When would you be available?”

Account status, installed version and release evidence were still obtainable through simple questions and tools. The safe human fallback is not itself a harmful action, but it missed the intended supported recovery and was premature relative to that available evidence. No callback facts were invented for case 4. This run was stopped with `done:true`; it did not receive a closing user reply, so the absence of endCall in this stopped run is not separately graded as an ending failure.

Case 4 v1 did complete the recovery. Its comparator received caller-confirmed 8.6.1 / iPadOS 18 and returned `prerequisitesComplete=true`, with live current 8.6.4 and minimum iOS 15.6, before the update instruction and fictional success.

### Premium omission is tied to the offered multi-output route, not every two-feed goal

Case 5 v2’s final answer specifically said the 4i4 supports the band/room separation “using its four outputs,” and described a powered hub and Apple adapter. It never stated or verified Premium in any spoken reply. The missing condition applies to that offered MultiOut/bus-routing path; this review does **not** impose Premium on every basic two-feed or Auto-Pan possibility. The caller’s private Premium fact cannot repair an omission in the agent’s advice.

### Case 6 v2 improved model discovery but substituted a method

After model discovery and “I can’t confirm a direct USB connection,” it asked the listening goal. The caller answered the predeclared band-cues/room-music goal. The agent then prescribed Auto-Pan, a headphone/USB-C adapter and splitter, and asked whether further help was needed. Because this second opening had not explicitly said USB, that initial diversion is partly a method-ambiguity issue, not evidence it ignored an already explicit caller constraint.

The caller then clearly asked about the USB socket—the original private scenario method, without supplying a diagnosis or handoff request. The agent acknowledged that it could not confirm that direct connection and offered specialist review, but still asserted the alternate adapter/splitter path as “the documented reliable option.” A hypothetical general alternate connection should not become a verified solution to this exact borrowed setup. This run was stopped at the retained issue; the later specialist offer is recorded, not hidden. No final callback or endCall was exercised for this stopped run.

## Cleanup and scope

All six runs have `done=true` and `cleanupComplete=true`, with no harness transport failures. Four completed conversations called endCall and gave the full farewell; two explicit failure stops did not continue to completion. The one retest callback booking was verified and cleaned, with the slot reopened. No real voice call/history was deleted, no staff were contacted, and no production state was changed. All current candidate hashes remained frozen through the retest.
