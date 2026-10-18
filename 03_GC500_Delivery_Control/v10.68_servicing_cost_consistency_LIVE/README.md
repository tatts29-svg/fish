**VERIFIED LIVE — 18 Oct 2026.** This release is included in published v10.71, SHA256 `34a6b81b4f5adc76a46c2d28670d24d1f72e0233092d13dd3445f8b0805b1df2`,18,506,356 bytes, published12:41 AEST and independently read back. Source382d0ee. Earlier draft/testing notes below are retained as history. Author: Andrew Fisher.

# Supplier servicing cost consistency — v10.68

Author: Andrew Fisher

**READY FOR PREDECESSOR PUBLICATION.** Source, financial comparisons, standard sweeps and phone presentation checks are complete. Publication still requires the release owner to build from the exact verified-live v10.67 predecessor, reproduce the candidate hash below, and use the guarded upload and public read-back. This patch does not modify the tracker, operational records or original supplier quotes.

Supplier servicing cost still used quoted quantities while customer servicing Revenue used the site's equipment count and event nights. This change uses the existing `servicing748` eligibility and nights, the same recorded unit quantities, and the matching original supplier quote rates. Supplier toilet-block cleaning includes blocks sharing a reference with a waste tank; the customer's existing sewer-connect servicing rule remains separate and unchanged. The explanation is generated from the differing quantities. Each supplier line rounds once to cents with decimal arithmetic. No current equipment count or supplier rate is hard-coded in the patch.

The shared cost projection feeds the Costs total, P&L cost split, supplier coverage and monthly provisional cost calculation. Original quote totals stay available as clearly labelled reference evidence. Customer rates, customer Revenue, water, other quote lines, delivery/pickup and existing branch attribution remain unchanged. Service ticks do not feed financial calculations.

Missing or ambiguous supplier-rate sources are explicit incomplete costs. Known unrelated amounts remain available as labelled subtotals; the full cost and recovery coverage remain unavailable. Quoted service quantities never substitute for missing site quantities. Missing required service mappings, duplicate quote identities, unknown transport and unsafe cent totals cannot produce a complete cost. If a service cannot be matched to its quote line, that quote's cost is held. If its quote identity is missing, all quote costs are held because the affected source cannot be identified safely. Original quotes remain untouched in `DATA.rehire_quotes`; the cost projection's quote-shaped objects must not be used to display source documents.

A blank delivery or pickup field is a verified zero only when the original subtotal, GST and other transport amounts add exactly to both printed grand totals. Missing totals, an unexplained residual, or invalid/negative explicit amounts leave transport incomplete. This is source reconciliation, not a blanket null-to-zero conversion.

Monthly review retains the existing provisional allocation across the quote's dated period, including its existing warning that Finance must confirm timing and invoice/payment coverage. Incomplete supplier rows display known subtotals and cannot be proposed as full accrual or planned amounts. Undated and unavailable amounts retain the existing costing branch. Separately recorded monthly costs remain unchanged, including records that cite a quote without carrying its allocation dates. This does not change source dates or post journals, recognise payment or infer completed services.

## Files and local checks

- `supplier_cost1068_src.js`: shared pure cost projection, exact cents and read-only page adapter.
- `patch_v1068.py`: exact-once guarded integration, requiring v10.67 and refusing repetition.
- `tests/test_supplier1068.cjs`: 36 synthetic checks covering source immutability, changed quantities/rates, exact line rounding, required mappings, duplicate quote identities, unavailable transport, strict blank-fee reconciliation, overflow, zero quantities, tank-linked block cleaning and preserved Revenue/water/transport.
- `tests/test_consumers1068.cjs`: 14 read-only VM checks of real patched page functions and all inline-script syntax. Covers native customer/supplier block rules with cancellation, moved-away, departure and own-use exclusions; approved/unapproved projection; full versus known costs; recovery gates; forecast top-ups; ledger reconciliation; monthly allocations/actions; branch attribution; old-base/repeat refusals.
- `tests/test_browser1068.cjs`: read-only frozen-record desktop/phone comparisons; all financial details and screenshots must be written outside the repository. Uses the shared browser lock and canonical write-blocking harness.
- `tests/assert_sweeps1068.cjs`: checks both canonical sweep reports for all 24 tabs, seven exact deep-link destinations, Back, intentional aliases and zero errors/write attempts.

