# v9.62 — Toilet receipts and installation by item

Author: Andrew Fisher

Andrew asked for truthful toilet counts on Today and consistent quantities across tabs. The old reference-wide short-delivery rule suppressed two installed 16-pan blocks at WC31 because the accessible toilet was still recorded as not supplied. WC09's older block-only arrival was also being reused for four later FWF units whose numbers were assigned but whose arrival was not recorded.

The shared read-only item reader keeps receipt, assignment and installation separate. WC31's two blocks use the native 9 October description-level install tick, recorded after its explicit supplied quantity of two; its accessible toilet remains zero received and zero installed. WC09 has two installed blocks, six received pee panels without recorded installation, and four assigned FWF units without recorded arrival. Quantity-only pee panels no longer ask for six individual numbers.

Today, type details, Equipment Inventory, supplier inventory and the day-arrival pod use this reading. Current toilet scope is 254 schedule units: 225 FWF, 15 six-metre blocks, 2 sixteen-pan blocks, 4 accessible toilets, 2 trailers and 6 pee panels. Separate waste tanks are excluded from the toilet headline. This schedule scope differs from Event Portables' confirmed supplier quantity of 194 FWF; the latter is not substituted into the job requirement.

Native record 5155 yields 137 toilet units received, 131 installed, and 123 without confirmed installation (at least 51.57% installed). Only WC31's accessible quantity of one remains in the shortage review. Event Portables retains all 91 assigned identities; 73 total units are recognised on site, including 71 FWF (70 at locations and one spare). Of 194 confirmed FWF supply, 123 have no recorded arrival. A partially received item quantity never selects which supplier numbers arrived.

No native records, dates, identities, labour ticks, rates or financial calculations are written. Historical dates exclude later item receipt/installation evidence. Stale, future, duplicate and invalid item evidence cannot override the split-delivery guard. Recorded current quantities without a timestamp are not projected backwards.

Validation: synthetic regressions cover old split deliveries with and without Complete, repeated-reader idempotence, partial receipts, zero receipts, stale installation, offset timestamps, duplicates, historical dates, independently installed mixed-reference quantities, and current-day split entry counts. Optional native readback assertions reconcile every toilet type to the headline and supplier receipts. Strict patch tests cover the predecessor, exact anchors, double application and reproducibility. Root owns final combined browser, financial, sync and publication checks. Private native snapshots stay outside Git.

Final sync regression: recording two later FWF receipts at WC09 must preserve its two previously installed blocks and leave pee-panel installation at zero. A replay against native record 5155 changes received units from 137 to 139 while installed units remain 131 and the unrelated accessible review remains one; restoring the fixture restores all counts and the exact original record. Same-item split shortages review only previously claimed work, excluding later deliveries. Early schedule evidence must reconcile to the item order and contain valid, unique rows.

## Combined release verification

READY TO UPLOAD as part of v9.58–v9.63, 9 October 2026. Final standard-build SHA-256 `d98bfc4b6bb8461feec1f4af31a7d69fdd0711f2979d27bae4c324d7f8001ae6`, 12,762,245 bytes; exact live v9.57 base `1f04615f0c941e1c6c2b45e0656fc92e2bd816998a7b5f2d428f1e1b0e4a6cb0`. All 48 scripts parse. Final source checks (214 programme, 50 fencing and 65 toilet), 153 financial checks and 17 native ties pass. Both desktop and phone sweeps pass 22 routes, seven deep links and Back. All 21 incoming-record scenarios across seven tabs pass, with native record 5155 and actual charges/costs unchanged. Final phone layouts were inspected. Sixteen signed papers link to 17 original photographs. Detailed sanitised combined evidence is in the v9.63 release folder.

The final update replay exposed an intermediate WC09 partial-receipt regression. It was corrected and independently reviewed before rebuilding and repeating final checks; the superseded candidate was never published. Missing receipts and conflicting source scopes remain explicit.
