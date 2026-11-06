# Record: Kyle Gover back on days for demob — APPLIED, VERIFIED

Author: Andrew Fisher.
- **Applied:** 25 Oct 2026 17:35 AEST, on the live v12.19 page (`6ccc030d…`).
- **Made by:** Andrew Fisher via Claude, through the running sheet's own control (`runSetShift`).
- **Record:** version 10954 → 10981; 27 documents (each shift's cost line, its stamp and its name), each acknowledged 200. Every other document is unchanged in value.
- **Backup:** the whole record before the run, kept private outside the repo (scratchpad `record_25Oct2026_kyle_demob_days/backup_state_20261025T073510Z.json`).
- **Report:** `report_20261025T073510Z.json`.

Andrew, 25 Oct 2026: "can we add Kyle back to start on days as of 27th Oct 6:30-17:00 to friday 30/10/2026 then again 02/11/2026 to 06/11/2026".

| Days | Shift | Paid by the running sheet | Cost at his $53.05 / h |
|---|---|---|---|
| Tue 27 – Fri 30 Oct 2026 | 06:30–17:00 | 10 h a day: 7.6 ordinary, 2 at time and a half, 0.4 at double | $604.77 a day |
| Mon 2 – Fri 6 Nov 2026 | 06:30–17:00 | the same | $604.77 a day |
| **9 days** | 94.5 h worked | 90 h paid | **$5,442.93** |

- The break is left blank, as on his other day shifts and on the crew's demob days. The running sheet takes its standard half hour.
- Each day carries the note "Back on days for demob, 27–30 Oct and 2–6 Nov 2026. Confirmed by Andrew Fisher, 25 Oct 2026."
- Kyle had no line, live or taken off, on any of these days before the run. Monday 26 Oct and the weekends stay empty.

**Andrew's own edits at the same time** (in the page, 17:22–17:31):
- Daniel Gough off 2–6 Nov and 9–13 Nov (ten shifts).
- 26 Oct at 06:00–17:00 for Andrew, Daniel and Alfie.
- Alfie's nights and meals for the demob days.

The P&L's wages note after both: 74 hired-in shifts, **$67,413.10** = $68,264.27 − $6,349.80 (Daniel's ten, $634.98 each) + $55.70 (Daniel's longer 26 Oct) + $5,442.93 (Kyle's nine). Wages are tracked, not added to the P&L.

**How:**
- `days.cjs` is the 23 Oct runner (`../record_23Oct2026_kyle_shift_hours/four.cjs`) with one more operation, `shift_add` (person, date, start, finish, note).
  - It refuses a day that already has a live line, and a person not on the running sheet.
  - It stages each day through `runSetShift` inside the page and checks the line came out as asked.
  - The write gate lets through only the nine days' own documents (`costs/W-L-kyle-gover-<date>`, their `stamps/` and `by/`).
- The dry run came first on the live page: every write aborted, 27 documents planned.
- Then `--apply`:
  - the full backup;
  - the public page's SHA-256 checked;
  - the 27 PUTs acknowledged;
  - every op verified on the service, and every other document compared unchanged.
- A fresh load of the live page read the nine days back: 06:30–17:00, 10.5 h each, with the note, recorded by Andrew Fisher; errors 0, writes 0.

The edit key is never printed, logged or stored.
