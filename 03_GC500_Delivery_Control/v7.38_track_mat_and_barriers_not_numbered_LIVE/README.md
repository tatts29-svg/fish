# v7.38: track mat and water-filled barriers carry no asset numbers (LIVE)

Author: Andrew Fisher

Andrew, 29 Sep 2026:

> "Also track mats and water barriers don't have asset numbers."

They're counted by quantity (metres of barrier, sheets of mat), never by a number on each piece.

## Before
- The walk-around and Questions already left them out.
- The inventory still counted every one as "no number yet": Trakmat 20 and TL2 barriers 76. That was 96 of the 100 in the "no number yet" total.
- These places still asked for a number, or left a blank for one:
  - the Change form;
  - the day list;
  - the drawer;
  - the driver and install sheets.

## Now
- **Inventory:** "Coates numbered" reads *not numbered* and "No number yet" reads "-". The job's "no number yet" total drops from 100 to 4.
- **Change form:** it says "Not numbered - water-filled barriers and track mat are counted by quantity, not by asset number." There's no box to add a number.
- **Day list:** "Asset no. not numbered".
- **Drawer:** "Not numbered - counted by quantity".
- **Sheets:** "Not numbered - count only", with no write-in line.
- **Existing numbers:** a number already recorded against one (T0025 Trakmat has one) is still shown.

## Tested (live data, writes blocked)
- 16 references are affected.
- Checked against v7.37:
  - the labour units, the money model and the labour plan are identical;
  - every location's "n of q" is identical.
- **Tab sweep:** 21 tabs, 0 errors on desktop and phone.

**LIVE: 29 Sep 2026, 09:39 AEST.** It matches the build byte for byte on the view link.
