# v11.36 — The closure lines on the 2026 plan (Fence closures tab)

Author: Andrew Fisher. Built on live v11.35 `823a9035…`. LIVE line and hashes in STATUS.md.

## Andrew's word, 23 Oct 2026

- "Lets have a tab for closures showing the map. We want this on a 2026 map. We will use this data as a basses. We dont
  need to number things yet … This is not the middle of road this is the side of the roads some on both sides or one side."
- "Dont use this map. Look at highlighted area lines."
- "The fence get a new map … Draw the line when your zoomed in at 16000% so you get a straight defined neon glow line that
  follow the foot path. And crosses the roads when shown onto other side of the road. Only time line breaks is when the
  next colour starts. This need to be sorted with priority now."

## What changes

The Fence closures tab (v11.33) gains a card under its head: the 2026 master layout D001-26003-03 in an SVG, the
explorer's tile pyramid under it as the view narrows, and the closure lines as neon strokes (halo, glow, pale core) that
keep their width at any zoom. Pinch, wheel, drag, double tap and the − / + / Fit buttons go from the whole sheet to
16000%. A legend by colour names the places; Open the Map explorer as before. No numbers. The v11.33 record, the ticks
and the printable sheet are untouched; the crew card is untouched.

## How the lines were made (lift/)

1. **Fit.** The marked 2019 plate (the record's plate image) was fitted to the 2026 sheet overview by SIFT features and
   RANSAC: 122 inliers, median 1.1 px, p90 2.5 px on the 1192-px sheet (`lift/homography.json`).
2. **Read.** The plate, warped into sheet coordinates, was read colour by colour for where each highlighted line starts
   and ends and which side of the road it is on. Those readings are the waypoints in `lift/routes.json` (sheet pt), one
   route per unbroken run of a colour; a waypoint flagged `c` ends a road crossing (the pink at Gate 7). The photograph's
   own misfit at the west end (about 18 pt, 13 m, at Breaker St) is why the waypoints are read off the 2026 drawing and
   the plate only decides extent and side.
3. **Place.** `lift/snap_lines.py` densifies each route every 2 pt, samples the explorer's tiles at 4 px per pt across the
   route (±7 pt, ±4 on the Esplanade) and takes the drawn fence or kerb line nearest the route by a Viterbi pass that
   keeps to one line; a crossing segment is left straight; the Esplanade's north kerb came from the track surface itself
   (`lift/tan_edges_esplanade.json`). Output `closures_lines.json`: nine lines, 271 vertices.
4. **Check.** `lift/render_lines.py` draws the lines over the drawing at 4 px per pt; the renders are in
   `evidence/check_*.png`.

A first cut that lifted the highlighter itself as a raster band (`lift/lift_overlay.py`, `lift/closures_overlay_2x.png`,
`lift/closures_areas.json`) was built and tested but never uploaded: too fuzzy for the ask. It stays as the source read.

The lines: **pink** — the Gate 6 block (the Esplanade front of Meriton and Pacific Plaza, Ocean Ave, Surfers Paradise
Blvd at G4, back up the diagonal; with the reach west along the Esplanade compound), the Esplanade north side Gate 6 to
Gate 5A, Main Beach Pde north side to Gate 7, across, the south side to Breaker St and down its west side to Gate 8;
**teal** — Cable St, round Cable Beach, Pacific St north side; Main Beach Pde south side from the Ferny Ave corner past
Higman St to T4; **orange** — the river side from the T8 chicane to Madison Point and down Ferny Ave to Narrowneck Court;
Breaker St east side (Norfolk) to Serisier Ave and Hill Pde, both sides; Breaker St west side south of Gate 8.

To move a line: edit the waypoint in `lift/routes.json`, run `python3 lift/snap_lines.py lift/routes.json` (needs the
scratch copies of the tile fetcher), copy `lines.json` to `closures_lines.json`, rebuild.

## Files

- `patch_v1136.py` — requires live v11.35 by SHA-256; inlines `closures_lines.json` and `tiles1136_manifest.json` into
  `closuremap1136.js`; style and script before the last `</body>`; footer.
- `closuremap1136.js` — the card: SVG viewBox in sheet pt, tiles by byte range (as the Map explorer), the paths, gestures,
  buttons, legend; `window.ClosureMap1136` (LINES, TILES, pct, box, setZoom, fit, tiles, level) for the checks.
- `closures_lines.json`, `tiles1136_manifest.json` (the explorer manifest, L0–L3).
- `tests/test_v1136.cjs` — desktop and phone: the card under the head at the whole-sheet view; nine lines, 3 pink / 2 teal /
  4 orange, each with halo, glow and core; the legend's three colours and places, no mark numbers, no agent names; every
  line's start, end and extent against the reading of the marked plan incl. the Gate 7 crossing; + twice 256%, Fit 100%,
  16000% at Gate 7 a 15 pt wide view at tile level 3 with the tiles arriving as blobs; no overflow; record unchanged, no
  errors, no writes. Screenshots at fit, 1600% at Gate 6 and 16000% at Gate 7.

## Checks

- Dry build on a scratch copy of live v11.35, scrubbed as the build is, then the real build from live: byte for byte the
  same (`647d33d6…`).
- `tests/test_v1136.cjs`: 8/8 desktop and phone on the build; 8/8 desktop and phone on live.
- Regression: v11.33 12/12 on the build and on live. Sweeps, desktop and phone: 27 tabs, 7 hashes, Back, 0 console,
  0 writes blocked.
- LIVE 23 Oct 2026 05:00 AEST.
