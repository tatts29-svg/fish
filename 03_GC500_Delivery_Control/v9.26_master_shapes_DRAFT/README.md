# Master shapes in Arrange loads — v9.26 DRAFT

Author: Andrew Fisher

State: source frozen for root composition, not READY TO UPLOAD. All 42 source/model checks pass on a provisional v9.23/v9.24/v9.25 integration. The earlier real-page desktop and phone checks pass; the final compact single-card width change still needs the exact combined release visual check. Its attempted rerun stopped before Arrange loads because the shared record did not reach live within 60 seconds during the service connection interruption. No upload or operational record change. The guarded patch advances v9.25 → v9.26; root owns final release checks and publication.

Andrew requested the actual shapes from the master when choosing loads, including door sides, FWFs, accessible toilets and generators. White/yellow lines represent the water barriers. Waste tanks share their toilet block footprint and position underneath, grey and labelled. Truck loading direction can be chosen here using the existing loading-direction record.

Sets of more than four physical units use one native details fold with the total; small sets stay visible. A single unit retains a compact grid column instead of stretching its diagram and loading selector across the entire workspace. Panning and zooming reuse the selected unit content rather than rebuilding it every frame.

The native map, full daily load numbers, exact anchors, selection, order buttons and print models stay in place. Sourced vector outlines are added to the map and current physical units appear underneath the selected load. Loading choices use the existing `loading872Set` function exactly once; merely opening/selecting a load never writes. A truck's driver/passenger side is not a site compass bearing and is never inferred from a master-plan door.

## Evidence

- Frozen predecessor: commit `822b06a8ce52a860eccdc0ec0b5b37ef5d94859d`, `v9.15_master_shapes_DRAFT`; explicit full handover PR comment `6063856337`.
- Original master: D001-26003-03-MASTER.pdf, 2 Oct 2026 issue. SHA-256 `8753d875cf90682e09afefae8c774144d9e9725ece87f726707882fb3711c56d`. Private original `/workspace/private-v889-review/originals/D001-26003-03-MASTER.pdf` is not republished.
- `source/shapes_v915.json` is frozen drawing evidence. Its historic unit inventory is deliberately **not embedded or used**. It contains an outdated WC20 asset association that Andrew already corrected: 1327228 is a toilet; 1311341 is a waste tank. Current identities and item descriptions come exclusively from `gcUnits925`.
- `source/footprints_v915.json` preserves the catalogue/document citations and explicit model/size uncertainty from the frozen evidence. A standard footprint is never plotted as a confirmed master location or used as transport dimensions/mass.
- `source/verify_pdf926.py` freshly reads the original PDF and checks drawing sequence numbers, vertices, all door curves/leaves and barrier pieces. `source/pdf_check926.json` is that fresh read, not the predecessor's cached comparison.
- Four inset door symbols at T0258/T0266 contain two original PDF curves each. Both curves and every leaf segment are now preserved (`swing.arcs` and `swing.leaves`; singular compatibility fields hold the first original segment); the old helper simplified them to one. All 121 door symbols are tested against the source curves. FWF chevrons remain chevrons, not invented doors.

Map evidence uses the original sheet transform (2384 × 1684 pt; main +25.50,+0.12 pt and inset 0,+0.06 pt). Readable detail diagrams may fit a small panel; map overlays use a uniform native camera projection with no minimum-size enlargement. Tank geometry has no location offset. A label identifies the layer below the toilet block.

## Identity and uncertainty

`gcUnits925(a)` supplies only current `physical:true` rows with stable `id`, `ref`, `item`/`label`, optional `assetNo` and exact `loadingId`. The native booked asset from `dpLoads` is passed through, preserving split-load selection. An empty allocation must remain empty. Standard/planned quantity rows are not converted to physical inventory.

Only an exact adapter `loadingId` matching a current native `loading872Rows(a)` row is editable. Only numbered native unit rows are editable; generic item rows are not repeated as if they were separate physical units. No number/index or generic item-row guessing. Waste tanks never inherit a toilet's loading selector. Two owner identities sharing a legacy loading key cannot edit one another; that ambiguous key offers no selector. Unknown dimensions get an explicit unknown-size symbol.

Several same-kind units under one reference do not establish which numbered asset occupies which master outline. Those diagrams say “unit position to confirm”; they do not select an outline or door by array order. The master remains visible as reference context. A separately recorded moved pin does not inherit the old master footprint. Shared-ref split loads are deduplicated after prioritising the selected load, so selection colour remains correct.

## Public helpers

- `MasterShapes926`: readonly drawing evidence (`shape`, `layout`, `svg`, `doorEdges`, `footprint`, `meta`). `layout`/`svg` accept `components:[indices]` to select evidence directly. Snapshot `units()` is empty by design. No operational identity or transport specification is supplied.
- `Shapes926.unitModel(a, env)`: returns current physical rows with native loading row and drawing evidence. Tests supply an environment explicitly.
- `Shapes926.saveDoor(ref, unitId, side, expectedSide, env?)`: validates stable current identity, native loading ID, edit access, side whitelist and stale choice before invoking the native setter. Returns `{accepted, kept, reason?, unchanged?}`. Native `bump.kept === false` means pending; no whole-record rollback or second save.
- `Shapes926.panel(el, model, selected)` and `overlay(view, map, model, selected)`: called by two guarded native Arrange-load hooks.
- `Shapes926.overlayModels(model, selected, env)`: pure source-aware, selected-first geometry dedup, used by the overlay and tests.

The stylesheet only targets this addition under `#pane-timeline`. Readonly selectors retain legible text. Existing money, staffing, load order and transport data are untouched.

## Checks

- `node tests/test_shapes926.cjs <candidate>`: 42 source/model checks pass. 1,308 source vertices, 121 door symbols and 242 barrier pieces match the freshly read master within 0.001 pt (test threshold 0.01 pt). Covers stable IDs, WC20 correction, ambiguity, unknown sizes, readonly/stale saves, native persistence failure, split-load highlight and moved pin handling.
- Shared `toolchain/check_page.py` passes on the provisional combined v9.24/v9.25 candidate. The candidate is not a release.
- `tests/test_shapes_actual926.cjs`: previous GET-only real-page run passed at 1440 and 390 px with the real `gcUnits925` adapter: current CP1 unit, map overlays, readonly state, no horizontal overflow or view writes, six-unit closed/expandable fold, one captured native save/readback, persistence-failure feedback and stale-choice refusal. Zero page errors and zero operational requests. Evidence: `/workspace/private-shapes926/actual-units/results.json` and `shapes-1440.png` / `shapes-390.png`; both screenshots were inspected. This run predates the final auto-fill CSS and two small guards covered by the 42 pure checks.

Before release: rebuild on the final v9.23/v9.24/v9.25 chain, including the latest v9.25 accessory labels; rerun actual tests using real `gcUnits925`, inspect desktop and phone screenshots including the final compact single-card width, and run the standard final release sweeps. The provisional candidate is `/workspace/private-shapes926/units-candidate.html`, SHA-256 `fca262b2fa677c50cdba2114c60f366ed8ec000fa2c71675b659785e0e0d2206`. For the final v9.27 combined page, set `INTEGRATED_PAGE=1` on the pure test to skip only the standalone v9.25-to-v9.26 exact diff assertion; root separately checks the complete chain. Patch requires the integrated v9.25 footer and advances it to v9.26 exactly once; root's next patch advances the combined release to v9.27.
