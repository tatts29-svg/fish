# v10.60 — Map explorer: every reference as the shape of what it is, with its door, and the tick inside (LIVE 17 Oct 2026 22:49)

Author: Andrew Fisher · 17 Oct 2026

Andrew, 17 Oct 2026: "the circle should be the shape of the icon. Also with the fwf the door is where it points to";
"they need to be icons of what they are. With the green tick inside that equipment not outside it"; "when we see all
the references the references is the shape of what it is and how it looks on the map if it has a door it show the
door"; "And the green tick is inside the shape not outside". Then "Proceed. Approve. Upload".

## What changes in the Map explorer

- A reference with its own traced outline on the 2 Oct master (`MasterShapes926`) is drawn as that outline, turned the
  way it sits, in its category colour: a building its footprint, a toilet block its block, an FWF its square. A
  catalogue footprint (not traced) is dashed; a waste tank under its block is grey.
- The door shows: the master's door swing (arc and leaf) where it has one. For an FWF, the chevron on its edge, which
  is where its door is (Andrew's rule above). An FWF with no traced chevron shows no door rather than a guessed one.
- The status sits inside the shape: the green tick when complete (amber dash, or the other states the same way), once
  per reference, in its main part (on a run of FWFs, the one nearest the middle), sized to fit. A shape too small for
  it at that zoom is filled in the status colour instead. No circle, glow or tick beside a shaped reference.
- The Done chip's finished units are drawn the same way (their shape with the tick inside), not as loose ticks.
- Glow and pulse (Andrew, 17 Oct 2026: "Glow and pulsate too"): every shape glows softly in its colour (orange and
  stronger when selected); the selected shape ripples outward in its own outline, not a circle; finished units beat
  twice when the Done chip shows them, as the old rings did. The pulse runs on its own small layer, so the map is not
  redrawn for it; it is still while the map moves, hidden, in 3D or fencing, and with reduced motion or Motion Off.
- The reference is written inside its shape, along it, beside the tick: one shape, no second label box (Andrew,
  17 Oct 2026: "Put the reference number inside the box too.. i dont want two boxes shown"). Selected, the status words
  go under it when they fit. When the shape is too small at that zoom for the tick and the reference side by side, the
  tick shrinks; smaller still, the shape takes its status colour (green when complete) with the reference on it.
  Tapping the reference or anywhere inside the shape picks it; the selected reference is outlined in orange.
- A reference keeps today's marker, so nothing disappears, when it has no traced shape, more than one place, an outline
  it shares with other references, is furniture, is a water-filled barrier run (a line, not a shape), or its marker sits
  more than 6 sheet points (about 4 m) off its outline. On today's record that covers P26, P28, P34 (police fridges and
  chairs: they share the police building's outline), PG01/03/05/29 (one shared FWF outline), every WB barrier run, and
  T0258 and T0266 (the traced outline is an area label away from the item). Their status now sits inside their circle,
  and the reference is plain text under it, no box. 125 references are drawn as their shape.
- The fencing map and the 3D view are unchanged; the PNG export is unchanged (it never carried the markers).

## Also in this release: WC17 on delivery day 7

Andrew, 17 Oct 2026: "wc 17 move to day 7". Day 7 reads P09 → P33 → WC17 (placed last; no order was given), the day
before P36 and P10 on day 8. The existing WC17 rule already says the blocks go in the day before, so day 7 carries no
second copy. Source `../sequences_17Oct2026/sequences.json`; the day groups are built into the page, so it rides this release.

## How

The page gains `gc500MapShapes1060()` (read-only, built once from `MasterShapes926`) and `gc500ShapeLayer1060`. On each
explorer frame load the page injects one inline script into the frame (same origin; the explorer's policy allows inline
scripts). It wraps the explorer's own `drawMarks`, `done782List`, `tick897`, `markAt` and `itemAt887`, and paints the
shapes on a canvas just under the native markers, through the explorer's own camera (`sheetToDevice`, `toGeo`,
`applyM`), so they stay aligned while panning, zooming, turning and in the satellite inset. It runs only on the
reviewed explorer build (`explorer.js?v=8586cb7d5008`) and stands down otherwise. The explorer's files, the record and
every figure are unchanged. Footer v10.59 → v10.60.

