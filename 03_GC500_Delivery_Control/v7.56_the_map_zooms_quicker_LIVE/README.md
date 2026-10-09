# v7.56 — the map zooms quicker, and stays sharp while it does (LIVE)

**LIVE in the combined v7.59 page, 1 Oct 2026 08:11 AEST.** The public view serves the build byte for byte: **8,489,105 bytes**, SHA256 `ed1e2f4b9e97b94558d09522bdd9b7c64aaf1e18740a39dd88494227b388a403`. 55 focused checks and both 21-tab/7-link sweeps passed, with zero page or console errors. Earlier build sizes below describe the draft checks. No shared records changed.

Author: Andrew Fisher · 1 Oct 2026

Andrew, 1 Oct 2026: "Maps revisit. Improve. Smoothness. Accuracy. Graphics. Zooming in and out quicker, accurate.
Faultless."

## Which map this is

The page's own drawing viewer: the Master plan and every issued sheet (Map → a sheet button, `#sheet/MASTER`), the
same viewer the drawers and Timeline open a drawing in. The Map tab's default view, Plan on satellite, is the
explorer that lives in the Coates Way machine (`explorer/explorer.js`, v7.14) and is not a page file; its zoom is
noted at the end.

## What changed

| | live v7.54 | v7.56 |
|---|---|---|
| a wheel notch (100 px) | ×1.20 | ×1.38 (Ctrl+wheel ×2.2) |
| the + / − buttons | ×1.6 | ×2 |
| the eased glide's time constant | 67 ms | 45 ms |
| sharp tiles | fetched only once the map had been still 180 ms — a long zoom ran blurry and snapped sharp at the end | fetched DURING the zoom, throttled to every 150 ms as a drag already does, then once more at rest (120 ms) |
| the point under the cursor | stays put | stays put |

Nothing about what the map shows, its pins, its search, its turning or its record changes.

## Evidence — `evidence/practice_tests.js` on the Master plan, desktop 1440×1000

| measure | live v7.54 | v7.56 build |
|---|---|---|
| five wheel notches at one spot | zoom ×2.46 (1.197 a notch) | zoom ×4.95 (1.377 a notch) |
| tiles arriving while the zoom still moved | none | yes — 8 tiles on at 1.19 s, before the glide had settled |
| tiles on at rest | 20 of 20 | 20 of 20 |
| the map point under the cursor after one more notch | drifted 0.2 px | drifted 0.3 px |
| + button | ×1.6 | ×2.0 |
| Fit (↺) | back to 1, tiles cleared | back to 1, tiles cleared |
| page errors / console | 0 / 0 | 0 / 0 |

`evidence/practice_results.json`, `evidence/shot756_explorer_zoomed.png`. Baseline run: the same script on the live
page, results in the session scratchpad.

Sweeps on `build/GC500_v7.56/GC500_Delivery_Control_hosted.html` (v7.55 + v7.56 on the live v7.54; 8,475,941 bytes,
check_page PASS): desktop 21 tabs, 0 errors, 0 console; phone (MOB=1) 21 tabs, 0 errors, 0 console.

## Files

- `patch_v756.py` — guard `v7.56 - tiles during the zoom`; five exact-once replacements in the viewer (ease, zoom
  step, the `zTiles` variable, wheel, buttons, idle timer).
- `evidence/` — the test, its results and the picture.

## The Plan on satellite explorer (not in this build)

Its glide uses a time constant of 77 ms and ×1.25 a wheel notch (`explorer.js` v7.14: `Math.exp(-dt * 13)`,
`.0022` a pixel), with the destination's tiles fetched as the wheel turns, so it never zooms blurry. Bringing it to
the same feel (time constant ~50 ms, ×1.38 a notch) is a one-line change to a machine-set file, registered with the
edit key — a machine release, not a page upload. Proposed as v7.58 on STATUS.md; not built here.

Upload order: v7.55 then v7.56 on the live v7.54 (one build). No record write. Run the usual key grep (the Mapbox
and Google key prefixes) before upload — clean on this build.
