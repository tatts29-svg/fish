# v11.63 — progress to race weekend

Author: Andrew Fisher. Andrew, 23 Oct 2026: "Just with the progress we are doing progress of up to race weekend. Not after
friday 23/10/2026. Or things will look like they are not complete if that makes sense." Then: "We need to get this perfect."
and "I need everything talking. Everything updated."

Built on live v11.62 `c4badfeb8dfe33ea88dd33a5280428281cb87ae1dec005c3ace44ca306713ed8`.

## What changes

**One cut-off, Fri 23 Oct 2026.** Every progress reading on the page counts the programme to race weekend and no later. After
the Friday they stay where race weekend left them, so a pick-up in demob never makes the build look unfinished:

| Reading | Before | Now |
|---|---|---|
| Today board, its seven groups, the category index, the fencing card | read the day (moved into demob after Friday) | read Fri 23 Oct |
| Where we are, by group | water barriers 311 of 375, 83% | 311 of 311; WB20 (30, from 26 Oct) and WB19 (34, from 2 Nov) named under the plates, not counted |
| Delivery pace and the Today report | 727 of 791 "whole job"; from 26 Oct "behind by 30", from 2 Nov "behind by 64" | 727 of 727 booked by race weekend, nothing behind, every day after |
| Milestones banner, list and A4 print | today's ticks | Friday's ticks |
| Showcase progress scenes, the progress email | today | race weekend; the email names WB19 and WB20 |
| Coates Way adherence, the reds, the tab dot | "175 of 176", "1 reference overdue" from 26 Oct | "Due by race weekend 175 · 175 on site"; no red |
| Questions: fencing gap | measured to yesterday | measured to yesterday, never past Friday |

Demob, costs, servicing, prestarts, the Timeline, the weather and the calendar keep the real day ("Off site again" still moves).

Two replay gaps closed so Friday reads the same on any later day: a receipt the record holds with no time stamp counts at the
cut-off as it does today, and a VMS board moved off T0001 and later replaced keeps its replacement at the cut-off.

**Fencing reads one figure.** The category index was 98.44–99.88% because eighteen crowd-control dockets waited on an Event or
Demarcation review. Now, under Andrew's rule of 22 Oct ("our dockets and what has been invoiced are the truth"):

- 36560, 36568, 36603 and 36611 read again after tonight's scrim corrections (category unchanged).
- The fourteen event-week crowd-control dockets confirmed as recorded: 36623, 36634, 36635, 36636, 36637, 36643, 36645, 36647,
  36751, 36755, 36760, 36764, and 36627 (Event 125 m + Demarcation 7.5 m) and 36629 (Event 237.5 m + Demarcation 182.5 m)
  confirmed split exactly as recorded.

Fencing now reads **99.16%**: crowd control is 170.5 m under the programme on the dockets we hold (Event 2,135 of 2,163 m,
Demarcation 5,062.5 of 5,205 m). The index reads **99.88%**.

**The evidence catalogue reads the papers.** The 24481 overlap read again (36614 now carries the sheet's 85 m of scrim, counted
once under Scrim fitted). Added on the catalogue's own rules:

| Work | Papers | Metres |
|---|---|---|
| Relocations (temp fence) | service notes 24482 (22.5), 24483 (17.5), 24484 (80), 24490 (27.5) | 147.5 |
| Removals (mesh panels × 2.5 m) | collection forms 28554, 28556–28560, 28566, 28567, 28569, 28571, 28572, 28575, 28577, 28578 | 875 |

Relocations now read 582.5 of 989 m and removals 1,102.5 of 1,133 m. Barrier moves and barrier collections are not fence and
are not added (as before). 28555 stays out (its reviewer tied it to relocation 24474), as does 28579 (one stroke, maybe a stray
mark).

## Files

- `progress1163.js`: the cut-off, the wrappers, the split rule, the data install.
- `data_v1163.json`: the eighteen review rows and eighteen evidence operations, built by `make_data.py` from
  `snapshots_23Oct2026.json` (the page's own reading of the record on 23 Oct, `tests/probe_gen.cjs`, GET only). A later change
  to any of those records makes its row stale again by the page's own check.
- `patch_v1163.py`: asserts the v11.62 base, lands each change exactly once, footer v11.62 → v11.63.
- `tests/test_v1163.cjs`: opens the page with the real clock, then with the page clock at Tue 27 Oct and Tue 3 Nov; every
  progress reading must equal Friday's, demob must move, no errors. Desktop and phone.
