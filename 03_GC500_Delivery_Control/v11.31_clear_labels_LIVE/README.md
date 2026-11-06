# v11.31 — Every label on the plan gets a clear spot; a Closer view around the scanned reference

Author: Andrew Fisher. Built on live v11.30 `f004603f…`. LIVE line and hashes in STATUS.md.

## Why

On the v11.30 card the plan draws, but where references sit close together (around PG01 in Area 1: WC17, WC73, T0176,
PG03 and PG05) their labels ran into each other on a phone. Andrew's standard for the card: "clear as day"; and
"Make sure we have a map of their allocated area they are currently in".

## What changes

- **Labels laid out.** Each label takes the first clear spot around its pin: above when that is free, else beside or
  below, else further out with a short leader line back to the pin. Every pin and every placed label is kept out of
  the way of the next. The scanned reference is placed first and its label is a touch larger; the others a touch
  smaller.
- **Closer / Wider.** A button under the plan crops it to the references within about 48 plan pixels of the scanned
  one, so a tight cluster spreads across the card; Wider goes back to the whole area. The scanned reference is always
  on the crop.

Footer v11.30 → v11.31. The crews see it once the trackers are published again.

## Files

- `patch_v1131.py` — requires the live v11.30 page by SHA-256; adds `layoutLabels1131` and `zoom1129` to the map
  block, the Closer crop and its button and listener, leader lines, the handle's `setZoom`/`zoom`; style; footer.
- `tests/test_v1131.cjs` — desktop and phone: the template; then, in a card tab, every reference with a pin drawn in
  both views and measured from the drawn text and circles: no label runs into another label or another pin and none
  leaves the crop; the scanned label is the largest; PG01's cluster carries leader lines and Closer trims to the
  references near PG01; tapping Closer flips the view; record unchanged, no errors, no writes. Per-reference
  measurements go to `evidence/*_label_layout_v1131.json`.
- `tracker_card_check.cjs` — on the published card also counts label overlaps from the drawn boxes (must be 0) and
  requires the Closer button.

## Checks

- Dry build on a scratch copy of live v11.30, then the real build from live: byte for byte the same (`02bdac7d…`).
- `tests/test_v1131.cjs`: 11/11 desktop and phone on the build; 11/11 desktop and phone on live. Every one of the 74
  references on the sheet measured in both views: no label touches another label or another pin, none leaves the
  crop; WC85 (Coates Compound, Seaway; its record pin is off the sheet) gets the line instead of an empty crop.
  Per-reference measurements in `evidence/*_label_layout_v1131.json`.
- Regressions: v11.30 10/10, v11.27 9/9, v11.26 10/10 on the build (evidence/regression_dry/) and on live.
- Sweeps, desktop and phone: 25 tabs, 7 hashes, Back, 0 console, 0 writes blocked (evidence/sweep_*.json).
- LIVE 23 Oct 2026 02:22 AEST. TEST tracker republished 02:23, EVENT 02:24; `tracker_card_check.cjs` CARD OK on
  both: 14 pins, PG01 highlighted, the plan on a `blob:` source, 0 label overlaps measured from the drawn boxes, the
  Closer button, Where am I, the kept copy, the Save & close status page, 0 writes blocked, 0 page errors.
- Screenshots: `evidence/dry_map_PG01_wide.png` and `evidence/dry_map_PG01_closer.png` (the build, with the plan
  served from the explorer copy); `evidence/area_map_PG01_phone_v1131.png`, `evidence/card_live_phone_v1131.png` and
  the desktop pair (the live TEST card).
- Measured while tuning (evidence of the method, not a check): the drawn labels run 0.57–0.71 of the font size per
  character in the card's fallback font, so the layout reserves 0.72; three rings and eight directions left one pair
  touching in Area 1, five rings and sixteen directions clear it.
