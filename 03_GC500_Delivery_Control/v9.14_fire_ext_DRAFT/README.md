# v9.14 fire extinguishers — DRAFT (not uploaded, not committed)

Author: Andrew Fisher

**Andrew, on site, about 16:25 AEST, 8 Oct 2026:** "also on another note i see no option to add fire extinguishers. these dont have a asset no a remember they have a charge also"

**State:** DRAFT, review findings fixed (see "Review findings" below), and the project manager's 8 Oct answers on the rate applied (see "8 Oct: the rate answered" below). Nothing was uploaded, committed or written to the record.

- **Base.** The task named live v9.11 (`408ae6ac…`). Live had moved to footer **v9.18** (`c547a6de…`) and was still there at the last build (8 Oct, about 23:25 AEST). The patch is built on v9.18; every anchor matched once.
- **Build:** `toolchain/build.sh v914_fire v9.14_fire_ext_DRAFT/patch_v914_fire_ext.py` gives `10593ecd…` (11,627,370 bytes). `check_page.py` reports PASS all checks. Running the patch a second time stops with "v9.14 is already applied". The previous candidate was `18638084…` (11,626,615 bytes); the only change since is the wording below.
- **Not claimed.** No version is claimed on `STATUS.md`. The footer is untouched; the next free number is for whoever publishes.

## Why there was no option (live v9.11, read only)

- **127 of the 176 references carry no fire extinguisher line at all.** The v5.81 labour rule (`labourLinesFor`: only lines with a priced card figure) withholds it wherever the card has no figure:
  - toilets: the card writes 0.00;
  - generators, light towers, VMS, Trakmat, water barriers and the containers: no Fire Ext. column;
  - forklifts: "N/A";
  - furniture: "Included".
- **On the 49 portable buildings where the line exists, it is a hidden yes/no tick, not a quantity.**
  - It sits among Install/Steps/Levelling/Cleaning/Demob in the editors-only "Contract & charges" fold, which is closed by default.
  - It counts one extinguisher per building, at the card's Fire Ext. figure. The card heads that column 2025.
  - No fire_ext tick is recorded anywhere on the job.
- **The accessories form ("Attach an accessory") can't take them either.**
  - It has no fire extinguisher type.
  - It is offered on buildings and toilets only, by the v7.43 rule ("If I go into a generator there should be no option to add accessories").
  - Recording one as "Other" writes three documents, prints "2 × 2x Other — …" on the sheets, and makes the location's accessory money unknown.

## What v9.14 does

- **One control on every location's drawer.** It covers building, toilet, container, generator, tower, barrier, furniture and plant line.
  - It sits in "Inside it and asset numbers", under its own "Fire extinguishers" heading, just under the accessories form where there is one. For editors the fold title says "add fire extinguishers".
  - An editor sets the count with − / + (44 px buttons) and presses **Add fire extinguisher** (× n).
  - Once there are some, the buttons are **Save quantity** and **Take off**. Save quantity is quiet (grey) until the count is changed; then it turns orange and the part says "Not saved yet: 3 set, 2 on the record." Take off sits at the far end of the row, away from Save quantity.
  - **The accessories type list** ("Attach an accessory — pick the type", where the WC09 air conditioners were added) now offers "Fire extinguisher — no asset number, counted below" to editors. Picking it resets the list, scrolls to the Fire extinguishers part and puts the focus on its Add button. The form's own rules (v7.43) are otherwise unchanged.
  - No asset number is asked for. The view link shows the count and no control.
