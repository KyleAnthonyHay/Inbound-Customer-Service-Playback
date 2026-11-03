# Dev voice suite rerun, 2026-11-02 evening (all 21 scenarios, 24 kHz dev websocket fix)

| Scenario | Expected intent | Ended | Tool calls (Vapi) | Report |
|---|---|---|---|---|
| ambiguous-info | song-loading | assistant-ended-call | delegate, search_playback_docs, delegate, endCall | docs/voice-tests/2026-11-03T00-44-04-321Z-ambiguous-info.json |
| audio-device-selection | audio-output | assistant-ended-call | delegate, search_playback_docs, delegate, search_playback_docs, delegate, delegate, endCall | docs/voice-tests/2026-11-03T01-03-51-641Z-audio-device-selection.json |
| callback-unavailable-time | callback | customer-ended-call | delegate, delegate, get_callback_slots, delegate, delegate, reserve_callback | docs/voice-tests/2026-11-03T00-46-14-065Z-callback-unavailable-time.json |
| current-version-no-update-advice | subscription | assistant-ended-call | delegate, delegate, lookup_demo_customer, search_playback_docs, delegate, endCall | docs/voice-tests/2026-11-03T01-05-53-254Z-current-version-no-update-advice.json |
| genuinely-expired-subscription | subscription | assistant-ended-call | delegate, delegate, lookup_demo_customer, delegate, delegate, endCall | docs/voice-tests/2026-11-03T01-08-09-810Z-genuinely-expired-subscription.json |
| human-request | human-request | assistant-ended-call | delegate, get_callback_slots, delegate, delegate, endCall | docs/voice-tests/2026-11-03T00-48-16-787Z-human-request.json |
| mac-dante-ethernet-adapter | audio-output | assistant-ended-call | delegate, search_playback_docs, delegate, delegate, delegate, endCall | docs/voice-tests/2026-11-03T01-10-31-140Z-mac-dante-ethernet-adapter.json |
| missing-team-sharing-permission | song-loading | assistant-ended-call | delegate, search_playback_docs, get_planning_center_service_context, delegate, lookup_demo_customer, delegate, endCall | docs/voice-tests/2026-11-03T01-12-35-106Z-missing-team-sharing-permission.json |
| off-topic | off-topic | assistant-ended-call | delegate, delegate, search_playback_docs, delegate, endCall | docs/voice-tests/2026-11-03T01-14-22-216Z-off-topic.json |
| out-of-scope-refund | out-of-scope | customer-ended-call | delegate | docs/voice-tests/2026-11-03T00-49-41-195Z-out-of-scope-refund.json |
| output-routing | audio-output | assistant-ended-call | delegate, search_playback_docs, delegate, delegate, endCall | docs/voice-tests/2026-11-03T01-16-14-575Z-output-routing.json |
| payment-past-due | subscription | assistant-ended-call | delegate, delegate, lookup_demo_customer, delegate, endCall | docs/voice-tests/2026-11-03T01-18-05-552Z-payment-past-due.json |
| planning-center-audio-output | audio-output | customer-ended-call | delegate, check_song_access, get_planning_center_service_context, lookup_demo_customer, delegate, search_playback_docs, delegate | docs/voice-tests/2026-11-03T00-52-00-194Z-planning-center-audio-output.json |
| planning-center-song-loading | song-loading | assistant-ended-call | delegate, delegate, check_song_access, search_playback_docs, delegate, delegate, endCall | docs/voice-tests/2026-11-03T01-20-22-104Z-planning-center-song-loading.json |
| rental-expired-no-credits | subscription | customer-ended-call | delegate, delegate, check_song_access, delegate, delegate | docs/voice-tests/2026-11-03T00-54-13-531Z-rental-expired-no-credits.json |
| robot-question | song-loading | assistant-ended-call | delegate, search_playback_docs, delegate, endCall | docs/voice-tests/2026-11-03T00-55-47-310Z-robot-question.json |
| robot-then-human | human-request | assistant-ended-call | delegate, check_team_availability, delegate, endCall | docs/voice-tests/2026-11-03T00-57-11-992Z-robot-then-human.json |
| song-loading-older-version | song-loading | assistant-ended-call | delegate, delegate, search_playback_docs, delegate, delegate, endCall | docs/voice-tests/2026-11-03T01-22-26-886Z-song-loading-older-version.json |
| song-not-purchased | subscription | assistant-ended-call | delegate, search_playback_docs, get_planning_center_service_context, delegate, check_song_access, delegate, endCall | docs/voice-tests/2026-11-03T01-24-35-400Z-song-not-purchased.json |
| troubleshooting-fails-escalate | audio-output | customer-ended-call | delegate, search_playback_docs, delegate, delegate, delegate, delegate | docs/voice-tests/2026-11-03T00-59-52-786Z-troubleshooting-fails-escalate.json |
| wrong-organization | song-loading | assistant-ended-call | delegate, search_playback_docs, delegate, lookup_demo_customer, delegate, endCall | docs/voice-tests/2026-11-03T01-01-28-244Z-wrong-organization.json |
