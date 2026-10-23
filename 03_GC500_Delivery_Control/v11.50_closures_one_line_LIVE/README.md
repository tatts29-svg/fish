# v11.50 — The fence closure lines redrawn from the marked plan of 23 Oct: one bright colour, straight, on the footpaths

Author: Andrew Fisher. Built on live v11.48 `d87a23c8…`. LIVE 23 Oct 2026 11:11 AEST, page `13f89f1924ff73c5…` (21,394,449
bytes; full hash in STATUS.md).

## Andrew's words, 23 Oct 2026, on the v11.38 map (with his marked plan)

"i honestly dont like what you have done. think foot path look at what i have done to give you guidance. i want this on
the foot path or follow the line on the maps. nice and straight not like a sccribb and neon lights lets work on one
rteally really bright colour then we can work on what areas to have people but i need some attention to this must look
really good".

## What changes on the Fence closures tab

- **The lines are his.** The marked plan (`lift/marked_plan_23Oct2026.webp`) was fitted to the 2026 sheet
  (D001-26003-03) by SIFT/RANSAC homography (1473 inliers, median error 0.3 px, `lift/homography2.json`); the pink marker
  strokes were lifted as their centreline (the mask reduced 3×, thinned, spurs pruned, paths merged through junctions and
  across small gaps only where they continue in the same direction) and simplified to straight runs (6 pt, near-collinear
  runs merged at 12°): 16 runs, 87 vertices, about 3,700 m (`closures_lines.json`; `lift/lift2.py` registers and masks,
  `lift/lift4.py` traces). No snapping, no offsetting: the runs sit where the marker went.
- **One bright colour, no glow.** Every run is a solid #ff1fd4 core on a dark #3a0030 edge, round caps and joins, no
  halo, glow or filter. The line is 16 pt wide on the plan at the whole-plan view on a desktop (about 11 m, the width of
  the marker), never more than 14 px on the screen as the view zooms in, and never less than 4 px (a phone at the
  whole-plan view); the engine sets the width on every view change through two CSS variables.
- **Everything else as before:** Plan / Satellite (Esri World Imagery through the explorer's georeferencing, capped at
  zoom 20), the zoom to 16000% on the explorer's tiles, pinch, drag, double-tap, the credit. The legend is one line.
  No numbers.
- The v11.36/v11.38 card's style and script are replaced in place (same ids, same handle `window.ClosureMap1136`, which
  also exposes `ONE`, `lineWidth()` and `unit()`). The record and the crew card are untouched.

## Files

- `patch_v1150.py` — requires live v11.48 by SHA-256; checks the lines file (one colour, on the sheet, the 23 Oct lift),
  the tile manifest and the georeferencing; swaps the block; footer v11.48 → v11.50.
- `closuremap1150.js`, `closures_lines.json`, `tiles1136_manifest.json`, `geo1138.json`.
- `lift/` — the marked plan, the homography, `lift2.py` (registration and pink mask) and `lift4.py` (centreline, merge,
  simplify, naming by the v11.38 line each run overlaps).
- `tests/test_v1150.cjs` — desktop and phone: one colour on every line, solid with no glow or filter, the widths the
  engine sets at the fit view and at 400%, the runs straight (under 2.2 vertices per 100 pt, no segment under 5 pt,
  5,000 to 5,600 pt in all) and within 12 pt of eleven spots read off the marked plan, Satellite with Esri tiles under the
  lines and the credit, 1600% and 16000% on satellite, Plan back; record unchanged, no errors, no writes. Screenshots at
  the fit view, the Esplanade and Breaker St at 400%, Main Beach Pde at 250%, satellite at the fit view and 1600%.

## Checks

- Dry build on a copy of live v11.48, scrubbed as the build is, check_page PASS; the real build from live byte for byte
  the same (`13f89f19…`, 21,394,449 bytes).
- `tests/test_v1150.cjs`: 11/11 desktop and phone on the build (evidence/dry/); 11/11 desktop and phone on live
  (evidence/live_*, evidence/closures_*_live_*.png).
- Regressions on the build: v11.33 (Fence closures tab) 12/12 desktop and phone, v11.44 (satellite maps) 11/11, v11.46 (crew
  card) 11/11 (evidence/dry/regress/).
- Sweeps, desktop and phone: 27 tabs (19 shown), 7 hashes, Back, 0 errors, 0 console, 0 writes blocked
  (evidence/dry/sweep_*.json).
