# v11.24 — Job icons that show what the jobs are

Author: Andrew Fisher. Built on live v11.23 `e47d37de…`. LIVE line and hashes in STATUS.md.

Andrew, 22 Oct 2026: "Lets make some really good icon symbols for these.. left get rid of the race car lights. And lets do
icons for what they actually are".

## What changes

The three job icons on v11.23 (a tanker that read as a race car, a sparkle, a drop) become line icons drawn for the job,
chosen from rendered candidates at the card's real sizes (48 / 24 / 18 / 15 / 13 / 12 px, in the chip, the header cell, the
button and the big ring):

| Job | Icon |
|---|---|
| Pump out | a holding tank, open at the top, with the liquid drawn up and out |
| Clean & restock | a spray bottle |
| Water checked / refilled | a tap with a drop |
| Pump out, clean & lock (final day) | a padlock, as before |

The same four icons everywhere they appear: the crew card's three rings, sticky header, area chips, per-area job list and
job buttons, and the page's servicing panel rings and chips. They are stroked in the job's colour (hi-vis, mint, blue; green
when done), so the colour rules that filled the old shapes now colour the stroke. Nothing else changes: percentages, data,
codes, service, record. Footer v11.23 → v11.24.

The crews see the new icons once the tracker is published again from the page's own fold (TEST first; the event tracker on
Andrew's word; printed codes stay valid).

## Files

- `patch_v1124.py` — requires the live v11.23 page by SHA-256 (`BASE_SHA256`). Replaces the v11.23 icon block (panel, raw;
  card, inside its JSON string) and the v11.23 card and panel styles (`fill:` → `color:` on the icon rules), imported from
  `../v11.23_three_jobs_LIVE/patch_v1123.py` for exact anchors. Footer. The card JSON is parsed back and checked.
- `tests/test_v1124.cjs` — desktop and phone: the old icon nowhere on the page; the panel's icons are the tank, spray bottle
  and tap, stroked; each panel chip and ring, and each card chip, header cell and big ring, is drawn in its job colour on
  the stroke with no fill (computed styles); the card template publishes with the four icons; record unchanged, no errors,
  no writes. `../v11.23_three_jobs_LIVE/tests/test_v1123.cjs` with `EXPECT_PAGE=v11.24` is the regression.
- `tracker_update.cjs`, `tracker_card_check.cjs` — as v11.23, the card check also requiring the three new icons and no old one.
- `evidence/` — the candidate sheets, screenshots and results.

## Checks

Applied to a copy of the live v11.23 page first; the live build is byte-identical (`ae6fac7d…`, 21,124,209 bytes). Toolchain
PASS. `tests/test_v1124.cjs` desktop 9/9 and phone 9/9; `test_v1123.cjs` regression 11/11 on the same page; sweeps desktop +
phone 25 tabs / 7 hashes / Back, 0 errors, 0 blocked writes. On the live page 9/9. The TEST tracker was republished from the
live page's own admin fold (one POST /api/cards, the page's own confirm answered, contact from the service, "saved and read
back"); `tracker_card_check.cjs test PG01`: CARD OK — the three new icons on the card, no old one, six rings, header fits,
clean code shows Clean & restock and Water checked / refilled, pump code Pump out alone, 0 writes, 0 errors. Evidence in
`evidence/` (candidate sheets `icon_candidates.png` and `icon_chosen_in_context.png`). The EVENT tracker (the crews' printed
codes) is republished only on Andrew's word.
