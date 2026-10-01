# Month-end Finance review — v7.62

Author: Andrew Fisher

The review of the combined Costs and accruals drafts found that future and unconfirmed work could be described as earned Revenue or incurred cost. This correction keeps source values, confirmed work, forecasts and items needing reconciliation separate. It does not post a journal or change any shared records.

The Costs tab includes people, dates, days and hours by month, with confirmed, awaiting-confirmation and forecast hours shown separately. Actual costs take precedence only while their source confirmation is valid. Internal labour allocation remains visible when a payroll rate is missing. Customer labour charges exclude cleaning, fire extinguishers, accommodation and travel; these have their own lines. Missing prices remain explicitly partial.

Recorded work without an explicit work date remains in a separate allocation list. Entry timestamps and asset arrival dates are not treated as work dates. Supplier invoices are evidence of invoices, not payments. The fencing payment confirmation is retained without inventing a paid amount or automatically recommending a duplicate cost accrual. Finance must reconcile work periods, billing, payments and existing postings.

Build on the current live page, applying all three patches in order:

```bash
bash toolchain/build.sh v7.62 \
  v7.60_costs_in_andrews_structure_DRAFT/patch_v760.py \
  v7.61_accruals_for_finance_DRAFT/patch_v761.py \
  v7.62_finance_review_basis_DRAFT/patch_v762.py
```

v7.61 must not be released alone. Its original regression expectations for automatic accruals, inferred work months and the scope labelled as labour are superseded by this folder's tests. The existing public function names, section identifier and journal schema are retained.

Validation is in progress. Synthetic regression tests cover billing snapshots, future work, pickup dates, undated ticks, green-book dates, unknown invoices, stale actuals, internal allocations, moved charges and unpriced work. Browser checks use the shared harness, which prevents record writes. Local screenshots and exports containing live records stay out of version control.

Release status: draft under integration review; no upload yet.
