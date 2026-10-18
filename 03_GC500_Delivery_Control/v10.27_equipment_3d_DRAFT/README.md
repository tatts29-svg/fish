Author: Andrew Fisher

# v10.27 — equipment on the 3D map

READY TO UPLOAD — implementation `d9afa6a2`. Final checks passed. This release follows Andrew's approved Gate 6 example and his extension, “Approved for all”. It preserves the established GC500 appearance and the master/confirmed updated layout, including the revised Gate 6 compound supplied on 15 October.

The 3D map shows recognisable equipment on the existing recorded footprints. Select an item to see its reference, quantity, equipment descriptions, supplier and explicit completion status from the same shared record used elsewhere. Details opens the existing reference drawer; View photos opens the existing grouped photographs when present. Source and illustrative-shape information sits under More info. Closing the card, changing views and refreshing must preserve the user's navigation choices.

## What changes

- Read-only canonical adapter: 149 mapped references in the checked record, with detailed snapshots bounded to nearby/selected references.
- Lightweight local GLB geometry for buildings, containers, generators, FWF, accessible toilets, pee panels, toilet blocks, light towers and water barriers. Only supported equipment with established positions receives a model.
- Exact-family component matching: each drawn footprint is consumed once. Recorded quantities remain authoritative. Extra units without individual positions stay in the full quantity and explanation; they are not placed at invented coordinates.
- Selected footprint glow, clear original model materials, reference quantities and a clear complete/not-complete badge. Reduced-motion preference keeps the selection solid.
- Gate 6 shortcut, close-up search framing, model visibility toggle and zoom buttons. A selected item with a known entrance is framed at a three-quarter angle from that side; phone framing keeps it above the information card.
- Open-door display follows explicit master door bearings/edges. Unknown door sides are not invented. Open leaves indicate entry direction, not actual open/closed site status. Where a source doorway must be adapted to fit an illustrative body, More info says so.
- More info shows recorded dimensions and verified per-unit weight when available; guide examples are not promoted into actual measurements. A reproduced `returnJSON.stringify` typo in the existing verified-specification identity helper is corrected to `return JSON.stringify`.
- Stable selected reference, More info, card scroll, camera and terrain height across routine refresh. Nearby models are bounded; distant/unpositioned items retain normal pins.

The inspected record produces 124 valid model groups from 149 mapped references, with no geometry/count errors. Area markers remain area markers. At WC51 the seven units are six FWF and one accessible toilet. At WC09 all 18 listed items remain visible in the record; the drawing establishes positions for four FWF, six pee panels and two blocks, so the additional six FWF are not given fabricated individual positions.

## Accuracy boundary

Coordinates and confirmed updated footprints come from the existing master/site records. Models are illustrative equipment shapes, not surveyed CAD or a loading guide. Recorded door side is shown where explicit source evidence exists; other fittings remain illustrative. Known dimensions are used; unrecorded heights and fittings use nominal model dimensions. The source imagery retains its own resolution and photogrammetry limitations. Desktop/mobile emulation is tested; this is not a claim of zero latency on every device or network.

This feature sends no operational writes. It does not change rates, quantities, financial calculations, asset identities, receipt/completion evidence or map positions. Removing the injected adapter, reverting the footer and reversing the single identity-helper spacing correction recovers the exact live base page byte for byte.

Final page: `39e2bec4595d018a36c2ded5b2afa33b1bda4b0dc07e88606cfbbd36fbc3560b` (17,787,588 bytes). Final retained machine: `86eb69168f5e08b369ff1a41758140fabf36fc28fcc81fb705605322b128fcc3` (236 files).

## Source and publication

- Starting repository source: `580fae51`; latest shared board reconciled from `46c3ac3c` (its older duplicate v10.26 READY line is superseded by the 17:05 record6562 rebuild).
- Live page base: `66878d12b8f4a98c177b3bf07f30efcce501da46f56b3244b92da94e458b320f` (v10.25).
- Machine base: `eb8a01ffa79dc336057b2b369a6500344058e9a5f4635205d0fa1dbe9ef3e0c2` (233 files).
- Page patch: `patch_v1027.py`; uses the shared build/check/upload toolchain and an exact base guard.
- Machine preparation: `prepare_machine1027.py`; three exact-source replacements and three new modules. `publish_machine1027.py` retains all 230 other files unchanged, producing 236 total. It validates hashes, sizes, types and the current manifest again immediately before registration. Dry run sends no writes.
- The v10.26 financial/source and milestone changes remain separate. Its owner must rebase from the new live page before publication if this release goes first.

Raw records, original customer material, full screenshots and private test snapshots remain outside Git. Repository evidence contains only release identities, check summaries and synthetic fixtures.

## Reproduction

From `03_GC500_Delivery_Control`:

```sh
bash toolchain/build.sh v10.27 v10.27_equipment_3d_DRAFT/patch_v1027.py
python3 v10.27_equipment_3d_DRAFT/prepare_machine1027.py /private/current-machine /private/candidate-machine
node v10.27_equipment_3d_DRAFT/tests/test_geometry1027.cjs
node v10.27_equipment_3d_DRAFT/tests/test_layout1027.cjs
node v10.27_equipment_3d_DRAFT/tests/test_viewer1027.cjs
node v10.27_equipment_3d_DRAFT/tests/test_navigation1027.cjs
python3 -m unittest discover -s v10.27_equipment_3d_DRAFT/tests -p test_publish_machine1027.py
```

The browser regression accepts PAGE, MAP_ROOT, OUT and MOB=1, and uses `release_review1021/readonly1021.cjs` to block every operational write. Run the standard desktop and phone navigation sweeps through the same wrapper. Final focused checks: 149 pass (49 geometry, 28 layout, 32 viewer, 6 height, 5 navigation, 17 publisher, 12 adapter specifications). Both final-page standard sweeps pass all 24 tabs and seven deep links with zero application errors or operational writes. Final affected phone checks pass 33/33, with the actual phone screenshot inspected. Actual-public desktop verification follows upload. The current shared sweep contains 24 tabs (including Event nights and VMS), so this release wrapper validates all 24 rather than the older 22-tab count.
