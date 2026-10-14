# GC500 quantity and reference corrections — live

Author: Andrew Fisher

This release follows the full equipment, generator, map and reference recheck. It corrects confirmed disagreements between current stock, original receipts, planned work and future deliveries. The established design, original site history and agreed prices are retained. Raw source and financial evidence remains private. Root owns integration and publication after combined checks.

Confirmed corrections:

- Demob uses canonical references and current collection quantities. Two forklift aliases and a historical VMS relocation no longer create extra pickups; the moved board stays in its original receipt history.
- Inventory outstanding quantities follow received quantities, not current stock after moves or collections. Its dates and split delivery portions use the same supplier model as Build.
- Two existing source-only FWF requests are included once in Inventory and retain quantity and provenance on map cards. No native asset, receipt, navigation pin or asset number is invented.
- WB19 and WB20 remain scheduled workfronts, with their 64 reinstatement placements shown separately from new barrier supply. The imported schedule's peak is labelled as a source comparison rather than a live count.
- The Concert generator marker uses the published drawing's inverse transform, correcting the approximately 24-metre display offset while preserving the authorised GPS point and every other master position.
- Inventory A4 pages reserve room for reinstatement information and long destination details, without clipping cards or offering invented positions.
- Planned quantity edits retain the received/installed baseline and original evidence. Quantity and its baseline travel in one native document. Remaining units stay pending, and existing supplier ownership and actual hire cannot be promoted merely by changing an order quantity.

Implementation is split into independently checked component folders. The map machine publication changes exactly three files and retains the other 230 entries; the parent page and machine must be verified together. Source guards reject a changed base or repeated patch. Native record changes are separate from release publication.

The original-source audit is in `../audit_14Oct2026_inventory_recheck/`. The private Excel has Existing and Needs checking tabs. Unallocated source lines, unplaced equipment, area-level anchors and the unidentified historical completion record remain explicit reconciliation items; matching totals do not establish a surveyed location or physical identity.

Exact live base v10.16: 3cbfd0d5c9bd53f02d5a89b274e83ee0c2d2c8dc17b03da59b68cf3a3db8673c. Published 14 Oct 2026 at 18:34 AEST; fresh-public verification completed at 18:36 AEST. The separately requested WC09 scope change requires the user's clarification of additional versus total quantity and must preserve the existing received equipment.


Final implementation: `891ee555`. Candidate page: `d30833b57d59b2347c106193fa052edfda6c953801c513069af0ab6e05e00b5d` (15,275,158 bytes; 118 scripts). Candidate machine: `ca0b74da923e0955e6e4252a2dfe11bd076deec377585f3a1b48be0d6e5efdd0`.

The final quantity/work correction observes native audit stamps when an individual work tick is removed. Both complete desktop/phone navigation sweeps and all 85 quantity cases pass on that runtime. The final page differs from it by exactly one Inventory label fallback: a valid master point without landmark words says “Master-plan position” instead of “no location”. All financial, map, sync and navigation code is byte-identical. The affected Inventory suite and actual PDF export were rerun on the final page; WC46/WC55 QR destinations were decoded and match their unchanged master positions.

Verification: 12 combined source guards; 23 pure and 85 browser scope cases; 55 financial change cases and 72 unchanged-state parity checks across 20 domains; 27 native sync plus 18 financial sync checks; 29 Inventory browser, 24 fixtures and five patch guards; nine-page A4 export with phone/PDF visuals; 33 map checks each desktop and phone plus 15 model/seven manifest/three source guards; both 22-route/seven-link/Back sweeps; 18 final combined checks. The test guard rejected Google map session creation before transport; no application exceptions or operational test writes occurred. Native6075 and existing money remain unchanged. Upload and machine preparation dry runs pass. Raw financial evidence and source originals remain private.

WB19/WB20 later removals stay in Demob: the original schedule explicitly separates reinstatement and subsequent removal (2/6 November and 26/29 October). They are valid later work, not additional new barrier supply.


Live proof: the public page serves the exact reviewed `d30833b5…` bytes, and the registered map machine serves exact `ca0b74da…` with the other 230 files retained. Actual-public 18 combined, 33 phone-map and 72 financial parity checks pass with no local candidate interception. All 20 financial domains remain equal to the original v10.16/native6075 baseline; no operational record changed. Root owns this verified publication. Future drafts must rebuild from this new page and retain the current map manifest. WC09 remains awaiting the total-versus-additional answer; no planned quantity or new receipt has been entered.
