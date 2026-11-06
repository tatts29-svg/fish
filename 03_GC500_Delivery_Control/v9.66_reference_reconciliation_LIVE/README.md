Author: Andrew Fisher

LIVE — 9 Oct 2026 at 18:21 AEST, combined v9.65–v9.69. READY source `706c259d`; exact public SHA-256 `a271015a9cf6d099b1665d3bcef71bb6fe5b2671d7081739c91b0f04d52205b5`, 12,815,042 bytes. Fresh actual-public verification passed 9/9; native record 5167 remained unchanged. Final desktop/phone navigation and 20 phone interactions passed. Combined evidence is in `v9.69_item_ownership_labels_LIVE/evidence/`.

Author: Andrew Fisher

# v9.66 — Existing references and schedule links

LIVE as part of the combined v9.65–v9.69 release. Source remains frozen. This module makes no native record changes.

The Timeline labelled 31 schedule rows as having no reference even though 22 already had item records and four were already linked removal movements. Opening the old action could create a second item. This release follows the existing record, keeps the source row as evidence, and leaves five additional tasks visible with their own T references. It also stops Equipment saying an item is absent from the drawing when it has a verified master-plan or site position.

Default Timeline information stays concise. Source relationships remain in closed disclosure rows. Receipts, installations, item quantities, map positions, commercial records and charges do not change.

## Evidence reviewed

- Original `GC500 26' Schedule (7).xlsx`, SHA-256 `485f5d885b88d836b63e85ad4062474a95a484022386efec7be62429f958edac`, reviewed directly from the uploaded XLSX with openpyxl. Relevant original cells: Week 4 row 15 WC-TV; Week 5 rows 15/19–23; Week 2 rows 4/22; Week 1 rows 8/12/13; Event Week rows 2/28/29/32/39–41/45/46/51; Demob Week 3 rows 5–7/10–12.
- Original `P003-26003-01 Programme - Coates Inf V1 14.8.26 (2).xlsx`, SHA-256 `fc39ba08ded1f6c6d4823b755b44d1463cf72262829b11dce4fa65f87506bcb7`. Base information rows 128 and 154 name GN25 and WC85 equipment, but do not supply their destinations.
- Native record 5164, exact v9.63 page; existing stable item keys, saved source-row assignments, recorded map positions, equipment types and source-paired demob events.
- Original master D001-26003-03 PDF text and the existing reviewed master-position data. No new point or GN/WC number is inferred from a nearby label.
- Original 17-page `VMS001-26003-01_GC500_COATES_VMS_LOCATIONS.pdf`, SHA-256 `9ef1527d1fd9c6c7ea70dd3db3ced96784b0c1b32eba0df2aa3fb5ecd61be382`, and native D025 asset-to-callout assignments. The existing conflict about which plan governs is preserved; this release changes no VMS pin.

## Reconciliation

There are 176 active item records, all with non-empty keys. The 34 active source rows in this audit resolve to 29 item links and five additional schedule tasks. Three existing assigned source rows are preserved in the linked-source view rather than omitted. Among the old 31 missing-reference entries, 26 already have valid links:

| Existing source | Linked record | Basis |
|---|---|---|
| T0243 | T0243 · WC-TV | Original schedule names WC-TV; existing master position is the drawn toilet block |
| T0224 | T0023 | Existing Event Container placement/removal relationship |
| T0227 | FL01 / source T0003 | Existing 5 t forklift removal and saved source-row alias |
| T0228 | FL02 / source T0004 | Existing 2.5 t forklift removal and saved source-row alias |
| T0229 | T0005 | Existing Macintosh forklift placement/removal relationship |
| Other 24 source rows | Their current item reference | Existing item record, including already assigned source rows |

Named locations such as S18, Supply, Helen Park, OP42 and Macintosh are retained as named areas; the pit-lane reporting point is never converted into a confirmed installation position. Source references are not renamed, so photos, labour, deliveries and contracts continue using their existing keys.

