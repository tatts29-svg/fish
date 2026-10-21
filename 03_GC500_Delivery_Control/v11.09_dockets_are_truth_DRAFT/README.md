# v11.09 — dockets and invoices are the truth; Eric off the installers

Author: Andrew Fisher. Built on live v11.08 `522dbc09…`. Candidate sha256
`4741d5cddb17582515cd0be85b9491ab5a4b068b9c58f05d306c7a83fefa4de5` (21,060,059 bytes). Status in STATUS.md.

Andrew, 22 Oct 2026: "Our dockets and whats been invoiced is truth"; "please remove eric from the names in installers";
"Everywhere needs to talk updates and place updates everywhere else". The first two are now rules in AGENTS.md.

## What changed (`patch_v1109.py`, on the live v11.08 page)

1. **The three crowd-control-barrier dockets are confirmed as their records classify them.** The Build index held
   36596 (287.5 m), 36603 (672.5 m) and 36613 (70 m) as "awaiting classification" and showed CCB as a 1,030 m range,
   because the review catalogue had no row for 36596 and stale rows for the other two (their records had been corrected
   since). Three rows are added the way the page already layers review rows (after the v10.46 block, replacing by docket
   number), written against the current record and the signed paper's checksum: 36596 and 36603 Demarcation (the
   programme rows they install and the paper's own notes), 36613 Event (the Porsche Lounge construction zone). The
   page's own review rule reads them as confirmed; if a record or paper changes it marks them stale again, as for every
   other row. Event 1,267.5 of 2,163 m and Demarcation 4,532.5 of 5,205 m now read as single figures.
2. **The invoiced row with no docket date counts.** Fence Costs 2026.xlsx, Week 6 row 3 (232.5 m clean + 3 vehicle
   gates, recorded 10 Sep 2026 by the supplier) was the one undated record and was held out of Done. An invoiced workbook
   row with no docket date is now placed on the day the invoice sheet recorded it, inside its own week (10 Sep is in
   Week 6, 7–12 Sep); every other rule (usable, week placement, scope) is unchanged. Its gates are counted as every
   docket's gates are (2 wheels per gate), where the v10.47 wheel count had skipped it for an unset scope and no wheel
   column.
3. **Eric Lucian comes off the current installers** (the About/Today contacts input and the AboutContacts1089 filter).
   His 14 Oct 2026 shift stays where it is history: the run sheet, the Costs labour rows and the 14 Oct day record.
4. Footer v11.08 → v11.09.

## Result on live data (22 Oct)

| Row | v11.08 | v11.09 |
|---|---|---|
| Temporary fence standing | 11,345 of 12,617 m · 89.9% | **11,577.5 of 12,617 m · 91.8%** |
| Vehicle gates | 108 of 135 | **111 of 135** |
| Crowd control · event | 1,267.5 (range 1,197.5–2,227.5) of 2,163 m | **1,267.5 of 2,163 m**, confirmed |
| Crowd control · demarcation | 4,532.5 (range 3,572.5–4,602.5) of 5,205 m | **4,532.5 of 5,205 m**, confirmed |
| Build index (fence + CCB + flat feet) | 85.11–85.43% | **86.58%** |
| Evidence state | ready, 3 pending | ready, 0 pending |

Scrim 1,725 of 4,394.5 m, pedestrian gates 22 of 34, flat feet 147 of 256, relocations 435 of 989, removal 227.5 of
1,133 m: unchanged. Every fencing display reads these same rows (v11.08's one model).

## Checks
Toolchain PASS all checks (the attribution scrubber is a no-op on this build). Today/Build probe on live data as above,
0 errors. Installers probe over every tab: Eric is off Today and About; his 14 Oct history stands. Sweeps and the
cross-tab consistency probe: see STATUS.
