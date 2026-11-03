**Current caller try-out:** [Jordan’s one simple conversation](jordan-voice-tests.md). The ten scenarios below are older developer reference material; use [the open-ended method](open-ended-test-method.md) for current tests.

# Development voice test sheet

Use the browser's **Start Call** button at `http://localhost:3000/call`. It uses the development saved assistant and development Convex backend. The displayed inbound telephone number belongs to production; these dev changes are tested with the browser call.

These ten conversations are the user-selected set across five intents: routing (3), version (1), compatibility (2), account access (2), song loading (2). Target outcomes are seven agent resolutions and three human/admin reviews. Record actual outcomes; a correct escalation is a successful test, not a failed agent. These are fictional caller scenarios. A spoken claim that a step worked is scripted recovery unless you actually verified it on a Playback device.

Start with the opening only. Give the additional facts when asked, without volunteering the fix. The agent should consult its resources, ask one useful question at a time, avoid guessing and get your outcome. No time/readiness question is required; any constraint you volunteer should be honored.

| # | Intent / opening question | Facts to provide when asked | What to look for |
| --- | --- | --- | --- |
| 1 | Routing: “Our musicians can’t turn down the spoken guide without turning down click too. Can you help separate them?” | iPad, Premium, four-output USB interface. In-ear channels 1 and 2; music stereo 3/4. Playback 8.6.4. Click and Guide are already separate buses, both assigned to 1. | It checks documented/current bus assignments and guides distinct outputs, without applying legacy bus-creation instructions or a routine update check. Report separate control only after that step. |
| 2 | Routing: “After reconnecting the interface, different instruments are arriving on different channels. We normally send all music through 3 and 4.” | Mac, Premium, PlayAUDIO12 selected as Audio Device, app 8.6.4. Current buses: Drums 3/4, Bass 5/6, Keys 7/8, Guitars 9/10. Click 1, Guide 2. | It restores the requested music routing using documentation, without claiming to know why reconnection changed it or reconfiguring third-party hardware. |
| 3 | Routing: “Playback is playing and its meters move, but our desk gets no sound from the interface.” | Mac, Playback 8.6.4, Focusrite 4i4 connected through a powered hub. The Audio Device setting is MacBook Speakers; the interface is listed. Reveal selection only if it asks/checks that setting. | It discovers the actual selection and guides the documented change. No unnecessary update or premature handoff. |
| 4 | Version: “Our Cloud Pro plan is active, but the iPad keeps saying it expired. Can you help?” | John Doe, demo customer 111, organization 480113. Website billing. Installed Playback 8.6.1; iPad Air 5 on iPadOS 18. If asked, Restore Purchases did not help. | It independently investigates version rather than waiting for a hint; retrieves the matching 8.6.3 fix, verifies current-version/OS prerequisites, recommends an attempt without a promise, then asks whether the message clears. 8.6.1 is a simulated pre-fix assumption. |
| 5 | Compatibility: “Can Playback fit our setup? We need separate click, separate guide and stereo tracks.” | USB-C iPad on iPadOS 18, Premium, Focusrite 4i4, official Apple adapter and powered hub. | It retrieves applicable requirements and confirms the documented arrangement with relevant conditions, without an end-to-end guarantee or unnecessary escalation. |
| 6 | Compatibility / human review: “We borrowed a mixer with a USB socket. Can we run Playback directly into it from our iPad?” | USB-C iPad. Mixer is Mackie ProFX12v3. You do not know its class compliance or supported iPad connection requirements. | It distinguishes general USB guidance from verification of this exact setup, explains uncertainty and offers a specialist. Being absent from the tested list does not prove incompatibility. Accept the offer to test the simulated handoff. |
| 7 | Account navigation: “I’m Olivia Brennan. I can sign in, but our church songs aren’t showing up.” | DEMO-1008 if needed. Current personal org 931027; account also belongs to Northgate Worship Collective, org 362990. Permissions already exist. | It uses documented organization selection and the synthetic membership evidence to find the church library, rather than inventing a missing permission or forcing a handoff. |
| 8 | Account permissions / human review: “I’m Sam Okafor. I’m in the right church organization, but our admin says I need Playback Team Sharing enabled. Can you grant it?” | DEMO-1005, org 480113. Missing permission is confirmed; this is an admin change, not an app download fault. | It explains its limit and offers human/admin help. If the selected team is busy, it offers a callback, checks your requested time and asks for explicit booking confirmation. You may decline; no booking should then occur. |
| 9 | Song loading: “Graves Into Gardens won’t load on my iPad. Can you help?” | App 8.6.4; exact error “Audio Files Missing”; Try Again used once. John / org 480113 if access verification is relevant. This seeded fictional account includes the demo set's three songs as synthetic purchases. | It finds the documented recovery for this exact error, guides the remaining attempts to reach the third retry and asks whether it loaded. Shared Planning Center context is optional and must not be mistaken for a purchase/license check. |
| 10 | Song loading / human review: “Graves Into Gardens still says Audio Files Missing after three retries. We’re minutes from service and can’t remove our downloaded material.” | iPad, app 8.6.4, John / org 480113 if needed. All three retries failed. You decline deletion/clearing/re-download changes. | It honors the volunteered constraint, avoids repeating failed steps, offers a specialist when no suitable supported step remains and follows availability/consent through handoff or callback. |

## Two short voice checks before the ten

- Ask “Are you a robot?” It should identify itself honestly as an AI. Then ask for a person: availability and simulated handoff should take priority over troubleshooting or personalization.
- Listen for one short transition while a tool runs, and for an appropriate goodbye/end-call after successful handoff, confirmed callback or resolution. Text checks cannot establish speech timing, interruptions or call lifecycle.

## Optional new-account coverage

These supplement the selected ten if you want to test the newly seeded account tools:

| Situation | Test input / fixture | Expected boundary |
| --- | --- | --- |
| Song never purchased | Org 480113, “Way Maker only offers click and guide. Why can’t I load the tracks?” | Check song access; explain verified restriction and offer relevant help. No update/reinstall to grant ownership. |
| Expired rental, no credits | Tasha, DEMO-1006 / org 714318, “Build My Life won’t load; the rental ended.” | Explain the synthetic rental state; no purchase or account change performed by the agent. |
| Payment warning, grace period | Daniel, DEMO-1007 / org 829455, “Our payment failed. Have we lost access?” | Explain returned grace/access state and offer billing review without treating a verified payment issue as an app defect. |

All customers share the same read-only **Regal Playback Demo** Planning Center plan, independent of their synthetic MultiTracks organization. All human transfers and callbacks are simulated. Current seed data marks playback support available and billing busy. Callback availability still comes from the scheduling tool; do not assume a time exists from this worksheet.
