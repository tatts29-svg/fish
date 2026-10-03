# Bounded follow-up: 8c821da

Author: Andrew Fisher

**Most earlier UI integration gaps are corrected.** Affected stream/template/handler probes pass **18/20**, and changed road/print probes pass **16/16**; the two failures reproduce one new capacity defect (34 passes across 36 probes). The mixed-owner date issue remains in byte-identical planner/confirmation code. This is exact moving-draft feedback, not READY or a publication decision.

Source: `8c821da439027bd09b01d4dbc2e84b53c966c397`, compared with `abbb01baf3318d39d970313063c29cdb30990d33`. Demob SHA-256 `bafd51d93afd3716c4e277eec4a93d56f358d94820f17e485e2a64dd0745d143`; private candidate on the unchanged v8.13 baseline `f16b0c3a46582a6545e48ce02883582f2406767f32c912a64585cabcf07e1c1d`.

## Changed paths verified

- Coates load cards and emails use their actual 12-unit model capacity and identify the stream. Supplier and Coates load cards have separate `sub1`/`coates1` identifiers.
- Unknown ownership is stated in the pick-up row, toilet view and email.
- Actual `wireDemob816()` binds the rendered supplier load ID through the button to `printDay816()`. Both same-day stream buttons select and render only their own reference. Printing preserves the synthetic shared-record object.
- Supplier truck view and printed list omit the former invented midnight/Kingston movements. The printed list includes the reference and pump-out requirement.
- The computed supplier-before-tank prerequisite now appears in both truck view and run sheet. This resolves the omitted-instruction finding; it does not prove a physical supplier collection has happened.
- The independent [road/print follow-up](followup_8c821da_roads.md) passes 16/16 changed-path probes: sheet rendering no longer reads removed `A.run`; actual oversize checkbox handlers persist/clear their flags and warnings reach screen/print; actual travel controls save separate run values, preserve blank as unconfirmed, and print those states. Original-guide limitations remain explicit.

## New actionable defect

**P1 — Accepted lower truck capacity does not constrain the load.** `demob816_src.js:231,270–276,290–293,487–493,584–586`. The new “This truck takes (units)” input allows a minimum of 1 and its actual handler accepts **8**, saving that value to the selected device/load key. A 12-unit Coates fixture then remains packed as **12**, while the model reports `cap: 8`, `free: -4`, `capWarn: false`. The new card labels it **full**, with no overload warning. The scheduler packs to the fixed 12 before applying the user-entered capacity, and `capWarn` checks only capacities greater than 14.

Either constrain this control to the explicitly supported capacity range and reject invalid entries, or pack/reconcile to an accepted lower capacity and clearly flag any existing excess. Never label a load above its accepted truck capacity as simply full. Actual handler/storage, record preservation and computed/rendered outcomes are covered by the last four fixture assertions.

## Earlier findings still open

- **Mixed-owner portions/dates:** the planner through `demobSel816()` and actual `confirm816()` are byte-identical to abbb01b. The previously proved 24 supplier Monday + 1 Coates Tuesday case still has no per-stream portions: Monday's list omits it, Monday Confirm writes zero, and Tuesday confirmation moves both streams to Tuesday. Source lines 241,262,268 and 596–607 retain the issue. The unchanged-region hashes are recorded in [comparison evidence](followup_8c821da_unchanged.json); the same tests were not needlessly rerun.
- **Saved travel override compatibility:** the new editor is distinct from migration of the old local-storage override. See the roads follow-up for what the unchanged reader still ignores. This is compatibility between drafts, not evidence that a live user's value was lost.
- **Original guide/source applicability:** owner-provided excerpts are available, but the original Queensland Access Conditions Guide PDF remains unavailable and was not independently read. The visible “09:00–16:00 only” claim and full-Kingston-trip calculation must retain their source/route qualifications; excerpts do not establish complete current permit conditions.

## Retained checks and limits

No planner, pump gate, merge or Timeline behaviour was changed in the source areas already tested. `patch_v816.py` remains `9b17360533c8a346b54ed7364c729dc890b4948a7c29be334e50c9a7e2a1d411`; `drawer816_src.js` remains `6f87a42c4ac481bbbbceaab8c33e96adfd0f5b91fa7bc1780618a082d0882125`. The earlier **17/17 Timeline/drawer** result is retained against these identical files, not reported as a new run. The earlier zero/unknown quantity observations likewise remain linked to unchanged planner code.

[Portable affected-UI fixture](followup_8c821da_ui.cjs) / [results](followup_8c821da_ui.json): **18 passes, 2 failures**, exit 1 for the capacity defect. It supplies explicit synthetic ownership evidence, runs actual templates, binds actual event handlers, and uses minimal DOM/print stubs. No browser rendering or print pagination is claimed.

To reproduce, archive the exact source commit plus `toolchain/rep.py`; apply its patch only to a private copy of the unpatched v8.13 baseline (`f07e92cc79ad416e75f0db2b6cfa1c302d1789cf7c93ff0da8142afc6dc8a7ec`). Then run:

```sh
node followup_8c821da_ui.cjs /path/to/frozen/demob816_src.js /path/to/private-patched-candidate.html
```

Only new review artifacts were written. No browser, live record read/write, implementation edit, commit or publication. No full release-readiness claim.
