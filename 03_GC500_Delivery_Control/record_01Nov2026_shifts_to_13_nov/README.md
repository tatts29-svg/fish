# Who works Monday to Friday to 13 Nov, and at what times — 1 Nov 2026

Author: Andrew Fisher. Andrew, 1 Nov 2026 (this chat): "Can we have Daniel Working Monday to Friday Up to 13/11/2026 Same
with me and Alfie and Aaron.... and no Aaron on 30/10/2026 and 06/11/2025 and 13/11/2026 Mondays Alfie does 6:00Am - 17:00
other days he does 6:30-17:00 Aaron does 6:00-17:00 i do 6:00-17:00 and daniel does 6:30-17:00".

## What the running sheet held before (record 12685)

- **Daniel Gough:** his 06:30–17:00 days from 2 to 13 Nov were on the running sheet but taken off. Andrew Fisher took them
  off on 25 Oct 2026 at about 17:30 AEST.
- **Andrew Fisher:** 06:00–17:00 every weekday to 13 Nov already.
- **Alfie Harris:** 06:30–17:00 every weekday to 13 Nov, including Mondays 2 and 9 Nov. Mon 26 Oct already 06:00–17:00.
- **Aaron Zelvis:** 06:00–17:00 every weekday to 13 Nov, including Fridays 6 and 13 Nov.
  - His only line on Fri 30 Oct is the 8 h water-barrier demob (WB03, 9972648 STPS).
  - That line's note says it is "the Thursday night, 29 Oct, shown here as an 8 h day".
  - So he has no Friday day shift on 30 Oct.

## Applied

1 Nov 2026 08:56 AEST (31 Oct 22:56 UTC), on the live v12.69 page (`038bd277…`), by Andrew Fisher, through the running
sheet's own controls.

Runner: `labour_fill.cjs`. It is the 31 Oct runner (`../record_31Oct2026_andrew_start_times/`) with three new operations:

| Operation | Running sheet control | Page function |
|---|---|---|
| `shift_back` | Put back | `runShiftBack867` |
| `shift_off` | Take off | `runShiftOff867` |
| `shift_set` | the time boxes | `runSetShift` |

Spec: `shift_spec.json`. It has 14 changes, each carrying Andrew's words:

| Who | Days | Change |
|---|---|---|
| Daniel Gough | Mon 2 – Fri 6 Nov, Mon 9 – Fri 13 Nov (10) | put back, 06:30–17:00 (each line checked to read 06:30–17:00 before it went back) |
| Alfie Harris | Mon 2 Nov, Mon 9 Nov | start 06:00 (finish 17:00 kept); the page works out 11 h |
| Aaron Zelvis | Fri 6 Nov, Fri 13 Nov | taken off (a tombstone, so Put back stays on the row) |

1. **Dry run** (`dryrun_20261031T225556Z.json`): 30 documents planned, nothing sent.
2. **Backup:** the whole record was backed up first. It is kept privately and **not committed**, because this repository is
   public. The runner now refuses a backup folder inside the repository.
3. **Write:** the public page's sha256 was checked. Then 30 documents were written, each acknowledged 200:
   - the 10 put-backs, each with its author;
   - Alfie's 2 lines, each with its stamp and author;
   - the 2 take-offs, each with its author.
4. **Read back** (`report_20261031T225625Z.json`):
   - record version 12685 → 12715;
   - every planned document is as sent;
   - no other document changed;
   - verification OK.

## Fresh read after (read only, record 12715)

| Who | w/e 8 Nov | w/e 15 Nov | Running sheet cost a week |
|---|---|---|---|
| Daniel Gough | Mon–Fri 06:30–17:00, 52.5 h | the same, 52.5 h | 3,174.90 (5 × 634.98) |
| Andrew Fisher | Mon–Fri 06:00–17:00, 55 h | the same, 55 h | salary, hours only |
| Alfie Harris | Mon 06:00, Tue–Fri 06:30, to 17:00, 53 h | the same, 53 h | Coates wages, hours only |
| Aaron Zelvis | Mon–Thu 06:00–17:00, 44 h | the same, 44 h | Coates wages, hours only |

Nothing changed before 2 Nov. Daniel's w/e 1 Nov stays at 53 h (3,230.60 on the running sheet).

## Left as recorded, for Andrew to say

- **Aaron, Fri 30 Oct:** this line is his Thursday-night water-barrier run (8 h, WB03, STPS). It is not a Friday day shift.
  Taking it off would lose those hours.
- **Daniel, Mon 26 Oct:** recorded as 06:00–17:00, not 06:30. It is a past day already on the record, so it was not
  changed. At 06:30 it would be 55.70 less on the running sheet.
- **"06/11/2025":** read as Friday 6 Nov 2026, the only 6 Nov in the job.

## What it means for the figures

- **Labour hire, running sheet basis:** Daniel's two weeks add 6,349.80 in November.
- **The P&L:** those two weeks are carried at his POs instead:
  - 4674224, w/e 8 Nov: 3,052.60;
  - 4674225, w/e 15 Nov: 3,052.60.
- **Coates wages and salary:** hours only, so no dollars move.
  - Aaron: 22 h fewer in November.
  - Alfie: 1 h more in November.
