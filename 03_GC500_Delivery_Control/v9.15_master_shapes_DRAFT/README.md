# v9.15 master shapes, every item: DRAFT (not live)

Author: Andrew Fisher

**What the project manager asked:**
- On site, about 16:40 AEST, 8 Oct 2026, with two Arrange loads screenshots: "be good when we choose the loads the loads are the same shapes as what is on the maps and be even smarter by even as far as making it exactly the same shape so would even show the door side".
- 9 Oct, about 00:05: "Remember every item has a shape even a fwf has a shape. Disabled toilet. Generator too."
- About 00:10–00:20: "Water barrier have shapes theirs is the white and yellow long lines." / "Waste tank almost need to be same shape as the toilet block greyed. Clearly to say waste tank." / "Waste tanks are under the toilets so u wont see on master."
- About 00:30: "Remember when we pick the loads we can select the driver to door selection here too. As we can see the door side on the pics."

**What this is:** every unit on the ground has its own shape, as data plus a drawing helper Arrange loads can use.
- Where the 2 Oct master D001-26003-03 draws the unit, the shape is traced from the PDF vector (source `master`, solid outline).
- Where it does not, the unit gets its footprint from a cited source, placed at its reference (source `not drawn on the master — footprint from …`, dashed outline). Where no source settles the size, it says **size to confirm** and still draws the best sourced size.
- **Arrange loads (`drops911`) is not touched.** Whoever owns it wires `MasterShapes915.svg()` into the markers. The door picker should use the master's door as its default, and the side chosen on the page wins. Each unit carries its `loading_id` (`u<asset>` or `item:<item>`), the key `loading872Set` already uses for "Door to driver side / passenger side / not applicable", so the per-unit door choice can sit beside each unit's shape. The side is never set automatically.

## Contents

| file | what |
|---|---|
| `shapes_v915.json` | All 198 references: the 180 of 8 Oct plus 18 schedule-row and record references that carry units. Each unit is listed under its reference with its part(s). Built by `build_all.py`. |
| `footprints_v915.json` | The footprint used for each item type, reconciled from the two catalogues, with both catalogues' sizes, the disagreement, the door rules and the sources. |
| `build_all.py` | Builds both files from the inputs below and the base page's MASTER_LOC, then writes both checksums into the patch. Run it again if MASTER_LOC changes (for example after the pins release). |
| `shapes_v915_traced_8oct.json` | The 8 Oct trace, kept unchanged (sha `c53e21d5…`). |
| `inputs/` | `inventory.json` (every unit on the ground), `traced_new.json` (the 9 Oct trace of parts the 8 Oct trace had not tied to a reference), `catalogue_drawings.json`, `catalogue_documents.json`. |
| `patch_v915_shapes.py` | Adds `MasterShapes915` to the page as two new blocks at the end. Nothing else changes. It refuses to run twice, on a base without v9.11, when either json's checksum differs, or when MASTER_LOC moved since the build. |
| `tests/test_shapes915.cjs` | Static and browser tests (below). |
| `evidence/verify_pdf.py`, `evidence/pdf_check.json` | A fresh, independent read of the PDF that the tests compare against: outlines, doors, barrier pieces and barrier lines. |
| `evidence/doors_check.json` | The independent door re-check: 117 of 117 agree, so no door was changed. |
| `evidence/markers_*.png`, `evidence/test_*.json` | Test results and marker pictures, laptop and phone. |

## Every unit, and where its shape comes from

402 active units (inventory.json has 409 rows; 7 belong to cancelled references). Barrier references are one row each, counted in pieces; the trakmat row is one row of 20 mats.

