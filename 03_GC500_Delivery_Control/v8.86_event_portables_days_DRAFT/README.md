# v8.86 — Event Portables load days on the page (DRAFT, candidate built and tested)

Author: Andrew Fisher. Built on live v8.83 `88a3584e` with v8.84 and v8.85 chained in. **Not LIVE**: no edit key in this session.

## What Andrew asked

> 7 Oct 2026 13:15 AEST: "can we also look at delievies im sure we changed these the wc and we had deliveruies days for these from Evenportables.."
>
> 8 Oct 2026 00:20 AEST: "Approved and get everything done"

So: for every reference on the Event Portables delivery plan, the page's planned delivery day is the plan's load day. A day Andrew has recorded on the shared record always wins. Everything that reads the planned day — the Timeline day lists and delivery cards, Today's due-in and due-out counts (the banner pod and the programme panel), the drop sheets, run sheets and loading sheets, Where we are — reads the same day, and the page names the source: **Event Portables plan v10, 3 Oct**.

## Source

`meet_points_03Oct2026/event_portables_plan.json`, **v10, prepared 3 Oct 2026**: five loads of 24 FWF — Fri 9 Oct (Load 1, with 6 pee panels), Tue 13 Oct (Load 2), Thu 15 Oct (Load 3), Mon 19 Oct (Loads 4 and 5). The same file v8.19 wrote into the page as the supplier card (`EP819`).

Live record **version 4370** (public view token, GET only, 8 Oct 2026 ~00:50 AEST): five Load 1 references already carry Andrew's day change to Fri 9 Oct — WC34 (by Andrew directly, 7 Oct 13:29), WC38, WC39, WC40 and WC61 (3 Oct). WC09 and WC57 carry no record date. T0089 is taken off its day on the record (7 Oct 05:23) and its asset was deleted on 6 Oct as "Not on this job". Nothing on the record was changed by this work.

## What changed

**The plan's day goes in at the build, as a schedule correction.** The page has had a way of saying "a day corrected out loud at the source reads like a reschedule" since v5.54 (the King's Birthday correction): the row's `date` becomes the corrected day, the workbook's day stays beside it as `date_as_written`, and `date_correction` names who said so and when. `effectiveDates()` already treats that as a move and still lets a day recorded on the page win. `patch_v886.py` applies exactly that to the 20 schedule rows the plan moves, in `DATA` at build time, so every list, count, card and sheet that reads the row's day reads the load day — nothing is worked out again at run time.

Each moved row carries `date_correction = {as_written, stated_by: "Event Portables plan v10, 3 Oct", stated_on: "2026-10-03", recorded_at: 2026-10-07T14:20Z (Andrew's approval, 8 Oct 00:20 AEST), source, load, load_date, zone, basis, plan886: true}`. The reference's own span (`first_date`, `last_date`, days and weeks between, `duration_state`) follows its rows by the builder's rule. Nothing else in `DATA` changes — `tests/test_data886.py` proves it field by field against the live base.

**Matching rule.** A drop with a WC reference moves the reference's one FWF placement row dated on or after the plan (3 Oct), plus its pee-panel row where the drop carries pee panels; the quantities must equal the plan's (they all do). A row dated before the plan was already delivered when the plan was made and stays (WC67: 2 FWF on site since 1 Oct stay; the second 2 move). A drop with a task reference and no WC number moves that unreferenced schedule row (T0176). A drop with neither is reported, not guessed at.

**Five small run-time changes** let a reference whose rows split across days read right (all in `patch_v886.py` and `ep886.js`):

