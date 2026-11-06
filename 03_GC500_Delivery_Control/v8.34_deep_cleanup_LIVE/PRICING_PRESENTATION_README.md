Author: Andrew Fisher

The guarded `pricing_presentation834.apply_patch(text, path)` component changes presentation only. The selected current card and its source year supply the Pricing heading. If no source year is available, the heading omits it. The asset-list count is labelled “Active schedule records”, since it includes aliases and records with several units. The obsolete blanket hire-duration statement points to the existing charge-window and exceptions card; it supplies no new dates, rates or charge rule.

Existing native `source_row` links, where the canonical record is still active, identify alias records. Pricing keeps every record and every numeric comparison unchanged. A basis note says those comparisons still contain source-linked aliases and need allocation reconciliation; affected item rows show the actual source links. The Costs comparison gets the same qualification. A missing/cancelled canonical record, repeated name, quantity or physical number is not enough to classify a live alias.

`python test_pricing_presentation834.py` passes 16 synthetic checks, including street/circuit/source-year headings and the record-count label, unchanged date/exception calculations, explicit source-link authority, missing canonical records, escaping, no input mutation, numeric-function preservation and patch drift/reapplication guards. Private current-native binding and actual-renderer parse checks are outside the repository.

This is an integration component, not a published release. Final integrated desktop/phone review belongs to the release owner. It does not change Revenue, Direct costs, contract charges, comparison values, source data or native records.
