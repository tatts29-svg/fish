# Financial and supplier export audit

Author: Andrew Fisher

Read-only audit of live v10.15, SHA256 `bc7885b1bed08bafd75353ec3666ca9a4c52a59d17ad3bb0eb5896f011586f67`, against shared native version 6075. Tests use the strict GET-only harness; all service writes are blocked. Raw financial values, contracts, asset lists, generated PDFs and screenshots remain in the private audit evidence folder.

Confirmed defect: the next supplier delivery day has more destination rows than the single-page PDF renderer can fit. The individual day export and the combined export throw instead of producing a document. Root owns the v10.16 release; the scoped PDF correction preserves A4 portrait, full destinations and 18 mm QR codes, with clearly labelled continuation pages only where required. Daily quantities and truck allocation are unchanged.

Forty financial checks pass after source documents have loaded. These cover current Costs/P&L/branch/Finance reconciliation; changes to the editable pee-panel hire rate and received quantity; branch propagation; purchase-order value being separate from Direct costs; and generator charging at each race-week boundary. Every current generator contract line was recalculated independently using its quantity, published rate precision, delivery date and contract-line rounding. Current arrived supplier numbers were compared with the authorised references and supplier receipt model. No financial or native data was changed.

The initial generator grouped-row check was corrected to respect the existing contract-line rounding rule. Two distinct source contract lines can differ by one cent from multiplying the combined displayed quantity and rounding only once. This was a test-assumption issue, not a live charge error.

Limits: arithmetic reconciliation does not prove that every source contract allocation is correct. Existing unpriced transport, work scope and hire-allocation holds remain. Some source rows reuse an asset number with overlapping periods, different serials or locations; these require source/physical allocation review rather than automatic deletion or an invented charge. The audit does not certify these unresolved values as complete. The separately delegated offline/document recovery audit identifies another defect even though settled online financial calculations reconcile.

`snapshot.cjs` captures settled shared models. `scenarios.cjs` makes reversible in-memory changes, restores them and never calls native save functions. Its extra synthetic partial-generator case exercises inconsistent receipt inputs; it is not evidence that the present saved generators are overcharged. `export_check.cjs` reproduces the original real PDF failure. The focused corrected export tests live with the v10.16 PDF module.
