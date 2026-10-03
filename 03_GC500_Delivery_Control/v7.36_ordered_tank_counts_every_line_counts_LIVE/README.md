# v7.36: an ordered tank carries its number, and every ordered line counts (LIVE)

Author: Andrew Fisher

Andrew, 29 Sep 2026:

> "1328978 waste tank is on site. Inventory says no number for this location. Please ensure this is all correct and eliminate these bugs."

## What was wrong
- **WC05** ordered a Waste tank ×1 and a Toilet Block 6m ×1.
  - The tank is on the record as an on-site unit, "Waste tank" 1328978.
  - Since v5.59, a tank is kept out of a location's *building* numbers. That's right for labour ticks and photo slots.
  - But the count (and the v7.32 split by item) read only the building numbers. So the tank WC05 ordered showed "no number yet", and the inventory's Waste tank row read 1 numbered and 1 with no number.
- **"n of q numbered" read only a location's first ordered line.** These locations showed the wrong target:
  - WC01 (FWF ×2 + Accessible ×1) read "1 of 1", so it looked finished;
  - WC05, WC09, WC20, WC27, WC31 and WC51 had the same fault.
- **Cancelling a location with two item types filed wrongly.** Every Coates number went to spares as the location's first type, so WC05's toilet block would have become a "Waste tank" spare. A unit's on-site record also stayed behind with its number.

## What it does now
- **An ordered item recorded as its own unit counts as that item's number.** That applies in:
  - the inventory;
  - the walk-around;
  - the list under a count, which now shows that item's own numbers;
  - Questions;
  - a cancelled order's move to spares, and a "Release".
- **"n of q" counts every ordered line.** It uses what turned up where it was counted, else the order.
  - WC01 now reads 2 of 3: the accessible toilet isn't numbered or recorded yet.
  - WC05 reads 2 of 2.
- **A cancelled order's numbers go to spares as the item each one counts as.** Their on-site unit records come off with them.
- **Labour and money are untouched.** Building numbers are unchanged, so no labour tick moves.

## Tested (live data, writes blocked)
- **Inventory, Waste tank row:** Coates numbered went from 1 to 2, and "no number yet" from 1 to 0. Tapping the count shows WC05 1328978 and WC27 1328979.
- **Regression checks (v7.35 against v7.36):**
  - the labour units, all 210 reference/item pairs, are identical;
  - the money model and the labour plan are identical;
  - the tab sweep shows 21 tabs and 0 errors on desktop and phone.
- **Practice cancel of WC05, then put back:**
  - 1097377 went to spares as Toilet Block 6m, and 1328978 as Waste tank;
  - nothing was left on WC05;
  - nothing was counted twice.

**LIVE: 29 Sep 2026, 09:00 AEST.** It matches the build byte for byte on the view link.
