# Test matrix

Each row is one simulated call. Fill in **Expected intent** before running; fill in the rest after.
Intent labels: `song-loading`, `audio-output`, `version-check`, `subscription`, `human-request`, `out-of-scope`, `off-topic`, `callback`.

Metrics (computed from this table):
- **Intent classification accuracy** = correctly classified calls / total test calls
- **Containment rate** = calls resolved without a human / total test calls
- A correct escalation is a successful outcome but is **not** contained. Abandoned or unresolved calls are not contained.
- If an in-scope containment rate is reported, its denominator is in-scope calls only and is labeled as such.

| # | Scenario | Channel | Demo customer | Expected intent | Classified intent | Tools called (observed) | Resolution | Escalated? | Contained? | Notes / needed improvement |
|---|----------|---------|---------------|-----------------|-------------------|-------------------------|------------|------------|------------|----------------------------|
| 1 | Documented song-loading problem (song stuck downloading) | browser | — | song-loading | | | | | | |
| 2 | Documented audio-device selection problem (no sound, wrong output) | browser | — | audio-output | | | | | | |
| 3 | Output-routing issue (click/guide to wrong channel on USB interface) | browser | DEMO-1003 | audio-output | | | | | | |
| 4 | Older version (8.6.2) with "Cloud Pro expired", active subscriber | browser | DEMO-1001 | version-check | | | | | | |
| 5 | Current version with "Cloud Pro expired", should NOT get update advice | browser | DEMO-1001 (say current version) | subscription | | | | | | |
| 6 | Genuinely expired subscription | browser | DEMO-1002 | subscription | | | | | | |
| 7 | Direct request for a human | phone | — | human-request | | | | | | |
| 8 | Out-of-scope request (refund) | browser | — | out-of-scope | | | | | | |
| 9 | Missing/ambiguous caller info (vague symptom, no version) | browser | — | song-loading | | | | | | |
| 10 | API failure / inconsistent version metadata (simulate Apple outage) | browser | — | version-check | | | | | | |
| 11 | Troubleshooting fails, needs escalation | browser | — | audio-output | | | | | | |
| 12 | No team available, then confirmed callback | phone | — | callback | | | | | | |
| 13 | Unavailable slot / booking failure, then retry | browser | — | callback | | | | | | |
| 14 | Off-topic request (recipe / weather) | browser | — | off-topic | | | | | | |

## Results

- Intent accuracy: _ / 14 = _
- Containment: _ / 14 = _
- In-scope containment (denominator = in-scope calls): _ / _ = _

## Failures and retests

| Call # | Failure observed | Change made | Retest call # | Outcome |
|--------|------------------|-------------|---------------|---------|
