# v12.42.2: truck loads from what is Ready

Author: Andrew Fisher · 26 Oct 2026, review fixes 27 Oct 2026 · a point release on v12.42.1 (the Demob cards without the "booked" zeros). **DRAFT: held; not built, not uploaded.**

Andrew, 26 Oct: "Be good if the equipment that is ready we can work out what can go on what load. With event portaloos they can get 24 per truck. Or 6 pee panels and 18 toilets on a truck. Or qty 1 16 pan toilet. Buildings are generally 1 per truck.. accessible toilet can go on with other." His answers to three questions: the Coates accessible toilet rides on a Coates truck with other Coates gear; other Coates gear is one a truck for now; a truck is filled nearest first. Then: "Vms most trucks could tow one or a truck can load 2 and tow 1".

## What it does

In **Everything on site**, under the bar, a **Truck loads from what is Ready** panel plans every unit ticked Ready, and nothing else:

| Gear | A truck takes |
|---|---|
| Event Portables portaloos (FWF) | 24 |
| Event Portables pee panels | 6 at most, the rest toilets, 24 in all |
| Event Portables 16 Pan block | 1, on its own |
| VMS board | 3: load 2, tow 1 (two boards: load 1, tow 1; one board: towed). Each owner's boards go on their own trucks. Each board is measured from its own pin and is a stop of its own, with its own place and directions |
| Building | 1 |
| Coates accessible toilet | rides on the nearest Coates truck carrying one other piece of Coates gear (never a building, a water barrier run, a VMS board or another accessible toilet), and only with gear booked for the same time (or unbooked with unbooked) |
| Coates FWF, generators, light towers, toilet blocks with their tanks, a water barrier run, lifts | 1 for now |
| Units booked for the same time (one owner) | stay together on their own trucks, whatever they are, cut by the rules above; booked trucks are listed first, by time |

- **What a unit is** comes from the unit's own item and label, never from its reference's description. WC09's description reads "FWF, Pee Panel, Toilet Block 6m", so going by it would make every FWF there a pee panel.
- **Nearest first.** A truck starts from the reference with the most Ready units and fills from the nearest Ready units until it is full. It uses as few trucks as the units need.
- **Each truck** lists its stops in order, with what is there, the asset numbers and where it stands; tapping a stop goes to its card. A toilet block with its waste tank reads "1 Toilet Block 6m + waste tank" with both numbers. Once one of the two has left, the line shows only the part still on site.
- **Book this load** (edit link) opens the booking sheet (calendar and clock) for the whole truck, titled with its number and first stop, e.g. "Book truck 3 (from WC09)". It books every unit on the truck for the same day and time, in one save. A booked truck says when, stays together whenever the loads are worked out again, comes first in the list, and its day card carries the pick-ups. The flash names the truck as it now stands, with its new number and first stop, and counts its units the same way the sheet does.
- **Text** and **Send** carry the truck's list: the truck by number and first stop, its booking, then each stop with its units, asset numbers and place, and a Navigate link for each stop.
- The view link shows the loads, with Text and Send.

When more rules come (how many generators or light towers a truck takes), they go in `cutLoads` beside the others.

## Review fixes (27 Oct 2026)

An independent review found these in the first draft. All are fixed in `make_src_from_v12421.py` and `singles1238_src.js` was made again from it.

1. **A unit was classed by its reference's description.** WC09's 10 FWF became pee panels, so WC09 was split over three trucks and its FWF were listed as pee panels. Now the unit's own item and label decide. WC09's 16 Ready units (10 FWF and 6 pee panels) go on one truck, listed as "10 FWF · 6 pee panels".
2. **WC01's two Coates FWF were classed as accessible toilets** and rode as extras on generator, light tower and toilet block trucks. Fixed by 1: a Coates FWF is other gear, one a truck, and only the accessible toilet rides with it.
3. **VMS boards at one reference were planned as one place:** one stop, directions to the first board only, distance by reference. Now each board is measured from its own pin and is a stop of its own (its VMS label and place), and the texted list has a Navigate link for every stop.
4. **A toilet block with its waste tank read "2 Toilet Block 6m"** and left the tank's number off. Now it reads "1 Toilet Block 6m + waste tank" with both numbers, or only the part still on site.
5. **Bookings were kept together only for Event Portables.** A booked VMS or Coates truck was cut up again, lost its booked line, and Book this load then overwrote the boards' bookings without warning. Now units booked for the same time (one owner) are put on their own trucks first, for every kind of gear, and only unbooked units are filled around them. If a truck ever held units booked for different times, the truck would show those times and the button would read "Book this load and move N booked units". No rule makes such a truck now.
6. **Booking a truck renumbered every truck**, so the flash and the texts could name a truck that was now different units. Booked trucks now come first, by time and then first unit. A truck is named by its number and first stop in the sheet, the flash and the texts. After a booking, the flash names the booked truck by the number it now has, found by its booking time. Each truck also carries its own id, so a tap reaches the truck that was drawn.

