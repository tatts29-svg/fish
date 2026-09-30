# v7.55 — the P&L in Andrew's words (DRAFT · READY TO UPLOAD)

Author: Andrew Fisher · 1 Oct 2026

Andrew, 1 Oct 2026: "Check for error ensure correct P&L wording is used."

## What was wrong

The live v7.54 carries the Forecast P&L and the rehire on every branch (KINP's Event Portables toilets, NVAC's
sub-hired forklift, the SUB lines). The upload reworded the branch table away from the business words on
AGENTS.md: "Toilet hire Revenue … included in hire", "Hire at card or entered rates", "Rehire detail · included",
"none recorded", "do not add that column again". None of those are Andrew's terms.

## What v7.55 does

Puts the words back, every figure unchanged. The one useful thing the rewording added stays: a rate typed on Costs
counts beside the card.

| Where | Was (live v7.54) | Now (v7.55) |
|---|---|---|
| Branch table column heads | Hire · by the rate / Hire · card / entered / Rehire detail · included | Hire · by the rate / Hire · from the card / Sub-hired · rehire |
| KINP's rehire cell | Toilet hire Revenue … included in hire · Rehire detail | **Rehire · Event Portables** · 132 toilet lines · 148 units · **Rehire Revenue $X at our rates** · Rehire cost $Y approved — shown, never added |
| NVAC's rehire cell | Rehire … plant | **Rehire · plant** · 1 line · Rehire Revenue $X at our rates · supplier and Rehire cost not on the record |
| SUB lines | n SUB lines · $ | n SUB lines the rental system books · Rehire Revenue $ · supplier · Rehire cost not on the record |
| Total row | Toilet Revenue · n lines | Rehire · toilets · n lines · Rehire Revenue $ |
| Revenue line | Hire at card or entered rates | Hire with no contract rate yet — from the card, or a rate typed on Costs |
| Tag | card / entered | from the card |
| Note under the table | "do not add that column again" | "The branch total is the contracts line above, to the dollar … Sub-hired · rehire is detail of those columns, not another amount." |
| Footer author fallback | the project manager | Andrew Fisher |

Terms follow AGENTS.md: Revenue, Direct costs, Rehire, Rehire Revenue, Rehire cost, Transport Revenue, the card /
street rate card 2026, "charged to the V8s at our rates". Never "sub-hire partners".

## Files

- `patch_v755.py` — guard `pl755`; swaps the whole `pl754Title` and `pl754Cell` functions (brace-matched), then
  exact-once replacements for the card line, the tag, the column heads, the total-row cell, the note and the footer.
- `evidence/practice_tests.js` — the v7.54 P&L test, rerun: every branch row's rehire cell read, totals compared to
  the contracts line, desktop and phone, 0 errors.
- `evidence/practice_results.json`, `evidence/shot755_*.png`.

## Build and evidence

Built on the live v7.54 (8,475,019 bytes) with v7.56 on top: `toolchain/build.sh v7.56 v7.55_…/patch_v755.py
v7.56_…/patch_v756.py` → `build/GC500_v7.56/GC500_Delivery_Control_hosted.html`, 8,475,941 bytes, check_page PASS.

| Check | Result |
|---|---|
| P&L practice test (desktop and phone) | every rehire cell in Andrew's words; branch totals unchanged to the dollar; 0 errors |
| sweep.js desktop | 21 tabs, 0 errors, 0 console |
| sweep.js phone (MOB=1) | 21 tabs, 0 errors, 0 console |

Upload order: v7.55 then v7.56 on the live v7.54 (one build, `build/GC500_v7.56`). No record write. Run the
usual key grep (the Mapbox and Google key prefixes) before upload — clean on this build.
