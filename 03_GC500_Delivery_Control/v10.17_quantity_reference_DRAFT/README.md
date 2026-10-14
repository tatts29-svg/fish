# GC500 quantity and reference corrections — draft

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

Exact live base v10.16: 3cbfd0d5c9bd53f02d5a89b274e83ee0c2d2c8dc17b03da59b68cf3a3db8673c. Not ready to upload. The separately requested WC09 scope change requires the user's clarification of additional versus total quantity and must preserve the existing received equipment.
