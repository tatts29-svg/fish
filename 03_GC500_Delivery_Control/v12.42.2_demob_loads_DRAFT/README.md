# v12.42.2: truck loads from what is Ready

Author: Andrew Fisher · 26 Oct 2026 · a point release on v12.42.1 (the Demob cards without the "booked" zeros).

Andrew, 26 Oct: "Be good if the equipment that is ready we can work out what can go on what load. With event portaloos they can get 24 per truck. Or 6 pee panels and 18 toilets on a truck. Or qty 1 16 pan toilet. Buildings are generally 1 per truck.. accessible toilet can go on with other." His answers to three questions: the Coates accessible toilet rides on a Coates truck with other Coates gear; other Coates gear is one a truck for now; a truck is filled nearest first. Then: "Vms most trucks could tow one or a truck can load 2 and tow 1".

## What it does

In **Everything on site**, under the bar, a **Truck loads from what is Ready** panel plans every unit ticked Ready, and nothing else:

| Gear | A truck takes |
|---|---|
| Event Portables portaloos (FWF) | 24 |
| Event Portables pee panels | 6 at most, the rest toilets, 24 in all |
| Event Portables 16 Pan block | 1, on its own |
| VMS board | 3: load 2, tow 1 (two boards: load 1, tow 1; one board: towed), each owner's boards on their own trucks, nearest first |
| Building | 1 |
| Coates accessible toilet | rides on the nearest Coates truck carrying other gear (never a building's), one a truck |
| Other gear (generators, light towers, toilet blocks with their tanks, a water barrier run, lifts) | 1 for now |

- **Nearest first.** An Event Portables truck starts from the reference with the most Ready units and fills from the nearest Ready units (by their pins) until it is full. As few trucks as the units need.
- **Each truck** lists its stops in order, with what is there, the asset numbers and where it stands; tapping a stop goes to its card.
- **Book this load** (edit link) opens the booking sheet (calendar and clock) for the whole truck and books every unit on it for the same day and time, in one save. A booked truck says when, keeps its units together the next time the loads are worked out, and its day card carries the pick-ups.
- **Text** and **Send** carry the truck's list: each stop, its units and asset numbers, and directions to the first stop.
- The view link shows the loads, with Text and Send.

When more rules come (how many generators or light towers a truck takes), they go in `planLoads` beside the others.

## Files

| File | What it does |
|---|---|
| `singles1238_src.js` | The cards module: v12.42.1's, with the truck loads (release `v12.42.2`). |
| `make_src_from_v12421.py` | Makes `singles1238_src.js` from v12.42.1's module, so the loads move with any change to it. |
| `patch_v12422.py` | On the live v12.42.1 page, replaces its module (found exactly once) with this one; footer v12.42.1 → v12.42.2. |
| `tests/test_v12422.cjs` | The v12.42.1 tests plus the loads: every Ready unit planned once and only Ready units; Event Portables trucks at most 24 and 6 pee panels, as few as needed, starting from the biggest Ready group; the rules on staged cards (16 Pan alone, building alone, accessible with a generator, VMS 3 a truck with load 2 tow 1, booked units together, Not ready left off); view link Text/Send only; Book this load in one save; a booked truck stays together and shows on its day card; the texted list. |

## Checks

To follow.