Smaller items done at the same time:
- The accessible toilet rides only on a truck booked for the same time as it, and never on a run (a group card).
- One natural sort (a single `Intl.Collator('en-AU')`, made once) for the whole module.
- A unit's load kind is worked out once per card, and an owner's name once per plan.
- The load flash counts units the same way the sheet does (a block with its tank is two units), not by unit ids.
- `tests/test_v12422.cjs` no longer skips Book this load without saying so. It records a FAIL when the button is missing. It now books a truck with no booking and at least two references, and checks:
  - the sheet title;
  - one document per reference;
  - the units together under the new time, with the flash naming the truck's new number;
  - that a single unit's sheet opened afterwards still says "Book the pick-up".
- One code comment carried over from v12.42.1 named an assistant. It now says only that it came from a review.

Left as it is, and why:
- Two trucks of one owner booked for the very same time are treated as one booked set and cut again by the rules. Their units stay booked and stay off the other trucks, but they may swap between those two trucks. Telling them apart needs a load mark stored with each booking on the shared record, and that is a record change for Andrew's yes. It is not in this draft.
- Event Portables' own accessible toilets (if any) count as toilets in the 24. Andrew's rule was about the Coates one.

## Files

| File | What it does |
|---|---|
| `singles1238_src.js` | The cards module: v12.42.1's, with the truck loads (release `v12.42.2`). Made by the script below, never edited by hand. |
| `make_src_from_v12421.py` | Makes `singles1238_src.js` from v12.42.1's module (each replacement must match exactly once), so the loads move with any change to it: `python3 make_src_from_v12421.py ../v12.42.1_demob_daycards_DRAFT/singles1238_src.js singles1238_src.js` |
| `patch_v12422.py` | On the live v12.42.1 page (85826c9b…), replaces its module (found exactly once) with this one; footer v12.42.1 → v12.42.2. |
| `tests/test_v12422.cjs` | Browser test (view link, then edit rehearsal with every write captured). It has the v12.42.1 tests plus the loads: every Ready unit planned once and only Ready units; Event Portables at most 24 a truck and 6 pee panels, as few trucks as needed, starting from the biggest Ready group; WC09 classed by its units' own items; the rules on staged cards; the five review cases on staged copies of the record's own cards (WC09 on one truck, WC01, three T0001 boards as three stops, WC05's block and tank, a booked T0158 pair); view link Text/Send only; Book this load on an unbooked truck of two or more references; the single-unit sheet after it. |
| `tests/test_v12422_plan.cjs` | The planner alone, no browser: takes the planner block out of `singles1238_src.js` and runs it in a Node VM on staged cards with real positions (`node tests/test_v12422_plan.cjs`). |

## Checks

- `node --check` on the module's script: passes. `node --check` on both tests: passes.
- `node tests/test_v12422_plan.cjs`: 14/14.
- On the real Ready set after run 9 (177 Event Portables units and Andrew's GN25, LT05, LT06), each unit with its own item and its reference's real description from the live page, positions from the master plan: 11 trucks for 180 units. There are 8 Event Portables trucks (seven of 24 and one of 9). WC09's 16 are on Truck 1, listed as "10 FWF · 6 pee panels", with 8 FWF from PG01, PG03, PG05, PG29 and WC29. GN25, LT05 and LT06 get a truck each. With staged Coates, VMS, tank and booked cards added, 16/16 review checks pass.
- `patch_v12422.py` on a local copy of the live v12.42.1 page, then `toolchain/check_page.py` against it: PASS (214 inline scripts parse, no new keys). Nothing was built in the toolchain or uploaded.
- The browser test has **not** been run on this version (no browser in this session). It is the next step before READY.
