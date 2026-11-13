# v13.06 — the Demob figures read 100% when everything is off site (READY TO UPLOAD, 14 Nov 2026)

Author: Andrew Fisher. Andrew, in his Claude chat, 13–14 Nov 2026: "Everything is now offsite why is it 92%", then "Page fix" (chosen
over recording pick-ups on WB19 and WB20). Dashboard only; upload on Andrew's "Upload".

## Why it read 92%

The Demob tab's progress card read 731 of 795 units off site (92%, four stars) and 184 of 186 references; the Fri 13 Nov day card
read "At least 98.92 percent". Every reference had gone except WB19 (34 TL2) and WB20 (30 TL2). They are not separate barriers: the
programme lists the reinstatement of WB02's and WB03's barriers as its own runs. The record holds both as not on site, never
delivered, and the barriers' departures are on WB02 (9 Nov 14:00, run 125) and WB03 (29 Oct 19:00, run 76). So the figures waited
on 64 units that could never be picked up. The Demob cards already left such a run off (v12.42); the progress figures did not.

## What changed

- `DemobProgress996` (the one function every demob figure reads): `whole()` and `summary()` now take the demob scope through
  `scope1306()`, which leaves out a reference whose light is "not on site" with nothing collected on its history at any date, the
  v12.42 card rule. That moves the progress ring, the five stars, the line, the day cards' figures and the "Demob scope" tile
  together. The tile now names what it leaves out ("WB19, WB20 not on site, nothing to collect").
- At 100% the figure at the end of the progress line ran off the card's right edge; at the right edge it now sits left of the
  point, below the line.
- Footer v13.06.

Unchanged: the record, WB19 and WB20 on the register (light "not on site" as recorded), every other tab, the per-reference
departure readers (they call `evidence()` directly), maps, money, the P&L, branch totals and the Coates Way machine files.

## Checks (read only on the live record 13404, every write aborted, none attempted)

| | Live v13.01 | v13.06 candidate |
|---|---|---|
| Units off site | 731 of 795, 92% | 731 of 731, 100% |
| References fully gone | 184 of 186 | 184 of 184 |
| Stars | 4 of 5, "8.1% to go" | 5 of 5, "the demob is complete" |
| Fri 13 Nov day card | At least 98.92 percent | 100.00 percent |
| Day cards | "46 of 795 by the end of the day" (Mon 26 Oct) | "46 of 731 by the end of the day" |
| Demob scope tile | 186 | 184 · WB19, WB20 not on site, nothing to collect |

- `tests/test_v1306.cjs`: 14 of 14 on desktop and on phone (`test_desktop.txt`, `test_phone.txt`); the same test on the live page
  fails on exactly the figures above (`test_base_live.txt`, `test_base_live_phone.txt`), so it measures the change.
- Sweeps (`toolchain/harness/sweep.js`), desktop and phone: 27 tabs, the same 17 shown as on the live page, 0 page errors, 0
  console errors, deep links clean (`sweep_desktop.json`, `sweep_phone.json`, `sweep_desktop_base_live.json`).
- `check_page.py`: PASS (225 inline scripts parse, no keys, author line).
- Phone screenshots of the card, before and after: `tests/phone_progress_live_v1301.png`, `tests/phone_progress_v1306.png`.

## Build

`toolchain/build.sh v13.06 v13.06_demob_gauge_DRAFT/patch_v1306.py` on the live dashboard v13.01
`2f6bc154b896a33252f21b1b438593b2d7453b79bb47ef3ff01abb0721624e7b` (17,066,969 bytes) → candidate
`1017be1594f6c9660838d6440dfb125c9399de99519fae3866a7af8fdd2caa52` (17,068,185 bytes). Implemented and tested by Claude; not
reviewed by Codex. Next: Andrew's "Upload", then `toolchain/upload_page.py` (guarded on the unchanged live base) and a live read-back.
