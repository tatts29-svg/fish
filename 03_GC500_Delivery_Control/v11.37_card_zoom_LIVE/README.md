# v11.37 — The crew card's plan zooms: pinch, drag, double tap, + / − / Fit, with the Map explorer's sharp tiles loading in

Author: Andrew Fisher. Built on live v11.36. LIVE line and hashes in STATUS.md.

## Andrew's word, 23 Oct 2026

"Also servicing when u zoom in takes u to the symbol on the map. See attached this is all i can see. We need to be able to
zoom in 16000% like our other maps" (a screenshot of the browser's own zoom on the card, the plan a blur).

## What changes on the card

- **A view the crew can move.** One finger drags the plan, two fingers pinch it (the point under the fingers stays put), a
  double tap zooms in on that spot, the mouse wheel zooms on a desktop, + / − / Fit sit under the plan. Pins, symbols and
  labels keep their size on the screen whatever the zoom; the labels are laid out again when the gesture ends. The moved
  view holds while the card redraws; Closer, Wider and a tap on a symbol drop it.
- **Sharp tiles.** Past what the sheet overview can show, the card fetches the Map explorer's drawing tiles for the view
  (the same transparent raster pyramid the explorer draws, levels 0 to 3: 1 to 8 device pixels per sheet point, about
  16 times the overview) by byte range from the page's own origin (`/w/…/explorer/assets/vt/`, 206 responses, WEBP
  tiles of 512 px) and draws them over the overview under the veil; they are kept for the session. The slim manifest
  (levels 0 to 3, 30 KB) rides in the card. Off signal, the overview stays.

## Files

- `patch_v1137.py` — requires live v11.36 by SHA-256; rewrites the v11.34 map block (view, tiles, gestures, buttons,
  the handle's `setView`/`view`/`tiles`); style; footer. `tiles1137_manifest.json` — the slim manifest.
- `tests/test_v1137.cjs` — desktop and phone, in a card tab with nothing served but the card: the template; the computed
  crop with the tile layer and the veil; + halves the view with the pin and label scaling to keep their screen size; a
  deep view on PG01 asks for level 3 tiles that cover it (each 32 plan px across) with PG01 still drawn; the tile
  requests go by byte range to the vt files and fail cleanly; a tap on a symbol, Closer / Wider and Fit drop the moved
  view; record unchanged, no errors, no writes.
- `tracker_card_check.cjs`, `tracker_update.cjs` — as v11.34.

## Checks

- Dry build on a scratch copy of live v11.36, scrubbed as the build is, then the real build from live: byte for byte the
  same (`db0d582a…`).
- `tests/test_v1137.cjs`: 10/10 desktop and phone on the build; 10/10 desktop and phone on live.
- Regressions on the build: v11.34 8/8, v11.31 11/11, v11.30 10/10. Sweeps, desktop and phone: 27 tabs, 7 hashes, Back,
  0 console, 0 writes blocked.
- LIVE 23 Oct 2026 05:06 AEST. TEST and EVENT trackers republished 05:07 through the page's own publish
  (`tracker_update.cjs`, a backup each, outside the repository); `tracker_card_check.cjs` CARD OK on both (14 pins with
  14 symbols, the six-symbol key, PG01 highlighted, the plan on a blob: source, 0 label overlaps, zoom, Where am I, the
  Save & close status page, 0 writes blocked, 0 page errors). Screenshots in `evidence/`.
