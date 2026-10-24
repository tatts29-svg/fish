# v10.30 — Water barriers get their own section; no agent name anywhere (LIVE 16 Oct 2026 04:53 AEST, as part of v10.31)

Author: Andrew Fisher. Andrew, 15 Oct 2026: "Water barriers is missing its own section. What's been completed and what
has not has no set up like buildings and toilets. Only looking at the Coates." And: "ensure we do not mention anywhere
on any tab that entry is done by codex or claude."

Built on the live v10.28 after `patch_v1029.py` (the card governs NVAC), so the page goes out as v10.30 carrying both.

## What changes

| Change | Where | How it is counted |
|---|---|---|
| **Water barriers** card on the Work progress board, after Toilets and Fencing | Today | The board's own rule: the schedule's WB quantities (375 TL2 barriers on 15 Coates references), Done = the barriers of every reference ticked complete (76 today: WB01, WB02, WB03), Left = the rest. The milestone banner follows the board. |
| iEDM's water barrier programme TP02-26003-03 on the page (`DATA.wfb_programme1030`) | every board row, the drawer | Each WB row's zone, location, quantity, days, install date and time and who installs, water-truck fill time and who fills, removal date and time, and the comments as written. Downer's 5 rows (253 barriers) are kept, named in the card's notes, never counted. |
| "Water barrier programme" card in a WB reference's drawer, before Where it is | drawer | Install, fill, removal, days on hire, the programme's and the schedule's and the contract's quantities, the joined contract lines. |
| Contract 9972648-STPS (17 TL2 lines) joined to its 15 WB references | Equipment, drawer, Costs | The programme, the schedule and the line all name the reference; where the quantity or the install date agrees the basis says so. The joins move no money: every contract line charges what v10.29 charges. |
| `esc()` drops " via Codex" and " via Claude" from anything the page prints | every tab, drawer, print | The record keeps the full recorder string; the page prints the person. The audit of 24 tabs, 8 drawers and 9 print routes finds no agent name (it found 15 pages with one before). |
| Footer | — | v10.29 → v10.30 |

## What the three sources disagree on (written on the card, not reconciled)

| Reference | Schedule | Programme | Contract line |
|---|---|---|---|
| WB04 Helen Park HVM | 14 | 13 | 12 |
| WB05 Main Beach light rail bus stop | 13 | 12 | 13 |
| WB07 Admiralty Drive intersection | 17 | 0 ("10× captured within WB05") | 17 |

On the programme with no reference on the Coates schedule: **WB22** (4 barriers, Marriott pedestrian crossing closure,
install 18 Oct 20:00 during Downer's road closure) and **WB21** (0, Main Beach light rail, a move into the turning lane
on the Sunday night). Both are listed on the card for Andrew to place.

## Files

`patch_v1030.py` (guards: ' · v10.29' footer present, no repeat), `wfb1030.js`, `wfb1030.css`, `read_wfb_programme.py`
(reads the workbook, sha `ec099497…`, which is customer material and not committed) → `wfb_programme.json`,
`data_log_1030.json` (joins, differences, Downer rows), `tests/test_wfb1030.cjs`.

## Checks

| Check | Result |
|---|---|
| `check_page.py` | PASS, 128 scripts, no secrets; DATA round-trips byte for byte before the change |
| `tests/test_wfb1030.cjs` (every write aborted) | ALL 12 CHECKS PASSED |
| Agent-name audit (24 tabs, 8 drawers, 9 print routes) | 0 pages with Codex or Claude in visible text (15 before) |
| `harness/sweep.js` desktop and phone | 24 tabs, 18 shown, no page, console or deep-link errors |

Build `build/GC500_v10.30/` 18,008,517 bytes. Not uploaded; goes live on Andrew's "Upload" (carrying v10.29).
