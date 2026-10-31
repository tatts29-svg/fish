# v11.29 — The area on the site plan after a scan; a done job lit in its own colour

Author: Andrew Fisher. Built on live v11.28 `db9368ab…`. LIVE line and hashes in STATUS.md.

Andrew, 23 Oct 2026: "Be good if we can show them a map of area they scanned is this possible . Just want to help them and
make this extremly easy for them" and "And we high light based off colour too. Water needs to be neon blue. Clean and
restock is green. We need one for pump."

## The area on the plan

On a code's card, under the reference's details, and on the status page after Save & close, a new card **"Area 1 · Pit
Lane, Paddock & Teams · on the plan"**: the site plan, cropped to the area, with a pin on every reference of the area that
has a pin on the record. The scanned reference is white with a pulsing hi-vis halo; done references are green; the rest
hi-vis. **Every pin is a tap to navigate** (Google Maps directions, the same link as the Navigate button). A legend sits
under the map. **Where am I** asks the phone for its location once and plots a blue dot, or, when the dot would fall off
the crop, says "You are about 230 m north-east of PG01, off this crop." A refusal reads "Location is off for this browser".

**Where the plan comes from.** The explorer's own sheet overview (`/w/Coates-GC500-2026/explorer/assets/sheet-overview.webp`,
1192 × 842 px, 179 KB, the same origin as the card, so no key and no third party). Without signal the image does not load
and the pins sit on the dark; the rest of the card works as before.

**How a pin lands.** The explorer's `georeferencing.json` (25 Sep 2026 registration, a copy in this folder): lat/lon →
Web Mercator pixels at z18 (512 px tiles) → the inverse of the main plan's `sheet_to_z18px` affine → sheet points →
overview pixels at 0.5 px per point. A reference the drawing shows in its inset takes the inset's own affine, as the
explorer does (3 of 74). Checked in Python against the drawing's own reference labels (`source-labels.json`): 61 of the 74
pinned references have a drawn label, median 3.3 pt (about 2.3 m) from the pin, 59 within 10 pt; the worst are WC49 (27 pt)
and WC57 (17 pt), where the drawing's label sits away from the recorded pin. Not a survey (the registration's check is
0.67 m RMS, 1.04 m at the 95th percentile).

## A done job in its own colour

| Job | Done button | Tick box | "Completed hh:mm" |
|---|---|---|---|
| Pump out | hi-vis orange border and glow on a dark amber | hi-vis fill, dark tick | hi-vis |
| Clean & restock | green, as before | green | green |
| Water checked / refilled | neon blue border and glow on a dark blue | neon blue fill, dark tick | light blue |

The label icon on a done button keeps drawing (the v11.25 rule), in the job's light colour. The settle flash on tapping
takes the job's colour too. A pending (waiting for signal) button stays amber as before.

## Files

- `patch_v1129.py` — requires the live v11.28 page by SHA-256. Appends the plan functions to the card's function block
  (`PLAN1129`, the inverse affines, `planPx`, `areaMapHtml`, the Where am I listener, `window.SvcMap1129` for the checks);
  the map call on the code's card and on the status page; the style and the done colours; footer. The affines are read
  from `georeferencing_explorer_copy.json` at patch time.
- `georeferencing_explorer_copy.json` — the explorer's registration file as served on 23 Oct 2026.
- `tests/test_v1129.cjs` — desktop and phone: PG01's pin against the plan pixel worked out independently; the map for
  PG01 (crop inside the plan, the image, 14 navigation pins, PG01 white with the pulsing halo inside the crop, legend,
  Where am I); the blue dot when near, the distance line when 2 km away, the refusal line; the map on the status page and
  on the code's card; the three done colours by computed style with the label icon still drawn; record unchanged, no
  errors, no writes. `test_v1127.cjs` and `test_v1126.cjs` run on the same page as regressions.
- `tracker_card_check.cjs` — also requires the map on the published card at PG01 (12+ pins, PG01 the highlighted one,
  Where am I) and the plan image loading from the card's origin at 1192 × 842.

## Checks

- Dry build on a scratch copy of live v11.28, then the real build from live: byte for byte the same (`2e42b438…`).
- `tests/test_v1129.cjs`: 11/11 desktop and phone on the build; 11/11 desktop on live (evidence/).
- Regressions: v11.27 9/9 and v11.26 10/10 (evidence/regression_v1127, regression_v1126).
- Sweeps, desktop and phone: 25 tabs, 7 hashes, Back, 0 console, 0 writes blocked (evidence/sweep_*.json).
- LIVE 23 Oct 2026 01:44 AEST. TEST tracker republished 01:44. `tracker_card_check.cjs test PG01` then FAILED on the
  map: 14 pins and Where am I were there, but the plan image did not load. The GET-only probe
  (evidence/live_map_PG01_probe.png) found the cause in the card's console: the service serves the crew card with
  `Content-Security-Policy: img-src data: blob:`, which refuses an image from the card's own origin. The pins and the
  done colours were right; the plan was dark. Fixed in v11.30 (the card fetches the plan and shows it as a blob). The
  EVENT tracker was not republished on this release; v11.30 republished both.
