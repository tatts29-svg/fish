# v11.23 — Servicing tracker: three jobs, three percentages, water in the completion

Author: Andrew Fisher. Built on live v11.22 `5cde768c…`. LIVE line and hashes in STATUS.md.

Andrew, 22 Oct 2026: "As we are doing references who ever is doing the water refil. They just need to tick complete. This
confirms everything for this reference has been confirmed level is ok or has been refilled. So lets do a completion
percentage for checking refiling water. This uses the current clean and restock qr code which is used. So we should have a
completion percentage done for pump out. One for clean and restock and another for Water checked/refilled. Everything is
time stamped. Its a way to work out what is getting done. Capture anything that is not getting done. Or even missed. But we
want this to look really good and amazing for people using it." Then: "I think we add the water to the completion".

## What changes

**One water job, counted.** The v11.22 pair (Water checked + Refilled, both extras outside the percentage) becomes one job,
**Water checked / refilled**, on the clean & restock code: one tap a reference, meaning every unit there is right, filled or
not needed. It keeps the key `refill`, so any Refilled tap already on the record counts. It is a counted job like the other
two: the extras list is empty, the overall completion is pump + clean + water (on the night 251 + 259 + 242 = 752 unit-jobs),
and a reference is done when all three are done. Blocks, sewer, tanks and pump-only lines are unchanged (no water job). The
final day stays lock-up only.

**Three percentages, time-stamped.** Every tap already carries its time (the audit log is unchanged). On top of the overall
completion ring the crew card now shows, for the area the code belongs to and for everything:

- three rings — Pump out (hi-vis), Clean & restock (mint), Water checked / refilled (blue) — each with its icon, percentage,
  "done of all", "to go" and the time of the last tap;
- a sticky header sized for a phone: the day, the area (or Everything), and the three small rings with "to go" counts. A day
  with none of the three (the final lock-up) keeps the one Everything ring;
- three chips on every area header in the list, so a missed job stands out at a glance;
- the per-area fold lists every job on the day with its icon, count, percentage and last time;
- every job button carries its icon; the water button is blue with its own hint ("Tap when the water is checked or
  refilled"), green when done like the others.

The page's servicing panel (Event nights) shows the same three rings under the whole-night meter and three chips on each
area row; its table column "Water checked / refilled" no longer says "not in %"; the whole-night meter counts water.

**Unchanged:** the QR codes already printed (the clean code carries clean + water, the pump code pump; same hashes), the
service, the record, the audit log, the ready-to-audit list, the completed-day cards. The event tracker's published card
is republished from the admin fold (TEST first, the event tracker on Andrew's word); the printed codes stay valid.

## Files

- `patch_v1123.py` — requires the live v11.22 page by SHA-256 (`BASE_SHA256`). Tracker definition (page data and the card
  bundle's copy, each edited twice): tasks `refill: "Water checked / refilled"` (no `check`), `extras: []`, clean group
  `clean, lockup, refill`, FWF and accessible night plans `pump, clean, refill`. Card template: the v11.22 water functions
  and style replaced byte for byte (imported from `../v11.22_water_tally_LIVE/patch_v1122.py`) with the three-job functions
  (`jobStatsFor`, `jobsRowHtml`, `jobChipsHtml`), the new sticky header, the per-job progress list, a task class and icon
  on every job button, the water hint and the style. Panel: `jobStats1123` / `jobs1123Html` and style. Footer v11.22 →
  v11.23. The card JSON is parsed back and checked before the page is written.
- `tests/test_v1123.cjs` — desktop and phone (`MOB=1`): definition; the panel rendered from the page's own module with
  made-up ticks (every pump-out done, PG01 and PG03 cleaned and watered): three rings, chips on 15 areas, the whole-night
  completion worked out independently (251 + 2×2 of 752 = 33%) and, against the previous page on the same ticks, the
  v11.22 figure (251 + 2 of 510 = 49%) to show water now counts; the card template as the fold publishes it, rendered in a
  second tab with every write refused: three rings, the three-ring header fits a 390 px phone, chips on every area header;
  record unchanged, no errors, no writes.
- `tracker_update.cjs` — republishes the tracker from the admin fold exactly as an editor would (TEST by default; `event`
  on Andrew's word); the only write let through is the page's own POST /api/cards. Saves the private links file beside
  itself (gitignored, never printed).
- `tracker_card_check.cjs test|event [REF]` — GET only: opens the published card at one reference's clean code and pump
  code and checks the three rings, the header fit, and which jobs each code shows.
- `evidence/` — screenshots and results.

## Checks

See STATUS.md for the live line (toolchain PASS, test_v1123 desktop and phone, sweeps desktop and phone, the live run, the
TEST republish and card check).