- **Saved with who and when, one document per save.**
  - The row goes in the location's own `accessories` document, a collection the record already syncs (kind `value`, one document per reference).
  - The save runs through `mayWrite` → `whoAmI` → `bump`. On the view link `mayWrite` refuses it, so nothing changes and nothing is sent.
  - Row shape: `{type: 'Fire extinguisher', qty, qty_stated: true, as_written: 'Fire extinguisher', asset_no: null, asset_no_state: 'not numbered — counted by quantity', origin: 'added in this page', source_task: null, _added: true, added_at, added_by}`.
  - A change writes `edited_at` / `edited_by` on the same row.
  - **Take off** sets the quantity to 0 and keeps the row. It also stores the count it had (`off_qty`) and who took it off and when (`taken_off_by`, `taken_off_at`). The add stamp stays. The drawer then shows "Taken off · was Fire extinguisher × 2 · who · when" on both links. For an editor the stepper starts at the old count, so **Add fire extinguisher × 2** puts them back.
  - No stamp and no tombstone is written, so each save is exactly one document.
- **Shown as "Fire extinguisher × n"** in these places:
  - the drawer;
  - the Equipment row, beside "N inside it", in the same muted style;
  - the Drivers and Install sheets, in the accessories column, with a tick box on the Install sheet.
- **Kept out of the ordinary accessories** (list, count, accessory hire pricing, the Pricing accessory table), so each fact shows once and nothing is priced twice.
- **The charge wording.** Editors read the full sentence: "Charged per piece (one-off) at the card's Fire Ext. rate for Building 6m." (or, before any are added, "Each one is charged per piece (one-off) at …"), or "Charge: rate to confirm … until the project manager gives a rate". The view link reads only "Charged per piece." or "Charge: rate to confirm." No year is said with a fire extinguisher anywhere on the page.
- **The per-building tick.** Where a quantity is added, the fire_ext tick in "Contract & charges" is disabled. The reason now shows as text beside it as well as on hover: "— not ticked here: counted by the Fire extinguisher × 2 added under Inside it".

## The charge

- **Charged per piece through the page's existing fire_ext money path:**
  - `labourMoney` → `assetTotal` → `moneySummary`: Costs, the P&L and the customer charges;
  - `pl760Ticks`: the P&L's fire extinguisher line and the By branch table;
  - `acc761Model` / `acc761Labour`: Accruals and the Finance handover;
  - `labourPlan`, Pricing and the labour card.

  Each reads the pieces once. `labourRevenue858` already takes fire out of recorded install, so install labour is unchanged. The page books fire extinguishers as a hire charge, so on the Forecast P&L they sit in **Hire Revenue (1005)**.
- **Rate:**
  - **Where the card prices it:** the card's Fire Ext. figure for the location's item type, the same figure the per-building tick uses, charged once per piece (one-off). Andrew confirmed this basis on 8 Oct (Q1 and Q2 below). Today that is the portable buildings and ticket boxes.
  - **Everywhere else:** "rate to confirm". That covers 0.00, no column, "N/A" and "Included" (toilets, generators, towers, VMS and other plant, containers, furniture). The money is unknown, never nought. Every known figure on that location stays as it was. What each page says:
    - **the drawer:** "Charge: rate to confirm";
    - **the P&L "Fire extinguishers, per piece" line:** counts pieces and locations ("6 fire extinguishers added on 3 locations · 4 pieces at a rate to confirm"). Its amount reads "rate to confirm" when nothing on it is priced, otherwise the priced amount "+ 4 at a rate to confirm". The same rule now applies to the other ticked lines on that card, which also showed nought when nothing on them was priced. The By branch table's fire cell adds "rate to confirm";
    - **Pricing (customer charges):** fire extinguishers are counted apart from the labour ticks. The row says "2 fire extinguishers, rate to confirm" (or "2 fire extinguishers" and their figure), never "labour" of nought;
    - **the labour plan:** the Fire extinguisher row chips "4 rate to confirm", not "no qty". The "labour quantities" check is not raised for them;
    - **Costs:** the "Labour ticked on references" line says "2 lines not priced yet, not in the figure (rate or quantity to confirm) · 4 fire extinguishers on 2 locations: rate to confirm, not in the figure";
    - **costs to job end:** one more item not priced, "4 fire extinguishers on 2 locations: rate to confirm", for the project manager. The Forecast P&L's Hire Revenue basis names them too;
    - **the Finance handover:** under its invoice block, "Not in the invoice figures: 4 fire extinguishers on 2 locations, rate to confirm — …";
    - **Accruals:** the fire extinguisher labour group is marked incomplete;
    - **the location's own total** turns incomplete.
