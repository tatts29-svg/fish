# v9.14 fire extinguishers — DRAFT (not uploaded, not committed)

Author: Andrew Fisher

**The project manager, on site, about 16:25 AEST, 8 Oct 2026:** "also on another note i see no option to add fire extinguishers. these dont have a asset no a remember they have a charge also"

**State:** DRAFT. It is built on live v9.11 and tested in the practice harness. Nothing was uploaded, committed or written to the record. The checks and their results are under "Checks" below.

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
  - It sits in "Inside it and asset numbers", under its own "Fire extinguishers" heading. For editors, the fold title says "+ fire extinguisher".
  - An editor sets the count with − / + (44 px buttons) and presses **Add fire extinguisher** (× n).
  - Once there are some, the buttons are **Save quantity** and **Take off**.
  - No asset number is asked for.
  - The view link shows the count and no control.
  - The accessories form and the v7.43 rule are unchanged.
- **Saved with who and when, one document per save.**
  - The row goes in the location's own `accessories` document, a collection the record already syncs (kind `value`, one document per reference).
  - The save runs through `mayWrite` → `whoAmI` → `bump`.
  - Row shape: `{type: 'Fire extinguisher', qty, qty_stated: true, as_written: 'Fire extinguisher', asset_no: null, asset_no_state: 'not numbered - counted by quantity', origin: 'added in this page', source_task: null, _added: true, added_at, added_by}`.
  - A change writes `edited_at` / `edited_by` on the same row. Take off sets the quantity to 0 and keeps the row and its history.
  - No stamp and no tombstone is written, so each save is exactly one document.
- **Shown as "Fire extinguisher × n"** in these places:
  - the drawer;
  - the Equipment row, beside "N inside it";
  - the Drivers and Install sheets, in the accessories column, with a tick box on the Install sheet.
- **Kept out of the ordinary accessories** (list, count, accessory hire pricing, the Pricing accessory table), so each fact shows once and nothing is priced twice.

## The charge

- **Charged per piece through the page's existing fire_ext money path:**
  - `labourMoney` → `assetTotal` → `moneySummary`: Costs, the P&L and the customer charges;
  - `pl760Ticks`: the P&L's fire extinguisher column and the By branch table;
  - `acc761Model` / `acc761Labour`: Accruals and the Finance handover;
  - `labourPlan`, Pricing and the labour card.
  
  Each reads the pieces once. `labourRevenue858` already takes fire out of recorded install, so install labour is unchanged.
- **Rate:**
  - **Where the card prices it:** the card's Fire Ext. figure for the location's item type, the same figure the per-building tick uses. Today that is the portable buildings and ticket boxes.
  - **Everywhere else:** "rate to confirm". That covers 0.00, no column, "N/A" and "Included" (toilets, generators, towers, VMS and other plant, containers, furniture). The money reads unknown, never nought:
    - the location's own total turns incomplete;
    - Costs counts it as unknown labour;
    - the P&L shows "not priced";
    - the Accruals labour group is marked incomplete.
    
    Every known figure on that location stays as it was.
- **The rule that cannot double count: an added quantity replaces the per-building fire_ext tick and forecast for that location.**
  - That location's fire_ext tick box is disabled, with the reason.
  - Its forecast slot (one per building, "still to tick") is replaced by one charged slot for the pieces added.
  - A location with nothing added works exactly as before, ticks and forecast included.
  - On the record of 8 Oct 2026 there are 0 fire_ext ticks, so no existing money moves.
  
  The other choice was "adds only beyond the ticks". It was not used because a tick and a quantity on the same location would have to be reconciled by hand.

## For the project manager (nothing is asked on the page)

1. **Rate basis.** The card's Fire Ext. column is headed **2025**. Is that the figure to charge in 2026, or is there a 2026 figure?
2. **One-off or weekly?** The page treats it as a one-off hire charge per piece, as the card's labour block does. Should it be charged weekly or daily instead?
3. **The rate where the card has none.** What should toilets, generators, light towers, VMS and other plant, containers and furniture be charged? The card writes 0.00 or has no column there. Until a rate is given, those read "rate to confirm".
4. **Where he expects them.** Which locations, and how many on each? The page does not pre-fill any.
5. Also noticed, not changed here:
   - WC09's two air conditioners added today are both currently "taken off".
   - On the view link the accessories form is visible with enabled inputs. A save there is refused by `mayWrite`.

## Files

- `patch_v914_fire_ext.py` is the patch.
  - Code only: DATA, MASTER_LOC and the footer are unchanged and asserted.
  - Every replacement matches exactly once.
  - It refuses to run twice.
- `tests/test_fire_ext914.cjs` runs the practice tests on laptop and phone (`PAGE=<build> [MOB=1] node tests/test_fire_ext914.cjs`).
- `evidence/` holds the test logs, the sweeps and the screenshots. No dollar figure is in any frame or any log; money moves are given as multiples of the card's Fire Ext. figure (F) and as counts.

## Checks

(see below; filled from the runs)
