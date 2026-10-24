# Map pickup pack and Coates FWF finder — DRAFT

Author: Andrew Fisher

Andrew requested a Demob button in the existing map area: select pickup equipment, confirm no twin-steer truck, share the location/map/details/navigation and attach a PDF to an email. He then requested an easy way to locate Coates FWFs.

This draft adds a local selection and export workflow using the existing remaining-quantity/physical-unit model. Recorded collection quantities and unit ownership are retained; outstanding arrival, pump-out and quantity-review holds accompany the request. It never writes a collection or changes the shared record. The new truck checkbox is local to this pack; the current global printing behaviour remains unchanged.

Coates FWF finding uses each recorded unit's owner, not a reference-wide supplier. Confirmed reference locations are shown together; missing positions remain explicitly unplaced. A reference position does not establish an individual unit's precise place.

Implementation and integration tests are in progress. NOT READY TO UPLOAD. Base is pinned in BASE_SHA256 and the existing map module in SPOT_SHA256. Build using the shared toolchain. Private live records, generated PDFs and screenshots remain outside this repository. Servicing/tracker and Samsung investigation belong to the existing owner.

Checks so far: native desktop flow 27/27, synthetic model boundaries 14/14, byte-preservation/source guards 4/4. Generated PDF visually inspected. Phone and full regressions in progress; a later test also covers the email download/draft fallback. No publication claim.
