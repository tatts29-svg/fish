# Units and sub-hire review — 9 Oct 2026

Author: Andrew Fisher

State: source and live-data audit; real-page phone mock-up. No production page, operational record or financial figure has been changed. This document deliberately contains no monetary figures. Exact costs and evidence are in the private audit JSON.

## Verified baseline

- Public v9.18, SHA-256 `c547a6debe1dea9009b50466d3c1028ec9c3a800e6c591ea258b61490b14b762`, 11,605,879 bytes.
- Read-only browser snapshot: record 4599, 9 Oct 2026 AEST. All 17 financial and transport reconciliation tests passed; zero page errors and zero attempted writes.
- Claude source read: `bdeb207f4d0220b38e131bd170f8530826321d53`; AGENTS, both boards, unit_slots_design_08Oct2026 SURVEY/DESIGN/REVIEW, part E source, approved quote decisions and original-source pointers read.
- Decisions: PR #1 comments 6061302551, 6061535340 and 6061656244. These carry Andrew's per-unit requirement and approved quote basis. Coates labour on Event Portables gear remains chargeable to the V8s. The new layout remains a preview for Andrew's required review.

## Confirmed defects and gaps

1. WC09's two Coates block numbers still auto-deal to Pee Panel. The live split is FWF none, Pee Panel 1268858/1311146, Toilet Block 6m none. Claude's part E fixes this exact wrong assignment; no operational migration is necessary for that reader correction. The two incorrectly entered air-conditioner records are already taken off and must remain visible in history, never silently reactivated or deleted.
2. WC31 has Event Portables fleet 12 only. Its supplied record still says one 16Pan block and zero accessible toilets; the Coates accessible asset 1317645 Andrew supplied is not on the record. The desired breakdown is two supplier blocks and one Coates accessible toilet, not a reference-wide supplier switch. The second supplier block number is missing. Per-unit display may show Andrew's report as pending recording; it must not silently overwrite the shared counts.
3. WC09 has four photo links: two explicitly assigned to asset 1268858 and two reference-wide. Asset 1311146 has no explicitly assigned photo. The two general photos must stay unassigned until someone identifies their unit. WC31 has no photo links.
4. WC09's six pee panels and four FWF toilets have no individual supplier fleet numbers recorded. Do not recycle the two block assets, or use array position as physical identity.
5. Existing rehire classification assumes every contract toilet line is Event Portables, including 38 Coates-numbered contract lines. It is unsuitable as the new company inventory's ownership source; Andrew explicitly identifies the WC31 accessible unit as Coates-owned. Owning company and costing branch are separate fields.
6. Current transport forecast is reference-wide. The single WC31 accessible-toilet carrier event, docket 26115307, receives the whole reference's card forecast including both supplier 16Pan units. The WC09 two-block SFL event, with two separate dockets 26115312 and 26115316, receives the FWF-derived card forecast; the ambiguous block card contributes none. The figures reconcile internally but the scope pairing is wrong. Supplier delivery/pickup is also present in approved quote totals, so coverage must be resolved before adding any separate supplier transport amount.
7. Q6845 transcription covers one 16Pan block; Andrew now requires two at WC31. The second unit's inclusion/coverage needs explicit evidence. Show quote-covered unit rates where present, but do not pretend the approved quantity is two or silently increase the approved supplier total.
8. PremAir fleet 120T / registration V14221 is Andrew's VMS10. Its contract's costing branch is STPS; the sales-analysis code contains KINP-SUB, which must not be used to override the contract branch. The supplier cost original is still absent. Current contract data also names other supplier codes; the company area must leave those records findable, not hide them when showing Event Portables and PremAir.

## Quote source status

The live page embeds detailed transcriptions of Q6844–Q6847, each dated 28 Jul 2026, with the original PDF SHA-256 and itemised quantities, rates, periods and delivery/pickup. The four quotes were approved on Andrew's word, with final total subject to change. This is usable evidence of the current model's basis, but not a new original-source review.

No original Q6844–Q6847 PDF was found in current/Claude Git trees, accessible private-file inventory, attachment filename search or the live 401-file registry. None of the registry's SHA-256 values matches the four recorded original quote hashes. Parent was asked to request the original PDFs/current revisions from Claude's private authorised handover. Do not ask Andrew to repeat the already settled quote basis. No 2025 contract/invoice has been substituted.

