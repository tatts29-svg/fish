# v7.37: sub-hired locations (LIVE)

Author: Andrew Fisher

Andrew, 29 Sep 2026:

> "Sub-hired needs some work. I want an option when I go into, for example, WC41 to clearly say this is a sub-hired unit, then it removes anything to do with Coates, with an option to do so. ... We need some attention to make sure this is easy, and also define sub-hired gear and where it is. I need you to add all these in for me and fix this process."

Everything is on **Timeline → the day → Edit (Change deliveries)**.

## A sub-hired location
- **To mark one:** in the Sub-hire box, press **This location is sub-hired…**. It asks first:
  - whose gear it is;
  - whether to take the location's Coates numbers off (they go to spares if it's on site).
- **Once marked, the location:**
  - shows **SUB-HIRED · Event Portables** on the form, on the day list, in the walk-around and on the driver and install sheets;
  - no longer asks for a Coates number;
  - has its units recorded as that company's in the walk-around, whatever is set at the top.
- **Change back to Coates** undoes it.
- **Where it's stored:** a new synced collection, `subhire`, with one document per location. Each one records who marked it and when.

## Easier entry
- **Short fleet numbers:** a sub-hire company's numbers can be 1 to 12 characters (for example "12" or "0065"). Leading zeros are kept. Coates numbers are unchanged.
- **Add many at once:** paste a location's numbers (one per line) and press Add all.
  - A number already on the location is refused, and so is one already on another location. The refusal names where it is.

## Sub-hire register
- It sits under the inventory, and the **Sub-hire** button beside Inventory jumps to it.
- It lists every sub-hired unit by company: which location, what it is, its fleet numbers, how many of the order are numbered, and the company's spares.

## Not changed
- Charges and costs still read the contracts, quotes and dockets.
- Labour is unchanged.
- Checked: the money model, the labour plan and all 210 labour units are identical to v7.36.

## Entered on the live record for Andrew
These were entered on 29 Sep 2026, recorded as "Andrew Fisher (via Claude)":

| Location | What was entered |
|---|---|
| WC41 | Marked sub-hired, Event Portables. Fleet numbers 0521 0996 0191 0669 0643 0517 0682 0651 0065 0518 (10 of 10). |
| WC43 | Marked sub-hired, Event Portables. Fleet numbers 0723 0056 0161 0182 0528 0696 0420 0961 0646 0581 (10 of 10). |
| WC31 | Event Portables unit 12 on the 16Pan Block. What turned up: 16Pan Block 1 of 2 and Accessible Toilet 0 of 1, so WC31 shows Short. |

- **0141** was already on **WC42** as Event Portables. It was left there, and pasting it at WC41 is refused with "on WC42".
- **Checked from the live record afterwards:**
  - WC41 and WC43 read 10 of 10;
  - WC31 reads 1 of 1 and shows Short;
  - the inventory's FWF row shows Event Portables 21;
  - the register shows Event Portables with 22 units at 4 locations.

## Tested
- **Practice copy** on live data, desktop and phone, with writes blocked:
  - the same entries made through the buttons;
  - no page scrolls sideways;
  - 0 errors.
- **Tab sweep:** 21 tabs, 0 errors on desktop and phone. A "k is not defined" error on the day list badge was found by the sweep and fixed before release.

**LIVE: 29 Sep 2026, 09:18 AEST.** It matches the build byte for byte on the view link.
