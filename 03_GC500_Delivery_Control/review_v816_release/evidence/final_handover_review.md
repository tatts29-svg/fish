# Final v8.16 handover review

Author: Andrew Fisher

**No runtime blocker remains in the bounded reviewed scope. All 56 final independent CPU checks pass:** streams 20/20, actual UI/print handlers 20/20, roads/travel/sheet paths 16/16. These use the frozen product source and exact rebuilt candidate below. Browser gates and publication remain with the release owner.

| Input | Exact value |
| --- | --- |
| Frozen source | `7f7d9066dbe6bda82eab12f1df0894410fd8845c` |
| Base v8.15 | `35ab136643f9b7b0fb5b4e237c501c58cb27bc31e4faaded75df013dad0f7770` · 9,118,422 bytes |
| Final candidate | `7ae89da4e80b070ade2977ef4e47ed3e766be6dc7722bd610e21ad78ddaa77d0` · 9,244,210 bytes |
| Demob source | `3f18954e509eafd35c81f1c466963eaea886c23a68a570d1574bf8c72a740afc` |
| Patch | `9b17360533c8a346b54ed7364c729dc890b4948a7c29be334e50c9a7e2a1d411` |
| Drawer | `6f87a42c4ac481bbbbceaab8c33e96adfd0f5b91fa7bc1780618a082d0882125` |
| CSS | `cd316ad919b0a9e721b3291e4c5dc2f5693f3f3d7734f26a5f4b763f71554d9b` |

## Final change and test basis

Compared with `6837e9f`, the product changes only one legend sentence, clarifying the supplier's 24-unit capacity and Coates' 12–14-unit capacity. Patch, drawer, CSS and all runtime logic are byte-identical. Independent reconstruction of `6837e9f` on the exact final base produces prior candidate `cf29603544e22000a5d421b7d7435f2c1f507d2bf80a46fcf4ad0c0540c15016` (9,244,173 bytes). Replacing exactly that sentence produces the final candidate byte for byte: [comparison evidence](final_legend_comparison.json). The owner's claim that earlier standing checks ran on a candidate differing only by the legend is therefore supported by the actual bytes.

Preserved independent fixtures were recovered from audit commit `6b1066d`, not copied from owner pass logs. `followup_abbb01b_streams.cjs` and `followup_8c821da_ui.cjs` ran unchanged; the roads fixture's sole modification was its asserted source hash, updated to the final Demob hash. All ran locally with synthetic data and minimal DOM stubs where needed. Mixed-owner first-day confirmation, stream/date preservation, accepted lower capacity, actual supplier/Coates print selection, permit-warning controls and travel editing pass. No browser, network, live-record access, operational mutation, product edit or commit was performed by this review.

Older gate/merge/date cases were not needlessly rerun: their source is unchanged from the reviewed repairs, and current owner evidence retains the passing results. The owner records 71/71 CPU cases; prior fixture sets 33/33, 26/26 and 53/53 use an explicit fixture-only supplier ownership shim. That shim supplies the ownership assumption missing from their old synthetic assets; it is not in the product. The Timeline hunk and drawer remain exact, retaining the prior 17/17 date/template results and the owner's current 13/13 plus 17/17 reruns. Owner browser 115/115 and standing checks were read as owner evidence, not relabelled as this review's execution.

## Closure of the 32 recorded entries

This is the owner's round-by-round count, which includes repeated findings; it is not 32 distinct defects. “Closed” means the reproduced software behaviour is corrected within the stated fixtures and source scope. Incoming-purpose interpretation, original-document validation and physical relationship limits remain explicit.

