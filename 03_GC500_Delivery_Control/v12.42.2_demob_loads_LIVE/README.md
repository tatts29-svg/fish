# v12.42.2: truck loads from what is Ready — LIVE 27 Oct 2026 06:18 AEST

Author: Andrew Fisher · 26 Oct 2026, review fixes and second review fixes 27 Oct 2026 · a point release on v12.42.1 (the Demob cards without the "booked" zeros). **DRAFT: held; not built, not uploaded.**

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
| Units one save booked together (Book this load, or "Book all" at a reference) | their own trucks, cut by the rules above, never mixed with other units, whatever else is booked for that time |
| Units booked one at a time on their own cards, for the same time (one owner) | planned together, on trucks of their own, cut by the rules above |
| Booked trucks | listed first, by time |

- **What a unit is** comes from the unit's own item and label, never from its reference's description. WC09's description reads "FWF, Pee Panel, Toilet Block 6m", so going by it would make every FWF there a pee panel.
- **Nearest first.** A truck starts from the reference with the most Ready units and fills from the nearest Ready units until it is full. It uses as few trucks as the units need.
- **Each truck** lists its stops in order, with what is there, the asset numbers and where it stands; tapping a stop goes to its card. A toilet block with its waste tank reads "1 Toilet Block 6m + waste tank" with both numbers. Once one of the two has left, the line shows only the part still on site.
- **Book this load** (edit link) opens the booking sheet (calendar and clock) for the whole truck, titled with its number and first stop, e.g. "Book truck 3 (from WC09)". It books every unit on the truck for the same day and time, in one save, and every unit on it (at every reference) carries the same save mark: the booking's own stamp, which every booking already stores. A booked truck says when, stays together whenever the loads are worked out again (whatever else is booked for that time), comes first in the list, and its day card carries the pick-ups. The flash names the truck as it now stands, with its new number and first stop, and counts its units the same way the sheet does.
- **Booking for a time a truck is already booked for.** When the day and time picked on the sheet (a truck's, one unit's or "Book all") is one a truck of the same owner is already booked for, or the units being booked are on a booked truck, the summary line under the calendar names that truck and says what saving does to it:
  - "Truck 1 (from WC33) is already booked for Wed 28 Oct · 06:00 and keeps its own units" (a whole truck, or one unit that goes on a truck of its own). Save saves; nothing is asked.
  - "... this unit goes on it too", "... this unit comes off it" (or "N of these units come off it"), or "... saving plans it again with this booking, and units can move between trucks". The line turns amber, and Save asks first: a driver who already has that list needs the new one, so text it again after saving. OK saves; Cancel leaves everything as it is and the sheet stays open.
  The sheet works this out by planning the loads as they stand and again with the booking in, so what it says is what the plan will show.
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

## Second review fixes (27 Oct 2026)

A second review found these. All are fixed in `make_src_from_v12421.py`, and `singles1238_src.js` was made again from it.

1. **A booked truck was cut up again when another unit of the same owner was booked for the same time on its own card.** On the real Ready set, Truck 3 (from WC33) booked for Wed 28 Oct 07:00 and then PG01 0285 booked for 07:00 on its card put PG01 0285 on the WC33 truck and pushed WC43 0182 off to a truck of its own. The driver's list was then wrong and nobody was told. Of 1,239 "whole truck plus one unit" cases, 165 swapped a unit. Now Book this load works out one stamp for the whole save and writes it on every unit at every reference. The loads split each time and owner by that mark: a save of more than one unit is cut on its own, and units booked one at a time are planned together. No record format change: the stamp (`set`) was already stored with every booking. Two whole trucks booked for the same time now keep their own units too, which the first draft listed as a known limit.
2. **Booking for a time another truck of that owner held changed the booked truck without a word.** The sheet now names that truck and says what saving does (see "Booking for a time a truck is already booked for" above), and Save asks first whenever a truck already booked would change. The flash after Book this load now counts the units on the truck it names, found by the booking time and the units booked.
3. **Two browser checks passed with nothing to test.** The Event Portables truck check and the WC09 check now FAIL, and say so, when the record holds no unbooked Ready Event Portables units (or none at WC09) to test against.
4. **No test covered a refused truck save, and "one save" was not checked.** The browser test now makes a truck save with this browser's storage refusing it: the flash says "Not saved · keep this page open" and never "recorded by", the sheet stays open, and nothing goes up for the truck's references. The in-page copy is then put back before the real booking. The booking check now also counts one document per reference. The planner test runs the truck writer in a Node VM: one mark for the whole truck, a refused save says "Not saved", and a view-only link writes nothing.

Left as it is, and why:
- Units booked one at a time for the same time and owner are still planned together, so adding another can move a unit between their trucks. The sheet says so and asks before saving.
- Clear booking on a unit's own card asks "this unit only?" as before. It does not name the booked truck the unit comes off.
- Event Portables' own accessible toilets (if any) count as toilets in the 24. Andrew's rule was about the Coates one.

## Files

