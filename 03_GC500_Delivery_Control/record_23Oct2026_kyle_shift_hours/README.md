# Record: Kyle Gover's three shifts without hours take his own times — APPLIED, VERIFIED

Author: Andrew Fisher. Applied 23 Oct 2026 16:00 AEST on the live v11.58 page (`50ae2d0f…`), by Andrew Fisher, through the running
sheet's own control (`runSetShift`): record **10566 → 10575**, nine documents (each shift's cost record, its stamp and its name).
Full-record backup before the write: `backup_state_20261023T060042Z.json`; the run and its read-back: `report_20261023T060042Z.json`.

Andrew, 23 Oct 2026, on the forecast's "3 labour records missing hours (Kyle Gover)": "You should know this".

## What was on the record and what is now

| Shift | Was | Now | Basis |
|---|---|---|---|
| Kyle Gover, Tue 20 Oct 2026 | no start or finish | 06:30–17:00, 10.5 h paid | his build weekday pattern: 22 Oct and every September weekday on the running sheet are 06:30–17:00 |
| Kyle Gover, Wed 21 Oct 2026 | no start or finish | 06:30–17:00, 10.5 h paid | the same |
| Kyle Gover, Sun 25 Oct 2026 (event night) | no start or finish | 18:00–06:00, 12 h paid | the two event nights Andrew typed on 15 Oct: 24 Oct 18:00–06:00 and 23 Oct 18:06–06:00 |

The breaks are the running sheet's own standard for each day (the page works them out); nothing else on any shift changed.
Kyle is labour hire (Job Connect, $53.05 / h on the record), so these three shifts are now priced like his others.

## How

`four.cjs` is the 23 Oct record runner (`three.cjs`) with one more operation, `shift_times` (person, date, start, finish, why): it
stages each shift through `runSetShift` inside the page, reads the record back, and allows only the three shifts' own documents
(`costs/W-L-kyle-gover-<date>`, their `stamps/` and `by/`) through the write gate. Dry run first on the live page (every write
aborted, the plan printed); then `--apply` with the full backup, the page hash checked against the one reviewed, the nine PUTs
acknowledged, the record read back and every other document compared unchanged. The key is never printed, logged or stored.
