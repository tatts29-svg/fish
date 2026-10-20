# Independent CPU follow-up: e540cbc

Author: Andrew Fisher

**The three quantity corrections from 6a0bb20 pass.** The previous 43-check suite now has 42 passes and one retained incoming-purpose interpretation check. Seven added quantity/notice checks produce six passes and one concrete zero-quantity defect. Total: **48 passes, one code defect, one interpretation to settle**. This is exact moving-draft feedback, not a READY or publication decision.

Exact source commit: `e540cbc31bef88500f9b781688c53f8693932514`. The implementation was only read. Its patch applied privately to the same verified v8.13 baseline; no browser, network, operational record, external comment or commit was involved.

| Input | SHA-256 |
| --- | --- |
| Unpatched v8.13 baseline | `f07e92cc79ad416e75f0db2b6cfa1c302d1789cf7c93ff0da8142afc6dc8a7ec` |
| Private patched audit candidate | `202a5125e2a012d0c721410571fc1ba07771b4806376a8551181865a7331cd97` |
| `patch_v816.py` | `9b17360533c8a346b54ed7364c729dc890b4948a7c29be334e50c9a7e2a1d411` |
| `demob816_src.js` | `da701a82b6657f0d1f23d40381a8056b0a61837859e846ac5c1e7d4e92a2617e` |
| `drawer816_src.js` | `6f87a42c4ac481bbbbceaab8c33e96adfd0f5b91fa7bc1780618a082d0882125` |
| Owner `v816_tests.js` | `5119c7ceefb2d3c288be3dd72ccb1a154f2e53fc453859f6bf04fe21bd65b087` |

## What is fixed and verified

- **Same-day portions:** 24 + 1 on Monday survives actual confirmation and the fresh model. The confirmed-day path iterates all matching portions rather than selecting only the first. Distinct-day 24 Monday + 1 Tuesday, JSON reload and merge round-trip still pass.
- **Quantity increase:** 25 → 26 conserves all 26 units. The extra unit is explicitly `unplanned`; changed-quantity notices appear in the pick-up row, toilet loads, email draft and printed sheet. Rendering the reconciliation does not rewrite the saved confirmed record.
- **Quantity decrease:** 25 → 24 conserves 24 and shows the changed-quantity notice in those same four outputs. The raw confirmed portions remain preserved while the computed plan explains the reduction.
- **Quantity becomes unknown:** the two existing portions remain represented as uncertain loads with a quantity-change notice. Unknown totals no longer claim `full`, and email/loads retain uncertainty wording.
- **Prior safety and date fixes:** reuse revocation, stale-clearance rejection, actor/time evidence, known-arrival-history gates, later/equal-time false precedence, merge history/idempotence, pump coverage for all 49-unit portion days, and known/unknown same-reference toilet-before-tank timing remain passing.
- **Timeline/drawer:** the independent suite remains **17/17**. Typed added-reference removals, cancelled recorded Out dates and explicit plan-removal precedence remain correct. `patch_v816.py` is unchanged from 6a0bb20; the Timeline replacement remains byte-identical to 968aefb, SHA-256 `8e9e00f0bd00f01edae6ecef1ed4fa12059fa92e703bfd33f990d79657db7a26`. The drawer change only adds an escaped quantity-change notice; date selection is unchanged.

## Remaining concrete defect

**P2 — Correcting a portable quantity to zero creates a one-unit normal-truck instruction.** `demob816_src.js:183–184,198,297,309–312`. Start with 25 FWF units and confirm their portions, then set supplied quantity to **0**. Reconciliation removes every portion; `evtPure` becomes false because `evtN` is zero. The normal-truck list therefore includes the reference. `stops816` filters out its zero-count parts, then falls back to `{type:'FWF', n:1}`. The resulting run sheet schedules one FWF despite a known zero quantity and a note saying the quantity fell from 25 to 0. This is an additional reachable edge in the quantity correction path, not a claim that this exact state exists on the live record.

Keep the reference and discrepancy visible, but do not fabricate a pickup unit for an all-known-zero reference. The new fixture `zero_quantity_does_not_create_fallback_one_unit_truck` observes **1**, expects **0**, and is the only concrete code failure in this follow-up. This should be corrected before the affected run-sheet behaviour is treated as complete.

## Incoming-purpose semantics, assessed separately

The unchanged code allows the ordinary pre-event light change for a reference with no recorded arrival history, interpreting it as an incoming delivery. The same reference on a demob/event/out-date cutoff is blocked; the explicit Demob **Collected** action is blocked without pump-out evidence at any date. Those distinctions are reproduced by the fixtures.

The supplied demob brief prohibits loading/transporting unemptied toilets and tanks. It does not explicitly prescribe a separate saved incoming-purpose field or specify the modelling of the generic pre-event arrival-status control. The earlier R1 assertion demanding that this generic historyless pre-event light always be blocked was the review's implementation interpretation. **It is not independent evidence of a mandatory policy requiring a new purpose field.** Its expected-false assertion is retained in the JSON for comparison, with an explicit interpretation note; it is not counted here as a proven code defect or, by itself, a release blocker. The owner should document what that generic incoming light asserts and how it differs from a collection/loading permission. No assertion is made here that a status change proves physical equipment empty.

## Portable evidence and limits

[Main fixture](followup_e540cbc_cpu.cjs) / [results](followup_e540cbc_cpu.json): 31/33 raw assertions pass; the two non-passing observations are the zero-quantity defect and retained incoming-purpose expectation above. [Independent Timeline/drawer fixture](followup_e540cbc_timeline.cjs) / [results](followup_e540cbc_timeline.json): 17/17 pass, including exact source/baseline hash guards.

Extract `e540cbc31bef88500f9b781688c53f8693932514` to a temporary directory, including `v8.16_reference_and_demob_DRAFT` and `toolchain/rep.py`; apply its patch to a temporary copy of the baseline above. From this evidence directory:

```sh
node followup_e540cbc_cpu.cjs /path/to/frozen/demob816_src.js /path/to/patched-candidate.html
node followup_e540cbc_timeline.cjs /path/to/unpatched-v8.13.html /path/to/frozen/v8.16_reference_and_demob_DRAFT
```

The main script deliberately exits 1 for the recorded non-passing assertions. Templates are evaluated as strings; no DOM, visual layout, print pagination, device performance, final fresh-live build or standing browser-suite approval is implied. Original audit files and implementation files remain unchanged.
