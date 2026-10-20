# Rate-card source audit

Author: Andrew Fisher · 14 Oct 2026

Independently re-extracted the exact live page's static rate mappings and compared them with the original rate-card workbook, including candidate mappings for ambiguous descriptions. **812 checks pass** across 51 mapped item/candidate rows, hire and standby values, work charges, Gold Coast transport cost/charge columns, accessories, four event hourly roles, servicing and fencing.

Numeric values are compared before rounding. Separate source meanings — Included, N/A, POA and a stated zero — remain distinct. Where a combined labour figure is split between install and demob, the two one-way charges add back to the original source figure. Original work-column year headings are retained.

Two differences from the workbook are deliberate: CCB Event uses $7.51/m and CCB Demarcation $13.08/m. Both were settled by Andrew on 24 September and independently match the original issued Street Rate Card 2026 PDF. Restoring the workbook's $9.579 and $14.1831 would increase customer charges incorrectly.

This establishes the accuracy of the mapped source prices. It does not establish that every asset has a rate, every native edit has propagated, or every quantity/date/charge allocation is correct. Unmapped and ambiguous types are listed in the evidence; no amount is invented. Runtime quantity, duplicate-charge, rate-edit and P&L reconciliation checks form separate parts of the release audit. The stale WC09 FWF quantity is one such separate defect.

No operational records or published prices were changed by this review. Exact source cells, values, accepted differences and coverage limits are in `rate-card-source-audit.json`.
