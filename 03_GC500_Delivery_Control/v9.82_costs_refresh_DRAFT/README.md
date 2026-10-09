# Costs refresh audit — v9.82

Author: Andrew Fisher.

READY TO UPLOAD — all final candidate checks complete; not yet published.

Andrew requests another Costs audit: correct totals, shared updates and no duplicate presentation.

The monthly labour table and CSV now include each worker’s existing home branch. The CSV includes the current KINP allocation used by Finance; this is an allocation basis, not proof of a posted journal. Worker branches remain sourced from the shared worker record.

Purchase-order entry rejects negative amounts, missing/negative partial receipt values and partial receipts exceeding the PO amount. Invalid shared PO records are marked “Receipt needs review” and excluded from receipted totals rather than treated as receipts. Valid current figures are unchanged.

Desktop and phone browser fixtures verify a transport cost reaches P&L, combined branches and Finance exactly once; remote removal updates the same figures. All six Costs sections retain one customer header and no stale or duplicate summary panels. A worker branch edit reaches monthly CSV and Finance. The fixture restores the browser record and makes no operational service writes.

Final presentation regression: 38 phone checks. All 15 financial models, 12 operational projections and native record 5201 preserved against v9.81. Phone screenshot inspected. Desktop and phone navigation: 22 routes, seven direct links and Back each pass; no page/console errors or service writes. Actual-public verification pending. Exact-base/double-apply guards and isolated actual PO entry-function tests pass; the invalid partial receipt bug is reproduced against v9.81. Existing rate, wage and receipt holds remain; no complete-invoice or posted-ledger claim.

Base: 824192c81c4c719590d82bd5497cb8c6e5e0f93590d61035ce642e7490919b34.
Candidate: f27008ce5293921f69c5f0b812ff46f5dddb00453e7d3748d99909aa22561bd2 (12,952,641 bytes; 67 scripts).

Codex implemented and tested independently; no Claude review claimed.
