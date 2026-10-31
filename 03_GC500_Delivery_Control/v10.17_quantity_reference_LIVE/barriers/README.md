# Bounded water-barrier reinstatement classification

Author: Andrew Fisher · 14 Oct 2026 · Codex · implementation ready for combined testing

`patch_barriers1017.py` adds a read-only classifier for WB19/WB20 and labels the old 265-unit peak as an imported source-schedule comparison. Inventory integration is owned by the `inventory` component; this component does not change its anchors or any native records. All 15 workfronts, schedule rows, quantities, current receipts and map locations stay in the operational model.

## Original evidence read directly

The attached **GC500 26' Schedule (8).xlsx**, SHA256 `df43938f8a2de8fbcdfcd478ebdd4021ae512eca5787786f525498d322cb4bb0`:

- `Demob Week 1`, row 2: WB20 / Gold Coast Highway (Turn 2) / TL2 / 30 / 26 Oct 2026 / **G2 Reinstate**. The corresponding WB03 initial installation is Week 5 row 43, followed by removal in Event Week row 31.
- `Demob Week 2`, row 2: WB19 / S08 pedestrian pathway along Main Beach Parade / TL2 / 34 / 2 Nov 2026 / **G2 Reinstate**. The corresponding WB02 initial installation is Week 4 row 6, followed by removal in Week 3 row 2.

The subsequently supplied **GC500 26' Schedule (6).xlsx**, SHA256 `98b6db43c734fc0d6ea4c02efccc1c5b2b1071f83b6a85b33df07843b9183fe4`, was also read directly and agrees on those operations, dates, quantities and locations. This supports a classification of reinstatement work. It does not identify individual unnumbered barriers or confirm a future transfer, arrival, completion, off-hire or cost.

## Integration contract

- `window.waterBarrierPlacement1017(a)` returns `null` unless the source key, initial source task, reinstatement task, activity, TL2 type and original quantities match the reviewed operations. For a match it returns `kind`, `key`, `sourceRef`, `item`, current `quantity`, `sourceQuantity`, current `date`, `label` and source sheet/row.
- `waterBarrierPlacements1017(assets?)` returns the matching current rows, date ordered.
- `waterBarrierPlacementsNote1017(rows?, print?)` renders one concise reinstatement total with reference links and dates. Explanatory text sits under More info. Print uses plain references.
- Quantity edits read current `chargeLines()`/`qtyOf()`; date edits read `effectiveDates()`. Original source guards remain independent of those operational edits. Mixed or invalid quantity lines are not silently classified as barriers.
- Inventory should separate these placements from new Ordered/Still to come quantities while retaining any subsequently recorded receipts/current stock. The classification does not itself perform stock transfer or hide actual units. The source-schedule peak is not a replacement for new-supply demand or current onsite stock.

## Verification

`node test_barriers1017.cjs`: 31 fixtures pass, including source guards, both ref pairs, zero/invalid/mixed quantities, current quantity/date changes, cancellation and no record mutation. Patch applies once to the live v10.16 source and refuses a repeated application. Actual-public prototype check is in `read_public_fixture1017.cjs`; this injects only the classifier into a GET-only browser so the current native data can be checked without changing the app or record. Combined Inventory rendering and full release checks remain the release owner's responsibility.