| File | What it does |
|---|---|
| `singles1238_src.js` | The cards module: v12.42.1's, with the truck loads (release `v12.42.2`). Made by the script below, never edited by hand. |
| `make_src_from_v12421.py` | Makes `singles1238_src.js` from v12.42.1's module (each replacement must match exactly once), so the loads move with any change to it: `python3 make_src_from_v12421.py ../v12.42.1_demob_daycards_LIVE/singles1238_src.js singles1238_src.js` |
| `patch_v12422.py` | On the live v12.42.1 page (85826c9b…), replaces its module (found exactly once) with this one; footer v12.42.1 → v12.42.2. |
| `tests/test_v12422.cjs` | Browser test (view link, then edit rehearsal with every write captured). It has the v12.42.1 tests plus the loads: every Ready unit planned once and only Ready units; Event Portables at most 24 a truck and 6 pee panels, as few trucks as needed, starting from the biggest Ready group; WC09 classed by its units' own items; the rules on staged cards; the five review cases on staged copies of the record's own cards (WC09 on one truck, WC01, three T0001 boards as three stops, WC05's block and tank, a booked T0158 pair); view link Text/Send only; a truck save this browser cannot keep; Book this load on an unbooked truck of two or more references (one document per reference); the single-unit sheet after it, which says its unit would come off the booked truck. The Event Portables and WC09 checks FAIL when the record no longer holds Ready units to test against. |
| `tests/test_v12422_plan.cjs` | The planner and the truck writer alone, no browser: takes them out of `singles1238_src.js` and runs them in a Node VM on staged cards with real positions (`node tests/test_v12422_plan.cjs`). Second review cases: a full booked truck plus one same-time single booking keeps its units exactly (a case the first draft got wrong); two whole trucks at the same time; what the sheet says and asks; one mark per truck save; a refused save; a view-only link. |

## Checks

- `node --check` on the module's script: passes. `node --check` on both tests: passes.
- `node tests/test_v12422_plan.cjs`: 23/23.
- On the real Ready set after run 9 (177 Event Portables units and Andrew's GN25, LT05, LT06), each unit with its own item and its reference's real description from the live page, positions from the master plan: 11 trucks for 180 units. There are 8 Event Portables trucks (seven of 24 and one of 9). WC09's 16 are on Truck 1, listed as "10 FWF · 6 pee panels", with 8 FWF from PG01, PG03, PG05, PG29 and WC29. GN25, LT05 and LT06 get a truck each. With staged Coates, VMS, tank and booked cards added, 16/16 review checks pass.
- Second review, on the same real set with bookings made as the page makes them (one mark per save): all 1,239 "whole truck plus one unit at the same time" cases keep the booked truck exactly, and the sheet says "keeps its own units" without asking. All 20 pairs of whole VMS trucks booked for the same time (the review's [VMS 04, 05, 14] and [VMS 13, 16, 17] among them) keep their boards. All 8 Event Portables trucks booked whole for 07:00 keep their units. On 1,500 random bookings the sheet warned exactly when a booked truck changed, naming exactly those trucks (207 warned). 3,000 random plans broke no rule: every Ready unit once, the caps, no save mixed with other units, no owners or times mixed, booked trucks first, ids unique. 14/14. One clash check (the loads worked out twice) takes about 2.5 ms on the real set.
- `patch_v12422.py` on a local copy of the live v12.42.1 page (85826c9b…), then `toolchain/check_page.py` against it: PASS (214 inline scripts parse, no new keys), run again on the module after the second review fixes (module sha256 83b6db6c…, made again from the script byte for byte). Nothing was built in the toolchain or uploaded.
- Since then: a VMS board on a delivery reference shows the rego the VMS register holds for it (VMS-01..03 since record run 11 carry VMS21/22/24 as Premiair units, which hold no rego); the day-card checks hold on any later day; the truck check redraws Everything before reading the loads.
- Built on verified live v12.42.1 `85826c9b…` with `toolchain/build.sh v12.42.2 v12.42.2_demob_loads_LIVE/patch_v12422.py`: candidate **`c83f1a27a3995852437afe4890bf4dd43d253aecb3128baa52b12a61d9b704ba`**, 214 inline scripts, page check PASS.
- `tests/test_v12422.cjs` on the candidate, reading the live record (206 Ready, the three VMS references): **78/78 desktop, 78/78 phone** (`evidence/test_v12422_desktop.txt`, `evidence/test_v12422_phone.txt`). Book this load booked a whole truck (Truck 2 from WC69, 24 units at 5 references) for one day and time in one save on the page only; the truck came back first and named by its booking; the texted list gives every stop its own Navigate link. Writes were captured in the page; nothing reached the network.
- Shared sweeps, desktop and phone: 27 tabs, 19 shown, 0 tab errors, 0 page errors, 0 blocked writes, 7 hashes, back to #plant (`evidence/sweep_desk.json`, `evidence/sweep_phone.json`).
- Screenshots in `evidence/` (truck_loads, truck_loads_booked); staff names blurred, and redacted in the logs.

## Live

- Uploaded 27 Oct 2026 06:18 AEST: the view link serves `c83f1a27…` byte for byte (15,800,103 bytes), confirmed by a separate fetch and cmp. Built on live v12.42.1 `85826c9b…`.
- Live tests on the live bytes: **78/78 desktop, 78/78 phone** (`evidence/test_v12422_live_desktop.txt`, `evidence/test_v12422_live_phone.txt`), reading the live record (206 Ready after record run 12).
