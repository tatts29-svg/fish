# v11.39 — Where each VMS board goes (colour-coded satellite map), Friday morning, the closures satellite layer fixed

Author: Andrew Fisher. Built on live v11.38 `c3bbed84…`. LIVE line and hashes in STATUS.md.

## Andrew's word, 23 Oct 2026

- "Vms removals boards lets colour code lets have a map with the colour have a dotted line on where they go. They get taken
  off track first thing this morning."
- "Today is friday they get taken off the track this morning."

## What changes

1. **The map, under the VMS removals tab's head.** The five end-of-session boards from the page's own positions on Esri
   World Imagery (Web Mercator from the page's lat / long), each board a solid pin in its own colour (13 red, 14 orange,
   15 yellow, 16 cyan, 17 magenta), a dotted line in that colour to the square where it goes, with the straight-line
   distance; labels with the board's earliest off-track time; tap a pin or a square to navigate; pinch, wheel, drag, + / − /
   Fit; a legend with Navigate links. Where each goes: VMS 16 behind 2 Breaker St and VMS 15 the T2 runoff are the tab's
   pinned spots; VMS 17 the T10 runoff is the T10 label on the 2026 plan through the explorer's georeferencing; VMS 13 and
   14 go to the Altus compound on Cypress Ave, shown at the street (geocoded) with a dashed square until the compound's spot
   is pinned.
2. **Friday morning.** The removal mornings gain Friday 23 Oct (after Thursday night) ahead of Saturday, so the tab opens
   on today's removal with its own ticks; Saturday, Sunday and Monday unchanged.
3. **The closures map's satellite layer.** On v11.38 the imagery was laid out at its world coordinates (about 1.2 × 10⁸ px)
   and the browser's single-precision SVG arithmetic put the tiles millions of pixels off screen, so Satellite showed the
   lines on a dark field. The layer is now laid out from a local origin (the main plan's top-left corner) and draws.

The record untouched; the crew card untouched.

## Files

- `patch_v1139.py` — requires live v11.38 by SHA-256; appends the VMS map's style and script; adds Friday to MORNINGS;
  replaces the closures block with `closuremap1139.js` (the origin fix); footer.
- `vmsmap1139.js`, `closuremap1139.js`, `closures_lines.json`, `tiles1136_manifest.json`, `geo1138.json`.
- `tests/test_v1139.cjs` — desktop and phone: the card, five boards in their colours with routes, labels, tap targets and
  Navigate links; sane distances (VMS 16 within 60 m, VMS 15 100–400 m, VMS 17 200–700 m, VMS 13 / 14 1.2–2.5 km at the
  street); Friday first and chosen on the day; Esri tiles placed; zoom and Fit with the pins keeping their screen size; the
  map area really draws (brightness and spread of a clip); the closures satellite layer from a local origin and really
  drawing; record unchanged, no errors, no writes. Screenshots at fit and at 2 Breaker St (1600%).

## Checks

- Dry build on a scratch copy of live v11.38, scrubbed as the build is, then the real build from live: byte for byte the
  same (`26351b4f…`, full hash in STATUS.md).
- `tests/test_v1139.cjs`: 11/11 desktop and phone on the build; 11/11 desktop and phone on live.
- Regressions on the build and on live: v11.38 9/9; v11.32 11/12 — its "three mornings" check is superseded by Friday
  (test_v1139 checks the four). Sweeps, desktop and phone: 27 tabs, 7 hashes, Back, 0 console, 0 writes blocked.
- LIVE 23 Oct 2026 07:15 AEST.
- Known on this build, fixed in v11.40: past zoom 20 Esri has no imagery here, so 1600% and beyond on Satellite showed
  "Map data not yet available" tiles.