- **The rule that cannot double count: an added quantity replaces the per-building fire_ext tick and forecast for that location.**
  - That location's fire_ext tick box is disabled, with the reason.
  - Its forecast slot (one per building, "still to tick") is replaced by one charged slot for the pieces added.
  - A location with none counted (nothing added, or all taken off) works exactly as before, ticks and forecast included.
  - On the record of 8 Oct 2026 there are 0 fire_ext ticks, so no existing money moves.

  The other choice was "adds only beyond the ticks". It was not used because a tick and a quantity on the same location would have to be reconciled by hand.

## Questions for Andrew (nothing is asked on the page)

1. **Q1, rate basis — answered by Andrew, 8 Oct 2026** (his chat with Claude, about the fire extinguisher rate). The card's Fire Ext. column is headed with the card's earlier year.
   - About 18:00 AEST: "use 2025 for now if need to we edit at a later date".
   - About 18:10 AEST: "don't mention anything about 2025".
   - So the page charges the card's Fire Ext. figure as it stands and says no year with it anywhere (see "8 Oct: the rate answered"). If he gives another rate later, it is a change to that figure.
2. **Q2, one-off or weekly — answered by Andrew, 8 Oct 2026** (same chat, about the same charge).
   - About 18:15 AEST: "one off charge i'm sure".
   - So it is a one-off charge per piece at the card's Fire Ext. rate. The page already charged it once per piece; the editors' sentence now says "(one-off)".
3. **The rate where the card has none.** What should toilets, generators, light towers, VMS and other plant, containers and furniture be charged? The card writes 0.00 or has no column there. Until a rate is given, those read "rate to confirm".
4. **Where he expects them.** Which locations, and how many on each? The page does not pre-fill any.
5. Also noticed, not changed here:
   - WC09's two air conditioners added today are both currently "taken off".
   - On the view link the accessories form is visible with enabled inputs. A save there is refused by `mayWrite`.

## 8 Oct: the rate answered (what changed in this candidate)

Andrew's answers above (Q1 rate basis, Q2 one-off) changed wording only. No money figure moved (money rerun below).

- **Editors' drawer sentence:** "Charged per piece (one-off) at the card's Fire Ext. rate for Building 6m." The year in brackets that followed it is gone, with the code that put it there.
- **View link:** unchanged, "Charged per piece." / "Charge: rate to confirm."
- **The charges fold** (editors) says "Fire extinguisher × 2: <amount> at the card's Fire Ext. rate (one-off)". The year it added in brackets is gone.
- **The card's own Fire Ext. line, as the page already showed it.** These said the card's column year too:
  - the per-building tick's hover text in "Contract & charges" (the column heading and its year note);
  - the "<year> card" source chip on the Fire extinguisher row of the labour card.

  They now read "Fire Ext." with no year, and the chip is not shown on that row. This is done by a small wrapper over `labourLinesFor` that clears the heading's year and the year note for the `fire_ext` line only. The rate and every other labour line are as before.
- **Kept as it is:** the card's data (DATA) still holds its own column heading, year included, untouched and asserted byte for byte. The page never shows it with a fire extinguisher; the year check below reads every tab to prove it.

## Before uploading

- **Rollback hazard.** Once fire extinguisher rows exist on the record, do not upload a build without v9.14 over it. An older build reads them as ordinary accessories: it lists them, and a taken-off row (quantity 0) counts as 1 and makes that location's accessory money unknown.

## Review findings (two reviews of the `b3f796b3…` build), and what was done