Period matters: Q6846's drinking-water tank transcription is one unit for six weeks, not a one-off unit price. All four quote subtotals, transport, GST and totals reconcile when this period is respected. The current embedded Q6846 has dates; the 1 Oct audit's old undated finding is historical and must not be repeated as current.

## Required integration order and boundaries

- Build from whichever page is actually live; do not publish a stale candidate.
- v9.09 parts: crew → broadcast → split → lines (part E) → vms → truckflow (part F). Part E is the unit-number reader dependency; it also preserves the existing item-level door-side choice when the blocks become separate number rows.
- v9.14 fire extinguishers changes assetTotal/labourMoney/labourPlan; do not put its extinguisher quantities back into the new per-unit labour slot model.
- v9.13 VMS register supplies owning company, fleet and registration; preserve board identities and T0103/T0001 movement. Integrate the later patch against the earlier patch, not parallel replacement strings.
- v9.15 remains Claude-owned. Its shapes and door choice use loading872Set; preserve those existing IDs and choices.
- Keep one document per photograph; retain each existing photo service ID and current per-asset associations.
- No new labour tick writes to `supplied`. Claude's original slot design has rejected stale-phone/multi-phone risks. A line must remain consistently number-based or slot-based once work is recorded; do not switch key families or spread whole-reference ticks from a stale client.
- Current units are whole-reference documents; sameUnit keys by number, or label when missing. That cannot safely distinguish two same-label unnumbered supplier units or identical fleet numbers from different suppliers. Introduce stable per-unit identity with an explicit, reversible alias strategy for old asset keys; audit backend/sync/export/import support before choosing the new document collection.
- Keep explicit unit fields: reference, description/line, owning company, supplier fleet or Coates number, costing branch, quote/line/period, existing photos, work identity, loading identity. Unknown identity stays unknown.
- The generic company list excludes Advanced Fencing but retains a direct route to the existing Fencing area. Other recorded suppliers remain reachable.

## Next implementation steps

1. Show the real-page phone previews and obtain Andrew's layout decision (AGENTS requirement). The description selector keeps repeated units compact; each unit has its own details and photos.
2. Finish original quote review and confirm whether the additional 16Pan has revised quantity/coverage. Preserve approved totals until supported corrections are itemised.
3. Rebuild/retest the transferred part E and adjoining integration on the current live base, preserving fire/VMS/shapes releases.
4. Implement per-unit adapters and company view; prototype stable identity and document persistence before any data migration. Fix line/load-level transport coverage and distinguish own hire from rehire under the explicit per-unit ownership.
5. Record every intended financial delta by cause. Run frozen-record before/after money comparison plus the 17 tie-outs; test two stale clients, quantity reduction, asset renumbering/removal, unknown supplier IDs, existing photos and door sides.
6. Correct WC31's operational record only through approved native actions with a backup and fresh read. No correction has been applied by this audit.

## Private deliverables

- `audit-live.json`: full current source/model/record snapshot, including detailed figures; private only.
- `audit-summary.json`: current identity and reconciliation findings.
- `files-live.json`: GET-only file registry evidence.
- `mockup.js`, `mockup.cjs`: reversible browser-only rendering of the proposed layout on the exact live page, no save path.
- `mock-*.png`: phone views for WC31 blocks, accessible toilet, WC09 blocks/panels/FWF, and company area.
- `mockup-result.json`: overflow, state preservation and no-write checks.

## Validation complete

The five phone description views fit a 390 px viewport with no horizontal overflow. Existing photos for WC09 asset 1268858 are visible and stay attached to that asset. Both supplier screens were visually inspected. The in-memory shared record is byte-identical before and after the mock-up, with zero page errors and zero attempted writes. Final renderer SHA-256: `f7da597c0759eda74c8896ababa9732d1799d93a9311899b9e5dbd415ab506cb`. These checks do not validate a production implementation or authorise a migration.

To recreate: set `GC500_REVIEW_PRIVATE_DIR` to a private output folder containing the current `page-live.html`; set `CHROMIUM_PATH` and `NODE_PATH` for the shared harness, then run `preview.cjs` under the browser lock. Output screenshots and figures remain outside Git.
