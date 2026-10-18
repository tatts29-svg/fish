# Supplier servicing cost consistency — draft v10.68

Author: Andrew Fisher

**DRAFT. Not ready to upload.** This patch is reserved for the verified v10.67 page after the speed and servicing-tracker releases. It does not modify the tracker, operational records or original supplier quotes.

Supplier servicing cost still used quoted quantities while customer servicing Revenue used the site's equipment count and event nights. This change uses the existing `servicing748` eligibility and nights, the same recorded unit quantities, and the matching original supplier quote rates. Supplier toilet-block cleaning includes blocks sharing a reference with a waste tank; the customer's existing sewer-connect servicing rule remains separate and unchanged. The explanation is generated from the differing quantities. Each supplier line rounds once to cents with decimal arithmetic. No current equipment count or supplier rate is hard-coded in the patch.

The shared cost projection feeds the Costs total, P&L cost split, supplier coverage and monthly provisional cost calculation. Original quote totals stay available as clearly labelled reference evidence. Customer rates, customer Revenue, water, other quote lines, delivery/pickup and existing branch attribution remain unchanged. Service ticks do not feed financial calculations.

Missing or ambiguous supplier-rate sources are explicit incomplete costs. Known unrelated amounts remain available as labelled subtotals; the full cost and recovery coverage remain unavailable. Quoted service quantities never substitute for missing site quantities. Missing required service mappings, duplicate quote identities, unknown transport and unsafe cent totals cannot produce a complete cost. If a service cannot be matched to its quote line, that quote's cost is held. If its quote identity is missing, all quote costs are held because the affected source cannot be identified safely. Original quotes remain untouched in `DATA.rehire_quotes`; the cost projection's quote-shaped objects must not be used to display source documents.

A blank delivery or pickup field is a verified zero only when the original subtotal, GST and other transport amounts add exactly to both printed grand totals. Missing totals, an unexplained residual, or invalid/negative explicit amounts leave transport incomplete. This is source reconciliation, not a blanket null-to-zero conversion.

Monthly review retains the existing provisional allocation across the quote's dated period, including its existing warning that Finance must confirm timing and invoice/payment coverage. Incomplete supplier rows display known subtotals and cannot be proposed as full accrual or planned amounts. Undated and unavailable amounts retain the existing costing branch. This does not change source dates or post journals, recognise payment or infer completed services.

## Files and local checks

- `supplier_cost1068_src.js`: shared pure cost projection, exact cents and read-only page adapter.
- `patch_v1068.py`: exact-once guarded integration, requiring v10.67 and refusing repetition.
- `tests/test_supplier1068.cjs`: 36 synthetic checks covering source immutability, changed quantities/rates, exact line rounding, required mappings, duplicate quote identities, unavailable transport, strict blank-fee reconciliation, overflow, zero quantities, tank-linked block cleaning and preserved Revenue/water/transport.
- `tests/test_consumers1068.cjs`: 14 read-only VM checks of real patched page functions and all inline-script syntax. Covers native customer/supplier block rules with cancellation, moved-away, departure and own-use exclusions; approved/unapproved projection; full versus known costs; recovery gates; forecast top-ups; ledger reconciliation; monthly allocations/actions; branch attribution; old-base/repeat refusals.
- `tests/test_browser1068.cjs`: read-only frozen-record desktop/phone comparisons; all financial details and screenshots must be written outside the repository. Uses the shared browser lock and canonical write-blocking harness.
- `tests/assert_sweeps1068.cjs`: checks both canonical sweep reports for all 24 tabs, seven exact deep-link destinations, Back, intentional aliases and zero errors/write attempts.

Run from `03_GC500_Delivery_Control`:

```sh
node v10.68_servicing_cost_consistency_DRAFT/tests/test_supplier1068.cjs
PAGE=/absolute/path/to/local-v10.67-candidate.html node v10.68_servicing_cost_consistency_DRAFT/tests/test_consumers1068.cjs
```

For each desktop/phone browser comparison, clear inherited page/media overrides, set `GC500_FIXTURE` to the same private frozen record, and use the installed Chromium through `CHROMIUM_PATH`. Set `MOB=1` for the phone run. Execute under `flock /tmp/gc500-browser.lock`, then run the unmodified `toolchain/harness/sweep.js` with fresh private caches for each release candidate. Pass its desktop and phone reports to `tests/assert_sweeps1068.cjs`.

The financial browser test follows native `renderPass` memo invalidation for its local simulated input changes. Its tracker check feeds local responses into the installed reader/reducer, verifies progress changes, and compares fresh financial snapshots. It never submits a service completion or changes the live tracker.

The 59 guarded replacements matched exactly once against the frozen local v10.67 candidate `6ae970ca79aea9b198aa93042d1a81ceea1589e404f66f552da70351d6967387`. Current private v10.68 candidate: `101797711b79fde90b2fa6cb1a267cd89360dc42486f28c072e61fa1cc9329a0` (18,486,212 bytes); 142 inline scripts pass static checking. The consumer test patches its supplied candidate in memory and uses synthetic amounts with real consumer functions; it does not read or verify private original quotations. **This is not a verified-live v10.67 base or a release check.** Recheck every seam on the actual verified v10.67 page. The version/footer guard identifies compatible source structure; it does not itself prove a page was published.

Private original-source reconciliation on 18 Oct matched all four quotations, fourteen item lines and twenty-four subtotal/transport/GST/total fields to the embedded source data. A second reviewer independently re-extracted and checked the original PDFs, their source hashes, line arithmetic and grand totals, including the omitted-fee reconciliation. Independent code review covered block eligibility, immutable quotes, exact cents and incomplete-cost coverage; no source blocker remained.

Both canonical standing sweeps passed on candidate `10179771…`: desktop and phone each covered 24 tabs, seven exact deep-link destinations and Back, including intentional aliases, with zero page/console errors and zero operational write attempts. `assert_sweeps1068.cjs` verifies these results. Current-record financial browser comparisons and phone screenshot inspection remain pending; their queued jobs were cancelled before launch to prioritise the predecessor's release gate.

## Required before READY

1. Build from the current verified v10.67 page using the shared toolchain. Preserve its exact tracker/map script allowlists and release content.
2. Review the current site quantities against the native unit/night model and the original supplier source. Keep the original documents, current operational values and detailed financial comparisons private.
3. Read-only browser checks on desktop and phone: Costs, P&L ledger, supplier coverage, monthly review and original quote display must agree. Check a local simulated quantity change, a customer-rate change and tracker tick changes: only the quantity change changes supplier cost. Check missing/duplicate-source handling.
4. Prove customer Revenue, water, other supplier lines, quote data and branch attribution are unchanged to cents; supplier cost changes exactly by the supported servicing-quantity difference. No operational write attempts.
5. Run both standing route sweeps, inspect phone presentation, complete an independent source review and record exact base/candidate hashes before guarded publication and public read-back.

No financial browser comparison, publication, operational writes or actual-live financial verification is claimed by this draft.
