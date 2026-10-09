# Independent CPU review: 6a0bb20

Author: Andrew Fisher

**39 positive checks pass; 4 fail. Moving draft, not READY.** Exact reviewed commit: `6a0bb204d5bf55e4b65be8cf07866e7b3f1402df`. The correction work is substantially effective: ordinary confirmation now preserves split dates, pump tasks cover earlier portions, reuse revokes old clearance, merge conflicts fail closed, unknown quantities remain represented, and authoritative removal dates agree with the Timeline. Four bounded cases still need action below.

## Source and verification

| Input | SHA-256 |
| --- | --- |
| Unpatched v8.13 baseline | `f07e92cc79ad416e75f0db2b6cfa1c302d1789cf7c93ff0da8142afc6dc8a7ec` |
| Exact patch applied to that baseline, private CPU candidate | `5539eba63a15e7f1658b5b564f07d62e290fba0dd9772939078e830361937429` |
| `patch_v816.py` | `9b17360533c8a346b54ed7364c729dc890b4948a7c29be334e50c9a7e2a1d411` |
| `demob816_src.js` | `a9e076a3dff429281b50e3ec0de1783734f025a0c14382deb46e00765cf09bea` |
| `drawer816_src.js` | `8223d5513ce002c7f866ea5e999abce7b62fb9e33a868682d5d30146bb2f9445` |
| Owner `v816_tests.js` | `5119c7ceefb2d3c288be3dd72ccb1a154f2e53fc453859f6bf04fe21bd65b087` |

[Demob fixture](followup_6a0bb20_cpu.cjs) and [results](followup_6a0bb20_cpu.json): **22/26** positive assertions pass. The fixture uses exact patched `setDate`, `setLight` and `mergeRecords`, synthetic quantities/states and a fixed fixture clock. It returns exit 1 for the four unresolved assertions. The original nine observations and previous six observations were also rerun privately before constructing these positive checks; none of the earlier evidence was overwritten.

[Independent Timeline/drawer fixture](followup_6a0bb20_timeline.cjs) and [results](followup_6a0bb20_timeline.json): **17/17** pass, with frozen input hashes checked. The Timeline replacement is byte-identical to `968aefb` (replacement SHA-256 `8e9e00f0bd00f01edae6ecef1ed4fa12059fa92e703bfd33f990d79657db7a26`); the drawer file is also unchanged. The explicit-plan correction is in Demob lines 177–178.

## Original eight findings

| Original finding | Verified result |
| --- | --- |
| 1. Pump-out gate exceptions | Date bypass for an on-site unit, missing actor/time and amber-with-arrival-history paths are fixed. Historyless units are blocked on the demob day. The before-event inference remains open (R1). |
| 2. Old clearance/current cycle | Fixed for the tested reuse paths: `setLight(...,'on site')` records a revocation; an older pump timestamp than a recorded arrival is stale; newer committed false and equal-time contradictory false win. A changed unit set/quantity has not been proven to revoke clearance. |
| 3. Merge drops evidence | Fixed for value/name/time/history, later false, equal-time conflict in both input orders, clash reporting and idempotent delivery merge. |
| 4. Split reference dates | Fixed for 24 Monday + 1 Tuesday, actual confirmation, JSON reload and merge round-trip. Same-day multiple portions and corrected total quantities still expose R2/R3. |
| 5. Toilet-before-tank across runs | Fixed for known and unknown portable quantities in the same reference: both stops exist and tank time follows toilet end. Separate-reference pairing is not established by this review. |
| 6. Unknown quantities | Fixed for confirmed/plan run presence and email uncertainty; no assumed one-unit quantity. The uncertain load still renders a green `full` chip (R4). |
| 7. Same-day added reference typed removal | Fixed; original delivery retained, no duplicate, move/clear behaviour checked. |
| 8. Cancelled drawer Out date | Fixed for typed, plan and early contract dates; source/cancellation wording retained. CPU template assertions only. |

## Seven findings from the 968aefb follow-up