| finding | outcome | evidence |
|---|---|---|
| **BLOCKING:** unpriced pieces read as nought or drop out on the rendered money pages | **fixed.** P&L line (pieces, "rate to confirm"), By branch cell, Pricing row, labour plan chip, Costs labour line, costs to job end gap, Forecast P&L Hire Revenue basis, Finance handover note. All 5 of the reviewer's suggested changes, plus the Finance handover, which does not show the costs-to-job-end list | test checks "P&L: …", "Pricing: …", "labour plan: …", "Costs: …", "costs to job end …", "the Finance handover …" (phase 2 and 3), laptop and phone |
| **BLOCKING:** "Take off" hides the record and loses the count | **fixed.** `off_qty`, `taken_off_by`, `taken_off_at` kept; "Taken off · was …" on both links; the fold shows when only taken-off rows exist; the stepper starts at the old count | test checks "Take off writes exactly one document …", "after Take off the drawer says …", "view link: GN01's taken-off row …", "editor (practice): GN01 shows the same taken-off line …" |
| Should fix: hard to find from the accessory type list; fold hint reads like a count | **fixed.** Option in the type list; fold hint now "add fire extinguishers" | test check "the accessories type list offers …" |
| README: "Costs counts it as unknown labour" / "the P&L shows not priced" were true of the models only | **fixed.** The screens now say it, and the README lists what each page says | above |
| README: "No hire figure changes" was wrong | **fixed.** It moves Hire Revenue (1005), as the page's existing path books it | "The charge" above |
| README: "AA's 3 other rows unchanged" proved nothing | **fixed.** A save on WC09 keeps its two air conditioner rows exactly; the AA claim is reworded | test check "adding 1 on WC09 writes exactly one document …" |
| Rollback hazard | **noted** under "Before uploading"; an older build cannot be changed from here | — |
| Unsaved quantity stays in memory | **made visible.** "Not saved yet: n set, m on the record", and Save quantity only turns orange when changed. Nothing is written | test check "Save quantity is quiet …" |
| Phone Equipment: the line can't be seen | **not a problem of this change.** The live base page has the same sticky-column layout; "N inside it" and asset numbers are hidden the same way. The phone text check passes; no phone frame is kept | — |
| View link, single-number locations (GN01) now show the asset-number Remove / "Add number" controls | **not changed.** The base already does this on AA and T0001; those controls refuse to save on the view link | — |
| Disabled tick: reason only on hover | **fixed.** The reason is shown as text | patch step 10 |
| Equipment line style | **fixed.** Muted, like "N inside it" | patch `fire914Equip` |
| Charge wording on the view link | **fixed.** The view link reads the short sentence | test check "view link: GN01 shows … rate to confirm" |
| Small polish: Save quantity orange when unchanged; hyphen for a dash | **fixed** | — |

**Money rerun.** The money reviewer's own script (`review_money914.cjs`, base v9.18 against this build) gives the same results as on `b3f796b3…`. The only difference is by design: the labour plan's "unpriced" count no longer moves for fire extinguishers, because they are now counted as "rate to confirm". The two too-strict asserts the reviewer explained (ratios, tie-out parts moving on both sides) fail the same way. In the "no card figure" scenario no money figure moves. The extra differences it lists are the costs-to-job-end list gaining one item, which shifts the later items' positions.

## Files

- `patch_v914_fire_ext.py` is the patch.
  - Code only: DATA, MASTER_LOC and the footer are unchanged and asserted.
  - Every replacement matches exactly once.
  - It refuses to run twice.
- `tests/test_fire_ext914.cjs` runs the practice tests on laptop and phone (`PAGE=<build> [MOB=1] node tests/test_fire_ext914.cjs`).
- `evidence/` holds the test logs, the sweeps and the screenshots. No dollar figure is in any frame or any log; money moves are given as multiples of the card's Fire Ext. figure (F) and as counts, and rendered page text is masked (`$#`).

