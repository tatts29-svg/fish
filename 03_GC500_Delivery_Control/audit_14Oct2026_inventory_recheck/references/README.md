# Reference and link coverage recheck

Author: Andrew Fisher.

Read-only review of actual-public v10.16, SHA256 `3cbfd0d5c9bd53f02d5a89b274e83ee0c2d2c8dc17b03da59b68cf3a3db8673c`, native record 6075.

All 202 source rows reconcile: 182 current references (including six explicitly cancelled records), 18 retained lighting/drawing/alias contexts, and two explicitly deleted references. Every one of the 200 searchable current/context references resolves correctly. No current equipment reference disappeared from its asset reader, route or search index.

Coverage also includes 191 typed planned lines, all 322 contract rows (148 have explicit reference allocations, all valid), 124 projected native unit references, 365 indexed unit references, and 230 programme entries. Two programme entries are source-only supplier requests, deliberately read-only until a native reference is recorded; their real Build cards display correctly without dead asset links. Both forklift aliases remain linked to their source tasks; current-stock/Demob handling is reviewed separately.

The captured models pass 2,193 reference/link/quantity-label checks. Actual phone browser navigation passes 25 exceptional reference cases: mixed toilets, latest site deliveries, moved fridges/VMS, generators, source aliases, lighting contexts and a cancelled reference. Back controls are present. Native records remain unchanged, with zero application errors or operational writes. A settled 390 px phone drawer is exactly 390 px wide; the screenshot was visually checked after its opening animation.

One unresolved historical data item remains: native `T0233` holds an old onsite/completion record but has no current master/schedule reference, unit, location, movement or deletion link. Its identity cannot be established from the status flags. Do not infer equipment, delete the record, or add a charge from those flags. Original-source review is being coordinated separately.

This is reference and link coverage, not a claim that all map positions, supplier allocations, historical receipts or Demob totals are correct. The other audit scopes own those checks.

Reproduce with the shared GET-only browser helper:

1. `PAGE=/private/live.html OUT=/private/references node capture_references.cjs`
2. `PAGE=/private/live.html OUT=/private/references node check_exceptional_routes.cjs`
3. `python3 analyse_references.py /private/references evidence/reference-coverage.json`

The capture files contain private operational and contract details. Keep them outside the repository; commit only sanitized results and reusable audit code.