Five source-only tasks remain visible: accreditation T0234, office/lunchroom demob T0222/T0223, and WAU fridge/air conditioning T0273/T0274. The demob source says 6 m while the Coates office/lunchroom opening rows say 4.8 m; the task names alone are not enough to merge those records. The WAU air conditioning retains its source SUB-HIRED marker. Existing moved/off schedule history remains available in its closed disclosure.

T0001 retains its seven current board references VMS01/02/03/04/06/07/08. Its moved board is not repeated. T0103 retains the confirmed VMS09 and VMS10 board references. These known references are not presented as missing destinations or converted into exact coordinates. Existing quantities remain unchanged.

## Genuine remaining destination gaps

The shared projection exposes 14 tasks/items requiring destination or original-item evidence:

- Five VMS groups T0128/T0158/T0159/T0169/T0170 have no exact board-to-load assignment. Numbered plan locations do not establish which future load each board belongs to.
- Coates office T0021 has no site destination; its source location cell describes the office size.
- Accreditation T0234 has no collection point.
- Spare generator T0268 has no recorded storage point.
- Demob T0222/T0223 lack an exact link to their original units.
- WAU T0273/T0274 source location cells contain product names, not destinations.
- GN25 and WC85 have equipment descriptions but no named destination.

All these records already have references. These remaining facts are not fabricated or hidden to obtain a zero count.

Separately, the Event Portables supplier plan has allowances for 4 FWF, 4 accessible toilets and 3 VIP combo blocks without a WC allocation. These are not counted as additional missing physical assets. The 91 identified supplier units all have a reference, including spare 0164 recorded at Pit Lane. Commercial contract matching is a different question: 174 source contract lines lack a unique traditional match (170 unmatched / 4 ambiguous), 131 of which already print reference strings. Miscellaneous charges are not additional physical equipment, and their classification is not changed here.

## Checks so far

- 17 focused source/link tests pass: existing references; four demob links; WC-TV; named-area versus exact-position separation; known board references versus unassigned VMS loads; genuine storage gaps; duplicate claims; invalid or deleted matches; future saved reference; Timeline item-link navigation binding.
- Run `node test_references966.cjs` from this folder. The checked-in fixture contains only relationship fields; coordinates and board asset identities are synthetic, and private native documents and financial data are excluded.
- GET-only structural browser check: five additional tasks, zero page errors; Today, Equipment Inventory, Transport, Event Portables, all contract rows and source arrays exactly unchanged versus v9.63 on native record 5164. This structural test precedes the final VMS and moved-history additions and is not the final v9.65 integration build.
- Final integration, phone inspection and publication verification remain with the combined release owner.

## Combined release acceptance

Author: Andrew Fisher

READY TO UPLOAD — combined v9.65–v9.69, 9 Oct 2026. Final SHA-256 `a271015a9cf6d099b1665d3bcef71bb6fe5b2671d7081739c91b0f04d52205b5`, 12,815,042 bytes; exact live v9.64 base `82d23168b4df656016bc8be2e7da74e58ac09a585eaebca3418f87bc4656291f`. All five sources frozen and independently reviewed. Desktop and phone each pass 22 routes, seven deep links and Back with zero errors; final phone journey passes 20 checks and screenshots are inspected. Known sizes/weights stay visible; supporting detail uses closed More info disclosures. Item photos/notes and mixed supplier labels preserve item scope. 34 source rows resolve to 29 existing links and five additional tasks; 14 genuine destination/association facts remain explicitly identified. Seven stale Questions prompts closed; 13 open, five pending, 40 answered/history. Native record 5167 unchanged; Today 254 planned/138 received/138 installed/116 without recorded installation. Financial 153 invariants, 17 native ties and 23 preservation checks pass; all 15 models unchanged. The strict phone fixture intentionally blocked one external Google tile-session POST; both standard sweeps passed actual map loading. No operational writes. The release owner owns guarded upload and fresh actual-public proof. Superseded 7ad8abcb candidate was not published.
