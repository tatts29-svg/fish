# Map pickup pack and Coates FWF finder — DRAFT

Author: Andrew Fisher

Andrew requested a Demob button in the existing map area: select pickup equipment, confirm no twin-steer truck, share the location/map/details/navigation and attach a PDF to an email. He then requested an easy way to locate Coates FWFs.

This draft adds a local selection and export workflow using the existing remaining-quantity/physical-unit model. Recorded collection quantities and unit ownership are retained; outstanding arrival, pump-out and quantity-review holds accompany the request. It never writes a collection or changes the shared record. The new truck checkbox is local to this pack; the current global printing behaviour remains unchanged.

Coates FWF finding uses each recorded unit's owner, not a reference-wide supplier. Confirmed reference locations are shown together; missing positions remain explicitly unplaced. A reference position does not establish an individual unit's precise place.

Implementation and integration tests are in progress. NOT READY TO UPLOAD. Base is pinned in BASE_SHA256 and the existing map module in SPOT_SHA256. Build using the shared toolchain. Private live records, generated PDFs and screenshots remain outside this repository. Servicing/tracker and Samsung investigation belong to the existing owner.

Current candidate checks: native desktop and phone 29/29 each; synthetic model boundaries 14/14; exact byte-preservation/source guards 4/4. Phone dialog and the generated PDF inspected. PDF content, map detail pages and navigation links checked. Final full navigation and map-search regressions are in progress. No publication claim.

The pack is invalidated if selected quantities, asset identities, holds, loading sides, mapped positions or plan doors change. The PDF retains the existing no-twin-steer stamp. Native sharing attaches files; browsers without file sharing download the PDF and request an email draft with an explicit attach instruction. Sharing cancellation never downloads or claims delivery.

## Expanded departure scope (in progress)

Andrew subsequently requested a Left site overlay, recorded departure date and time, remaining-to-leave totals, and exclusion of already collected items from the 50 m picker. The earlier export-only candidate passed both full sweeps and map-search regressions but has NOT been published. It is not the completed expanded feature.

`departure1211_parent.js` and `collection1211_open.js` are initial, currently unintegrated departure source. Current-stock quantities already have a native typed-collection reader, but identity allocation, VMS and map consumers need reconciliation before enabling partial collection. Historical unit scope and charges must remain intact. Departure writes will occur only when an authorised page user explicitly confirms the actual items/date/time through the native collection path; tests will capture and block all service writes.