## Checks

All checks were run on the `10593ecd…` build (base live v9.18) through the harness.

- **Practice tests:** `tests/test_fire_ext914.cjs`, laptop 1440 **58/58** and phone 390 **58/58**. Logs: `evidence/test_fire_ext914_laptop.log` and `_phone.log`.
- **Sweeps:** `evidence/sweep_laptop.json` and `sweep_phone.json`.
  - 21 tabs: 0 page errors, 0 console errors, 0 hash-route errors, **0 blocked writes**.
  - 15 tabs show; the same 6 are hidden from the nav as on the v9.13 baseline sweep (register, journal, breakdowns, variances, edit, add).

| check | result |
|---|---|
| The record holds no fire extinguisher rows and no fire_ext ticks before the test | pass |
| View link: no control or prompt on a building (AA), a generator (GN01) or a plant line (T0001) | pass |
| Editor (practice capability): "Add fire extinguisher" with − / + (44 px) in "Inside it and asset numbers" on AA, GN01, T0001, WC09 (toilet), T0023 (container); the fold title says "add fire extinguishers" | pass |
| The charge in words, no dollar figure and no year: "Each one is charged per piece (one-off) at the card's Fire Ext. rate for Building 6m." on AA; "rate to confirm … never nought" on GN01, T0001, WC09, T0023 | pass |
| + sets 2 without saving; one Add then writes **exactly one document**, `accessories/AA` (captured in page.route and aborted). The page sent it more than once with the same body, as its outbox retries | pass |
| The document holds one fire row: qty 2, `asset_no: null`, "not numbered — counted by quantity", added_by + added_at. (AA's document had no other rows.) | pass |
| After the save: "Fire extinguisher × 2", Save quantity, Take off; the ordinary accessories list is unchanged | pass |
| With 2 saved, AA reads exactly "Charged per piece (one-off) at the card's Fire Ext. rate for Building 6m." | pass |
| **Year check, editor (practice):** every line, hover title, aria label and list option mentioning a fire extinguisher or the card's Fire Ext. line, on all 21 tabs, the drawers of AA (2 added), a building with only the per-building tick, and GN01 with every fold open, and the money cards (P&L, labour plan, Costs margin card, Finance handover, labour card): none carries the card's column year | pass |
| Save quantity quiet when unchanged; + makes it the main button with "Not saved yet: 3 set, 2 on the record"; − back makes it quiet again | pass |
| The accessories type list offers "Fire extinguisher — no asset number, counted below"; picking it resets the list and focuses the fire extinguisher button, in view | pass |
| Take off writes exactly one document, `accessories/AA`: qty 0, off_qty 2, taken_off_by, taken_off_at; the add stamp kept | pass |
| After Take off: "Taken off · was Fire extinguisher × 2 · Practice Editor · when"; stepper at 2; "Add fire extinguisher × 2" | pass |
| Adding 1 on WC09 writes exactly one document, `accessories/WC09`; its two air conditioner rows are kept exactly | pass |
| A fresh read of the service after the test has no fire row (nothing reached the record) | pass |
| Session A: no page errors; the only console errors are the aborted practice saves; 0 blocked; viewing wrote nothing | pass |
| **Money, simulated record of 2 on AA** (Building 6m, card figure F) | see below |
| Existing ticks unchanged: 0 fire_ext ticks; every other building's fire_ext forecast identical; AA's forecast replaced by one charged slot of 2; no "Relocated or moved units" row; AA's tick box disabled | pass |
| View link: AA's drawer "Fire extinguisher × 2", no control; Equipment row "Fire extinguisher × 2"; Drivers and Install sheets carry it once, with a tick box on the Install sheet | pass |
| **No card figure, simulated record of 2 on GN01 and 2 on WC09**: no money figure moves at all; Costs 2 lines unknown, P&L fire_ext 2 unknown, labour plan "rate to confirm" 4 pieces (its "no qty" count does not move); Accruals group incomplete | pass |
| **Year check, view link** (2 on AA priced, 2 on GN01 and 2 on WC09 at a rate to confirm): the same reading of all 21 tabs, the drawers of AA, GN01 and WC09, and the money cards: none carries the card's column year | pass |
| The same, **as the pages say it**: P&L line, Pricing rows (no "labour" of nought), labour plan chip, Costs line, costs to job end (11 items not priced → 12), Forecast P&L Hire Revenue basis, Finance handover note | pass |
| **Taken off, simulated record**: GN01 at qty 0 (off_qty 2) and 2 on WC09, nothing on AA: no money figure moves against nothing recorded; the P&L fire amount reads "rate to confirm" | pass |
| View link and editor: GN01's "Taken off · was Fire extinguisher × 2 · Practice Taker · when"; the editor's stepper at 2; nothing written | pass |
| Session B: no page/console errors, 0 blocked | pass |

**The money, as multiples of F, where F is the card's Fire Ext. figure for Building 6m.** Every figure that moved was compared before and after the record of 2 on AA arrived:

- **+2 × F:**
  - Costs: charge.labour, charge.total, the difference, and the labour stream's charge;
  - the P&L (`pl770Model`): revenue now and to job end (in Hire Revenue, 1005), gross margin to job end, difference to job end;
  - the Finance handover (`fh866Model`): the invoice row and total, on record, to job end and unbilled, plus revenue on record and to job end;
  - costs to job end (`cj764Model`): revenue on record and to job end;
  - `rh766Model`: revenue now and to job end;
  - the P&L ticks (`pl760Ticks`): fire_ext amount, KINP's fire_ext and branch total, overall total;
  - the labour plan, charged;
  - Accruals (`acc761Labour`): fire_ext charged; Accruals revenue (`acc761Model`, Sep + Oct), with one "Fire extinguishers" stream;
  - AA's own known, total and labour.
- **−1 × F:** the labour plan's "expected" and the Accruals fire_ext "expected". This is AA's one forecast fire_ext piece (one building), replaced by the quantity.
- **+1 × F:** the Accruals fire_ext total, the per-piece total and the package total. These are the two lines above together: 2 charged less 1 forecast.
- **Whole-dollar copies of the same figures move by the same 2 × F, rounded.** Ratios derived from revenue (breakeven, margin percentages) move slightly, and tie-out parts move on both sides and stay tied.
- **Counts:** one more charged entry on Costs and the P&L (labour_ticks +1, fire_ext ticks +1); the labour plan has one more charged line and one fewer expected.
- **Nothing else moves.** No rehire cost, transport, cost or install-labour (`labourRevenue858`) figure changes.

**Screenshots** (in `evidence/`, each looked at; no dollar figure in any frame):

- `drawer_editor_AA_*`: the editor control with 2 saved; `drawer_editor_AA_takenoff_*`: after Take off, with "Add fire extinguisher × 2";
- `drawer_editor_GN01_*`: the editor control on a generator, rate to confirm;
- `drawer_view_AA_*` and `drawer_view_GN01_*`: the view link, with no control;
- `drawer_view_GN01_takenoff_*`: a taken-off row on the view link;
- `equipment_AA_laptop` and `equipment_AA_row_laptop`: the Equipment row. On a 390 px phone the Equipment table's sticky first column covers its asset column. That is the existing layout, and the existing "N inside it" line is covered the same way. The phone text check passed, but no phone frame could show it;
- `install_sheet_AA_laptop`: the Install sheet row. It was drawn outside the print styles, so the accessories run together. The phone frame is left out because the column falls off a 390 px frame there; the sheet text check passed on both.

**Step 1 evidence** (the read-only probe of live v9.11 behind "Why there was no option"): `evidence/step1_*`.
