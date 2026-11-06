# P&L pack v1.8 — independent recheck handover

Author: Andrew Fisher

Reviewed source: `15b4b6b66d4eff729dfb5310d0d4294c142e040a` on `ccr-061f77e8-ivjhrv`. Claude retains the combined v1.9 correction scope in PR1 6547993784; Codex owns the affected-path recheck. No supplied artifact, operational record or live page was changed.

The independently rebuilt HTML and CSV match the complete v1.8 hashes in PR1 6547640849 exactly:

- HTML: `1dcacb55937eaee60477b1d3f864f60b1ff68949f2c1ed73a83e11115a753722`
- CSV: `02c32c8d320c48b17241bdff90f21e4734facf19d36fe545b24eb0e15571af5d`

The workbook was rebuilt from the same source and inspected through actual LibreOffice PDF output. Its build timestamps differ; this is not an assertion that its binary hash matches Claude's delivered workbook. Detailed numerical evidence, original-source findings and screenshots remain in the private handover to Andrew.

**Result: corrections required before calling the pack finished.** These remaining implementation points are supported directly by public `review_31Oct2026_october_month_end/build_monthend.py`:

1. **Contract match-up:** `TDOC` examines only recorded `tFig` entries, while the `NT` forecast row classifies every forecast as untied and `charged_on` says forecast loads have no docket. Reconcile forecast rows' available docket links as well; keep their forecast status, leave genuinely unresolved rows untied, and ensure the same cost is never counted twice. Retain the financial totals while correcting the match-up and its wording.
2. **Workbook note printing:** the `sheet()` helper and `sheet('Open items', ..., widths=[160])` need a print-safe narrative width/wrapping treatment. Verify complete note text through the actual PDF, including the end of every long line; the presence of headers and financial columns alone is insufficient.
3. **Displayed hours:** `HOURS = '#,##0.0'` still rounds the workbook's visible hours despite preserving more precise stored values and using `hd` in the HTML. Preserve source decimals in the displayed workbook too. This is a presentation correction, not a request to change the underlying hours or money.
4. **Fencing comparison wording:** the section 1b introduction says the invoice is shown “in full”, while the comparison defines an exclusion. Make the introduction agree with the comparison's scope; keep its reconciled amount unchanged.

Default A4 landscape HTML print now retains complete rows and financial columns. The manually overridden portrait layout is a separate optional readability case. Keep the existing cost-estimate/source qualifications and business-scope decisions; the audit does not convert estimates into paid actuals.

Return one v1.9 source and artifact-hash handover, with each item mapped to the fix. Codex will check these changed paths, stored-value preservation, cross-format totals and actual PDF output. Current preview/publication gates remain. This public note deliberately excludes the detailed financial evidence.
