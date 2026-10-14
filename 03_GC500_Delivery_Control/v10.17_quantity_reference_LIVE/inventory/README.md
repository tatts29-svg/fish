# Inventory receipts, current stock and outstanding deliveries

Author: Andrew Fisher

Component published with v10.17 on 14 Oct 2026 at 18:34 AEST. It starts from the actual public v10.16 page, SHA256 `3cbfd0d5c9bd53f02d5a89b274e83ee0c2d2c8dc17b03da59b68cf3a3db8673c`. It does not publish or edit the shared operational record.

Inventory was subtracting current stock from ordered quantity to calculate deliveries still required. That incorrectly requested another VMS after an already-received board moved to another reference. The same mistake would recur after collection. Remaining deliveries now use the existing typed receipt history, independently for each reference and item. Current stock, ownership, receipt history, original delivery scope, rates and charges remain unchanged. Overdelivery at one reference cannot offset another reference's unmet request.

The two known supplier-only FWF requests now join Inventory ordered/outstanding counts through `Supplier996.model`. These remain read-only source requests, with their current supplier run dates and destination descriptions. They acquire no native asset, receipt, fleet number, fabricated pin, editor or navigation QR. A linked, cancelled or ambiguous source request is not added again. Export pricing marks their missing native price allocation explicitly without inventing a value.

Inventory's screen list, drill and PDF now use one outstanding-delivery projection. An exact reference/item quantity match consumes the existing supplier's dated portions, including split deliveries. Location labels count distinct references; dated rows are labelled delivery stops. Non-supplier quantities retain native dates. Twenty-one existing pending references previously used legacy programme dates instead of the current supplier runs; the checks reconcile every matching supplier scope.

The separately reviewed barrier helper identifies two source-labelled reinstatements. Their 64 barriers remain visible as scheduled work, separately from newly ordered supply. The helper does not record a transfer, receipt or completion. Actual stock at either reference remains visible if it is later recorded.

Inventory PDF summaries reserve room for this compact work note. Location pages use nine naturally sized rows rather than clipping maps, QR codes or long location names in the former fixed-height ten-row layout. The current full export is checked at its authored A4 page sizes; screen styling and the app's layout are preserved.

WC46/WC55 already have master-plan unit positions and correct QR destinations. Their missing landmark descriptions previously made the shared screen/PDF facts reader say that no map location existed. It now identifies a master-plan position when no normal destination description exists. Report points, missing positions, existing descriptions, coordinates and navigation are unchanged; this wording does not claim an onsite-confirmed pin.

Verification against unchanged native record 6075:

- 29 GET-only browser checks: 39 types, 175 Inventory references, 55 outstanding stops and 25 matched supplier date scopes; current stock and ownership equal the baseline throughout.
- FWF: 227 ordered, 175 currently on site, 52 outstanding. VMS: original placement scope 24, nine currently on site, 14 outstanding. The moved source reference retains its original eight received and seven current units, with none still to deliver.
- TL2: 311 new-supply ordered, 76 currently on site, 235 outstanding; 64 reinstatement placements shown separately.
- All summary pages, location pages and nested location cards fit their actual A4 bounds. The actual native PDF export has nine A4 pages (two landscape, seven portrait); summary, source-only destination, long barrier name and final pages inspected without clipping. Real phone source-reference chip, drill and Close tested; phone screenshot inspected.
- 24 pure fixtures cover partial receipt, movement, full/partial/unresolved collection, overdelivery, reinstatement, source-only requests, source suppression, split supplier dates, non-supplier dates and truthful location fallback labels.
- Five exact-source guards pass. No browser errors or attempted operational writes.

Run with `PAGE` pointing to the combined candidate and `BASE_PAGE` to the exact live base. Browser checks also require private `BASELINE` (the native-6075 quantity snapshot), `OUT_DIR`, and the usual Chromium environment. Original captures, screenshots and PDFs stay in private workspace storage. Root owns the final combined checks, financial parity and publication.

Final release browser and actual PDF evidence was captured from candidate SHA256 `d30833b57d59b2347c106193fa052edfda6c953801c513069af0ab6e05e00b5d`, native 6075. All 29 checks pass, including a split-reference fixture with 27 delivery stops at 26 distinct trade locations. WB19/WB20 later removal tasks were independently verified as distinct scheduled work following reinstatement, so Demob retains them; they do not represent additional simultaneous physical stock.

The final release PDF was visually rechecked after the location-label correction. WC46/WC55 actual PDF QR codes were decoded and still exactly match the existing master positions at the six decimal places used by navigation. No coordinates were changed.