| | units |
|---|---|
| traced from the master | 311 |
| not drawn on the master: catalogue footprint | 85 |
| waste tank under its block (its block's outline) | 6 |

| type | traced | standard | under its block |
|---|---|---|---|
| FWF | 212 | 15 | |
| Accessible (disabled) toilet | 4 | | |
| Toilet block 6 m / 16-pan | 15 / 2 | | |
| Pee panel | 6 | | |
| Waste tank | | | 6 |
| Buildings (6 m, 4.8 m, 12 m, 9.6 m, 3.6 m) and ticket boxes | 49 | 2 (T0021, T0022) | |
| Generators | 12 (incl. GN13, GN18) | 4 (GN25, GN? ×2, T0268) | |
| Water barriers (references) | 9 | 6 | |
| Light towers | | 24 | |
| VMS boards | | 23 | |
| Forklifts | | 6 | |
| FWF trailers | | 2 | |
| Containers | 2 (T0266, T0258) | 1 (T0023) | |
| Trakmat (×20), distribution board | | 2 | |

- **Cancelled references keep their units, marked:** P47, WC32, WC66, T0019 and T0089 have no shape. P53 is cancelled but the master still draws it, so its traced shape stays.
- **T0265 has no shape:** its 4 fridges ("OP42 Fridge") are contents, and no drawing or document gives a fridge footprint (size to confirm).
- **24 references are not placed on the map:** they have no position on the master, in MASTER_LOC or as a record pin (LT01–06 and NVLT at Molendinar, the VMS rows, FL01/FL02, GN25, GN?, WC100, WC85, T0021, T0109, T0162, T0176, T0268). Their shapes are for Arrange loads; `layout()` with a map projection returns null for them, and `shape().centroid` is null.
- **T0022 and T0023** have no MASTER_LOC entry; they are placed at the record pin somebody stood at (the point Navigate uses).

## What was added on 9 Oct, and how

**Water barriers are drawn on the master** (correcting the 8 Oct "not drawn"). They are the white-and-yellow lines (legend WATER-FILLED BARRIER), traced as line shapes:
- Each line runs through the mid points of each piece's short ends; every piece is kept with its own colour.
- **WB06** (GC Hwy grandstand, 3 lines, 156 pieces drawn against 154 on the contract), **WB01** (11 against 12), **WB14** (2 against 2): high confidence.
- **WB04**, **WB05**, **WB16** and **WB13**: medium (WB13's 10-piece run below the single pieces is low).
- **WB17 and WB18:** low. These are all-yellow kerb rows, not the white-and-yellow pattern, and may not be water barriers.
- **WB02, WB03, WB07, WB15, WB19, WB20** are not drawn: each is a straight standard line of its contract pieces at 2.0 m (the drawn TL2 piece), centred on MASTER_LOC, square to the sheet. Its line and direction are to confirm.
- **129 drawn barrier pieces in 9 runs have no WB reference** (side-street closures, Helen Park / G1, the T10 kerb); they are listed in `inputs/inventory.json`, not drawn here.

**Waste tanks:** each takes its own block's traced outline (same footprint, place and rotation): the project manager, "same shape as the toilet block, under it". The master not drawing tanks is expected.
- **Pairing:** WC05 and WC27 have one block each. WC20 is from the record's set labels (1311341 with 1327228; 1327225 with 1328982). WC60 is from the record's 1 Oct delivery note (1119489 with 1328980; 1087500 with 1328981).
- **Still to confirm:** which drawn WC20 or WC60 block carries which asset number. The tank follows its block.
- **On the map, the choice made:** the tank's grey outline sits offset 3–6 px down-right under the block, so a grey edge shows, with a "+ WASTE TANK" tag just below. The tag is fixed 10 px text, drawn at every zoom.
- **In Arrange loads** (`svg(ref, {unit})`), the tank is its own greyed block-shaped item with "WASTE TANK" along it, or in a tag below it when the number badge sits in its middle.

**GN13 and GN18:** the 2 Oct generator symbols at the pins the release in flight moves them to ("follow the master").

**WC59 units 3–7:**
- The master draws 7 FWF under the WC57 tag and 2 at WC59. The schedule and the record give WC57 2 and WC59 7.
- The five extra symbols are therefore drawn once, as WC59. WC57's parts 2–6 are kept in the data, marked `drawn_as: WC59`, and not drawn twice. The tag swap is to confirm.

**Containers:** T0266 (iEDM, Helen Park) and T0258 (SCA, beside WC69) are traced with their double doors from the legend STORAGE CONTAINERS (low confidence: untagged outlines). T0023 is a standard 6.0 x 2.4 m.

**The P26/27/28/29/34 block:** one tag covers four buildings. P27 is given building 1 and P29 building 2, in tag order, to confirm. P26, P28 and P34 hold contents only, so the whole block stays their shape.

**Units the master draws in a row with some not drawn** (WC45 8th, WC67 3rd–4th, WC69 10th–12th FWF): each continues the drawn row at the same rotation and spacing, dashed, to confirm on site. GN23's distribution board has no size anywhere, so it is drawn as a marker beside the generator, not as an outline.

## Footprints (footprints_v915.json)

**Rule:**
- Where the two catalogues agree within 10%, use the size measured on the master where the drawing evidence is direct, else the written size.
- Where they disagree by more than 10%, or one says "size to confirm", record both. Use the drawn size only where it was measured on the master from instances of that type; otherwise mark **size to confirm** and draw the best sourced size.
- A traced unit always uses its own traced outline.

**Size to confirm (drawn at the best sourced size, flagged on the part):**

| item | size drawn | source |
|---|---|---|
| Light towers | 2.5 x 1.75 m | the fleet guide's JLG tower, a different model |
| VMS | 3.835 x 2.0 m | Senior, fleet guide |
| 200 kVA (GN?) | 4.2 x 1.6 m | Cummins, the larger Coates 200 kVA |
| 100 kVA trailer | 3.42 x 1.45 m | skid row, fleet guide |
| Forklift 5T and the 3.5T line | 4.24 x 2.26 m | CLARK 5t |
| Forklift 2.5T RT | 2.95 x 1.45 m | MANITOU |
| FL02 | 3.738 x 1.237 m | fleet guide |
| T0109 | 3.63 x 1.21 m | fleet guide |
| FWF trailer | 2.4 x 1.4 m | fleet guide |
| Event container | 6.0 x 2.4 m | contract |
| Trakmat | 2.4 x 1.1 m | contract |
| Distribution board | no size anywhere | drawn as a marker |

**Drawn size used, written size differs:**
- 16-pan block: 6.0 x 2.39 drawn against 7.0 x 2.5 written.
- Accessible toilet: 2.41 x 2.39 drawn against 3.6 x 2.4 written.
- 20 kVA: 2.54 x 0.99 drawn (used for GN25) against 1.86 x 0.811 written.
- 80 kVA: drawn against fleet guide.

**Agreed:** FWF 1.21 x 1.19, buildings 6 / 9.6 / 12 m, toilet block 6 x 3, TL2 piece 2.0 x 0.5, T0021 and T0022 at 4.8 x 3.0 (the contract lines name them).

**Doors on parts not drawn on the master:** none is drawn. Each carries its catalogue rule as text, for example "door side not on the master; one door on a long side, about a quarter along; to choose in the picker".

## The frame

`poly` uses the same frame as `MASTER_LOC[ref].pt`: fractions of the 2384 x 1684 pt sheet, y down. That is the frame the Map explorer and Arrange loads draw in.

| region | from 2 Oct PDF points (x, y) |
|---|---|
| main plan | `fx = (x + 25.50) / 2384`, `fy = (y + 0.12) / 1684` |
| inset (1482.86–2334.08 x 873.42–1464.24 pt) | `fx = x / 2384`, `fy = (y + 0.06) / 1684` |

Sizes use the title-block scale, 1:2000 (0.705556 m per pt). The record pins for T0022 and T0023 go through the georeferencing of the 2 Oct master. The inverse is checked against every MASTER_LOC entry: median 0.05 m, worst 0.15 m.

## The helper

```js
MasterShapes915.shape('WC20')            // {ref, placed, centroid, units:[...], components:[{kind, source, standard, geometry, poly, size_m, confirm, size_state, units, under, door, doors, door_note, marks}]}
MasterShapes915.units('WC20')            // [{n, type, item, owner, number, loading_id:'u1311341', components:[0], source:'master', door, doors, size_m, confirm}, ...]
MasterShapes915.unit('WC20', 'u1327228') // the waste tank under block 1 (by n, loading id, asset/supplier number or 'type#index')
MasterShapes915.footprint('VMS')         // {size_m:[3.835, 2], size_state:'size to confirm', confirm:true, why}
MasterShapes915.svg('WC20', {number: 1, pxPerPt: view.scale, rot: camera.rot})   // every unit: blocks, tanks under them
MasterShapes915.svg('WC20', {number: 1, unit: 3, pxPerPt: 7.75})               // one unit: the greyed WASTE TANK item
MasterShapes915.svg('P25', {number: 1, project: frac => [x, y]})               // through the map's own projection (null if not placed)
MasterShapes915.doorEdges('P67', {unit: 1})  // every outline edge of that unit, with the master's door marked: for a picker
MasterShapes915.reason('P47')            // why there is no shape (cancelled)
```

The existing API (`shape`, `reason`, `refs`, `svg`, `layout`, `doorEdges`, `has`, `meta`) works as before. `shape()` and `svg()` now include every unit's part.

**What `svg()` draws:**
- Traced parts are solid. Parts not drawn on the master are dashed, and a part flagged "size to confirm" says so in its `<title>` and `data-confirm`.
- **FWF:** the legend's circle; traced ones also have the master's chevron.
- **Accessible toilet:** the wheelchair sign.
- **Generator:** the master's diagonal and triangle; standard ones get an orange diagonal and "GEN".
- **Water barrier:** a white-and-yellow line. Each piece is drawn when it is at least 4 px wide; otherwise alternating yellow and white dashes of the piece length.
- **Waste tank:** grey, labelled.
- **Tags** where they fit: VMS, LT, FL, CONT, MAT x20, DB.
- **Doors:** the master's door swings with a red door-side bar and an outward arrow. `door` set to a number or `{component, edge, at}` draws a chosen side instead.
- **`minPx`:** the whole shape scales up uniformly about its anchor when the largest outline's short side would be under `minPx`. Barrier lines are never scaled; they get a minimum stroke instead.
- **Anchor:** `data-ms915-anchor` marks the anchor point (the shape's centroid, or the unit's centre with `unit`), and `data-ms915-at` gives that point in the MASTER_LOC frame.

## Build and checks (9 Oct 2026)

- **Built on live v9.20** (`93c3bab1…`, which has the same DATA and MASTER_LOC as v9.18).
  - **Command:** `python3 -I build_all.py <base>`, then `toolchain/build.sh v915_all v9.15_master_shapes_DRAFT/patch_v915_shapes.py`.
  - **Candidate:** see the test files (`page_sha256`). `check_page.py` passes and the scrub changed nothing.
  - **Embedded data:** 300,971 bytes.
- **On the pins release candidate** (`build/GC500_v917_r4`, 57 pins moved, GN13/GN18 to their symbols): `build_all.py` re-places the standard parts at the new MASTER_LOC and the static suite passes there too (34/34; `build/GC500_v915_all/pins_check/`). If the pins go live first, rerun `build_all.py` on the new live page and rebuild.
- **Doors fixed:** none. The independent re-check found 117 of 117 agreeing.

| test | laptop (1440 x 900) | phone (390 x 844) |
|---|---|---|
| static (`evidence/test_static.json`) | 34/34 | 34/34 |
| browser (`evidence/test_browser_*.json`) | see file (static included) | see file (static included) |

**The static checks cover:**
- Removing the two blocks gives the base byte for byte, and the checksums match.
- Every page reference has a shape or a reason. Only cancelled references and T0265 have none.
- **Every unit in `inventory.json`:**
  - is answered in order with its own type, index and number;
  - has exactly one shape of its own (never shared);
  - draws on its own;
  - is found by its loading id and its number.
- **Every traced part against a fresh PDF read:**
  - 327 outlines: worst centroid 0.0001 m, worst vertex 0.0002 pt;
  - 121 doors: the 117 of 8 Oct point for point, and every arc end and leaf;
  - 242 barrier pieces and 265 line vertices, all under 0.001 pt.
- **Every standard part:**
  - cites its source and uses its reconciled footprint;
  - says "size to confirm" where it is;
  - follows the 10% rule.
- **The 6 waste tanks:**
  - each is its block's own outline;
  - on the map, grey and offset under the block with "+ WASTE TANK";
  - in Arrange loads, its own "WASTE TANK" item;
  - the label is still there zoomed out.
- **All 15 WB references are line shapes.**
- **Rotation and aspect are exact.** Scaling is uniform, and minPx is honoured.
- **Doors:** the door mark sits on the master's door edge, and a chosen edge overrides it.
- **The projected mode equals the explorer camera.** Unplaced references are never projected.
- **`unit` draws that unit only.**
- **Styles:** traced parts are solid and standard parts dashed, and each kind is recognisable.

**The browser checks cover:**
- The global and its counts.
- Every marker and every unit's marker parsed and rendered in Chromium, with its geometry within 0.007 px.
- The visible text of all 21 tabs, identical on base and build.
- Page and console errors.
- Blocked writes.

## Things to raise

1. **Single toilets:** there is no door on the master, and the chevron is unexplained. A person picks the door side, as before.
2. **WC57 / WC59 tags look swapped** on the master. The five symbols are drawn once, as WC59.
3. **Pairings to confirm:**
   - WB05: iEDM's table puts it at Commodore Park, so the light-rail run may be the 12 unreferenced "ADD TO FMS" barriers.
   - WB17 and WB18: low confidence, and probably not water barriers.
   - Which drawn WC20 or WC60 block carries which number.
   - P27 and P29 in the block.
4. **"Size to confirm"** applies to every light tower, VMS board, forklift, FWF trailer, the 200 kVA and 100 kVA generators, containers, the trakmat and the distribution board.
5. **Positions:** 24 references have no position on the map, listed above. Standard barrier runs are shown straight at MASTER_LOC, and their real line is to confirm.
6. **Arrange loads wiring and the per-unit door choice** are not in this patch (drops911 is not touched). The data gives each unit its `loading_id` for `loading872Set`.
