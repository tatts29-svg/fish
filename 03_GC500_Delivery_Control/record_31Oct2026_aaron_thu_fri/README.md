# The Thursday night on the barriers shown as a Friday 8-hour day — 31 Oct 2026

Author: Andrew Fisher. Andrew, 31 Oct 2026 ~04:1x AEST (this chat): "There was barriers that came out Thursday night. By aaron
8 hrs. Aaron didnt work friday. To make this clean do we just have aaron do hours for friday then and assign to stps barrier.
But only show as a 8hr day." Agreed, with the Friday row saying it was the Thursday night so the date is not lost.

## Applied

31 Oct 2026 04:06 AEST on the live v12.65 page (`10e8e8c2…`), through the page's own `setOurCost`, by Andrew Fisher, with
`labour_fill.cjs` (the runner gains `labour_set`: change named fields on an existing row, verified field by field) and
`tf_spec.json`: dry run first (4 documents planned, nothing sent), backup (`backup_state_20261030T180623Z.json`), the public
page's sha checked, 2 rows changed with their stamps (4 documents, each acknowledged 200), read back: record version 12489 →
12493, every other document unchanged (`report_20261030T180623Z.json`).

- **Friday 30 Oct**: the person's row becomes an 8-hour day with no start or finish, noted "Water barriers 9972648 STPS · 8 h ·
  WB03 (30) · demob · the Thursday night, 29 Oct, shown here as an 8 h day". The notes written on that row earlier today (a
  generator hour for GN01's departure and the KINP units that left on Friday) come off, since he was not there; the other four
  people rostered that Friday keep their KINP notes, and GN01's departure hour is unassigned.
- **Thursday 29 Oct**: the 4-hour "days" barrier note written earlier today under the "rest is done on days" answer comes off;
  the row's own roster hours are untouched. The Thursday barrier work was the night, and it is shown on Friday.

The barrier allocation (`record_31Oct2026_water_barrier_labour/`) therefore reads, for 29 Oct: the night, 8 h, shown on Friday
30 Oct; 102 hours in all on contract 9972648 (STPS), 90 with a name, 12 to come with the S08 run on Tue 3 Nov.

No figure on the P&L moves (wages are hours only). The roster's hours for the two days: Thursday as rostered, Friday 8.
