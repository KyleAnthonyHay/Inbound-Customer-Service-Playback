# Retained call history

Panel actions preserve history. Remove an individual finished call with its
archive icon, or use **Clear panel** for all finished calls. Both actions set
`calls.archivedAt`; they do not delete call records, transcripts or activity.
Active/ringing calls cannot be archived. New calls appear normally in the panel.

Open **Past calls → Archive** to read archived development calls, including
their original tool activity and transcript. **Load older calls** pages through
the full archive. The normal **In this panel** view only includes uncleared
entries. Use an archived call's **Restore to panel** button to return it to the
panel; it then leaves Archive. Restoration removes only the visibility marker,
preserving the same call ID, transcript and activity. Opening an archived call
for reading does not restore it. The full historical record spans both views.

In **Archive**, the trash button opens **Delete permanently** confirmation.
Confirming removes that saved call, its transcript, activity and measurements;
it also leaves the history metrics window. Live and unarchived calls cannot be
permanently deleted through this action. Restore remains available until deletion.
Large transcripts/activity logs are erased in bounded background batches. A
minimal call-ID/deletion-time marker prevents delayed webhooks or client events
from resurrecting the history. It contains no transcript, caller details or metrics.
This erases the application's stored history; it does not purge Vapi's separate
records/recordings, previous private exports or cancel demo callback bookings.
The existing `calls.remove` maintenance mutation remains for isolated test cleanup.

Restoration validation: 127 tests pass, including archive/restore round trips,
idempotent restores, missing IDs and live-call protection. A temporary synthetic
record was restored through the browser UI: it left Archive, appeared in the
panel, and retained the identical call, transcript and activity records. The
fixture was then removed; real call history was not altered by this check.

## November 3, 2026 preservation checkpoint

Before clearing, full stored call-history snapshots were saved privately:

| Source | Call records | Transcript rows | Activity rows |
| --- | ---: | ---: | ---: |
| Development | 99 | 908 | 306 |
| Production | 16 | 340 | 74 |
| Total | 115 | 1,248 | 380 |

These are stored call/attempt records, not a claim of 115 successful completed
voice tests. Private JSONL snapshots and their hash manifest are under
`private/2026-11-03/`, excluded from Git because they can contain caller details.
The snapshots contain the full stored call, transcript and activity tables.
The configured private API credentials were checked and were absent.

The development panel was cleared: zero entries remained, while all 99 calls
were still available in Saved history. A second snapshot verified that every
original call, transcript and activity record remained unchanged, except for
the new call visibility timestamp. Production records were exported read-only;
production application behavior was not deployed or cleared.

Validation: 124 local tests passed, including single-entry preservation,
idempotency, live-call protection and bounded bulk archiving. TypeScript and
targeted lint passed. Browser checks removed one entry, reopened its preserved
transcript/activity, cleared the remaining panel, and loaded all 99 saved calls
through pagination. No new voice calls were created by these checks.
