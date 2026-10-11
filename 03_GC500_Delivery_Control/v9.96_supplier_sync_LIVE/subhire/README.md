# Event Portables shared supplier projection

Author: Andrew Fisher

Status: LIVE in v9.96, published 12 Oct 2026 at 02:34 AEST. Final root integration and actual-public verification passed.

`patch_supplier996.py:patch(html)` composes after v9.94 or later. The native shared record is unchanged. `Supplier996.model()` supplies current inventory, cumulative receipts, outstanding dated fulfilment, daily deliveries and proposed supplier demob loads. Exact typed collection evidence is read from `DemobCollection996.read`; current stock and cumulative arrivals remain separate.

## Source reconciliation

At the 12 Oct 2026 read-only snapshot: 83 items on site = 75 FWF (including spare 0164), two 16-pan blocks, six quantity-only pee panels. There are 91 recorded asset numbers. WC61's eight and WC69's six are assigned numbers without recorded arrival. The 9 Oct native operation logs confirm allocation changes only; WC61 was explicitly moved to 13 Oct.

Outstanding scheduled FWF: 113. Andrew's supplier-total record, confirmed on 6 Oct, is 194: 75 cumulative received + 113 scheduled + 6 without a current allocation. The original quote of 246 and original plan's 190 allocation/120 future loads are historical. Neither 194 minus receipts nor old PDF totals are labelled as scheduled outstanding.

The old supplier-plan correction flag is no longer required when a current item matches explicit supplier-plan scope or typed ownership. Receipt quantities reduce only the matching item. Current event dates and explicit date moves supersede older PDF snapshots. Cancelled or otherwise held identities remain visible without creating a dispatch. Conflicting fleet locations are excluded from the certain current-stock count and disclosed for review.

Schedule (7), SHA256 `485f5d885b88d836b63e85ad4062474a95a484022386efec7be62429f958edac`, Event Week rows 49/50 supplies one FWF each for Brad Jones Racing (source spelling “Brad lones”) and Shell V-Power on 22 Oct, supplier “event p”. Neither has a native WC/task reference. Stable internal source-row requests join daily deliveries without inventing WC numbers or using team-building map pins. `Supplier996.resolveRequest` resolves an active, cancelled, ambiguous or missing native match. A unique native FWF reference replaces the fallback request; cancelled/deleted matches suppress it. Explicit source identities take precedence over names. A shared reference claiming both source requests is held as ambiguous, without allocating its full quantity twice. These projection rows do not add financial charge lines; the separately owned Finance adapter handles verified customer Revenue coverage.

The WC40 history moved five fleet numbers to WC69 and added 0647 there. It did not cancel WC40's five-unit demand or change the confirmed supplier total. That history does not justify reducing the remaining unallocated balance of six.

## Truck proposals

Maximum 24 portaloos; six pee panels plus 18 portaloos; each 16-pan block uses a full truck. Proposed groups retain outside-island, island and unknown-location separation. Current-on-site demob runs list public/outside-island locations before park/island, preserve distinct recorded pickup dates, and retain pump-out checks. Unknown identities/positions and conflicting records remain marked for review. Truck grouping is a proposal, not a booking or collection. The native full Demob programme can include future inbound gear; its separate capacity adapter is owned by the Demob implementation.

The five original supplier PDFs were reviewed, including rendered scanned load sheets. Their blank sign-offs do not prove arrival. Their hashes are preserved in evidence; originals stay private.

## Exports

`Supplier996.pdf("remaining")` exports every remaining date in one PDF; each proposed load shows its own recorded date, while undated work stays “Date not recorded”. The existing `pdf("remaining", "YYYY-MM-DD")` API remains available. Every PDF header shows confirmed FWF allocation (received, scheduled, unallocated), with current 16-pan blocks and pee panels separate. The all-dates export is available beside the per-day buttons. Eight pure export scope/label checks pass; real PDF text/date verification is included in the final desktop integration test.

## Verification

`tests/integration996.cjs` uses the shared read-only browser harness, with all operational writes blocked. Run under `/tmp/gc500-browser.lock`, with `PAGE` pointing to the candidate, `MOB=1` for phone and `OUTDIR` for private artifacts. Local-only receipt and quantity fixtures are restored before completion. Final desktop 26 and phone 21 focused checks passed: current/remaining counts, source resolution, date/quantity propagation, capacity, PDF generation, Back/Close/Escape/focus and viewport overflow. Phone inventory and remaining-delivery screenshots were inspected.

`tests/collections996.cjs` tests the shared typed collection reader with the root current-stock adapter. The final combined candidate passed all eight checks after the temporary workspace process exhaustion was resolved. Its fixtures preserve cumulative receipts and customer charging while removing collected items from current inventory and proposed demob. Independent adversarial model/capacity review passed 16 checks; shared source-request resolution passed 13 collision, precedence and cancellation checks. No live operational writes or email sends occurred.

Root completed combined v9.96 integration, final navigation sweeps and actual-public verification. Final supplier PDF exports are generated from the verified live page and current shared record, separately from earlier candidate previews.
