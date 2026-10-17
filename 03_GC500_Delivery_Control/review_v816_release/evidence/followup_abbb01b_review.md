# Bounded integration follow-up: abbb01b

Author: Andrew Fisher

**The newer moving draft has confirmed integration defects.** New stream checks pass 11/20, with nine failed assertions grouped below; Timeline/drawer remains 17/17. Exact source `abbb01baf3318d39d970313063c29cdb30990d33` adds ownership streams and road/travel models but leaves several existing renderers and controls using the old model. This is actionable draft feedback, not READY or a publication decision.

| Input | SHA-256 |
| --- | --- |
| Demob source | `aca9b7089b42d62902c1235f25f83be9bf32a573c62e359b2625f6d9da47df31` |
| Private candidate from unchanged v8.13 baseline | `dfb0f1f578397653436e7b198b97dedc55de5afe45669a775a337f3d9b6e36c6` |
| Unpatched baseline | `f07e92cc79ad416e75f0db2b6cfa1c302d1789cf7c93ff0da8142afc6dc8a7ec` |

## New stream findings

1. **P1 — Preserve dates for a reference split between owners.** `demob816_src.js:241,262,268,542–552`. Synthetic reference `MIX` has 25 FWF units, 24 supplier inventory units and one Coates asset number. Proposed loads are 24 supplier units on Monday 26 Oct and one Coates unit on Tuesday 27 Oct. Because the new code retains portions only for a single ownership stream, `r.iso` is overwritten by Tuesday and Monday's pick-up list omits MIX. Actual `confirm816('2026-10-26','all')` returns **0**. Confirming Tuesday then rebuilds **both** streams on Tuesday, losing the previously shown Monday collection. Preserve per-stream portions and include the reference on each portion day; verify confirmation, reload and merge keep those dates.

2. **P2 — Render each ownership stream's actual capacity and identity.** `:275–276,477–482,508–509`. The model correctly packs 25 Coates units as **12 + 12 + 1**, but `toiletHtml816()` still prints `of 24`, while email still describes every run as 24 per load. Both streams also restart load numbering at 1 without the stream identity in that load card. Use `L.stream`/`L.cap` consistently in cards, email, indicators and actions; do not instruct the branch using the supplier capacity for Coates loads.

3. **P1 — Supplier “Print this load” selects no load.** `:481,580`. The load card still offers that button, but actual `printDay816(...,'load',1)` filters only `kind === 'toilets'`; supplier loads now have `kind === 'supplier'`. A supplier-only fixture returns **0**, flashing “Nothing to print”. Select by the load's unique stream-aware identifier. This failure occurs before the separate run-sheet renderer exception reported in the roads review.

4. **P2 — Explain unresolved ownership on the retained row.** `:76–78,219,229,462`. An unallocated one-unit reference correctly produces `ownerUnk: 1` and no guessed run, but the pick-up row never renders that field or an owner-to-confirm notice. A person sees no reason it is omitted from the run list. Keep the reference visible and state which quantity cannot be assigned until ownership is confirmed.

5. **P1 — Carry the supplier dependency into the tank instruction.** `:384,492–493`. A reference containing a supplier FWF and its waste tank yields an untimed supplier collection, plus a timed branch tank stop at 07:00. `afterSupplier: true` is computed but never consumed by the UI, print or scheduling path. The truck output includes the generic “tank, after the toilet on it” part wording, but no explicit pending supplier pickup, hold or dependency status. The new untimed supplier run cannot establish when its toilet is off. Preserve that prerequisite in the timed tank instruction so its clock time cannot imply the dependency is cleared.

Supplier null times rendering as **00:00** are covered once in the [roads report](followup_abbb01b_roads.md); the stream fixture independently reproduces the same issue. They are not counted as a separate additional finding here.

## Road and print integration findings

The [independent roads report](followup_abbb01b_roads.md) proves:

- **P1:** all nonempty sheet rendering throws because `sheet816()` reads removed `A.run.lab/v`.
- **P1:** the new oversize setter has no UI caller; computed warnings are never rendered; old permit warnings disappear after the kind changes to `single`.
- **P2:** the new travel storage key has no editor or writer, and prior explicit travel overrides are ignored.
- **P2:** deliberately null supplier travel times display as midnight movements.

Original Queensland Access Conditions Guide v6.0 remains inaccessible and **was not read**. Numeric guide conditions, currency and route applicability remain unverified. The new 09:00–16:00 inference and council-boundary timing claims require original-source and route qualification; see the report for precise limits. No legal clearance is inferred from these CPU results.

## Positive checks and scope

Supplier-owned 25 units still pack as 24 + 1 and survive confirmation. Revised supplied quantity **25 → 24**, **25 → 0** and **25 → unknown** retains the earlier corrected behaviour: conserved known quantities, no phantom zero pickup/pump task, visible zero row, and uncertain stored portions. Rendering does not rewrite the synthetic confirmed record. Coates-owned 25 units pack as 12 + 12 + 1; mixed streams stay physically separate; unknown ownership does not invent a run; the supplier time model is null rather than invented; the supplier/tank dependency is detected internally.

All 17 Timeline/drawer date fixtures still pass. Patch and drawer hashes are unchanged from 24cb316; the exact Timeline replacement is still unchanged from 968aefb. These checks use actual source and templates in a VM, not a browser. The previous 53-check Demob fixture assumes the old single ownership stream, so it was not blindly counted as a regression suite for the new model. New synthetic inventory evidence explicitly identifies ownership instead.

## Portable evidence

[Stream fixture](followup_abbb01b_streams.cjs) / [results](followup_abbb01b_streams.json): **11 pass, 9 fail**, exit 1 as expected for recorded defects. [Timeline fixture](followup_abbb01b_timeline.cjs) / [results](followup_abbb01b_timeline.json): **17/17**, exit 0. The roads report records separate minimal source/CPU observations.

Archive exact `abbb01baf3318d39d970313063c29cdb30990d33` with `03_GC500_Delivery_Control/v8.16_reference_and_demob_DRAFT` and `03_GC500_Delivery_Control/toolchain/rep.py`; apply its patch only to a private copy of the baseline whose hash is above. Run from the evidence directory:

```sh
node followup_abbb01b_streams.cjs /path/to/frozen/demob816_src.js /path/to/private-patched-candidate.html
node followup_abbb01b_timeline.cjs /path/to/unpatched-v8.13.html /path/to/frozen/v8.16_reference_and_demob_DRAFT
```

Only new review artifacts were written. No browser, implementation changes, live record changes, commits or publication. These findings do not certify layout, performance, full standing suites or release readiness. The owner retains implementation ownership.
