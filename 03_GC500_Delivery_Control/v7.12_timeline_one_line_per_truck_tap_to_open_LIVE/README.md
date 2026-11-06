# v7.12: the day's list, one line per truck, tap to open (LIVE)

Author: Andrew Fisher

Andrew, 27 Sep 2026: "yes to today's load list tap to open more".

**Each line** shows:
- the load number, the same as on the Day documents plate and the PDFs (`dpLoads`);
- the reference codes, large, with a short "what";
- a status lamp and word per reference;
- the time and carrier;
- one short place.

**Tapping a line** opens that load's existing full cards in place: every control is unchanged, one load is open at a time,
and the open load stays open through a sync redraw. Moved-off, no-reference, cancelled and carrier sections are folded,
each with a count.

**Heights for 28 Sep:** desktop day list 6,929 → 575 px; phone 14,580 → 559 px.

**LIVE: 27 Sep 2026, 22:15 AEST.** The page is v7.13 live + `patch_v712.py`, verified byte for byte on the view link.

**Checked:**
- every reference is in exactly one line;
- the numbering matches the plate;
- a half-typed note survives a redraw;
- printing still works (1 page for a single load, 7 for all);
- no errors.
