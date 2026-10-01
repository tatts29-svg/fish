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
| 2 lines with no rate and no card line | "unknown, not nought" | still unknown, with what the contracts hold for them: the telehandler fork extension 1800 mm (NVAC) — **MEAD's own line SUB-2527 carries Rate 1 $9.30 a week for the nearest thing on the contracts, a forklift extension with no size stated: a starting point for the branch to confirm, not a rate to copy**; the forklift tyne rotator (NVAC) — no rate for it anywhere on the contracts or the card |

The tag "from the card" reads "priced by us · the card". The card table's heading under The working reads "Toilet
servicing — priced by us at our pump-out rates". A jump to something inside a closed fold now opens the fold first.

## Codex's review, 1 Oct 14:00 — one correction

A sibling line was matched on one shared word ("extension"). Now a sibling is the same description once the branch
prefixes are stripped, failing that the one named thing the contracts carry twice — a forklift extension, which needs a
fork word and "extension" on both sides **and no conflicting stated size** (1800 mm is not 2400 mm; a line that states
no size is not contradicted). The rate is named with its period ("$9.30 a week") and the P&L calls it "a starting point
for the branch to confirm (the size and the period), not a rate to copy". Codex's synthetic check for different
dimensions passes; all six of its checks pass on the corrected patches.

## Files

- `patch_v767.py` — the two P&L lines and the unpriced line in `pl752Card`; `pl767Servicing`, `pl767Unpriced`; the
  card748 heading; the jump handler opens the fold.
- `evidence/practice_tests.js` — the words; the servicing working with quantities and Event Portables' charge; the rule;
  the sibling rate named; the link opens the fold and lands on the table; no figure moved; read-only; no overflow; 0
  errors. `practice_results*.json`, `shot767_pl*.png`.

## Build and evidence

`build/GC500_v7.67e/GC500_Delivery_Control_hosted.html` — v7.64 → v7.65 → v7.66 → v7.67 on the live v7.63 (8,572,884 bytes):
**8,626,266 bytes**, check_page PASS, key grep clean. Practice tests desktop 12/12 and phone 12/12; v7.66 18/18 both; v7.64
22/22 both; v7.65 and v7.63 hold on the same build; Codex's six synthetic checks 6/6; sweeps desktop 21 tabs, 0 errors, 0 console; phone 21 tabs, 0 errors, 0 console
(`evidence/sweep_desktop.txt`, `evidence/sweep_phone.txt`).

The four-patch Costs release went live at 13:57 AEST (v7.63). On it, this is one build of four patches, for Codex to review and upload:

```
bash toolchain/build.sh v7.67 v7.64_costs_correct_and_to_job_end_DRAFT/patch_v764.py v7.65_the_costs_tab_in_one_flow_DRAFT/patch_v765.py v7.66_rehire_by_branch_DRAFT/patch_v766.py v7.67_priced_by_us_DRAFT/patch_v767.py
```
