# v11.25 — Neon job icons inside the rings, drawn for the jobs

Author: Andrew Fisher. Built on live v11.24 `ae6fac7d…`. LIVE line and hashes in STATUS.md.

Andrew, 22 Oct 2026: "Lets do some really elite icons  example attached just an example. Really push ur limits". The
example: glowing line icons inside glowing progress rings — a pump nozzle with a gauged tank, a spray bottle with a toilet
roll and a sparkle, a level gauge with a drop and a badge.

## What changes

**Two icon sets, the same four shapes at two levels of detail**, both stroked in the job colour (hi-vis, mint, blue, grey;
green when done), chosen from rendered candidate sheets at the real sizes (`evidence/icon_sheet_*.png`):

| Job | Detailed (48 grid, inside the rings) | Small (24 grid, chips / list / buttons) |
|---|---|---|
| Pump out | a pump nozzle, its hose looping under and up into a holding tank with a level gauge and a down arrow | a tank with the liquid drawn up |
| Clean & restock | a trigger spray bottle, a toilet roll, a sparkle | a spray bottle |
| Water checked / refilled | a drop with its level gauge inside and a tick badge | a drop with its gauge |
| Pump out, clean & lock (final day) | a padlock | a padlock |

**Crew card.** Each of the three job cards under the bars is a 66 px ring with the detailed icon glowing inside and the
percentage big beside it, then the name, the count and the last time. The sticky header's three rings carry the icons at
26 px with the percentage and the to-go count beside. Area chips, the per-area job list and the job buttons carry the
small set. The job buttons' own svg rules (written for the tick box: transparent stroke, a 40-unit dash the done
animation draws) no longer reach the label icon, so it draws — on v11.24 the spray bottle vanished there and only the
water drop's fill showed.

**Page's servicing panel (Event nights).** The three rings under the whole-night meter carry the detailed icons at 40 px
with the percentage beside; the area chips the small set.

Nothing else: percentages, data, codes, service, record unchanged. Footer v11.24 → v11.25. The crews see it once the
tracker is published again from the page's own fold (TEST first; the event tracker on Andrew's word; printed codes stay
valid). Glow is a CSS drop-shadow on the ring icons only (not on the 45 chips); it is off under reduced motion.

## Files

- `patch_v1125.py` — requires the live v11.24 page by SHA-256 (`BASE_SHA256`). Replaces the card's v11.24 function block
  (two icon sets, `ringIcon`, the job cards), the sticky header, the card style (v11.24's plus the ring-icon, glow, big
  percentage, header and button rules), the panel's function block and style, and the footer. Anchors are the v11.23 and
  v11.24 blocks, imported; the card JSON is parsed back and checked.
- `tests/test_v1125.cjs` — desktop and phone: the panel rendered from its own module (ring icons 40 px with glow, stroke
  colours, percentages beside, chips 12 px); the card template rendered with every write refused (job-card rings 66 px with
  42 px icons and the big percentage, header rings 26 px icons with percentage and count and the header fitting the
  screen, chips); job buttons built from the card's own pieces (label icon drawn, tick box untouched, done and pending);
  record unchanged, no errors, no writes. `../v11.23_three_jobs_LIVE/tests/test_v1123.cjs` with `EXPECT_PAGE=v11.25` is
  the regression (v11.24's test is superseded: it looked for the icons beside the rings).
- `tracker_update.cjs`, `tracker_card_check.cjs` — as before; the card check also requires the six ring icons at 42 px,
  the three header icons at 26 px, the percentages beside, the small set on the buttons drawn in the job colour.
- `evidence/` — icon sheets, screenshots and results.

## Checks

Applied to a copy of the live v11.24 page first; the live build is byte-identical (`0d8d97cf…`, 21,131,262 bytes). Toolchain
PASS. `tests/test_v1125.cjs` desktop 13/13 and phone 13/13; `test_v1123.cjs` regression 11/11 on the same page; sweeps
desktop + phone 25 tabs / 7 hashes / Back, 0 errors, 0 blocked writes. On the live page 13/13. The TEST tracker was
republished from the live page's own admin fold (one POST /api/cards, the page's own confirm answered, contact from the
service, "saved and read back"); `tracker_card_check.cjs test PG01`: CARD OK — six ring icons at 42 px, three header
icons at 26 px, the percentages beside, the small set on the job buttons stroked in the job colour with the tick box's
dash intact, no old icon, header fits, 0 writes, 0 errors. Evidence in `evidence/`. The EVENT tracker (the crews' printed
codes) is republished only on Andrew's word.
