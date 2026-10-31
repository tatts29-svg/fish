# Generator inventory and source reconciliation

Author: Andrew Fisher

Read-only recheck of the actual public v10.16 page, SHA256 `3cbfd0d5c9bd53f02d5a89b274e83ee0c2d2c8dc17b03da59b68cf3a3db8673c`, native version 6075. No application edits, source imports, rate changes or native writes. Detailed original cells, identities, charges and source comparisons remain private.

The operational register contains **16 requested generators across 15 active references: nine onsite and seven still expected**. Every onsite generator is marked complete, reaches the generator hire model and has a current map point. The cancelled earlier generator remains excluded. The 14 numbered/grouped schedule references plus two original unreferenced schedule rows are all accounted for, including that cancellation.

The financial forecast contains **18 units across 17 groups** because it also includes two contract-only spare generators. Those two are not confirmed delivered or positioned stock. Do not use the financial count as the physical inventory total. All 18 existing generator contract lines contribute to Costs and P&L once: isolated zero-rate probes remove exactly each line's actual and forecast contribution while leaving Direct costs unchanged.

The original rate card and latest supplied Baseplan workbook were reopened. Eighty-four reconciliation checks and 93 browser propagation controls pass. These cover requested-size pricing, source precision, contract-line rounding, all arrival dates in AEST, quantities, no repeated confirmed identity, cancellations, source joins, and ledger propagation. The browser used strict GET-only access; no application errors or operational writes. An initial test adapter used the wrong shape for the embedded plant-lines object; it was corrected to read its `lines` array before the successful final run. This was a test issue, not an application defect.

There are six confirmed physical generator identities for the nine arrived units. The generator model deliberately withholds three source-only identities until confirmed. All nine units in the latest Baseplan's Delivered rows are already represented in the onsite quantity, with the Concert labels treated as the existing two-unit group rather than extra generators. The Concert pair retains the user's exact supplied map point.

The separate map review subsequently found that the Concert explorer marker was displayed about 24 metres away from that correctly stored geographic point. The generator checks above verify stored/navigation coordinates, not the drawing transform. The bounded v10.17 map correction addresses that projection without changing the user's pin, generator quantities or charges.

Source gaps remain separate from arithmetic defects:

- GN06 has two possible source assignments, one of which is also repeated exactly in the workbook. Replacement versus extra scope is unresolved; the page does not double-charge the repeated row.
- GN10's pending source substitution differs from the requested size. Current requested-size charging remains intact; no new plant number is confirmed.
- The latest workbook removes one spare scope and changes the other spare's identity/date. Neither source change is sufficient to invent a delivery, location or cancellation.
- GN13's physical replacement is already recorded correctly; its older embedded contract identity remains a source reconciliation item, with quantity and requested-size hire counted once.
- GN25 and the trailer spare have written destinations but no verified master-plan coordinate. The two contract-only spares have no placed reference. No coordinate is invented.
- Existing commercial gaps remain visible: POA transport for the large generator and the Concert cable hire basis. This recheck is not a claim that those missing inputs are priced.

No new generator arithmetic or quantity defect was confirmed. A useful improvement would be search aliases for the two newer Concert source labels, opening the existing two-unit reference without changing stock or claiming separate verified positions.

`snapshot.cjs` captures actual-public models. `ledger_probe.cjs` exercises each current source line in memory and restores the whole record. `extract_sources.py` reads caller-provided original workbooks into a private output folder. `reconcile.py` checks those private outputs and the snapshots, independently recalculating every contract line from the original card. Root owns combined findings and any further corrective scope.
