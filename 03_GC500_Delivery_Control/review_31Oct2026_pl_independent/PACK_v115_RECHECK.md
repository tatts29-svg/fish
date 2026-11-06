# P&L pack v1.15 and live v12.75 — independent recheck

Author: Andrew Fisher. 1 Nov 2026.

Reviewed source `ae1535066164002f87d17615bc147ed68b8865d5` on `ccr-061f77e8-ivjhrv`.
Independent GET verified live SHA-256 `0b32aebda051d1e48ef5e2319b589a2acd0afeff97418a05ff7c365606b891dc`, 16,641,763 bytes.
The delivered pack data has SHA-256 `31b9a283e41058556aab1c6c226a5c165ba66b6b28244f89f8ce5c12b6b64065` and exactly matches the live payload.

## Result and ownership

The supplied figures, allocations and outputs reconcile under their stated source conventions. This is not an unqualified sign-off of exact monthly actuals or a complete posted ledger P&L. The source's approximate month-allocation basis and rate-description basis need the qualifications below; known estimates, missing wage dollars and Finance decisions remain explicit.

Andrew supplied the private handover, verified against its published SHA-256 and all 46 manifest entries. Rebuilding the reviewed source with only input-path substitutions reproduces the delivered JSON, HTML and CSV byte for byte. All delivered workbook cell values and number formats agree with that rebuild. The release outside the final P&L block also matches the previously verified v12.71 changes plus the documented v12.72 wrapping; the current block matches its source and pinned data.

Codex owns this independent recheck. Claude retains the combined corrections and publication. No record or release was changed by this audit. Detailed financial evidence, source transcriptions, allocation matrices, identifiers and screenshots are returned privately to Andrew; they are not in this file.

## Corrections for the owner

Paths are relative to `03_GC500_Delivery_Control/`. Preserve amounts, recorded facts, price categories and branch attribution unless the source establishes a numerical correction. Preserve the current cards, controls and folds.

1. **Monthly allocation qualification — `review_31Oct2026_october_month_end/build_monthend.py`, the forklift `add()` using “the month it mostly falls in”.** This rule is an estimate, not an exact service-date allocation. Keep the supported whole-job cost and branch. Clearly qualify the monthly assignment; establish actual line service periods or a specific Finance allocation basis before calling the monthly values exact. Do not invent line dates or prorate from approximate descriptions.
2. **Supplier rate-basis wording — the same builder's Royal Wolf cost description.** The amount is read from the source's system total while the prose presents the displayed daily rate as its exact extension. Describe the amount as the sourced system line total and reconcile the rate basis separately. Do not manufacture extra precision or change the source amount merely to make the displayed multiplication fit.
3. **Labour note count — `LC_NOTES`.** The prose's count does not equal the listed fractional-hour lines. Correct the count or derive it from the checked line set. The monetary values and precise source hours are already consistent across the outputs.
4. **Accrual and business labels — `v12.75_pl_tab_pos_and_contracts_LIVE/plf1275_src.js`, summary tiles, heading and accrual explanation; corresponding pack prose.** “October's work” is too narrow for the selected accrual, which includes an earlier-month catch-up. Use “Accruals through 31 Oct”, identify the selected scope and excluded classes awaiting Finance treatment, and call the journals prepared for Finance rather than evidence of ledger posting. Show invoices and forecast distinctly. Use “Difference so far” and “not a margin yet”; keep missing wage dollars and estimates visible in the existing summary note. Replace unqualified finality with the dated job-position view. These are wording corrections, not authority to change accrual policy or move revenue between months.
5. **Workbook narrative rows — `build_monthend.py`, Schedule 17 transport note rows and labour-charged note rows.** The Schedule 17 notes are unmerged in the narrow first column; actual LibreOffice output stacks words across pages and clips one note ending. Merge narrative rows across the appropriate table width and calculate wrapped height for that width. Apply the same treatment to labour notes for readability. Reprint the actual workbook and verify complete note strings, all numeric columns and page bounds. The earlier Open items defect is fixed.
6. **Mandatory print-edge warning — the inherited twin-steer print strip.** The actual printed P&L clips the warning's final letter. Give the strip enough printable space without weakening or abbreviating the rule. The regression check must require the complete warning on every page, not only the presence of its opening words.
7. **Business print readability — the pack HTML print styles.** The delivered PDF retains its content, but most body text is around six points. Increase readable body text and allow additional pages while retaining the current table structure. Recheck complete rows, column alignment and note wrapping after the font change; do not shrink figures merely to keep the existing page count.

## Completed verification

Separate audit agents checked original revenue, costs and POs, person/day labour allocation, semantic presentation, cross-format agreement and actual rendering. Arithmetic passing is distinct from source completeness and printing defects.

- Original revenue, identifiers and delivered-workbook comparisons: 1,845/1,846 checks; the sole failure is the labour-note count above, not a monetary difference.
- Labour: 3,200/3,200 checks, including source/home branch to receiving branch by person/day/month, hours precision, allowance window, invoiced versus uninvoiced weeks, and zero-net branch transfers. Internal wages remain hours only.
- Costs: 1,668/1,668 checks of supplier/month/branch/job totals, the month-by-receiving-branch matrix, source quantities and rates, all PO/no-PO and tied/untied contract partitions, transport replacements, current-record differences and the selected accrual schedule. Every matrix row and column ties; the source qualifications above remain open.
- Cross-format: 10,568/10,568 checks across the delivered workbook, HTML, CSV and JSON, including all 2,486 workbook cell values and 2,486 formats against the source rebuild. The delivered HTML PDF carries all 283 body rows, 1,793 cells and complete Open items, with no out-of-page glyph boxes.
- Actual workbook printing: all 602 numeric cells retained and all Open items complete; the narrow narrative-column defect above remains.
- Live desktop and phone: 41/41 checks each; actual Print 16/16. Additional independent coverage confirms all 288 table rows, 1,201 cells and 42 notes in the actual PDF. Phone table columns remain reachable. The full warning check exposes the inherited strip defect despite those existing tests passing.
- Current source's own `audit_pack.py`: 465/465 reproduced, separate from the independent checks. Shared page check: all 223 inline scripts parse; no new keys or exposed edit key.
- No attempted live writes or runtime errors; no operational or publication changes. The four earlier v1.8 correction paths are implemented and checked at their applicable scope.

## Next handover

Return one corrected source commit and exact artifact hashes, with the item-to-fix map and any retained Finance/source decision clearly marked. Codex can recheck the changed numeric bases, preserved totals and actual output paths. Do not call the monthly actuals or final ledger position fully independently verified while the stated source qualifications remain.