1. `effectiveDates()`: the correction branch reads the reference's first day and the day as written across every row, so a reference with moved and unmoved rows is not said to have moved as a whole, and `in_where` is only "schedule correction" when it did.
2. `programmeDaysBefore801()`: under a correction each row lands on its own corrected day, with "moved from" the day as written. Where Andrew has recorded a day, every row of the reference goes to his day (as it always has) and "moved from" is the schedule's day as written.
3. `movedOffDay()` names the rows that moved item by item ("4 × FWF, 6 × Pee Panel", not the reference's whole item list); `movedOffLine()` names the source. The `whereChip` words for a schedule correction no longer say it must come from corrections.json.
4. The day table and the delivery card show the row's own day in the date box (`rowDay886`) and, under "moved from", the source line **"Event Portables plan v10, 3 Oct · Load 1, Fri 09 Oct"** (`ep886Source`). The reference drawer explains a split (`ep886DrawerLines`, `ep886InWhy`).
5. v8.21's installer text says "Date needs confirmation" only on a row that carries what the supplier delivers (`ep886Covers`); the supplier card's record line says when a drop is off the plan on the record (`epRecLine819`, wrapping v8.19's).

The footer reads v8.86. No record writes, no money or rate changes, no Today layout changes.

## Before and after

Page day = the plan's load day, or the day recorded on the record where there is one (it always wins).

| Load | Reference | Row | What | Before (schedule) | After (plan) | Recorded on the record | Page day |
|---|---|---|---|---|---|---|---|
| 1 | WC09 | T0101 | FWF ×4 | Thu 8 Oct | Fri 9 Oct | — | **Fri 9 Oct** |
| 1 | WC09 | T0259 | Pee Panel ×6 | Thu 8 Oct | Fri 9 Oct | — | **Fri 9 Oct** |
| 1 | WC38 | T0091 | FWF ×1 | Wed 7 Oct | Fri 9 Oct | Fri 9 Oct (wins) | **Fri 9 Oct** |
| 1 | WC39 | T0092 | FWF ×2 | Wed 7 Oct | Fri 9 Oct | Fri 9 Oct (wins) | **Fri 9 Oct** |
| 1 | WC40 | T0093 | FWF ×5 | Wed 7 Oct | Fri 9 Oct | Fri 9 Oct (wins) | **Fri 9 Oct** |
| 1 | WC34 | T0099 | FWF ×1 | Thu 8 Oct | Fri 9 Oct | Fri 9 Oct (wins) | **Fri 9 Oct** |
| 1 | WC61 | T0095 | FWF ×8 | Wed 7 Oct | Fri 9 Oct | Fri 9 Oct (wins) | **Fri 9 Oct** |
| 1 | WC57 | T0108 | FWF ×2 | Mon 12 Oct | Fri 9 Oct | — | **Fri 9 Oct** |
| 2 | WC67 | T0262 | FWF ×2 | Mon 12 Oct | Tue 13 Oct | — | **Tue 13 Oct** |
| 2 | WC68 | T0155 | FWF ×1 | Mon 19 Oct | Tue 13 Oct | — | **Tue 13 Oct** |
| 2 | WC72 | T0156 | FWF ×1 | Mon 19 Oct | Tue 13 Oct | — | **Tue 13 Oct** |
| 2 | WC29 | T0148 | FWF ×7 | Mon 19 Oct | Tue 13 Oct | — | **Tue 13 Oct** |
| 3 | WC46 | T0151 | FWF ×1 | Mon 19 Oct | Thu 15 Oct | — | **Thu 15 Oct** |
| 3 | WC55 | T0152 | FWF ×1 | Mon 19 Oct | Thu 15 Oct | — | **Thu 15 Oct** |
| 4 | PG01 | T0164 | FWF ×1 | Tue 20 Oct | Mon 19 Oct | — | **Mon 19 Oct** |
| 4 | PG03 | T0165 | FWF ×1 | Tue 20 Oct | Mon 19 Oct | — | **Mon 19 Oct** |
| 4 | PG05 | T0166 | FWF ×1 | Tue 20 Oct | Mon 19 Oct | — | **Mon 19 Oct** |
| 4 | PG29 | T0167 | FWF ×1 | Tue 20 Oct | Mon 19 Oct | — | **Mon 19 Oct** |
| 4 | WC85 | T0168 | FWF ×1 | Tue 20 Oct | Mon 19 Oct | — | **Mon 19 Oct** |
| 4 | T0176 | T0176 | FWF ×2 (Red Bull, no WC number) | Thu 22 Oct | Mon 19 Oct | — | **Mon 19 Oct** |

For the five with a record date the page already showed Fri 9 Oct; what changes for them is the plan row underneath (the "moved from" now reads the schedule's day, Wed 7 or Thu 8, and the plan is named beside it). WC34's chip still says the move is Andrew's, not the plan's.

**Already on the load day, untouched (23 drops):** WC69, WC70 (Load 2); WC48, WC49, WC51, WC53, WC54 (Load 3); WC65, T0162 (Blanchard Race), WC10, WC28, WC30, WC35 (Load 4); WC19, WC73, WC13, WC23, WC24, WC25, WC26, WC45, WC47, WC62 (Load 5). WC51's accessible toilet and the WC29/WC30/WC45/WC47 removals on Mon 26 Oct are not the plan's and are untouched.

**Cancelled (plan list), untouched:** WC32, WC66 — on no load; 6 of WC09's 10 FWF — the schedule already carries 4.

## How WC09 is modelled

WC09 is one reference with three schedule rows: T0101 **FWF ×4** (Event Portables), T0259 **Pee Panel ×6** (Event Portables) and T0102 **Toilet Block 6m ×2** (Coates, with the SFL bookings — DD 26115312 at 09:30 and DD 26115316 at 10:00 on Thu 8 Oct, from Schedule 5). The plan's drop for WC09 is "4 FWF + 6 pee panels" on Load 1; it does not refer to the toilet blocks.

- T0101 and T0259 read **Fri 9 Oct**, moved from Thu 8 Oct, source Event Portables plan v10, 3 Oct · Load 1.
- T0102 stays **Thu 8 Oct** with its two SFL bookings; no correction on it.
- The Timeline lists WC09 on both days: Thu 8 Oct with the toilet blocks (quantity 2, no plan line, no "moved from"); Fri 9 Oct with the FWF and pee panels (quantity "4 / 6", "moved from 08 Oct", the plan named).
- The reference's own first day stays Thu 8 Oct (the first thing to arrive), so the drawer's In tile reads "Thu 8 Oct · on the plan · 4 × FWF, 6 × Pee Panel Fri 09 Oct, Event Portables plan v10, 3 Oct", and the "Due in on" field says which rows come Fri 9 with Load 1 and which stay Thu 8.
- The installer text no longer says "Date needs confirmation" on the toilet-block row (that warning is for rows carrying what the supplier delivers).
- WC09 has no date on the record. If Andrew records one, the page does what it has always done: every row of the reference, toilet blocks included, goes to his day. That is his call to make on the page, not the build's.

## How T0089 is handled

T0089 (Event Elec, FWF ×1, schedule Tue 6 Oct) is still stop 1 of Load 1 in the supplier's plan v10, but Andrew took it off the plan on the record (7 Oct: "T0089 off the plan, so load 1 is 23 FWF"; the row is off its day and the asset deleted as "Not on this job"). The patch does not move it: its row stays folded under Tue 6 Oct as the record left it, it is on no day list and on no sheet. The supplier card and the Load 1 run sheet now carry a record line, worked out fresh from the record at every drawing: "Event Elec (T0089) is off the plan on the record (…) – this load is 23 FWF". The card's own rows still show the plan as the supplier issued it (24 FWF with T0089), because that is what `EP819` is: the supplier's plan as it stands.

**Two drops with no WC number and no task reference** — Brad Jones Racing (1 FWF) and Shell V-Power (1 FWF), both Load 4 — have nothing on the page to carry them, so nothing moves. The patch reports them; they are listed in `evidence/ep886_changes.json`.

## What was deliberately left alone

- The record (version 4370): read once, GET only, never written.
- The supplier card's data (`EP819`, plan v10 as issued) and the plan JSON.
- `hire.weeks` and the card estimate's span on the moved references: an estimate for comparison only, and toilets are charged over the event. `tests/test_data886.py` holds `hire` identical.
- Each row's `sheet` and `phase` (where the row came from in the workbook) — "Schedule says" still names the sheet, and "moved from" says the rest.
- Today's layout, Where we are, money, rates.

## Build

`toolchain/build.sh v8.86 v8.84_today_wide_layout_DRAFT/patch_v884.py v8.85_where_we_are_DRAFT/patch_v885.py v8.86_event_portables_days_DRAFT/patch_v886.py`

| | |
|---|---|
| base (live at build, v8.83) | `88a3584e919d8acd32ac3905099c1d606ec2fe5c1da2793363e8ff870f212457`, 11,138,554 bytes |
| candidate | `9a279ba14c7f929d64545e79cfc798377a5eb8fadf4eb9a0cdb3734519f21640`, 11,183,528 bytes |
| check_page | PASS: 13 inline scripts parse, no new keys, author line present (`evidence/build.log`) |
| what the patch moved | `evidence/ep886_changes.json` (20 rows moved, 23 already on the load day, 1 off the plan, 2 unmatched) |

If v8.84 or v8.85 goes live first, drop the patch that is already live from the command and rebuild.

## Tests

- `tests/test_data886.py base candidate plan.json` — the narrow DATA identity: every section of `DATA` identical to live except the 20 plan rows (date fields only, to the plan's load day, as a correction) and their references' span fields; T0089, WC32, WC66, the WC09 toilet blocks, WC67's 1 Oct row and the Mon 26 Oct removals untouched. The older `test_source875.py` stops at the first intended date change, as expected (`evidence/source_identity875.log`).
- `tests/test_ep886.cjs` (laptop 1440 px and phone) — every plan reference listed on its load day or its recorded day; no moved row left on the day as written; WC34's recorded day with the recorder's chip; WC57, WC67, WC09 and T0089 as above; T0176 on Mon 19 Oct; the Fri 9, Tue 13, Thu 15 and Mon 19 Oct lists; the supplier card and Load 1 run sheet record line; the moved-off folds; the drop sheet for Fri 9 Oct; the installer text; the delivery cards, in the page and as drawn; the WC09 drawer; Today's pod and the programme panel's next-milestone counts against the same day list the Timeline draws; the Timeline's due in / due out for the four load days against that list; redraws of the Timeline and Today; no errors, no live writes.
- The full regression set of v8.85, rerun on this candidate (`evidence/`): model881, where885 at 2560/1600/1440 px and phone, wide884 at three widths and phone, layout876, crew883, vms874, finance866, asset873, loading872, unloading881, paired881, handling875, paired879, the 15-tab sweep, v871, supplier870 and kinp869 — laptop and phone.

**The record at the run (8 Oct 2026).** `test_ep886.cjs` reads the live record, so WC57 and WC67 are checked on the day the
record has for them at the run, or on the plan's load day when it has none — the rule the release states ("a day recorded on
the record still wins, the way it beats the plan", for the whole reference). On the morning of 8 Oct Andrew recorded Tue 13 Oct
on both WC57 and WC67, so on the combined candidate the test expects, and the page shows: WC57 on Tue 13 Oct (moved from 12 Oct,
the plan's Fri 9 Oct named beside it), off Fri 9 Oct and off its drop sheet; the supplier card's Load 1 line "Record shows
Tue 13 Oct for WC57 – this plan has Fri 9 Oct"; and WC67's four FWF all on Tue 13 Oct — the two on site since 1 Oct included,
because a recorded day moves every row of the reference. When the record has no day for them the original expectations apply
unchanged (WC57 on Fri 9 Oct by the plan; WC67's first two on 1 Oct). The test's own checks that stay the same whatever the
record says: no moved row left on the day as written, the lists and counts agreeing between Today and the Timeline, the WC09
split, T0089 off the plan, the redraws, no errors and no writes.

## Results

Candidate `9a279ba1…` on base `88a3584e`, run 8 Oct 2026 ~00:50–01:40 AEST, one browser at a time, every write aborted by the harness (`evidence/summary.log`, one log per run). Every suite gives the result the v8.85 candidate gave; the two out-of-date suites fail on the same lines as on live v8.83.

| suite | laptop | phone | note |
|---|---|---|---|
| data886 (narrow DATA identity) | PASS | — | DATA identical to live except the 20 plan rows and their references' span fields |
| source875 (old DATA identity) | stops | — | stops at the first intended date change, by design (`source_identity875.log`) |
| model881 | 12/12 | — | |
| **ep886 (new)** | **31/31** at 1440 px | **31/31** | screenshots in `evidence/shots/`; **31/31 and 31/31 again on the combined candidate `5e786047…` of 8 Oct 2026 ~11:30 AEST** with WC57 and WC67 recorded on Tue 13 Oct (`../v8.89_full_chain_08Oct2026/evidence_h1final/ep886_*.log`) |
| where885 | 24/24 at 2560, 1600 and 1440 px | 24/24 | |
| wide884 | 21/21 at 2560, 1600 and 1440 px | 21/21 | |
| layout876 | 18/18 | 18/18 | |
| crew883 | 34/34 | 34/34 | |
| vms874 | 18/18 | 18/18 | |
| finance866 | 24/24 | 24/24 | |
| asset873 | 40/40 | 40/40 | |
| loading872 | 26/26 | 26/26 | |
| unloading881 | 34/34 | 34/34 | |
| paired881 | 18/18 | 18/18 | |
| handling875 | 22/28 | 22/28 | the same six lines fail as on live v8.83 and the v8.85 candidate (v8.81 wording; P52 recorded as Franna) |
| paired879 | 17/18 | 17/18 | the same line fails as on live v8.83 and the v8.85 candidate |
| sweep | 15 tabs shown, 0 errors, 0 writes attempted | 15 tabs shown, 0 errors, 0 writes attempted | |
| v871 · supplier870 · kinp869 | 12/12 · 17/17 · 17/17 | — | |

Looked at (`evidence/shots/`): the Fri 9 Oct day view with the WC57 card open, laptop and phone — "09/10/2026 · Fri · moved from 12 Oct · Event Portables plan v10, 3 Oct · Load 1, Fri 09 Oct"; the WC09 drawer, laptop and phone — "In Thu 8 Oct · on the plan · 4 × FWF, 6 × Pee Panel Fri 09 Oct, Event Portables plan v10, 3 Oct". Dollar figures in the inherited v871 log are redacted in the evidence copy.

## Open for Andrew

1. The supplier card still shows plan v10 as Event Portables issued it — Load 1 with T0089 and 24 FWF — with the record line saying T0089 is off and the load is 23. A re-issued plan from Event Portables (v11) would take it off the card properly.
2. Brad Jones Racing (1 FWF) and Shell V-Power (1 FWF) on Load 4 have no WC number and no schedule row; the page cannot carry a day for them until one is given.
3. WC09's own In day reads Thu 8 Oct (the Coates toilet blocks) with the FWF and pee panels on Fri 9 Oct. If the whole of WC09 should read Fri 9 Oct, recording Fri 9 on WC09 does that — and moves the toilet blocks with it.
4. If Andrew records a day on any of these that differs from the plan's, his day shows and the plan's day sits beside it as "moved from", with the plan named — the page does not argue.
5. **WC67, recorded Tue 13 Oct on 8 Oct.** A recorded day applies to the whole reference, so WC67's first two FWF — on site since 1 Oct — now read Tue 13 Oct on the Timeline as well as Load 2's second two. If only the second drop was meant, clearing the date on WC67 puts the first two back on 1 Oct and the second two on the plan's Tue 13 Oct.
6. **A small gap to close in a later release, not in this one:** the "moved off this day" fold on Mon 12 Oct still says WC57 moved to Fri 9 Oct (the plan's correction, which is what the fold documents), while the record has since put WC57 on Tue 13 Oct. The row itself, its card, the lists, the counts, the drop sheet and the supplier card all read Tue 13 Oct. The fold should name the record's day when there is one ("moved to Tue 13 Oct on the record; the plan had Fri 9 Oct"). No data or money is involved.
