# v12.36: the Demob tab shows everything on site, by what it is, on your master plan

Author: Andrew Fisher · 26 Oct 2026

## What Andrew asked for (26 Oct 2026, with trucks collecting)

- "lets do a nice one of my map next to each asset. Refernce location ... need to look 10/10"
- "needs to be more orgabise it look confusing. catergorise it please"
- "Reference Meas Nothing with out the asset no and what it is" and "i have asked for weights and deimantion where are they"
- "the demob list should be everything onsite your missing 90% of it" and "i dont want the fencing in the bracing in the demob"
- "cards are not updated with what was picked up ... we are creating this so we know what can be picked up. not work to a schedule that does not work" and "lets not pre date anything"
- "a nice big completion Percentage of Demob too please. days vs Percentage to get this done"

## What the tab shows now

**Everything on site, first.** The tab opens on one list holding every reference on the demob plan, plus anything on site the plan does not hold yet (FL01 and FL02, the two forklifts). Fencing and bracing stay out. The day lists (pick-up list, toilet runs, pump-out run, trucks) are still one tap away, unchanged.

**Grouped by what it is.** The register's own discipline sorts the lines into groups, always in the same order:

1. Generators
2. Lighting towers
3. Portable buildings
4. Toilets & amenities
5. Water barriers
6. VMS boards
7. Plant & equipment
8. Ground protection
9. Furniture & fridges
10. Everything else

Each group has a header with a picture, its name, how many it holds, and its lights. Inside a group, lines run in GC500 ID order, with picked-up lines at the bottom.

**What it is, first.** Each card leads with what it is and its asset numbers. The GC500 ID drops to a small tag. Size (L × W × H) and weight are named in pills, from the page's own record:

- a recorded actual, the contract, or the 2023 Coates guide, which is marked "guide";
- where neither is held, the pill says "to confirm" rather than guessing.

For a part pick-up, the asset numbers still on site come first and the ones picked up are struck through.

**Your master plan beside every card.** Each card carries a piece of master plan D001-26003-03, drawn from the page's own plan tiles and ringed in red where the reference is:

- **Ring:** solid where the plan places the unit, dashed where it only names the area.
- **Label:** the reference and its asset number.
- **Place in words:** the servicing area for a toilet; otherwise what the plan says it is next to or near, and the area of the site.
- **Positions:** the ones the page already holds (Andrew's own pins first). One off the plan offers the satellite map; one with no position says so.
- **Tap the map:** opens the page's own "on the map" card, with the close-up, the wider area, Navigate and Send.

**The whole site above the lists.** Every line is a dot on the master plan in its light's colour. Tap a dot to go to its line. Tap a group button to go to the group.

**What really happened, not the schedule.** Each card says one of:

- **Picked up:** the DEPARTED stamp, and "Left site".
- **Part picked up:** for example "6 picked up · 11 to go".
- **Ready for collection.**
- **Not ready:** someone said so, with why.
- **Not checked yet:** quiet grey, not red.

In the everything view the plan's day, load and source come off the cards. The pick-up time reads "to be booked": nothing is pre-dated. The spot to book a pick-up date and time comes next (v12.37). It needs its own merge rule on the record, so it gets its own release and test.

**Demob complete, big.** A card at the top shows:

- units off site and references fully gone, both from the departure record (DemobProgress996);
- the day of the demob (day 1 of 15, finishing Fri 13 Nov);
- the percentage a day still needed;
- a chart of the days against the percentage, with the even pace to finish on time.

Presentation only: nothing is written to the record, and no record, P&L, Today, charge, QR or servicing tracker changes. Print keeps the page's own sheet.

## Files

| File | What it does |
|---|---|
| `demobmap1236_src.js` | One stylesheet and one script, inserted before `</body>`. It wraps `rowHtml816` (the map in the first cell), `listHtml816` (everything on site, grouped by discipline, using the page's own Coates and Sub-hired sections) and `renderDemob816` (the steps after each draw). |
| `patch_v1236.py` | Inserts the module on the verified live v12.35 page (BASE `10a21fc0…`) and moves the footer from v12.35 to v12.36. |
| `tests/test_v1236.cjs` | v12.35's checks, run in the day's pick-up list, plus the checks for everything on site. |