| Follow-up finding | Verified result |
| --- | --- |
| 1. Old use cycle permits later collection | Fixed in the tested setter/rearrival paths. |
| 2. Confirmation collapses split dates | Fixed for distinct-day portions and round-trips; R2 covers same-day portions. |
| 3. First split load lacks pump task | Fixed: all three days of the 49-unit fixture have the reference on the pump list. |
| 4. Unknown toilet disappears; tank alone | Fixed: confirmed unknown remains an uncertain truck, and a mixed unknown portable has a predecessor stop before its tank. |
| 5. Missing history inferred as incoming | Partly fixed with a cutoff; still fails before that cutoff (R1). |
| 6. Equal-time merge is order-dependent | Fixed: both orders keep false and record a clash. |
| 7. Explicit removal overwritten by proposal | Fixed: same-day added reference with an explicit 5 Nov removal stays on 5 Nov in both Timeline and Demob. |

## Remaining actionable cases

**R1 — P1, remaining: pre-event date still substitutes for explicit movement purpose.** `demob816_src.js:111–123`. With today 18 Oct, no arrival history, no pump-out and a `not on site` light, the ordinary gate still returns true for `in transit`. The code assumes that the move is incoming because it precedes the event/out date; it does not read an explicitly recorded movement purpose. A forced collection is correctly blocked. The lack of a recorded arrival still cannot prove that a toilet is unused or that the proposed movement is incoming. Keep outgoing/loading actions blocked, or represent the incoming purpose explicitly. This is the still-open strict-rule case, not a regression in the repaired on-site/date path.

**R2 — P1, new: confirming two portions on the same day drops the second portion.** `demob816_src.js:226`. Put 25 FWF units on a proposed outside reference and one fixed reference on each Tuesday–Friday. The planner correctly puts both portions (24 and 1) on Monday. Confirmation saves both, but the next model uses `r.portions.find(p => p.iso === iso)`, retaining only the first. The confirmed schedule contains 24 units instead of 25. Sum all portions on that day, or retain them as separate loads, with the 24-unit cap still applied. The fixture checks actual confirmation followed by a fresh model, not just stored JSON.

**R3 — P2, new: stored portions silently drift from a corrected unit quantity.** `demob816_src.js:163–168,226`. Confirm the ordinary 25-unit two-day split, then correct supplied quantity to 26. The model reports 26 portable units but its saved loads still sum to 25, without an explicit discrepancy. Validation checks dates/positive portion counts but not their sum against the current quantity. Preserve the confirmed record while visibly flagging the mismatch, or reconcile through the user's date/quantity confirmation flow; do not silently leave a unit outside the collection plan. The conservation assertion currently fails at 25 versus 26; an explicit unresolved-discrepancy design would require adapting that assertion accordingly.

**R4 — P2, new: unknown load says `full`.** `demob816_src.js:394`. The new `L.free && !L.uncertain ? ... : full` branch correctly suppresses top-up space for an uncertain load, but falls into the green `full` alternative. A zero-known-unit/unknown-total load therefore shows both `total not certain - count on site` and `full`. Render neither a free-space figure nor `full` until the total is known. The template assertion reproduces the misleading chip; no browser styling claim is made.

## Reproduction

Use Node and Python, a local unpatched baseline matching the hash above, and a temporary archive of **6a0bb20** containing `03_GC500_Delivery_Control/v8.16_reference_and_demob_DRAFT` plus `03_GC500_Delivery_Control/toolchain/rep.py`. Apply that frozen `patch_v816.py` only to a temporary baseline copy; verify candidate hash above. From this evidence directory:

```sh
node followup_6a0bb20_cpu.cjs /path/to/frozen/demob816_src.js /path/to/patched-candidate.html
node followup_6a0bb20_timeline.cjs /path/to/unpatched-v8.13.html /path/to/frozen/v8.16_reference_and_demob_DRAFT
```

No browser, network, operational-record access, implementation edit, external comment or commit. All new files use the authorised `followup_6a0bb20*` prefix. This review establishes only the stated source/CPU behaviour; final fresh-live build, visual/print, browser and standing release checks remain required after corrections.
