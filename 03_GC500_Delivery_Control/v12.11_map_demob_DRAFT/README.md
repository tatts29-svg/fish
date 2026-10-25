# Map pickup pack and Coates FWF finder — DRAFT

Author: Andrew Fisher

Andrew requested a Demob button in the existing map area: select pickup equipment, confirm no twin-steer truck, share the location/map/details/navigation and attach a PDF to an email. He then requested an easy way to locate Coates FWFs.

This draft adds a local selection and export workflow using the existing remaining-quantity/physical-unit model. Recorded collection quantities and unit ownership are retained; outstanding arrival, pump-out and quantity-review holds accompany the request. Preparing or sharing the pack never writes a collection or changes the shared record. A separate explicit departure action uses the native collection controls. The new truck checkbox is local to this pack; the current global printing behaviour remains unchanged.

Coates FWF finding uses each recorded unit's owner, not a reference-wide supplier. Confirmed reference locations are shown together; missing positions remain explicitly unplaced. A reference position does not establish an individual unit's precise place.

Implementation and integration tests are in progress. NOT READY TO UPLOAD. Base v12.10.1 is pinned in BASE_SHA256 and the existing map module in SPOT_SHA256. Build using the shared toolchain. Private live records, generated PDFs and screenshots remain outside this repository. Servicing/tracker and Samsung investigation belong to the existing owner.

Current candidate checks: native desktop and phone 29/29 each; synthetic model boundaries 14/14; exact byte-preservation/source guards 4/4. Phone dialog and the generated PDF inspected. PDF content, map detail pages and navigation links checked. Final full navigation and map-search regressions are in progress. No publication claim.

The pack is invalidated if selected quantities, asset identities, holds, loading sides, mapped positions or plan doors change. The PDF retains the existing no-twin-steer stamp. Native sharing attaches files; browsers without file sharing download the PDF and request an email draft with an explicit attach instruction. Sharing cancellation never downloads or claims delivery.

## Expanded departure scope (in progress)

Andrew subsequently requested a Left site overlay, recorded departure date and time, remaining-to-leave totals, and exclusion of already collected items from the 50 m picker. The earlier export-only candidate passed both full sweeps and map-search regressions but has NOT been published. It is not the completed expanded feature.

The departure modules are integrated into the candidate. They reuse `collection996` history, require the actual AEST departure date/time, preserve item identities and quantity categories, and exclude collected units from the picker and Coates FWF finder. Partial departures update current-stock quantities/identities, VMS status and map badges without changing historical unit scope or charge lines. They do not create new arrival events or revoke the remaining units’ pump-out clearance. Legacy events without an actual time remain labelled as time not recorded.

Current expanded checks: synthetic native collection boundaries 17/17, pickup model 14/14, preservation 8/8 (188 unrelated scripts exact, including Servicing/card and crew-code rules). Browser rehearsal and final export/navigation regressions remain in progress. NOT READY TO UPLOAD. Browser tests capture writes in memory and the harness blocks service mutations. No real departures are entered by this work.

Andrew also requested visible VMS icons while finding boards. The draft now adds sharp numbered sign markers for VMS map results, clickable to select the board, with separate linked labels at shared coordinates and a VMS boards quick finder. This changes presentation only; the existing recorded coordinates remain authoritative. Icon/browser regression checks are in progress.
