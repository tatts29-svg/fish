Author: Andrew Fisher

Transport specifications and original Load Restraint Guide references, integrated into existing equipment drawers, Timeline load actions, shared-load proposals, driver sheets, Demob and Documents. Source is ready for final combined-release integration; publication belongs to the root release task.

The complete 274-row reference catalogue retains original page provenance and unknown values. Guide weights and dimensions are candidates until a named user explicitly matches actual equipment and its travelling configuration. Lifting capacities and method scope maxima are never imported as actual equipment mass. Copying a guide row produces an unchecked draft. Generator skid dimensions are not offered as trailer assembly dimensions.

Per-unit records include actual model, evidence, travelling envelope, complete mass, configuration, skid support-base width where relevant, and method applicability evidence. Actual truck/load records include usable deck, available payload, deck/limit heights, additional support/restraint mass, individual positions and dated axle/anchor/restraint reviews. No master-plan drawing dimensions become verified transport specifications.

The calculator shows entered envelope, payload and loaded-height results. It does NOT validate the complete original restraint matrices, friction, blocking, connection ratings, lashing geometry or axle distribution. `assess().geometryFits` is a planning calculation only. `assess().fits` is false and `restraintValidated` is false for every currently selectable method, including documented engineering alternatives. Automatic load-sharing approval therefore remains disabled. This limit is stated in the editor and printed supplements. Carrier assessment and actual driver pre-departure checks remain required.

Identity and storage

- `transportUnitId924(ref, owner, nativeId, assetNo)` uses a reference/owner namespace and either a real native ID or asset number. No array index becomes an identity.
- `getTransportUnits924(a)` consumes `gcUnits925(a)` when available. Numbered physical IDs do not change merely because metadata acquires a UUID; VMS units use native ID `vms:<board.key>`.
- Unnamed physical units require an explicitly created UUID slot. When Units925 exists, that is the single creation entry point. Existing restraint slots remain readable. Unallocated slots never bypass split-booking filters.
- Per-unit and per-load documents use the existing `S.loads` / native per-document save path, bounded hash keys, and the full identity checked inside each document. No financial or operational source records are rewritten by this patch.
- Failed native saves restore the prior in-memory document or delete the new one. No false success message is returned.
- Load scope fingerprints include all safety-relevant values and their verification/source details, not just timestamps. Same-stamp imports invalidate earlier checks. Stale unit identities clear both specification and method acknowledgements. Unit and load forms capture their full source scopes and reject concurrent changes at Save, preventing old evidence being rebound to corrected equipment or a revised arrangement.
- Demob identities depend on their source contents, not displayed load numbers. Partial collections without exact individual allocations remain explicitly unresolved.

Original-source audit

The original 140-page PDF SHA-256 is `67c2d6442f6b22c7a0cc5f933275cf56463686a96763bf977a9713a40a96ccb0`. The existing complete review and catalogue were reused; selectable families were checked again against original pages. The accompanying `method-source-audit.md` identifies the remaining conditions. No method is an automatic restraint approval.

Validation

- 138 model/source assertions: catalogue provenance; nulls and genuinely unknown values; namespace identity; split booking slots; invalid/nonfinite dimensions and positions; payload/height/overlap; same-stamp specification imports; stale confirmation clearing; method maxima and named-model scope; longitudinal/central/paired skid constraints; and no automatic approval for all 16 method families.
- Eight injected persistence checks: native refusal and exception rollback, read-only refusal, identity collision, successful named/stamped capture, advancing stamps and truncating key refusal.
- Targeted actual-page phone run passed on candidate `ad77fca300afe22ca1ebabb0ecc96830835ee31a695e28695f291e0c09f0f2b3`, based on 9.23: readable original model reference, no horizontal drawer overflow, searchable catalogue in a view-only link, Timeline/driver/Demob integration, stable Demob IDs, unchecked source copying, native per-document capture and failed-save rollback; zero runtime errors, 70 reads and zero HTTP writes. This was before the final source-only method-bound/citation, split-slot and touch-target refinements.
- Final exact combined-release browser verification remains required. `tests/browser924.cjs` additionally checks actual load-form saves, mid-edit freshness rejection and A4 supplement overflow. The root task owns the final combined phone/desktop sweeps and guarded publication. No live records have been written by these tests.

Commands (from repository root)

    node 03_GC500_Delivery_Control/v9.24_restraint_integration_DRAFT/tests/model924.cjs
    node 03_GC500_Delivery_Control/v9.24_restraint_integration_DRAFT/tests/persistence924.cjs
    python 03_GC500_Delivery_Control/v9.24_restraint_integration_DRAFT/patch_v924.py <candidate.html>

For the browser test set `PAGE` to the exact combined candidate, `NODE_PATH` to the installed toolchain dependencies and `CHROMIUM_PATH` to the installed browser. The standard read-only harness aborts every HTTP write. Isolated synthetic captures replace the native saver and restore in-memory state.
