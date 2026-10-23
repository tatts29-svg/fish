# v11.44 — The satellite maps turned to the plan's way up: the beach along the top

Author: Andrew Fisher. Built on live v11.43 `483375ed…`. LIVE 23 Oct 2026 09:24 AEST, page `471bb02f…` (full hash in
STATUS.md).

## Andrew's word, 23 Oct 2026, with the VMS boards tab's satellite map

"this is rotated the wrong way"; "this is facing the wrong way in maps".

## Why

The master layout is drawn with east at the top (the explorer's georeferencing gives 89.9° to north), so the Map explorer,
the plan and the Fence closures map all carry the beach along the top. The v11.39 removals map and the v11.41 "Where it is"
maps were drawn north up, the coast down the right.

## What changes

The two scripts are replaced in place (same ids, same handles `VmsMap1139` and `SatMap1141`):
- Every pin, line, square and label is placed in the master layout's own frame (sheet points) through the explorer's
  georeferencing (`geo1138.json`, the same fit the Fence closures satellite uses): `pt(lat, lon)`.
- The imagery is laid out through the inverse fit from a local origin (the main plan's top-left corner in z18 px), so the
  picture turns with the plan and the browser's single-precision SVG arithmetic keeps the tiles where they belong.
- Fit, zoom, pinch, drag, the filter, the finder's zooms (v11.42) and the distances all work as before, in the new frame.
A point 200 m east sits 278 pt higher on the map; a point 220 m south sits 314 pt to the right; the Gate 7 crossing lands
at its sheet point (108, 461).

## Files

- `patch_v1144.py` — requires live v11.43 by SHA-256; swaps `vmsmap1139-script` and `satmap1141-script`; footer.
- `vmsmap1144.js`, `satmap1144.js`, `geo1138.json`.
- `tests/test_v1144.cjs` — desktop and phone: the frame (east up, south right, both maps share the fit, Gate 7 at its sheet
  point); the removals map's imagery through the matrix from a local origin with the first tile within the map, five pins
  and routes, VMS 16's spot above its board, 29 m; the map really draws (brightness clip); the "Where it is" map with 41
  pins, VMS 10 well to the right of VMS 01, GN25 still without a position; 6400% on GN23 centred on its sheet point; the
  finder's "VMS 10" landing on the boards map at 1600%; record unchanged, no errors, no writes. Screenshots of each map.

## Checks

- Dry build on a scratch copy of live v11.43, scrubbed as the build is, then the real build from live: byte for byte the
  same (`471bb02f…`).
- `tests/test_v1144.cjs`: 11/11 desktop and phone on the build; 11/11 desktop and phone on live.
- Regressions on the build: v11.41 10/10; v11.40 (VMS map) 11/11; v11.42 14/16 — its two view-centre checks compare
  against north-up pixel coordinates and are superseded by test_v1144's checks in the plan's frame. Sweeps, desktop and
  phone: 27 tabs, 7 hashes, Back, 0 console, 0 writes blocked.
