# v11.62 — the scrim metres Advanced's sheets bill, on the thirteen dockets built into the page — LIVE

**LIVE 23 Oct 2026 19:51 AEST**: page `c4badfeb8dfe33ea88dd33a5280428281cb87ae1dec005c3ace44ca306713ed8` (21,598,843 bytes), built on
live v11.61 `bf54c4a6…`, guarded upload; the view link serves the build byte for byte. Tests 29/29 on the build and 29/29 live,
desktop and phone; sweeps 27 tabs / 19 shown / 0 errors / 0 console, desktop and phone.

Author: Andrew Fisher. Andrew, 23 Oct 2026: "Please make sure we price correctly. Numbers match up."

Advanced's five Commercial Approval sheets (construction weeks 1–5, on the record line by line on orders 4647520, 4647519,
4647515, 4647517 and 4647509) bill braced-for-scrim metres on thirty-three hire agreements that our record did not match: on
twenty-four the sheet bills scrim our record did not charge (1,740 m), on nine it bills less than our record charged (367.5 m).
The twenty on the record went to the sheet's metres the same evening through the page's own docket correction
(`record_23Oct2026_event_week_matching/scrim_match_spec_record.json`, record 10719 → 10777). The thirteen of weeks 4 and 5 are
committed fencing data in the page (`DATA.ops.fencing.dockets`, the September papers captured before the record existed) and
change only by a build — this one.

## What changes

Data only. For each of the thirteen the patch sets `quantities` to the sheet's scrim beside the paper's clean (the clean line
keeps the paper's metres, gates inside the card's metre, as every docket on the page), writes the correction into the docket's
note (the paper's own reading stays above it), rebuilds the docket's own priced lines at the card so the build figure beside the
live figure agrees, and moves the footer v11.61 → v11.62. The page prices every docket at run time from its quantities, so the
Fencing tab, the Costs tab and the purchase orders pick the change up without any logic change.

| Docket | Where | Was | Now | Sheet (order) |
|---|---|---|---|---|
| 36506 | S18 C.2 construction zone | clean 132.5 | clean 132.5 + scrim 10 | CW5 4647509 |
| 36513 | S07 C-Zone | clean 127.5 | + scrim 12.5 | CW5 |
| 36514 | Event Operations – iEDM compound | clean 147.5, ped gate 1 | + scrim 70 | CW5 |
| 36518 | S.O.5 grandstand, back of house | clean 35 | + scrim 22.5 | CW5 |
| 36519 | Event operations – iEDM compound | components only | scrim 72.5 | CW5 (scrim 72.5, clean credited) |
| 36520 | Coates compound / ABD compound | clean 112.5 | + scrim 40 | CW5 |
| 36523 | Helen Park – BSF compound | components only | scrim 22.5 | CW5 (scrim 22.5, clean credited) |
| 36529 | — | clean 45 + scrim 45 | clean 45 + scrim **10** | CW5 (down) |
| 36531 | Pit building paddock | components only | scrim 105 | CW5 (scrim 105, clean credited) |
| 36532 | S10 compound ("not scrimmed as requested from iEDM, to be scrimmed at a later date") | clean 150 | + scrim 132.5 | CW5 |
| 36539 | Cypress Carpark | scrim 97.5 | scrim **40** | CW4 4647517 (down) |
| 36544 | K01 kitchen compound | clean 52.5, ped gate 1 | + scrim 52.5 | CW4 |
| 36547 | PB01 footings | clean 72.5 | + scrim 72.5 | CW4 |

Thirteen build figures: $31,126.61 (was $19,851.00 on these dockets' own lines).

## Checks

- `patch_v1162.py` asserts the live v11.61 base (`BASE_SHA256`), finds each committed entry by its number and id, requires it to
  round-trip byte for byte before touching it, lands each new entry exactly once, and counts the footer and the thirteen
  correction sentences.
- `tests/test_v1162.cjs`: on the build and on the live page, desktop and phone — the thirteen read as corrected with the build
  figure beside the live figure, their notes carry the correction, every red-book paper on the five sheets carries the sheet's
  scrim metres (36609 excepted: its signed scrim note of 22 Oct records 420 m; the week 1 sheet 125 m of it), footer v11.62, no
  page errors.
- Sweeps desktop and phone (`toolchain/harness/sweep.js`).

Built on live v11.61 `bf54c4a68843a460f0b23728ece16d91c60bc9a2ea036a9dc2740f4425300ed2` (21,590,895 bytes):
`build/GC500_v11.62/GC500_Delivery_Control_hosted.html` 21,598,843 bytes, `c4badfeb8dfe33ea88dd33a5280428281cb87ae1dec005c3ace44ca306713ed8`,
check_page PASS.
