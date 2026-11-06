# Alfie Harris on Mon 5 Oct 2026, 06:30–17:00 — 2 Nov 2026 (reversed the same morning)

> **Reversed the same morning.** Andrew, 2 Nov 2026: "No he diid not work kings bdat", "No one did", "Alfie did not work the 5th".
> The row was taken off again at 02:36 AEST (record 12734 → 12736), and his 5 Oct night with it (12736 → 12739):
> see `../record_02Nov2026_alfie_5_oct_off/`. What follows is the record of the run as it was applied.

Author: Andrew Fisher. Pack v1.19 carried an open item: "Alfie Harris: his 5 Oct night has no shift for him on the record; confirm it
against the hotel invoice." Andrew's answer, 2 Nov 2026 (this chat): "Oct 5  6'30-17:00". Alfie's labour row for Mon 5 Oct goes back on
the record at 06:30–17:00, the same times as his other weekdays that week.

## What the record held before

- The 5 Oct accommodation night `W-A-alfie-harris-20261005`, 223.63 (accrued in pack v1.19).
- A labour row `W-L-alfie-harris-20261005` that had been set aside on 6 Oct 2026 at 10:05 AEST (00:05:48 UTC) by Andrew Fisher. In the same
  25 seconds the 5 Oct rows of Aaron Zelvis, Andrew Fisher, Daniel Gough and Jayden Paul were set aside too.
- No meals line for 5 Oct (his 1 and 6–9 Oct days each have one at 100.00).
- Nothing delivered on 5 Oct local time. The P08, P46 and P51 entries stamped 5 Oct 23:2x UTC are 6 Oct in Queensland, and they are on
  his 6 Oct row.

Mon 5 Oct 2026 is the King's Birthday, a Queensland public holiday. The page's programme note says nobody works that day. The row's note
says the day is a public holiday.

## Applied

2 Nov 2026 02:19 AEST (1 Nov 16:19 UTC), on the live v12.79 page (`73df88ae…`), by Andrew Fisher, through the page's own
`addOurCost('labour', …)`. Doing that undoes the earlier set-aside, the same as adding the day on the Costs tab.

Runner: `labour_fill.cjs`, a copy of `../record_01Nov2026_shifts_to_13_nov/labour_fill.cjs`. Spec: `shift_spec.json`, one `labour_add`
with Andrew's words.

1. **Dry run** (`dryrun_20261101T161642Z.json`): one new row, 10.5 h; 5 documents planned; nothing sent.
2. **Backup:** the whole record was backed up first. It is kept privately and **not committed**.
3. **Write:** the public page's sha256 was checked. Then 5 documents were written, each acknowledged 200:
   - the row;
   - its stamp;
   - the undo of the set-aside;
   - its author, twice.
4. **Read back** (`report_20261101T161923Z.json`):
   - record version 12729 → 12734;
   - the row is as sent;
   - no other document changed;
   - verification OK.

The row: Alfie Harris, 2026-10-05, 06:30–17:00, 10.5 h, note "KINP labour, the rest of the day · Mon 5 Oct, King's Birthday (Queensland
public holiday) · Andrew Fisher, 2 Nov 2026". The 5 Oct rows of the other four stay set aside.

## What it means for the figures

- **Hours:** Alfie's October hours at KINP rise by the day: 10.5 worked, 10 paid after the weekday 30-minute unpaid break.
- **Pay split:** the page has no public-holiday rule. It splits the 10 paid hours by its weekday rule: 7.6 normal, 2 at ×1.5, 0.4 at ×2.
  The record holds no public-holiday rate, so what Alfie was paid for 5 Oct is for payroll to confirm.
- **Dollars:** none move. Coates wages are carried as hours only, and the 5 Oct night was already accrued at 223.63.
- **Open item:** the 5 Oct night now has a shift beside it.
