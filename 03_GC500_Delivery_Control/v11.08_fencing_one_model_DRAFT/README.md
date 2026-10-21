# v11.08 — one fencing model on every fencing display

Author: Andrew Fisher. Built on v11.07 `dc641835…`. Status in STATUS.md.

Andrew, 21–22 Oct 2026: "Fencing is still not complete its not 100% yet"; "We need fencing correct we need this fixed.
You have all the dockets. You have all the maps and schedule".

## What the dockets say
- 123 fencing records on the page (112 hire agreements and collections + service notes); 121 usable and dated inside
  Build + Event, one undated workbook row (Fence Costs 2026.xlsx, Week 6 row 3: 232.5 m clean + 3 vehicle gates), one
  yard labour docket (36511, no fence).
- On 88 of the 89 dockets that list mesh panels, panels × 2.5 m = the **clean** metres, including every docket that
  also lists "braced for scrim" metres. So braced/scrimmed fence is the same fence with scrim on it, not extra fence.
- Programme (the 2026 installation plan, Construction weeks 1–6 + Event week): clean 7,965 m, braced for scrim
  4,394.5 m, relocation 989 m, removal 1,133 m, vehicle gates 135, pedestrian gates 34, CCB event 2,163 m, CCB
  demarcation 5,205 m, flat feet 256 m. Phillip Park compound (docket 36502, 257.5 m) was TBC on the plan and is added
  as a signed-complete allowance (the 848 review).

## The two models that were live
| | Build index (848/1104, Codex) | "9 types" card, Showcase, milestone, copy (fenceMetres) |
|---|---|---|
| Fence standing | 11,345 of 12,617 m (dated dockets' clean line; programme clean + braced + allowance) · 89.9% | clean + braced added raw: 13,302.5 of 12,359.5 m · **100%** |
| Scrim | 1,725 of 4,394.5 m, own row | added into the fence metres |
| Vehicle gates | 108 of 135 from 216 docket wheels (2 per gate) | 3 of 135 (a rarely filled docket column) |
| Relocation | blank: review snapshot of service note 24481 stale (metres 185 → 65 after the financial association) | 137.5 of 989 (dockets only) |
| Removal | 227.5 of 1,133 (collections + stack-downs) | 0 (no docket column) |
| CCB | event 1,197.5–2,227.5 · demarcation 3,572.5–4,602.5 (1,030 m across 3 dockets awaiting event/demarcation) | raw column allocation |

The Build index was right. `fenceMetres()` now reads its rows (memoised 30 s per day, never caching a not-ready read),
so Today's card, the Design headline, the Showcase fence scene, the milestone %, left-to-do and the copy text all agree
with it. Today's card table shows done, left and programme per type. The 24481 snapshot is refreshed to the current
record (same 65 m relocation and 120 m scrim), which brings the relocation row back.

## Result on live data (22 Oct)
Today card: **11,345 of 12,617 m of fence standing · 90%** · scrim fitted 1,725 of 4,394.5 m · vehicle gates 108 of
135 · pedestrian gates 22 of 34. Build index unchanged at 85.11–85.43% (fence + CCB + flat feet, each capped).

## Still needs Andrew
- The three CCB dockets awaiting event/demarcation: 36596 (287.5 m), 36603 (672.5 m), 36613 (70 m).
- The undated workbook row (232.5 m clean + 3 vehicle gates): a date, or confirmation it duplicates a docket.
