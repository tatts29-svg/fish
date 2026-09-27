# v6.99 — one map: the Map explorer (DRAFT, awaiting Andrew's yes)

Author: Andrew Fisher · 27 Sep 2026

## What Andrew asked

> "Everything in 3d proof should be merged into plan on satellite.. satellite 3d and satellite pinned if its not in
> planned on satellite it needs to be in there. When u tap maps. It takes u directly into satellite explorer. So maybe
> change the maps to map.explorer or something maybe. We dont wanna double up on info in here."

And, of the two pages' controls: keep **Auto / Ultra (4K) / Light** and **Plan / Sat + plan / Satellite**.

## What the other views had, and where it is now

| Was in | What it had that the explorer didn't | Now |
|---|---|---|
| 3D proof and Satellite · 3D (the same thing twice) | Google's photorealistic 3D city with the job's pins standing on it; tap a pin to see what it is; fly to a found reference; compass; orbit; Overhead / Angled / Close-up and the named views; Auto / Ultra (4K) / Light | A **3D** mode in the explorer, beside Plan / Sat + plan / Satellite (key 4). The pins are the explorer's own, laid on the ground through its georeference, with the same numbers and places as the rings (checked against the master plan to within 0.1 m). They are coloured by chip and driven by the explorer's search and Find chips. The model's compass, orbit, views, full screen and Auto / Ultra (4K) / Light stay with it. Its own search and chips are hidden, because they would double up. Google's tiles are fetched on the first press of 3D only, and kept. |
| Satellite · pins | Tap a reference: what it is, where the delivery stands, the master-plan close-up, open its record; who pinned it on the ground | The **reference card** in the explorer, in 2D and 3D: name, trade, delivery status, the master-plan close-up, "Pinned on the ground by …" (only a real pin from a phone, never a position read off the plan), asset numbers, **Open** (the record's drawer in the dashboard) |

## The tab

- It is called **Map explorer** and is the explorer and nothing else: no Satellite · pins, Satellite · 3D or 3D proof button.
- It fills the screen below the tabs, stays loaded across tabs, and warms up in the background (v6.98).
- The explorer's own header reads "Map explorer · plan, satellite and 3D".
- Anything that used to open another map now opens this one:
  - old `#sheet/__satellite` links (2D);
  - old `#sheet/__satellite3d` links (3D mode);
  - a pin menu's satellite, 3D and explorer items;
  - any "3D proof" or "Plan on satellite" button.
- The Coates Way overlay no longer lists them as pages. The explorer's own-window page list shows Dashboard, Map explorer and The Coates Way.
- A drawing sheet reached from a reference's drawer ("show on the drawing") still opens as that sheet: it is the iEDM document, not a map.

## Checked (test browser, live record, GET only)

- **Tab and pane:** the tab reads "Map explorer" and nothing sits beside the explorer.
- **Card in 2D:** search GN04 and it is ringed. The card shows the master-plan picture, "Generators · No delivery record · S15" and Open GN04, and Open opens the drawer.
- **Old 3D link:** `#sheet/__satellite3d` lands in the explorer's 3D mode.
- **3D mode:**
  - 366 pins, all of the explorer's own;
  - its duplicate search and chips are hidden;
  - Overhead, Angled, Close-up, Macintosh Island, Narrowneck, Pit straight, Street level, Ground, Full screen, Auto, Ultra (4K) and Light are all there;
  - a pin tapped on the model opens the same card (WC23 · Toilets & amenities · S05).
- **Back to 2D:** the right mode button lights up.
- **Coates Way overlay:** offers Coates Way only.
- **Errors:** none on any run.
- **3D speed:** about 32 s to ready in the test browser, which has no graphics card and slow Google tiles. It will be much quicker on a real device, but that is not measured here.

## To publish (on Andrew's yes)

1. **Machine set:** add `explorer/explorer-merge.js`, and replace `explorer/index.html` (the `patch_explorer_index699.py` output) and `poc3d/index.html` (the `patch_poc3d699.py` output).
2. **Page:** live v6.96 plus `patch_v698.py` plus `patch_v699.py`.
3. **Explorer speed work:** when it lands, its `explorer.js` goes in on top. `explorer-merge.js` only hooks explorer.js's globals, so it doesn't need to change.

## 3D: crisp, and still quick (27 Sep 2026, after Andrew's "crisp 4k ultra ... how close we can get ... No lag")

- **Opens on Auto, then sharpens.** 3D opens on Auto so the first picture is quick, then a computer or tablet sharpens itself
  to **Ultra (4K)** as soon as that view has loaded. Test browser: first view at 34 s either way; starting straight in
  Ultra took 92 s, which is why it doesn't.
- **A guard keeps it smooth.** While the view moves, if Ultra runs slower than about 30 frames a second for 2 s, it steps down to Auto
  by itself and says so. A press of Auto, Ultra (4K) or Light is the person's choice and is never overridden.
- **Phones start on Auto.**
- **The camera may come in to 3 m** from the model (was 8 m).
