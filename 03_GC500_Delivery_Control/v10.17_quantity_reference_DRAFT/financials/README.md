# Independent financial parity

Author: Andrew Fisher

`capture1017.cjs` opens a supplied page through the strict GET-only harness, waits for both the complete shared record and source documents, then captures twenty full domains into a private output file. These include native state, customer charge totals, P&L, Finance, branch allocations, all source contract rows and resolved charges, source/entered rates, typed received quantities, generator calculations, supplier pricing, labour, transport and the unchanged WC09 record. No setter or native-save function is called.

`compare1017.py` requires the same native version and local day, compares every domain exactly, and verifies each model's existing reconciliation checks. Inventory physical quantities are allowed to change for the explicit projection corrections, but existing type-level currency values must remain identical and any newly displayed source type must add no charge. Raw financial values stay in the private audit folder; the comparison reports only check names and differing field paths.

The first combined v10.17 candidate passed all 72 checks against the frozen v10.16/native6075 baseline, with no differing financial field, application error or operational write. This is an interim candidate result; repeat capture and comparison against the final integrated page after any additional component changes. Root owns the final release statement.

Independent code-path review confirms the initial Inventory, Demob, barrier and map components change read-only projections. The Demob unit adapter is only consumed by the collection model; original charge lines, source rates and receipt records remain untouched. Source-only supplier requests added to Inventory do not become native equipment or a second monetary scope. Stored generator coordinates retain their values while the drawing projection changes.

Example from the repository root (provide private output paths):

```sh
PAGE=path/to/page.html OUT=/private/capture.json node 03_GC500_Delivery_Control/v10.17_quantity_reference_DRAFT/financials/capture1017.cjs
python3 03_GC500_Delivery_Control/v10.17_quantity_reference_DRAFT/financials/compare1017.py /private/baseline.json /private/candidate.json /private/parity.json
```

The capture needs the existing Playwright dependencies and Chromium binding. Baseline SHA256: `3cbfd0d5c9bd53f02d5a89b274e83ee0c2d2c8dc17b03da59b68cf3a3db8673c`. Detailed native copies and monetary evidence are not committed.
