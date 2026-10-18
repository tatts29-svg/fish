# Baseplan 2 source review — 14 October 2026

Author: Andrew Fisher

State: **READ AND COMPARED — no import, repricing or operational record changes.** The live application remains v10.12.

Andrew supplied `Baseplan SuperCars (2).xlsx` in this chat and said it may fill gaps. His authority rule remains: “what we have onsite and what we talk about is truth” and “The rate cards are the rates we have been given are currently truth.” The new export is supporting evidence, not permission to replace confirmed site records, agreed quantities, requested-size pricing or rate cards.

## Sources and current record

| Source | Private path | SHA256 |
|---|---|---|
| New Baseplan (2) | `/tmp/codex-remote-attachments/01a0f19e-5476-770e-91a2-08c3158610ba/134ca37b-2e91-4548-ab5d-c717d1d43dce/1-Baseplan-SuperCars-2-.xlsx` | `3f103174c9cde2934f2de9f78189f1931a13d9bf277b12169e280b271d9daf96` |
| Previous Baseplan (1) | `/tmp/codex-remote-attachments/01a0f19e-5476-770e-91a2-08c3158610ba/a60922c4-c761-44fe-b9e9-14ccb8970fc1/2-Baseplan-SuperCars-1-.xlsx` | `6f6a20a3567d99ff0f1e0e97c8387d5a94907a358711c7d52cf5b1043e54956d` |

All 11 original sheets were read directly with openpyxl, including contract lines and supplier annotations. Business rows were matched by contract and line number, with duplicate worksheet rows checked separately. Original workbook modified timestamps are 2026-10-13T20:05:44 and 2026-10-12T03:52:35 respectively; these metadata values are not physical arrival evidence.

A fresh actual-public, GET-only snapshot was taken at 06:12 AEST on 14 October: native version 5814, public page SHA256 `cde0aae30d5e528e85c2b16189bf0c0828397b87a7b3d10c1695362b19a58105`. All 17 existing financial reconciliation controls passed; no browser errors or operational writes. These controls establish consistency of the current calculations, not completeness of unknown financial inputs.

## Findings

- Previous export: 295 numbered worksheet rows and 295 unique contract lines. New export: **296 numbered rows but still 295 unique lines**. There are 293 retained lines, 39 changed retained lines (92 changed cells), two added unique lines and two absent lines. Both originals have the same 11 sheets and headers.
- **GN06** contract 9961976 line 48 is repeated exactly in rows 37 and 38. The old GN06 line 13 also remains with a different fleet, requested-size description and booking date. Count the duplicate once; resolve replacement versus additional scope before any allocation or charge change.
- **WB04** changes from 14 to 12 in contract 9972648, G5. Current requirement remains 14. The source must be reconciled to the site requirement; no reduction was applied.
- **GN10** changes from 20 kVA to 45 kVA, with its old fleet/serial cleared. The current requested size remains 20 kVA and it is not recorded onsite. Do not promote a source substitution into a confirmed asset or higher customer rate.
- **P46 fridge** new line 132 uses a different asset from the recorded onsite fridge, while the recorded P46 fridge is still allocated to P51 in the export. Reconcile both references together; no additional fridge or duplicate hire was created.
- **Events forklift** current asset 1281615 matches new MEAD contract 9987005 line 7, but its type, booking date and current stale branch link differ. Its explicit arrival-date field is blank. A status-entry timestamp is not an independently confirmed arrival date.
- The removed **300 kVA spare** contract line 32 still contributes to the current forecast and has no confirmed arrival. Source absence alone does not settle cancellation or replacement; reconcile before changing the forecast.
- Useful corroboration: P45 and P69 now carry the recorded onsite identities, GN13 now says Delivered, GN26/GN27 label the existing two Concert units, and LT01–LT04 label four towers already in the five-tower Molendinar group. These are identity/reference evidence, not extra units. The Concert map position remains Andrew's confirmed pin.
- New delivery-request docket numbers assist planning but are not proof of arrival. The fork-extension booking and refrigerated-container docket also need to remain tied to their existing records.
- **22 existing Rate 1 cells** on NVAC contract 9961976 are now nonzero. Their charging periods are not established consistently. Several resemble standdown-period amounts, while others disagree with actual starts or event-day treatment. They must not become daily rates or extra charges. The workbook compares each new amount with the current card daily/standdown rate on the same row; source precision and current model totals are retained.
- No existing labour prices, transport prices, branch/sales-analysis codes or supplier cost annotations changed. All eight transport charge rows are unchanged. This export does not supply new install, level, cleaning, demob or missing transport prices. No damage-waiver change is applied. WB06 remains 154, split 60 + 60 + 34; source calculated preview totals are never used as charges.

## Deliverable and evidence

`/workspace/output/GC500_Baseplan2_Check_14Oct2026.xlsx` contains exactly **Existing** (12 review rows) and **Needs fixing** (31 review rows). This reviews new export changes only, not the full site inventory. Each row identifies the Baseplan contract/line, our record, the new source and the action. The final 22 pricing rows show our day rates alongside their amounts without inventing a daily conversion. Exact source cells are in comments. Review rows are not equipment totals.

Private evidence and reproducible workbook builder are under `/workspace/private-baseplan-review14Oct2026/`:

- `operational-review.json`: complete original-sheet/line comparison, duplicate detection, current site evidence and operational assessments.
- `finance-review.json`: direct original pricing/branch/labour/transport comparison and all 22 new amount comparisons.
- `current/coverage-snapshot.json`: fresh private operational and financial snapshot.
- `build_review.py`, `price-workbook-rows.json`, `workbook-rows.json`, `workbook-validation.json`: deliverable generation and validation.

Root owns the combined review, with separate original-source operational and financial reviewers. Workbook reopening checks verify two tabs, source comments, filters/frozen headers and no executable formulas. A PDF rendering was used to inspect presentation. Private originals, detailed financial comparisons and the user workbook are not committed.

Final workbook SHA256: `a88c00a1bc4fc2910644c62b4624b5974739dafcb83e9045d2f9fe0f31bc9961`. Independent operational review passed 43 checks; independent pricing review passed 527 checks across all 22 pricing rows. The final pricing wording explicitly states our requested size and any next-size-down card basis for GN10, GN18 and GN20; this wording change leaves the reviewed operational rows untouched. Both original hashes were rechecked unchanged. Sanitised source counts, snapshot identity and validation are recorded in `source-review.json`.

Any future application change must begin from the then-current live page and native record, keep the above conflicts out of automatic imports, preserve confirmed site identities/dates and explicitly reconcile source joins. Do not bypass old importer hash/row-count guards or replace the embedded contract table wholesale.
