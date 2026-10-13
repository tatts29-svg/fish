# v10.06 — shared asset records, daily runs and charges

Author: Andrew Fisher

Implementation frozen; final integrated release checks in progress. Not live.

Base v10.05 SHA256 `65bba5cb7477816d587cb72025ff256f2eb8c2dbc65eb4087dccc5ad49f4622a`. Final candidate `fc7995c79cd5df18c47de4f2c05f1499382ba0313ae8b27dd23d783606a59068`,15,031,668bytes,94inline scripts.

One supplier-aware asset entry form prevents duplicate numbers, supports reversible removal and shows native Save acknowledgement. Searching an asset number or reference opens the same shared record; charge details show quantities, arrival, hire windows and branch. Background refresh preserves unsaved fields and rejects stale submissions. Fields remain readable in both themes.

Build, Today and Event Portables use one receipt and remaining-delivery model: completed receipts remain on their actual day. The reviewed13October snapshot has23FWF received plus1remaining; later daily balances24/24/24/3. Supplier stock112FWF received,76remaining,6unallocated. Leading zeroes and genuine cross-company identities remain distinct.

Applicable charges for arrived equipment feed Costs, P&L, branch totals and October preparation once. Pending quantities remain forecast. Stairs stay manual and support partial quantities. Future physical demob/pickup are not marked complete by charge inclusion. GN20 installation and demob use the existing combined labour amount, split once; its customer delivery/pickup rates remain editable POA. Missing transport rates and coverage remain explicit.

Generator hire remains the published card standby rate from confirmed delivery through22October, full daily rate23–25October, none thereafter. Commercial off-hire is consistently25October; physical demob dates remain separately labelled. NoBOQrate or damage-waiver increase is applied. The13October BOQ is reviewed separately, not imported.

Kyle’s authorised return from12October and race-night roster use native records and preserve unknown hours. Missing-hour records are now counted in Costs/P&L/Finance completeness rather than silently disappearing. No hours or wage amounts are invented.

Operational corrections are separate from the release: two confirmed ownership duplicates,10confirmed Event Portables receipt references and Kyle’s authorised roster changes. They require fresh private backups, named native actions, exact payload gates and full fresh readback. WC69’s distinct extra0689 remains a review item; it is not removed as a duplicate.

Source, pure checks and scoped read-only browser checks are complete. Final candidate desktop/phone financial, identity, save, run/PDF, navigation and native-practice checks are running. Root owns integration/publication with scoped implementation and independent financial/date/runner reviews. Detailed snapshots, originals and phone images stay outside Git.
