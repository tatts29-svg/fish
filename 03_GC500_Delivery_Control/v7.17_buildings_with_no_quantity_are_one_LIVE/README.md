# v7.17: a building with no quantity is one (LIVE)

Author: Andrew Fisher

Andrew, 27 Sep 2026: "Buildings with no qty. It's qty 1."

- The schedule's rows for about 40 buildings (AA, CP1, HRP, P01–P46 …) carried no quantity, so the Timeline cards,
  day list, sheets and register showed a blank.
- In the one projection every page reads (`buildAllAssets`), a building row or charge line with no quantity now reads 1.
  It says so in its own words ("one building — the schedule row gave no quantity, and Andrew confirmed on 27 Sep 2026 …"),
  and the schedule's wording is kept beside it.
- A quantity typed by a person, or worked out from the asset numbers, still wins.
- The charges are unchanged: the priced building lines already had their quantities (`moneySummary` probe identical).

**LIVE: 27 Sep 2026, 23:25 AEST.** The page is v7.02 live + `patch_v717.py`, verified byte for byte on the view link.
P38's card now reads "Quantity 1 · Building 6m". The pre-start is still one page, with no errors.