The design was checked against an independent read of the explorer, the page's frame hooks and the shape data, with
a critic; its two corrections are in (shared outlines keep their marker; the position test measures from the marker
to the outline, not to the centre).

## v10.60.1 hotfix (built, waiting on Andrew's "Upload")

The final independent review of v10.60 (round four, regression sweep) found that on the live page a tap 5-9 px beside
a small drawn unit at an overview zoom could open a hidden unit from another category (Generators at 100%: GN01 +6 px
opened BS01; Toilets: WC02 -6 px opened P41). v10.59 picked the drawn unit. `patch_v1060p1.py`: when a tap is inside no
outline, the shaped units' old ring reach is tried before the explorer's any-chip fallback. Footer v10.60 -> v10.60.1.
- New check reproduced it on live v10.60 (27 hidden picks in Generators alone; 61/62) and passes on the hotfix: 62/62
  desktop and phone. Sweeps 24 tabs/7 links, 0 errors, 0 console messages, desktop and phone. Build 18,300,417 bytes,
  sha256 `92c91a82174055f0…`.
- Left for later (minor, reviewed): a kept circle's badge over shaped neighbours at overview zoom takes their taps
  (T0258/T0266 over P52/P55; PG01 over WC16); a Done-chip unit enlarged to the 12 px minimum can sit under a
  neighbour's reference on the phone (WC38/P08); the first ripple after a pick can start mid-way.

## Build and checks

```
bash toolchain/build.sh v10.60 v10.60_map_shapes_DRAFT/patch_v1060.py
python3 toolchain/upload_page.py build/GC500_v10.60/GC500_Delivery_Control_hosted.html
```

- LIVE 17 Oct 2026 22:49 AEST over v10.59 `2b067249…` (base guard passed): 18,300,090 bytes, sha256 `67e1281ef8a9e6f2…`; the view
  link serves the build byte for byte. check_page PASS.
- `tests/test_v1060.cjs` 61/61 on the build and on the live page, desktop and phone. Round four (10 checks of the
  last fixes): 4 more fixed before upload (WC33's tick no longer shrinks to a pip; a chevron fades by its whole line
  under the tick or label; the 125% case-2 search no longer stops early; the day-7 note no longer repeats the WC17 rule).
- `tests/test_v1060.cjs` 43/43 desktop and phone (after the review fixes): shape data (P37's door swing, WC21's six chevrons, shared outlines);
  the layer mounts once under the native markers; which references are shapes and which keep markers; P37 drawn as its
  shape with no circle, the status inside it (the tick, or its status colour on a phone at that zoom) and nothing in
  the old tick spot; the reference written inside the shape and no label box anywhere; tapping the reference and
  inside the shape; turning the map and Satellite + plan; WC21's six FWFs and chevrons; the Done chip gives shaped
  units no loose tick; T0266's tick inside its circle; the pinned T0022 drawn once its pin arrives; fencing and 3D
  stand the layer down; record unchanged, no errors, no writes.
- Sweeps desktop and phone: 24 tabs (18 shown on the view link), 7 links, 0 errors, 0 console messages.
- v10.59 `test_v1059.cjs` on this build: 148/154; the 6 are part B's in-memory write checks for P26/P28/P34 (3 per
  viewport), which now find those day-only entries already in the record from the 13:30 step (expected).
- Independent review of the code, every finding checked: 16 confirmed and fixed - barrier runs back to circles; the tick
  laid out on the main part's own group and checked inside a part (WC07, WC15, WC17, WC31...); squares read along their
  own sides; kept circles and references tapped before shapes; kept circles' reference as plain text; door swings as
  curves with their landings; all six explorer scripts pinned (another build stands down); glow off while the map moves.
  Tests added for each. A second review of the fixed code before upload.
- Screenshots in `evidence/desktop` and `evidence/phone`.
