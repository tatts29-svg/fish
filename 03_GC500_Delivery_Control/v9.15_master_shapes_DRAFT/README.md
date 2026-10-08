# v9.15 master shapes: DRAFT (not live)

Author: Andrew Fisher

**What the project manager asked** (on site, about 16:40 AEST, 8 Oct 2026, with two Arrange loads screenshots): "be good when we choose the loads the loads are the same shapes as what is on the maps and be even smarter by even as far as making it exactly the same shape so would even show the door side".

**What this is:** every reference's footprint and door side, traced exactly as the 2 Oct master D001-26003-03 draws them. It comes as data plus a drawing helper that Arrange loads can use.

- **Arrange loads (`drops911`) is not touched.** Whoever owns it wires `MasterShapes915.svg()` into the markers.
- **The door picker** should use the master's door as its default, and the side chosen on the page wins over it.

## Contents

| file | what |
|---|---|
| `shapes_v915.json` | All 180 references: every one in DATA plus every MASTER_LOC entry. Each has a shape, or `shape: null` with the reason. The full provenance (PDF drawing index and sequence number, bbox) is in this file. |
| `patch_v915_shapes.py` | Adds `MasterShapes915` to the page as two new blocks at the end: the data (compact copy, with its sha256 and the source file's sha256) and the helper. Nothing else changes. It refuses to run twice, on a base without v9.11, or when the json's checksum differs. |
| `tests/test_shapes915.cjs` | Static and browser tests (see below). |
| `evidence/verify_pdf.py`, `evidence/pdf_check.json` | A fresh, independent read of the PDF that the tests compare against. |
| `evidence/markers_*.png`, `evidence/test_*.json` | Test results and marker pictures, laptop and phone. |

## The frame

`poly` uses the same frame as `MASTER_LOC[ref].pt`: fractions of the 2384 x 1684 pt sheet, y down. That is the frame the Map explorer and Arrange loads draw in.

| region | from 2 Oct PDF points (x, y) |
|---|---|
| main plan | `fx = (x + 25.50) / 2384`, `fy = (y + 0.12) / 1684` |
| inset (1482.86–2334.08 x 873.42–1464.24 pt) | `fx = x / 2384`, `fy = (y + 0.06) / 1684` |

- **The transform is proven** on 51 tags: median residual 0.05 m, and 0 px against the live Arrange loads anchors.
- **Before measuring an angle or a length,** multiply fx by 2384 and fy by 1684.
- **Sizes** use the title block scale, 1:2000 (0.7056 m per pt).

## What was traced

| | count |
|---|---|
| references | 180 |
| with a shape | 126: 111 units, 5 in the P34/24/26/27/28/29 block, 10 generators |
| parts traced | 318: 213 single toilets, 68 buildings, 17 toilet blocks, 10 generators, 6 pee panels, 4 accessible toilets |
| door swings | 117, on 59 references; all open outward |
| no shape (null, with the reason) | 54 |

**How each part was traced:**
- Every vertex is a path point of the PDF vector itself. The worst error is 0.0002 pt, and the round trip through the frame is under 0.0003 pt.
- The pin audit's outlines and the door audit's arc and leaf drawings were only a head start. Each one was re-read from the PDF and re-measured: the arc centre is on the outline edge, the sweep is 90 degrees, and the leaf is square to the edge and points outward. All 117 agree with the door audit's edge and position.

**The 54 with no shape:**
- **52 are not drawn on the master:** lighting towers, VMS, water barriers, the storage-yard list and similar.
- **GN13 and GN18:** the 2 Oct master no longer draws a generator at their places. The nearest symbol is not proven to be theirs, so the candidate is recorded and no shape is given.

**What a door is, and what is not:**
- **A door** is the legend's quarter-circle swing plus the door leaf. On toilet blocks the leaf is one side of the step landing box, and that box is kept in `swing.landing`.
- **Single toilets (FWF):** the master draws no door. It draws a chevron on one edge, which the legend does not explain. These have `door: null` with the chevron kept in `marks`, and the picker needs a person's choice.
- **Generators:** an orange box with a diagonal and a dark triangle (kept in `marks`). They have no door.
- **WC31:** cubicle doors are drawn on both long sides (33 swings), so `door` is null and all of them are in `doors`.
- **No door drawn:** P26/27/28/29/34 (the block), P53 and P56.
- **P66:** its door is on the west wall, opening into OP78 (the "DP78" in the screenshot).

**Each door carries:**
- the edge;
- its position along the edge;
- its mid point;
- the outward direction (a unit vector in sheet points);
- the exact swing: hinge, cubic arc and leaf;
- `faces`: the compass side on the ground, from the explorer's registration, where drawing up is east (P67's door faces north, P25's south).

## The helper

```js
MasterShapes915.shape('P67')   // {ref, how, centroid, door_summary, components:[{kind, label, poly, centroid, size_m:[6,3], angle_deg, door, doors, door_note, marks}]}
MasterShapes915.reason('LTC01')  // why there is no shape
MasterShapes915.refs()           // the 126 references with a shape
MasterShapes915.doorEdges('P67') // every outline edge, with the master's door marked: for a picker
MasterShapes915.svg('P25', {number: 1, selected: true, pxPerPt: view.scale, rot: camera.rot, minPx: 18, door: 'master'})
MasterShapes915.svg('P25', {number: 1, project: frac => [x, y]})   // or project each point through the map's own projection
```

**What `svg()` draws:**
- the true polygon(s), with exact rotation and aspect;
- the master's marks;
- the master's door swings with a red door-side bar and outward arrow;
- a number badge (radius 11 px) that stays readable: inside a big shape, beside a small one.

**Options:**
- **`door`:**
  - `'master'` (the default);
  - `'none'`;
  - an edge number on the main part;
  - `{component, edge, at}`: a chosen side, which replaces the master's door.
- **`minPx`:** when the short side of the largest part would be under `minPx` px on screen, the whole shape is scaled up uniformly about its centroid. It is never squashed.

**Positioning the marker:**
- The returned `<svg>` has the shape's centroid at `data-ms915-anchor`. Place that point on `MASTER_LOC`-frame `shape.centroid` projected to the screen.
- With `project`, the geometry is exactly the map's.
- Colours match the Arrange loads chips: `#183541`, and `#ff852f` when selected.

## Things to raise

1. **Single toilets:** there is no door on the master, and the chevron points both ways. WC07 and WC21 point away from the barrier; WC45 points toward the fence, with one unit reversed; WC51 is opposite its accessible door. A person needs to choose.
2. **14 references are more than 5 m from their current MASTER_LOC pin:** WC07 26.6 m, CP1 16.0, P26 7.3, WC09 6.5, WC81 5.8, WC35 5.7, WC24 5.6, WC65 5.5, T0243 5.4, WC59 5.3, P28 5.3, WC26 5.1, WC86 5.1, WC34 5.0.
   - The shape is drawn where the master draws the unit.
   - These belong to the pin accuracy audit, and the pins are not changed here.
3. **The P34/24/26/27/28/29 block:**
   - One tag covers four 6 m buildings, and the master does not say which building is which reference.
   - The whole block is the shape for P26, P27, P28, P29 and P34.
4. **P25:** it is a Building 4.8m on the record, but the master draws it 6.05 x 3.0 m. The shape follows the master.

## Build and checks (8 Oct 2026)

**Built on live v9.18.**
- The base was live v9.11 (`408ae6ac…`) when this work started. Live moved to v9.18 (`c547a6de…`, the Showcase release) while it was being tested.
- The patch was rebuilt on v9.18. It now inserts before the page's final `</body></html>`, so it no longer depends on which release's script comes last.
- `MASTER_LOC` is identical on v9.11 and v9.18 (166 entries).

| item | value |
|---|---|
| command | `toolchain/build.sh v915_shapes v9.15_master_shapes_DRAFT/patch_v915_shapes.py` |
| base | `c547a6debe1dea9009b50466d3c1028ec9c3a800e6c591ea258b61490b14b762` (v9.18) |
| build | `9d767e74083b24c111108e58aa58e005e3ae7265e56f5c56ea57512a769450b7`, 11,772,569 bytes |
| footer | unchanged |
| `check_page.py` | pass |
| embedded data | 152,171 bytes, sha256 `b063278f…` |
| `shapes_v915.json` | `c53e21d5…` |

**The patch refuses a second run.**

**Tests**

| test | laptop (1440 x 900) | phone (390 x 844) |
|---|---|---|
| static (`evidence/test_static.json`) | 21/21 | 21/21 |
| browser (`evidence/test_browser_*.json`) | see below | see below |

**What the static checks cover:**
- removing the two blocks gives the base byte for byte;
- the checksums;
- all 180 references are answered;
- 318 parts are compared with a fresh PDF read: the worst centroid is 0.0001 m, the worst vertex 0.0002 pt, and the 117 door arcs are under 0.0002 m;
- rotation and aspect: 5,076 edges, worst 0.07 degrees and 0.1% (rounding to 0.01 px);
- uniform scaling and minPx;
- the door mark on the right edge (468 marks);
- a chosen edge overrides the master's door;
- the projected mode equals the explorer camera.

**The browser checks cover:**
- the global;
- every marker parsed and rendered in Chromium, with its geometry within 0.007 px;
- the visible text of all 21 tabs, identical on base and build;
- page and console errors;
- blocked writes.

**Test rig notes:**
- Chromium's temporary profile was put in `/dev/shm` because the machine's disk was full (at times under 5 MB free).
- The fetch cache was a fresh folder under the scratchpad, trimmed while the tests ran.
- Every request was a GET, and no write reached the record.
