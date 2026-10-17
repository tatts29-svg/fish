# Supplier servicing cost consistency — draft v10.68

Author: Andrew Fisher

**DRAFT. Not ready to upload.** This patch is reserved for the verified v10.67 page after the speed and servicing-tracker releases. It does not modify the tracker, operational records or original supplier quotes.

Supplier servicing cost still used quoted quantities while customer servicing Revenue used the site's equipment count and event nights. This change takes the supplier quantities from that same existing `servicing748` projection and prices them at the matching original supplier quote rates. Each supplier line rounds once to cents with decimal arithmetic. No current equipment count or supplier rate is hard-coded in the patch.

The shared cost projection feeds the Costs total, P&L cost split, supplier coverage and monthly provisional cost calculation. Original quote totals stay available as clearly labelled reference evidence. Customer rates, customer Revenue, water, other quote lines, delivery/pickup and existing branch attribution remain unchanged. Service ticks do not feed financial calculations.

Missing or ambiguous supplier-rate sources are explicit incomplete costs. Known unrelated amounts remain available; quoted service quantities never substitute for missing site quantities. If a service cannot be matched to its quote line, that quote's cost is held rather than treated as a verified total. Original quotes remain untouched in `DATA.rehire_quotes`; the cost projection's quote-shaped objects must not be used to display source documents.

Monthly review retains the existing provisional allocation across the quote's dated period, including its existing warning that Finance must confirm timing and invoice/payment coverage. It changes the projected amount, not the dates, status or branch. It does not post journals, recognise payment or infer completed services.

## Files and local checks

- `supplier_cost1068_src.js`: shared pure cost projection, exact cents and read-only page adapter.
- `patch_v1068.py`: exact-once guarded integration, requiring v10.67 and refusing repetition.
- `tests/test_supplier1068.cjs`: 19 synthetic checks covering source immutability, changed quantities/rates, line rounding, aggregate/split/monthly reconciliation, invalid and duplicate sources, zero quantities and preserved Revenue/water/transport.

Run the synthetic checks with:

```sh
node v10.68_servicing_cost_consistency_DRAFT/tests/test_supplier1068.cjs
```

The source seams were checked against captured v10.65 public page SHA-256 `c62adee5817153a56d538e1db015b0ef66a8a6e75609bc4d6e09a47bedfafbd8`. Every non-footer replacement matched exactly once. A memory-only fixture with a fictional v10.67 footer applied and parsed all inline scripts; old-base and repeat refusals passed. **That fixture is not a v10.67 build or release check.** Recheck every seam on the actual published v10.67 page.

## Required before READY

1. Build from the current verified v10.67 page using the shared toolchain. Preserve its exact tracker/map script allowlists and release content.
2. Review the current site quantities against the native unit/night model and the original supplier source. Keep the original documents, current operational values and detailed financial comparisons private.
3. Read-only browser checks on desktop and phone: Costs, P&L ledger, supplier coverage, monthly review and original quote display must agree. Check a local simulated quantity change, a customer-rate change and tracker tick changes: only the quantity change changes supplier cost. Check missing/duplicate-source handling.
4. Prove customer Revenue, water, other supplier lines, quote data and branch attribution are unchanged to cents; supplier cost changes exactly by the supported servicing-quantity difference. No operational write attempts.
5. Run both standing route sweeps, inspect phone presentation, complete an independent source review and record exact base/candidate hashes before guarded publication and public read-back.

No browser checks, publication, operational writes or actual-live financial verification are claimed by this draft.
