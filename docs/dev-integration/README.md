# Combined development activation — November 2, 2026

Development is merged, deployed, seeded and synced for manual browser-voice testing at **http://localhost:3000/call**. This conversation's current diagnostic, update, timing and escalation decisions take precedence over older overlapping prompt rules. Production is not the target of this activation.

## Included work

- Phone-line mirroring and manual-search/Pinecone fixes from the phone-mirroring PR. Its merged head is an ancestor of dev.
- Synthetic organizations, memberships, subscriptions and song-access queries from the synthetic-accounts PR. That PR was closed against main, but its head commit is an ancestor of dev through the explicit dev merge; its changes are included without merging to main.
- Claude's AI disclosure, direct-human routing and short pre-tool voice transitions.
- This task's shared Regal Playback Demo Planning Center context, bounded knowledge guidance, full stored release-history matching and structured update assessment.
- Complete test command combining account, manual, Planning Center and text-harness checks.

Older account hints that declared an active-plan mismatch a software cause and prescribed a fixed symptom-specific flow were replaced with evidence-based hints. The new account/schema/song functionality is retained. The agent does not ask about available troubleshooting time, does not check versions routinely for a clear configuration explanation, and offers a specialist when it cannot establish a supported next step.

Primary demo org 480113 includes the Planning Center demo set's three songs as **explicitly synthetic purchases**, alongside its other sample library. Those rights are seeded fiction, not information verified by Planning Center. Other account restrictions and negative fixtures remain distinct.

## Commands completed on the Mac

```sh
git merge --ff-only origin/dev
git merge --no-ff claude/project-thread-y8ex3c
npm ci --no-audit --no-fund
npm test
npm run typecheck
npx convex dev --once
npx convex run seed:run
npm run sync:assistant
npm run dev -- --hostname 127.0.0.1 --port 3000
```

Conflicts in README, package scripts, the shared prompt and tool definitions were resolved with the current conversation as policy authority. The separate Claude checkout and its uncommitted files were not edited. The original checkout's unrelated retrieval report and untracked voice artifacts were preserved.

Seed result: **7 synthetic organizations, 8 customers, 20 songs, 2 teams and 748 callback slots**. Re-seeding reset only these demo tables/booking fixtures in development; it did not touch a real church or production.

## Verification and a caught regression

- **73 local tests passed**, plus TypeScript, targeted ESLint and whitespace checks.
- Signed deployed-tool checks passed for organization lookup, song access, update prerequisites, Pinecone manual retrieval and the real read-only Planning Center demo lookup.
- Read-back verified the saved development assistant matches the shared definition, including its speaker/reasoner/tool configuration. Unsigned webhook requests are rejected.
- Localhost returned HTTP 200, rendered the ready phone screen, and showed no browser console warnings/errors. No call button was pressed by the agent.
- The first combined seven-case text run had **6/7** reviewed passes: one direct-human response announced a connection after availability alone. That failure is preserved in `merged-text`.
- The availability result now explicitly reports `handoffStarted=false` and `actionPerformed=availability-lookup-only`. The duplicate opening handoff rule was removed; the shared human policy requires `initiate_handoff` success before announcing a connection.
- After redeploy/sync, **all seven cases passed in a fresh final run**: four independent version/update paths, clear wrong-output handling, direct human routing, and already-current/inconclusive escalation. Final direct-human and accepted-specialist paths both called the actual simulated handoff tool before announcing completion.
- All isolated text tool logs were closed and cleanup was checked. Caller-reported device recovery remains scripted; these are not physical Playback repairs or voice-parity results.

Text usage reported by Vapi: first combined run **$0.4105 / 27 turns**; final run **$0.3869 / 24 turns**. Zero text request failures; zero phone/automated voice calls launched. This small sample demonstrates these paths, not a statistical reliability guarantee.

Read-only hashes verified the production saved assistant did not change. No production Convex commands, production seed, production assistant sync or production phone-number changes were performed. Vercel's production Git branch is `main`; this integration targets `dev`.

## Test now

[Open the ten-case manual voice test sheet](../dev-manual-tests.md). It provides the opening question, hidden caller facts and expected handling for each selected conversation. There are also optional synthetic-account cases and two short AI-disclosure/direct-human voice checks. Use the browser Call button on localhost for development; the displayed inbound telephone number remains production.

**No setup commands are left for development.** Production Pinecone configuration remains separate and was not executed here. The supplied `convex env set --prod …` commands are production setup, not a prerequisite for the localhost/dev test.

Evidence: [deployed tool checks](activation.json), [final configuration/auth/production check](final-verification.json), [both text-run reviews](text-review.json), [final transcripts](final-text/).
