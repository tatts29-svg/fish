# GC500 quantities, equipment and map recheck — in progress

Author: Andrew Fisher

Andrew requests a full recheck of quantities, all equipment, generators, maps and references. Compare current onsite truth across the shared record, delivery/installation history, current stock, original source scopes and map readers. Counts of units, panels and metres remain separate. Recorded moves are not additional equipment; source-only requests are not confirmed arrivals.

Starting source: 9f042475. Exact live v10.16 SHA256: 3cbfd0d5c9bd53f02d5a89b274e83ee0c2d2c8dc17b03da59b68cf3a3db8673c. All service checks are GET-only. Raw source files and detailed reconciliations remain private. Root owns v10.17 corrections and final publication; the release remains DRAFT while combined tests run.

Verified coverage on native version 6075:

- 182 register references; 173 active canonical operational references after cancellations, aliases and relocation records are separated.
- 182 active item lines, 39 primary Inventory categories, 44 programme days and 55 supplier rows.
- All 31 dated supplier receipt rows (143 equipment units) and all 25 outstanding rows (52 FWF) reconcile to the daily Build runs.
- 101 accessory rows containing 121 pieces, including 76 numbered pieces, remain separate from primary equipment quantities.
- Generator register: 16 requested, nine arrived and seven expected. The financial forecast additionally contains two unplaced contract-only spares; 18 is not the onsite or operational register count.
- All 202 source reference rows reconcile to live records, reachable context or explicit deletion. No unidentified historical delivery is turned into a new asset.
- Current parent-to-map quantity and status fields, all published point transforms, reference search and exceptional routes checked on desktop and phone. Exact GPS points, plan-tag positions, representative area anchors and unplaced requests retain distinct meanings.

Confirmed corrections being tested:

- Collection plans duplicate two forklift aliases and a historical VMS relocation, and retain a moved VMS at its old pickup quantity.
- Inventory treats a moved or collected unit as still awaiting delivery because it subtracts current stock instead of historical receipt quantities.
- Two known source-only supplier requests are omitted from Inventory and lose their quantity/provenance in map cards.
- Two barrier reinstatement workfronts count 64 repeat placements as new supply.
- Concert generator coordinates are saved correctly, but the drawing projection offsets the displayed marker by approximately 24 metres.

Andrew has separately requested six FWF added back to WC09. Four FWF are already received there. Whether six means additional units or the new total remains a pending clarification; no receipt, identity, completion or quantity is being invented while it is unresolved.

Original-source differences are recorded separately in the source coverage review. Source requests and contracts can fill gaps, but conflicting dates, identities, quantities or prices do not overwrite confirmed onsite records. The workbook distinguishes existing records from specific entries needing reconciliation.

The audit will report enumerated coverage, confirmed defects, corrections and exact unresolved source/location cases. Matching arithmetic cannot establish a surveyed location or missing physical asset identity.
