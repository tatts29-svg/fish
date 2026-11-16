# v13.09 — every finished demob day carries its completed stamp (16 Nov 2026)

Author: Andrew Fisher. Andrew, in his Claude chat, 16 Nov 2026: "I have noticed on days in demob its nissing day completed stamped
please look over and fix these bugs". Dashboard only.

## Why the stamps were missing

On the live v13.08 page only Thu 5 Nov and Fri 13 Nov of the fifteen demob days carried the stamp (`tests/probe_days.cjs` on the
live record). A Demob day card was stamped only when every pick-up planned for that day was collected by the end of that same day
and every planned truck load matched it. Most days' plans moved: on 26 Oct, for example, 1 of the 12 planned loads went that day
(P38 and P39 left on 5 Nov, the generators on other days). WB20 (29 Oct) and WB19 (6 Nov) are also on planned truck loads although
they were never on site (v13.06), so those two days could never close. With the demob 100% done, thirteen finished days had no stamp.

## What changed

- `DemobProgress996.day()` also gives `closed1309`: the day is past, something was planned for it, nothing on it has an unknown
  quantity, and every reference planned for it and on each of its truck loads has since been collected (read on the record as it
  stands now), leaving out runs never on site (WB19, WB20) and references with nothing to collect.
- The day card's stamp shows when the old rule or this one holds. 5 and 13 Nov keep "All planned collections for this day
  evidenced complete."; the other thirteen read "Day completed. Every pick-up planned for this day has been collected."
- Nothing else reads the day's complete flag. Each day's percentage, its "collected / planned" load count and every other figure
  still read the day as it closed, so a day whose plan moved still shows it (26 Oct: 1 / 12 loads).
- Footer v13.09. No record, map, money, P&L or machine change.

## Checks (read only on the live record, every write aborted, none attempted)

- `tests/simulate_rule.cjs` on the live page before building: the rule closes all fifteen days, nothing blocking; WB20 (29 Oct)
  and WB19 (6 Nov) passed over.
- `tests/test_v1309.cjs`: 10 of 10 on desktop and phone (`test_desktop.txt`, `test_phone.txt`): fifteen days closed and stamped,
  both labels right, a future day and a past day with nothing planned not closed, footer, no errors, no writes. On the live page
  the same test fails on exactly the thirteen missing stamps (`test_base_live.txt`).
- Every day's own figures (percentage, bound, loads, collected loads, refs, recorded, the card's load and percentage text) are
  identical on the live page and the candidate (`figures_live.json`, `figures_candidate.json`).
- Demob 100% (`v13.06_demob_gauge_LIVE/tests/test_v1306.cjs`) on the candidate: 13 of 14, the one fail the footer now reading v13.09.
- Sweeps desktop and phone: 27 tabs, 17 shown as on live, 0 page errors, 0 console errors, deep links clean.
- `check_page.py` PASS; phone screenshot of the day cards looked at (`tests/phone_strip_v1309.png`).

## Build

`toolchain/build.sh v13.09 v13.09_demob_day_stamps_DRAFT/patch_v1309.py` on live v13.08
`7aecf0c1e80f88b702ed802f65e08b6401e099d49b4af2823e91068d1848329f` → candidate
`f3eea79feba6c463f4337487bcca5b43dd7e143e81fc6e409a8d8134121ab78d` (17,081,172 bytes). Claude implemented and tested; not reviewed
by Codex or Argon.
