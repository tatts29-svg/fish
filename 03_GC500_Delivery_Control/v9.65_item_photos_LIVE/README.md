Author: Andrew Fisher

LIVE — 9 Oct 2026 at 18:21 AEST, combined v9.65–v9.69. READY source `706c259d`; exact public SHA-256 `a271015a9cf6d099b1665d3bcef71bb6fe5b2671d7081739c91b0f04d52205b5`, 12,815,042 bytes. Fresh actual-public verification passed 9/9; native record 5167 remained unchanged. Final desktop/phone navigation and 20 phone interactions passed. Combined evidence is in `v9.69_item_ownership_labels_LIVE/evidence/`.

# v9.65 — selected item details and photographs — LIVE

Author: Andrew Fisher

The selected description now controls the drawer header, owner and asset numbers. WC09 Pee Panels and WC31 Event Portables blocks no longer inherit the Coates blocks’ numbers or branch. Physical-item cards retain their existing editor and photograph controls.

Known quantity-only groups (WC09 Pee Panels, TL2 water-filled barriers and Trakmat) receive the same photo-card layout, with quantity and owner data. Photo links use an explicit item-group association and the existing per-photo outbox, upload and link pipeline. They create no fleet identities or map pins. The reviewed legacy Trakmat product-code photo associations remain visible and retain their original links.

An optional site note sits inside each quantity group’s closed Item details section. It saves one namespaced `loads` record with the existing recorder/stamp/save workflow. It cannot change ownership, receipt, installation, quantity, dimensions or charges. The form checks the current item and note versions before saving; opening a card creates no record. Technical loading data remains read-only.

The initial view shows concise item data. Whole-location totals, sources and supplier quote explanations remain in closed details. Sub-hire is labelled on the selected item; mixed locations do not gain a whole-location supplier flag.

Build from exact live v9.64 SHA `82d23168b4df656016bc8be2e7da74e58ac09a585eaebca3418f87bc4656291f` using `patch_v965.py`. It rejects a different predecessor or repeat application and writes only after every guarded replacement succeeds. Marker for v9.66: `const ItemPhotos965 =`; footer v9.65.

Validation:

- `test_items965.cjs`: 35 focused checks for item/photo isolation, pending slots, stale owner/quantity/identity changes, cancellation, replacements, read-only controls, legacy aliases and guarded per-item notes.
- `test_patch965.py`: five predecessor, atomicity and unchanged native financial/count/upload boundary checks.
- `test_native965.cjs`: native record 5167 in a local fixture, nine item selections, real image-processing/outbox capture, selector-switch and stale-owner races, physical photo regression, and actual note save/reopen through locally captured `loads`, `stamps` and `by` documents. Network writes are blocked.
- Page parser and secret-count comparison against the predecessor.

Browser tests use the shared `/tmp/gc500-browser.lock`. Supply candidate, native API fixture and a private output folder as arguments to `test_native965.cjs`; defaults point to the private v9.65 evidence folder. Native fixtures, full DOM captures and photographs remain outside the repository. Root owns final combined checks and publication.

## Combined release acceptance

Author: Andrew Fisher

READY TO UPLOAD — combined v9.65–v9.69, 9 Oct 2026. Final SHA-256 `a271015a9cf6d099b1665d3bcef71bb6fe5b2671d7081739c91b0f04d52205b5`, 12,815,042 bytes; exact live v9.64 base `82d23168b4df656016bc8be2e7da74e58ac09a585eaebca3418f87bc4656291f`. All five sources frozen and independently reviewed. Desktop and phone each pass 22 routes, seven deep links and Back with zero errors; final phone journey passes 20 checks and screenshots are inspected. Known sizes/weights stay visible; supporting detail uses closed More info disclosures. Item photos/notes and mixed supplier labels preserve item scope. 34 source rows resolve to 29 existing links and five additional tasks; 14 genuine destination/association facts remain explicitly identified. Seven stale Questions prompts closed; 13 open, five pending, 40 answered/history. Native record 5167 unchanged; Today 254 planned/138 received/138 installed/116 without recorded installation. Financial 153 invariants, 17 native ties and 23 preservation checks pass; all 15 models unchanged. The strict phone fixture intentionally blocked one external Google tile-session POST; both standard sweeps passed actual map loading. No operational writes. The release owner owns guarded upload and fresh actual-public proof. Superseded 7ad8abcb candidate was not published.
