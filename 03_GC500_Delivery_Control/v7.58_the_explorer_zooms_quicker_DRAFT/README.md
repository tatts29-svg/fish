# v7.58 — the Plan on satellite explorer zooms quicker (DRAFT · a machine release, not a page upload)

Author: Andrew Fisher · 1 Oct 2026

Andrew, 1 Oct 2026: "Maps revisit. Improve. Smoothness. Accuracy. Graphics. Zooming in and out quicker, accurate.
Faultless."

The Map tab's default view is the Satellite Plan Explorer — a file in the Coates Way machine
(`explorer/explorer.js`, 122,423 bytes, md5 `f5c7ec1d…`, live since v7.14 and checked byte for byte against the
live `/w/…/explorer/explorer.js` on 1 Oct 2026), not the page. v7.56 quickened the page's own drawing viewer; this
brings the explorer to the same feel.

## What changes (two lines)

| | live v7.14 | v7.58 |
|---|---|---|
| a wheel notch (100 px) | ×1.25 (Ctrl ×1.82) | ×1.38 (Ctrl ×2.2) — as the page's viewer from v7.56 |
| the glide's time constant | 77 ms | 50 ms |
| the destination's tiles | fetched as the wheel turns (v7.14) | unchanged |
| double-tap ×2, pinch, drag, fling, reduced motion, phone resolution | | unchanged |

`release/explorer/explorer.js` — 122,510 bytes, md5 `1407e27035358e02c21f9fa98ca83c6b`. Made by
`python3 patch_v758.py` on the v7.14 file (`diff` shows the two lines).

## Evidence

`evidence/practice_tests.js` opens the live explorer twice (GETs only, through the harness's curl) — as it is, and
with this file put in place of the live one by the harness — and measures a notch's factor and the drift of the
point under the cursor. `evidence/practice_results.json`:

| | live v7.14 | v7.58 |
|---|---|---|
| one wheel notch | ×1.23 | ×1.38 |
| three quick notches | ×1.96 | ×2.61 |
| the point under the cursor after the notch | 0 px drift | 0 px drift |
| four notches back out | back to 1.00 | back to 1.00 |
| page errors | none (one harness "ERR_FAILED" console line in both runs: a request the read-only harness would not make) | same |

The glide's settle time could not be measured to better than the harness's ~40 ms sampling on software rendering,
so it is not claimed here; the change is a time constant of 50 ms in place of 77.

## Releasing it

A machine-set change with the edit key (as v7.14 was): put the one file on the volume and register a set with it in
place of the v7.14 `explorer/explorer.js`; every other file stays. The page is not touched. The lead's call —
Andrew has said the map is his tool on site, so this should go with his yes, after he has felt v7.56 on the page.
