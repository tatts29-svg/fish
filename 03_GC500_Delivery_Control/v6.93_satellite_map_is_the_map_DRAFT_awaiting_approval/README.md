# v6.93: the satellite map is the map (DRAFT, awaiting Andrew's yes)

Author: Andrew Fisher
Asked 27 Sep 2026: "I don't see any lighting towers or generators on the maps. Maps is very very clunky ... I'd rather we
use this for maps (#sheet/__satellite) ... it shows more ... only thing you need to add is the satellite pins."

**Nothing here is live.** Built as `v690 + patch_v693.py`; tested with the live record and the live map (read only),
the draft page served in place of the live one inside the test browser (`lh2.js`, `sat693.js`).

## What changes
- **Updated 27 Sep 2026 after Andrew's "Maps is meant to open #sheet/__satellite3d":**
  - The Map tab now opens on **Satellite · 3D**. If 3D can't run on the device, it opens this satellite map.
  - The buttons keep their names and order: Satellite · pins, Satellite · 3D, Plan on satellite, 3D proof.
  - The "Satellite map" rename and move-to-first are withdrawn.
  - The Master plan button goes in v6.96 ("dont double up any").
  - A search that finds something on the master still opens there.
- **Every reference is a pin in its trade's colour**, from the triple-checked master-plan positions:
  - generators yellow;
  - light towers white with an orange ring;
  - toilets green;
  - buildings orange;
  - water-filled barriers blue.
  The reference name appears beside each pin from zoom 16. Tapping a pin opens its drawer, as before.
- **The generators and light towers were already on the old board** (GN01–24 and LTC01–14 all had a spot), but every dot
  was the same orange, so you couldn't tell them apart. Now they stand out, and a chip per trade shows or hides them.
- **The master's other layers** are there too, off until their chip is pressed:
  - water barrier runs;
  - gates;
  - entry points;
  - big screens;
  - others' gensets;
  - interface areas;
  - drawn-not-ours.
- **Smoother:**
  - no "use two fingers / Ctrl to zoom" lock;
  - no fades, no world copies;
  - pins are drawn by the graphics card as layers;
  - a chip press is a filter, not a rebuild;
  - a full-screen button (Esc to leave);
  - the map opens framed on the circuit;
  - on a phone the map is taller.

## Checks (desktop 1440x900 and phone 390x844)
- 165 references placed: generators 12, light towers 13, toilets 68, buildings 53, water-filled barriers 12, access 2, other 5.
- Chips filter correctly (only generators, light towers, gates and big screens showing when chosen).
- Full screen works. No page errors.
- Not placeable (no drawing places them): the Molendinar yard units (LT01–06, T0002, NVLT), Phillip Park, WC10/66/85/100,
  WB01/05/06, and a few T-rows, as in v6.89.

## Note on phones
With the gesture lock off, a one-finger drag on the map moves the map, not the page. Scroll the page by dragging outside
the map, or use full screen.
