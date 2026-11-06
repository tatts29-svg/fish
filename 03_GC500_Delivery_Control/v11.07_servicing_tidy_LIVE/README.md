# v11.07 — Servicing tab: no doubled-up area blocks; map labels carry the unit count; the chosen area glows

Author: Andrew Fisher. Candidate sha256 `dc6418352db789ea41fdc78242191e98394ba03399f4fdcb5da3e0ab99d30d3d` (21,051,442 bytes)
on live v11.06 `7c3f21ce…`. Status in STATUS.md.

Andrew, 22 Oct 2026: "In servicing can you remove these at the bottom its like your doubled up as these are already
mentioned up the top"; "When we click on area the area on the map glows with area chosen. In brackets next to
reference make sure we have the qty number".

## What changed (`patch_v1107.py`, five exact-once replacements on the live servicing block)
1. The area accordions under the map (the original panel's list, restyled by v11.06 to look like the area cards above)
   repeated each area's score, lamps and counts. Their summary is now the area number and name only; inside stays the
   job tally and the reference-by-reference tick times (the audit view).
2. Map markers carry their unit count: "WC70 (1)", "WC71 (8)", "2 refs (16)".
3. The chosen area's drawing outline glows in its own colour (CSS only; the map module already marks it `.selected`).
4. Footer v11.06 → v11.07. The tracker data and crew card lines are checked unchanged; no code, token or signature changes.

## Checks
Phone edit-link read-only probe with live data: labels `WC71 (8)`, `2 refs (16)`, `WC68 (1)`, `WC70 (1)`, `WC72 (1)`;
one `.svc1100-region.selected` with glow stroke-opacity .55 after choosing Area 12; accordion summary "1 Pit Lane,
Paddock & Teams · references and times"; 0 page errors; the only aborted write is the page's own hydration save.
`tests/test_e2e_v2.cjs` (area % now read from the race card's data-pct) and both navigation sweeps: see STATUS.
