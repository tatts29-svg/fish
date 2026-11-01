# P&L v1.19 / live v12.79 — independent source review proposals

Author: Andrew Fisher

Reviewed source: `26b85a35528ad9057ee7eae7ef6a007a6162ff8b` on `ccr-061f77e8-ivjhrv`. The declared live page is `73df88aeb79bd4c3dccdeafd01a9d23f72aa3d7d87257220919b0464cb6be95f`; a separate fetch and clean source rebuild match those bytes. This folder contains source-only review proposals and synthetic tests. It does not alter active release modules, private captures, operational records or the live page.

Latest integration base: `abeaf188ee352ff2b7cd1d8dc7cdea9196ff5f54`. The owner renamed the v12.79 module folder to `_LIVE` without changing module bytes; the finder patch targets that current path. This newer source update postdates the v12.80 candidate at `ec189f2`. Reconcile the owner's latest record corrections before building the successor: these v1.19 results do not verify v1.20 or a newer record snapshot.

## Proposed corrections

- `finder_scope.patch`: use reporting-month and category scope consistently for labour, exact-person and home-branch answers. November labour is already carried in October, so a November choice must not fall back to whole-job hours. Whole-job overtime bands and prepared journal/move registers explicitly retain their own scope where the data cannot support a monthly apportionment. No invented splits. The synthetic finder test passes 52 checks.
- `transport_precision.py`: a generic source-rate extension and validation helper. Keep the original source unit-rate precision and round each extended leg once. Nine synthetic tests cover the calculation and invalid inputs. This cannot recover digits already truncated in a capture: match the authoritative source cost rate first. Monetary source evidence and corrected private inputs are provided separately; no financial rows are committed here.
- `category-print.patch`: widen the category label column and keep the complete worksheet summary on one readable landscape page. All values and descriptions remain.
- `propose_pack_print.py`: scoped standalone HTML print rules keep the category total with its table and prevent timing headers breaking mid-word.
- `propose_rate_quantity_labels.py`: label the transport estimate multiplier as rate quantity. It follows the stated rate basis and is not necessarily a truck-trip count. The numeric multiplier is unchanged.
- `propose_forecast_month_precision.py`: copy estimate rows for presentation, showing a forecast month when an on-site observation does not establish a collection day. Retain supported scheduled dates as scheduled, preserve recorded October dates, and use the same precision in tables, search and exports. The source input remains immutable. Synthetic tests cover generation (24) and search/export (15).

The established fencing-haulage attribution is STPS. Keep that attribution intact. Other equipment carried by STPS transport must not be silently relabelled as fencing, and equipment used by a fencing crew is not automatically a fencing-haulage cost.

## Integration order and checks

The release owner retains integration and publication. Reconcile successor source and claims first. Apply the finder and worksheet patches to an isolated copy of the reviewed source:

```
git apply --unidiff-zero --check finder_scope.patch
git apply --unidiff-zero finder_scope.patch
git apply --unidiff-zero --check category-print.patch
git apply --unidiff-zero category-print.patch
```

The public helpers write review copies or expose functions for composing them; they refuse unexpected source anchors. Layer the pack print helper, rate-quantity helper, then forecast-date helper. The last helper accepts explicit builder, module and finder paths and writes copies to `--out`. Preserve the financial correction's verified private inputs and checks when composing these source changes; do not regenerate from truncated rates.

Run the synthetic tests against the final composed files:

```
python3 test_transport_precision.py
node check_finder_scope.cjs /path/plf1279_src.js /path/plf1279_find.js
python3 check_forecast_month_precision.py /path/build_monthend.py
node check_forecast_search.cjs /path/plf1279_src.js /path/plf1279_find.js
```

Rebuild the private pack and its PDF; compare its values, allocations and source-preserving changes. Refresh the private pack README and manifest (exclude the manifest itself from its payload digest list). Update the data pin and generate the next version through the existing guarded release process. Run the affected desktop, phone, search/export, Finance and actual print checks plus the usual release guards. A private assembled review page is a test artifact; it is not an upload candidate and does not allocate a new release version.

## Evidence and remaining boundaries

Detailed source, financial, invoice, operational and attachment evidence remains private with Andrew. The original inputs are preserved. Passing arithmetic does not establish missing wages, supplier invoices, account decisions or posted journal evidence. Month-end management allocations must not be represented as proof that forecast work was completed or journaled in the ledger.

The existing consumables source check is line/category-specific: comparing it with whole-invoice totals can include separate transport. Preserve its scope. Existing source-description and Finance exceptions remain in the private handover; do not invent accounting decisions or operational corrections.

These are reviewed integration proposals, not READY TO UPLOAD, a final-ledger certification or a new release claim. The owner must publish through the guarded uploader and independently verify the exact live content before calling the successor live.
