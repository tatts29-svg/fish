# v7.30: walk-around numbers and short deliveries (LIVE)

Author: Andrew Fisher

Andrew, 29 Sep 2026:

> "I will need to go around today and get asset numbers off Event Portables loos. Is there any way I can add this into the reference, e.g. WC11, and add a new sub-hired toilet asset number? Also some locations like WC01 have multiple items; it says it is complete even if one did not turn up. How can we fix?"

Everything is on **Timeline → the day → Edit (Change deliveries)**. The **Walk-around** button at the top of the page opens it.

## Walk-around: record asset numbers
- **Whose units** is set once at the top. It defaults to Event Portables; switch it to Coates for Coates stickers.
- The trade chips pick the trade, with the one showing first. Toilets & amenities is open to start with.
- **Find a location** narrows the list (e.g. WC11).
- **Each location shows:**
  - what's ordered;
  - "n of q" numbered;
  - the numbers already on it;
  - one box to type the number.
- **Add** or **Enter** records the number, then the box moves on. It stays on the same location while that location still needs numbers, and goes to the next one once it's finished.
- **No number** records an Event Portables unit with no readable sticker.
- **Refused and named:**
  - a number already on this location;
  - a number already on any other location.
- A number that was sitting in spares comes out of spares.
- The list shows only locations still missing numbers; tick "show the finished ones too" to see all.
- **Where it's stored:** the same records as the Change form. Coates numbers go in assetNumbers and sub-hire units go in units, so the counts, the Questions list and the driver and install sheets all follow.

## What turned up (on the Change form)
- For each item on the location, the form shows the ordered quantity and a box for how many arrived. The box writes the location's supplied record, the same one its details card uses.
- Blank means not counted. A count below the order is **short**, and a count above it is **extra**.
- **Example (WC01):** Accessible Toilet 0 of 1, FWF 2 of 2.

## Short
- **Where it shows:**
  - beside the light on the day's list and on the Change form;
  - beside **✓ Complete** (as "Short · Accessible Toilet 0 of 1");
  - on the Timeline load line;
  - as a new Questions item, "n locations short", listing each one.
- The inventory's "at locations" uses the count, so a short location is counted short.

## Tested (practice copy on live data, phone size, writes blocked)
- **Walk-around** (the numbers are examples, not real stock):
  - Enter at PG01 recorded EP40001 (typed in lower case, saved as capitals) and moved on to PG03;
  - the next Enter recorded EP40002 and moved to PG05;
  - EP40002 was refused there, with "EP40002 is on PG03";
  - No number recorded an unnumbered unit;
  - "WC11" found the one location;
  - switching to Coates recorded 1299995.
- **WC01:** entering Accessible Toilet 0 and FWF 2 gave:
  - Short beside Complete;
  - "short" on the load line;
  - the Questions item "WC01 Toilets: Accessible Toilet 0 of 1";
  - accessible toilets at locations dropping from 2 to 1.
- **Phone:** nothing scrolls sideways. A site-wide table rule was stretching the new table to 640 px; it's fixed for this table.
- **Regression:** the money model is identical to v7.29, and the tab sweep shows 0 errors on desktop and phone.

**LIVE: 29 Sep 2026, 04:29 AEST.** It matches the build byte for byte on the view link.
