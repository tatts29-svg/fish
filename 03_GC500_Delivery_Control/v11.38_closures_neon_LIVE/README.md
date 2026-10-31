# v11.38 — The closure lines refined: thin neon on the footpath side, Plan / Satellite

Author: Andrew Fisher. Built on live v11.37 `db0d582a…`. LIVE 23 Oct 2026 07:03 AEST, page `c3bbed84…`; the Satellite layer's layout fault found after the upload is fixed in v11.39.

## Andrew's word, 23 Oct 2026, on the v11.36 map

- "U have highlighted to much. Its literally drawing along the foot paths only on one-side. Look at the pink. Walk that side
  of foot path. U dont walk on buildings. U cross roads when shown then walk on that side of road."
- "I want a clean bright neon line along the footpaths … professional lines not scribble. There is no breaks in the lines."
- "Use a new map or a satellite map. Come on push your limits here."
- "This is better but we need to show it so its the one side of foot path when shown and when the other side we show that."
- An example picture of neon lines on the marked plan: "purely an example of what it could look like but we need better see
  how its done either side of footpath".

## What changes

1. **On the footpath.** Each line is re-placed 2 pt (about 1.4 m) off the drawn kerb or fence line onto the footpath, away
   from the road. The road's hand is set per route in `lift/routes.json` (`road: L|R`, walking the route) and changes where
   a waypoint says so (the orange turns from Main Beach Pde's south footpath onto Ferny Ave's near side at the corner). A
   crossing (the pink at Gate 7) takes the offsets of the footpath points either side so it runs straight between them.
2. **Thin, clean strokes.** Halo 7 px at 22%, glow 3 px, pale core 1.2 px, all fixed on the screen, so the two sides of a
   road read as two lines even at the whole-plan view.
3. **No cutting across.** The pink's west reach climbs the access path between the Esplanade compound and Meriton
   (x 1680) instead of crossing the compound's boxes.
4. **Plan / Satellite.** Satellite swaps the drawing and its tiles for Esri World Imagery placed through the explorer's
   georeferencing of the plan (`geo1138.json`: sheet pt to Web Mercator z18 px, 2.69 px per pt, checked to about 1 m rms),
   clipped to the main plan, the lines on top, a credit line shown; Plan brings the drawing back. The imagery zoom follows
   the view (15 to 21).

The v11.36 card's style and script are replaced in place (same ids, same `window.ClosureMap1136` handle, now with `GEO`,
`base`, `setBase`, `toZ18`, `satZoom`, `satTiles`). The v11.33 record, ticks and sheet untouched; the crew card untouched.

## Files

- `patch_v1138.py` — requires live v11.37 by SHA-256; replaces the v11.36 block; inlines the lines, the tile manifest and the
  georeferencing; footer.
- `closuremap1138.js`, `closures_lines.json` (nine lines, 267 vertices, footpath offset), `tiles1136_manifest.json`,
  `geo1138.json`.
- `lift/` — `routes.json` (waypoints with the road hand and the crossing flag), `snap_lines.py` (snap + offset),
  `fetch_tiles.py`, `render_lines.py`.
- `evidence/check_*.png` — the lines over the drawing at 4 px per pt; `check_satellite_gate7.png` — the lines over Esri
  z19 tiles at Gate 7 through the georeferencing (the first alignment check).
- `tests/test_v1138.cjs` — desktop and phone: strokes and widths, button states, the satellite group and clip; the lines on
  the footpath side (pink north of Main Beach Pde's north fence west of Gate 7 and south of the south fence east of it,
  west of Breaker St's west fence; orange east of the east fence; the climb and the loop's closing side); Satellite on
  (tiles from Esri at zoom 15–17 for the whole plan, the drawing hidden, the credit, the lines on top), 16000% at Gate 7
  on satellite at zoom 21, Plan back; record unchanged, no errors, no writes. Screenshots: plan and satellite at fit, at
  Gate 6 (1600%) and at Gate 7.

## Checks

- Dry build on a scratch copy of live v11.37, scrubbed as the build is, then the real build from live: byte for byte the
  same (`c3bbed84…`).
- `tests/test_v1138.cjs`: 9/9 desktop and phone on the build; 9/9 desktop and phone on live.
- Regressions on the build: v11.33 12/12; v11.36 7/8 — its line-position check reads the v11.36 positions and is superseded
  by test_v1138's footpath-side check (the lines moved 2 pt by design; its crossing rule reads 2.0 pt of sideways travel
  where the crossing now runs from the offset north line to the offset south line). Sweeps, desktop and phone: 27 tabs,
  7 hashes, Back, 0 console, 0 writes blocked.
- LIVE 23 Oct 2026 (time in STATUS.md).