Run from `03_GC500_Delivery_Control`:

```sh
node v10.68_servicing_cost_consistency_LIVE/tests/test_supplier1068.cjs
PAGE=/absolute/path/to/local-v10.67-candidate.html node v10.68_servicing_cost_consistency_LIVE/tests/test_consumers1068.cjs
```

For each desktop/phone browser comparison, clear inherited page/media overrides, set `GC500_FIXTURE` to the same private frozen record, and use the installed Chromium through `CHROMIUM_PATH`. Set `MOB=1` for the phone run. Execute under `flock /tmp/gc500-browser.lock`, then run the unmodified `toolchain/harness/sweep.js` with fresh private caches for each release candidate. Pass its desktop and phone reports to `tests/assert_sweeps1068.cjs`.

The financial browser test follows native `renderPass` memo invalidation for its local simulated input changes. Its tracker check feeds local responses into the installed reader/reducer, verifies progress changes, and compares fresh financial snapshots. It never submits a service completion or changes the live tracker.

The 59 guarded replacements matched exactly once against frozen v10.67 candidate `6ae970ca79aea9b198aa93042d1a81ceea1589e404f66f552da70351d6967387`. The browser-tested v10.68 candidate is `101797711b79fde90b2fa6cb1a267cd89360dc42486f28c072e61fa1cc9329a0` (18,486,212 bytes); 142 inline scripts pass static checking. The consumer test patches its supplied candidate in memory and uses synthetic amounts with real consumer functions; it does not read or verify private original quotations. The version/footer guard identifies compatible source structure; it does not itself prove a page was published.

Private original-source reconciliation on 18 Oct matched all four quotations, fourteen item lines and twenty-four subtotal/transport/GST/total fields to the embedded source data. A second reviewer independently re-extracted and checked the original PDFs, their source hashes, line arithmetic and grand totals, including the omitted-fee reconciliation. Independent code review covered block eligibility, immutable quotes, exact cents and incomplete-cost coverage; no source blocker remained.

Both canonical standing sweeps passed on candidate `10179771…`: desktop and phone each covered 24 tabs, seven exact deep-link destinations and Back, including intentional aliases, with zero page/console errors and zero operational write attempts. `assert_sweeps1068.cjs` verifies these results. The final phone supplier-cost ledger screenshot was inspected in its native Costs context and passed presentation and no-write checks.

Final financial comparisons also passed on desktop and phone with the same frozen operational record in both baseline and candidate arms. Costs, P&L, supplier coverage and monthly allocation agree to cents with independently reconciled source rates and eligible unit/night quantities. All customer Revenue components, water, branch attribution, original quotes and operational state remain unchanged. Local quantity changes update every supplier-cost consumer; customer-rate changes leave supplier costs unchanged; missing/duplicate sources remain incomplete. Local tracker reader/reducer progress changes leave financial snapshots unchanged. This tracker check is not a signed service completion or a live tracker write.

Both final financial runs report `pass: true`, `financialPass: true`, `cleanNetwork: true`, no external blockers, no console/page/request/resource errors and zero operational write attempts. Earlier upstream network failures are retained as diagnostic evidence; the final clean results do not rely on an external-error exception. Private results, source reconciliation and screenshots remain outside the repository; no operational values or financial details are included here.

## Final upload envelope and publication gate

The upload identity fix adds only `<!-- GC500 Delivery Control -->` immediately after the existing doctype. On final v10.67 predecessor `f32b39bcf42637fd246e03c6b64547b9dd203015659b768411e232e77ffcfc86` (18,465,246 bytes), the unchanged v10.68 patch and canonical scrub produce final candidate **`851197de50912e51e5715c16d6a21271691593588ebba5bb0a0dd60608374534` (18,486,244 bytes)**.

The shared `v10.67_servicing_tracker_LIVE/tests/envelope_equivalence.json` proof confirms that removing this sole 32-byte non-rendered comment reproduces the browser-tested candidate exactly. Scripts, styles, data and all other bytes are identical. Browser evidence remains bound to `10179771…`; it is not relabelled as a browser run on `851197de…`.

The release owner must verify live v10.67 is exactly `f32b39bc…`, reproduce `851197de…` through the shared build process, preserve the predecessor's tracker/map allowlists, then complete guarded publication and exact public read-back. No publication, operational writes or actual-live financial verification is claimed by this readiness record.
