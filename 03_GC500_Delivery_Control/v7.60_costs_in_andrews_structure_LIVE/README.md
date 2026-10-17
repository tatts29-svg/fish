**LIVE — 1 Oct 2026 13:57 AEST, released within v7.63.** Author: Andrew Fisher. Approved four-patch build verified byte for byte. See v7.63 release evidence. Earlier draft/review notes below are historical.

# v7.60 — Costs in Andrew's structure (DRAFT · built and tested · awaiting Andrew's yes and Codex's check)

Author: Andrew Fisher · 1 Oct 2026

Andrew, 1 Oct 2026: "I need hard focus on costs now. I need everything to make sense. Toilets: we are sub-hiring
these, why is this not under KINP? Cleaning will be classed as different, so not part of a labour cost. Labour
Installs, Steps, Levelling, Labour Demob will fall under the Labour Install code."

## The three rules, applied

1. **The toilets sit under KINP**, the branch that sub-hires them. The toilets' servicing and cleaning at our pump-out
   rates ($85,102 — Rehire Revenue on no contract line) and the Event Portables rehire cost ($118,575, approved) now
   show against KINP: in the P&L's By branch table, in the lower By branch card (under Subhire, the way Advanced's
   fencing dockets sit under STPS), on the revenue stream line ("Toilet servicing and cleaning — KINP rehire") and on
   the direct-cost note ("KINP · Event Portables toilets, rehire cost …"). Fencing is named to STPS the same way.
2. **Cleaning is not labour.** The labour ticked per piece is split by kind: install, steps, levelling and demob are one
   line, **Labour — Install** (the Labour Install code); cleaning is its own line; a fire extinguisher is a hire charge.
   Today 165 ticks are all Labour Install ($17,082.81); no cleaning or fire extinguisher has been ticked yet, so those
   lines and columns show "—" until one is. The split adds to exactly what the old single line added to.
3. **Everything reconciles.** The By branch table carries every stream a branch owns — contracts by the rate and from
   the card, Transport Revenue, the rehire it carries off the contracts, Labour Install, Cleaning — and a grey **Rehire
   cost** column (a direct cost, never added to revenue). All branches $500,113 + the event labour scope $55,817 (the
   job's, on no branch) = Total revenue $555,930, to the dollar.

No figure is invented and no total moves: Revenue $555,930, Direct costs known $235,082, Difference so far $320,848
are exactly as on the live v7.54. The same money is shown where Andrew says it belongs.

| branch | by the rate | from the card | transport | rehire revenue off the contracts | Labour Install | revenue | rehire cost (direct cost) |
|---|---|---|---|---|---|---|---|
| KINP | $136,084 | — | $2,835 | $85,102 toilet servicing and cleaning | $16,458 | **$240,480** | $118,575 Event Portables, approved |
| STPS | $81,149 | — | $103 | $120,913 fencing dockets | — | **$202,165** | $77,122 Advanced's dockets |
| NVAC | $339 | $46,953 | — | — | $625 | **$47,916** | not on the record |
| MEAD | $4,069 | $1,483 | $4,000 | — | — | **$9,553** | not on the record |
| All branches | $221,641 | $48,436 | $6,938 | $206,015 | $17,083 | **$500,113** | $195,697 |
| Event labour — the scope (the job's, on no branch) | | | | | | $55,817 | |
| **Total revenue** | | | | | | **$555,930** | |

## Files

- `patch_v760.py` — guard `pl760Ticks`; adds `pl760Ticks`, `pl760ToiletBranch`, `pl760FencingByBranch`,
  `pl760BranchTable`; replaces the labour stream line, the servicing and fencing labels, the P&L's By branch block,
  the two direct-cost notes; swaps `branchCostCard` for a copy that lifts the servicing under Subhire on the toilets'
  branch (display only — the memoised roll-up is not touched); a little style for the grey column.
- `evidence/practice_tests.js` — proves the ticks by kind add to the old line, the toilets' branch, the reconciliation
  (branches + scope = total), the lower card, desktop and phone; also reads the labour hours and the forecast of labour
  to charge. `evidence/practice_results*.json`, `evidence/shot760_*.png`, the sweeps.

## Build and evidence

Rebuilt 1 Oct 2026 08:40 AEST on the **live v7.59** (8,489,105 bytes) with only `patch_v760.py`:
`build/GC500_v7.60/GC500_Delivery_Control_hosted.html`, **8,498,174 bytes**, check_page PASS, key grep clean. Practice
test, desktop and phone: ticks by kind = the old line (true), branches + scope = total (true), toilets' branch KINP,
$500,113.38 + $55,816.56 = $555,929.94, 0 errors, 0 console. Sweeps on that build: desktop 21 tabs, 0 errors, 0 console;
phone (MOB=1) 21 tabs, 0 errors, 0 console. (The first build, 8,498,185 bytes, was on the v7.55–v7.59 chain before those
went live; same figures.) Also applies cleanly with v7.61 after it (`build/GC500_v7.61b`, 8,527,820 bytes, PASS).

## The labour, as the page has it on 1 Oct 2026 (Andrew: "labour hours, and the projected forecast of labour to charge")

What we charge for labour, per piece from the card (the Pricing tab's plan, split by kind under the new rules):

| | charged (ticked) | expected on site, not ticked yet | to come | later (demob) | forecast in all |
|---|---|---|---|---|---|
| Labour Install (install, steps, levelling, demob) | $17,083 | $5,278 | $20,279 | $27,222 | **$69,862** |
| Cleaning (not labour) | — | — | — | $8,484 (67 units) | $8,484 |
| Fire extinguishers (a hire charge) | — | $1,666 | $937 | — | $2,603 |
| per piece, all kinds | $17,083 | $6,943 | $21,216 | $35,706 | **$80,948** |

By branch (all kinds): KINP $64,427 · NVAC $9,088 · STPS $7,433. Plus the event labour scope, hourly, over the
event: **$55,817** for 368.9 h — the job's, on no branch. Labour to charge, all in: about **$136,800** (per-piece
$80,948 + the scope $55,817), of which cleaning $8,484 and fire extinguishers $2,603 are not labour under Andrew's
rule, leaving **Labour Install $69,862 + the scope $55,817 = $125,679**.

What labour costs us (the tracker, hours only until wage rates are given): build and demob 2,042.5 h (767.5 h to date,
1,275 h planned; 1,577.1 ordinary, 280 at ×1.5, 89.4 at ×2, weighted 2,175.9 h) + 159 h planned over the race
weekend = 2,201.5 h. By employer: Coates 1,573.5 h (Aaron Zelvis, Alfie Harris, Andrew Fisher), Job Connect 436 h
(Daniel Gough, Kyle Gover), employer unstated 33 h (Jayden Paul, Wayne Crimmin). Wage cost: 49 of 208 shifts
priced (the Job Connect rates), $31,824 partial outlook, 1,626 h unpriced — no wage rate for the Coates people yet.

Not for upload until Andrew says yes to the structure and Codex has answered on the pull request (asked 1 Oct: anything
in flight on Costs, whether its finance model names a Labour Install code, anything contradicting the three rules).