| Entry | Recorded issue | Final disposition |
| --- | --- | --- |
| O1 | Outgoing pump gate, actor/time evidence | Closed within agreed outgoing/incoming interpretation; forced collection always gated. |
| O2 | Reuse and newer revocation | Closed: new arrival revokes old evidence; newer false and stale-before-arrival rules retained. |
| O3 | Pump evidence merge durability | Closed: merge preserves value/actor/time/history and false precedence. |
| O4 | Split load dates | Closed: durable portions retained, including mixed-owner repair. |
| O5 | Toilet before tank across runs | Closed for represented same-reference relationships; supplier dependency held visibly. |
| O6 | Unknown quantity invented as one | Closed: uncertain quantity remains explicit. |
| O7 | Typed removal missing on added reference | Closed: actual removal-event test replaces plan-fallback exclusion. |
| O8 | Cancelled drawer Out date hidden | Closed: authoritative date fallback and cancellation/source label. |
| F1 | Reused pump-out clearance | Closed, overlaps O2. |
| F2 | Confirmation collapses split days | Closed, overlaps O4. |
| F3 | First split day lacks pump task | Closed: every portion day contributes to prerequisite tasks. |
| F4 | Confirmed unknown disappears / tank alone | Closed: uncertain work retained; supplier/tank hold explicit. |
| F5 | Incoming purpose inferred from missing history | Resolved interpretation: supplied incoming date/no prior arrival/cutoff exception; outgoing collection forced. |
| F6 | Equal-time clearance conflict order dependence | Closed: fail-closed false and clash retained. |
| F7 | Added explicit remove loses plan precedence | Closed: dated remove event preserved. |
| G1 | Same-day second portion dropped | Closed: all matching portions retained. |
| G2 | Quantity change drifts from portions | Closed within stated owner allocation: reconcile per stream, show changes/unplanned/unknown owner. |
| G3 | Uncertain load labelled full | Closed: uncertainty takes precedence. |
| H1 | Known zero creates phantom pickup | Closed: reference visible, no truck/pump task. |
| I1 | Mixed-owner dates collapse | Closed: stream saved on each portion. |
| I2 | Coates capacity and stream label wrong | Closed: actual stream/capacity displayed. |
| I3 | Supplier Print this load selects nothing | Closed: stream ID flows through actual handler/dispatcher. |
| I4 | Unknown owner omitted without explanation | Closed: row/view/email state owner-to-confirm. |
| I5 | Supplier-before-tank dependency hidden | Closed: HOLD/after-supplier instruction replaces tank time. |
| J1 | A.run print exception | Closed: sheet uses per-run travel. |
| J2 | Oversize control/warnings disconnected | Closed: flag handler, state, warning and permit-review output connected. |
| J3 | Travel editor missing / old override ignored | Closed: editor/blank state and legacy migration present. |
| J4 | Supplier null times render midnight | Closed: untimed supplier view and sheet. |
| K1 | Mixed-owner dates still collapse | Closed, repeat of I1. |
| K2 | Lower capacity accepted but load exceeds it | Closed: overflow re-packed; overload display guarded. |
| K3 | Legacy draft travel migration absent | Closed functionally: carry over explicit value and retain new explicit settings. |
| K4 | Road window presented as legal entitlement | Engineering wording corrected to project planning window/permit check; original guide remains unverified. |

## Evidence attribution and non-blocking limitations

All 12 current owner JSON stamps identify final Demob `3f18954e…`, final base `35ab1366…` and candidate `7ae89da4…`. `fixtureProvenance` now distinguishes the historical test version from the tested product. The exact file hashes bind the stated “uncommitted working tree on 1382e98” to frozen source `7f7d906`. The older ownership-shim runs have combined source hash `767f8fd39e2d5b82cc0275903f634aabf3308ed7a3fe6493bf7feb9819504c7f`, independently reproduced from final source plus the checked-in shim; their differing hash is explained, not a conflicting product build.

Some historical prose remains stale: README's older test-source paragraph still names `a57de005`/`00a72d68`; the roads result's literal `remaining` array still says migration and old road wording are absent; nested Timeline maps retain old fixture source hashes after their old source pin was lifted. These are superseded by the exact mapping and current-source inspection in this review. Do not quote those stale fields as current unresolved runtime findings or as the final source identity.

The original Queensland Access Conditions Guide PDF remains unavailable and **was not independently read**. The owner excerpts and section references support traceability, not a claim of legal accuracy, currency or route/permit clearance. Current screen/print wording calls 09:00–16:00 a **project planning window**, retains permit review and labels the latest departure as planning. The old research note still overstates aspects of that wording. Operational vehicle dimensions, route conditions, measured travel time and unrecorded ownership remain for the responsible people to establish.

A minor traceability issue remains: travel migration uses one shared `_from` label, so editing one run can remove the migrated-origin label for another unchanged run. The numeric travel values are preserved; this does not reopen the former lost-override or capacity/date blockers. Same-reference toilet/tank relationships and explicit supplier HOLD instructions are covered; this audit does not invent or verify undocumented cross-reference physical relationships. Existing labelled planning defaults and device-local settings are not independently verified operational facts.

[Aggregate hashes, named checks and per-entry evidence](final_handover_review.json). This aggregate contains only source/test metadata, synthetic check names and review prose; no private operational records, real completion actors/timestamps, credentials or original attachments.
