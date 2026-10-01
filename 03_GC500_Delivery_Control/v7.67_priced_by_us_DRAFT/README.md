# v7.67 — Priced by us (DRAFT · built and tested)

Author: Andrew Fisher · 1 Oct 2026

Andrew, 1 Oct, reading the Forecast P&L's "Hire with no contract rate yet … an estimate until the branch puts a rate on
the line" and "Toilet servicing … on no contract line yet": "can you not answer these questions? Surely you can — you
have the answers. We need this to be presentable and as accurate as possible, so we may need to work out some ourselves.
This is a good time for us to shine." Applied after v7.60 to v7.66 — one build, eight patches, on the live v7.59. No
figure changes.

## What changes

The page already priced every one of those lines; the P&L framed them as open questions. Now it says what we did:

| P&L line | Was | Now |
|---|---|---|
| 32 lines, $48,436 | "Hire with no contract rate yet — from the card, or a rate typed on Costs · an estimate until the branch puts a rate on the line" | **"Hire priced by us from the street rate card 2026"** — the branch has not put Rate 1 on yet; we charge the card line each one matches: forklifts, VMS and barriers at the day rate × the days to the term date, the rest at the whole-event rate; a rate the branch gives us is typed on Costs and stands in for the card; a link **each line and its rate** opens the table under The working; when Rate 1 lands on the contract it takes over |
| Toilet servicing, $85,102 | "Event Portables' quantities on Q6844 · Rehire Revenue on no contract line yet" | **"priced by us at our pump-out rates"** — 780 × FWF Pump out & Clean & Restock at $72.87 · 24 × Tank Pump Out & Clean & Restock at $624.60 · 51 × Sewer Connect Units Clean & Restock at $260.25; Event Portables charge us $46,545 for the same work, inside the Rehire cost; the branch adds the servicing lines when it bills |
| 2 lines with no rate and no card line | "unknown, not nought" | still unknown, with what the contracts hold for them: the telehandler fork extension 1800 mm (NVAC) — **MEAD's own line SUB-2527 carries Rate 1 $9.30 (W) for the same thing: type it on the card to charge it**; the forklift tyne rotator (NVAC) — no rate for it anywhere on the contracts or the card |

The tag "from the card" reads "priced by us · the card". The card table's heading under The working reads "Toilet
servicing — priced by us at our pump-out rates". A jump to something inside a closed fold now opens the fold first.

## Files

- `patch_v767.py` — the two P&L lines and the unpriced line in `pl752Card`; `pl767Servicing`, `pl767Unpriced`; the
  card748 heading; the jump handler opens the fold.
- `evidence/practice_tests.js` — the words; the servicing working with quantities and Event Portables' charge; the rule;
  the sibling rate named; the link opens the fold and lands on the table; no figure moved; read-only; no overflow; 0
  errors. `practice_results*.json`, `shot767_pl*.png`.

## Build and evidence

`build/GC500_v7.67/GC500_Delivery_Control_hosted.html` — v7.60 → … → v7.66 → v7.67 on the live v7.59: **8,621,316
bytes**, check_page PASS, key grep clean. Practice tests desktop 12/12 and phone 12/12; v7.66 16/16 both; v7.65, v7.64
and v7.63 hold on the same build; sweeps recorded on the board.

Not for upload until the four-patch Costs release is live and Codex has reviewed; then one build, eight patches:

```
bash toolchain/build.sh v7.67 v7.60_costs_in_andrews_structure_DRAFT/patch_v760.py v7.61_accruals_for_finance_DRAFT/patch_v761.py v7.62_finance_review_basis_DRAFT/patch_v762.py v7.63_accruals_in_andrews_words_DRAFT/patch_v763.py v7.64_costs_correct_and_to_job_end_DRAFT/patch_v764.py v7.65_the_costs_tab_in_one_flow_DRAFT/patch_v765.py v7.66_rehire_by_branch_DRAFT/patch_v766.py v7.67_priced_by_us_DRAFT/patch_v767.py
```
