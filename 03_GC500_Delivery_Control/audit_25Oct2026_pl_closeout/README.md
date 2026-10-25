# Non-fencing P&L close-out audit

Author: Andrew Fisher

Read-only review requested in PR #1 comment 6393892195 and claimed at `d911b0c64faa83bf8f07b576b2bd4f1173ef562f`. Audited page: v12.18, source `1a8ea606bf339e35810781afc3b71f22315c23ba`, SHA-256 `677b41fce24fafdc1795259a272b4770c5d719e1dd2b3be245909ee484d0b4d4`, 15,352,474 bytes. Independent public GETs before and after the audit matched this hash; the last read was 25 October 2026 at 16:42:29 AEST.

## Result and limits

- 41/41 independent decimal checks passed: ledger sums, branch sums, supplier-category control totals, source payroll and overhead sums, transport reconciliation and the relationship between the demob and planned-gap lists.
- Native read-only captures: zero page errors and zero attempted record writes. No new confirmed calculation defect was found in the reviewed scope. This does not certify final invoices or resolve business decisions.
- The current branch figures match the shared Baseplan comparison workbook. The original private Baseplan (7) export is unavailable in this environment, so the original-export reconciliation is **blocked**, not certified complete. Its source owner is asked for an authorised private location.
- Private deliverables: a customer-charge summary excluding fencing demob, an audit workbook with component lines and open decisions, a close-off report and a one-page transport fill-in sheet. Operational and financial results remain outside this public repository.
- This changes no product code, rates, quantities, ledger allocation or operational record. No new release is required for the audit tools.
- The newer v12.19 claim at `8a1455639def6dbc7697ec833312243fbe9db2e1` supersedes the earlier fencing proposal hold. Its named owner retains that implementation. These reports are v12.18 snapshots; customer totals must be refreshed after a verified fencing release.

## Reproduce privately

Use the normal read-only browser harness with a private output path and the browser lock:

```sh
CHROMIUM_PATH=/usr/bin/chromium PAGE=/private/live.html OUT=/private/models.json \
  flock /tmp/gc500-browser.lock node dump_models.cjs
python validate_models.py /private/models.json /private/review-workbook.json /private/validation.json
python build_private_pack.py /private
```

`review-workbook.json` is the shared comparison workbook's sheets exported as arrays of rows, including headers. `conclusions.json` holds private review rows with four fields: topic, status, evidence/interpretation and what is needed to close. The PDF generator uses ReportLab and embedded DejaVu Sans; the workbook uses openpyxl. PDFs were checked for page count and content, then visually inspected; the customer summary and transport fill-in each fit on one page.

The source dump intentionally writes only to the private output file. Do not commit model captures, original exports, filled-in sheets, generated financial reports or screenshots of their contents.
