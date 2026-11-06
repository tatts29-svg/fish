# v9.64 — Quantity-only sub-hire ownership

Author: Andrew Fisher

Andrew confirmed the six installed Pee Panels at WC09 are sub-hired. Event Portables quote Q6845, Portable Toilets line3, already covers their supplier hire. The page previously excluded these panels from supplier stock because it only counted individually identified units.

A single item-level ownership record now links six quantity-only panels to Event Portables. Inventory and the existing supplier list and WC09 description display SUB-HIRED · Event Portables. The supplier PDF labels the row as quantity-only, with no fleet numbers. No physical identities or whole-location ownership flag are created: WC09’s Coates blocks and separately assigned FWF are unchanged.

The native setter is `quantitySubhire964Set(ref, item, quantity, owner, expectedToken)`. For this confirmed scope, use `quantitySubhire964Set('WC09','Pee Panel',6,'event-portables',quantitySubhire964Token('WC09','Pee Panel'))`. It requires editing permission and a named recorder, checks the current token and exact active item scope, and saves through the native bump/sync path. The key is `quantity-subhire964/WC09/Pee%20Panel` in the existing `loads` collection. The record contains the user confirmation and existing quote provenance. Receipt, installation and their timestamps are separate and untouched.

The shared reader rejects duplicate or malformed records, changed schedule quantity, inactive/moved references and overlapping physical identities. It reads actual receipt and installation quantities from the existing item model; owner quantity never proves arrival. Repeating the same confirmation is idempotent.

On the native5164 fixture with the ownership record inserted locally: Event Portables retains91 identified units and adds6 quantity-only units,97 tracked units in total. Recorded received stock is79, including71 FWF. Toilets remain254 planned,138 received and138 installed; WC09 remains8/12 installed. The existing six-panel supplier cost and customer installation charge are preserved; no second charge or contract remapping is added.

Validation: 54 isolated assertions plus one candidate company-model integration assertion, 18 strict patch/source-preservation checks, native setter capture of exactly three expected documents, unchanged financial/receipt/install/physical models, and phone supplier/drawer inspection. Passing the candidate HTML path to `test_quantity964.cjs` enables the additional integration assertion; running without that argument checks the 54 isolated assertions. The original native fixture and complete capture remain private. The setter was tested against a local capture only; production ownership recording and final publication belong to the release owner.

Final candidate READY TO UPLOAD: SHA-256 `82d23168b4df656016bc8be2e7da74e58ac09a585eaebca3418f87bc4656291f`,12,770,567bytes, exact live v9.63 base. Both desktop/phone22-route,seven-link and Back sweeps pass, with zero errors or writes. Seven final ownership checks pass. Both financial fixtures pass153 arithmetic checks,17 native ties and23 preservation checks; all15 financial models are identical to the fresh v9.63/native5164 baseline. Source independently reviewed, phone screenshots inspected. Production quantity ownership still awaits the authorised native save after publication.

LIVE9Oct2026at17:39AEST. READY sourcebb0d098e; guarded upload proves exact public candidate bytes. The authorised native ownership save subsequently changed5164→5167, exactly the expected loads/by/stamps documents. Fresh GET-only public verification confirms the six panels’ supplier, received/installed status, unchanged other items and identical money. See record_09Oct2026_wc09_pee_panels_subhired.
