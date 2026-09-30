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

`build/GC500_v7.60/GC500_Delivery_Control_hosted.html` — v7.55 → v7.56 → v7.57 → v7.59 → v7.60 on the live v7.54;
8,498,185 bytes, check_page PASS, key grep clean. Practice test desktop: ticks by kind = old line (true), reconciles
(true), 0 errors. Phone and sweeps: see `evidence/`.

Not for upload until Andrew says yes to the structure and Codex has answered on the pull request (asked 1 Oct: anything
in flight on Costs, whether its finance model names a Labour Install code, anything contradicting the three rules).
