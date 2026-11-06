Author: Andrew Fisher

State: VERIFIED LIVE within v9.28 — 9 Oct 2026 03:28 AEST. Public page SHA256 `592e73b38e8c5fb1d5bf98d00915c49550ab860b322f82fb957a99acc0369093` (12,262,425 bytes). The guarded upload verified the full served bytes. Combined evidence is in `../v9.28_finance_attribution_LIVE/evidence/combined_release.json`.

Transport specifications and original Load Restraint Guide references, integrated into existing equipment drawers, Timeline load actions, shared-load proposals, driver sheets, Demob and Documents. The integration is included in the verified combined v9.28 release.

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
- Final targeted combined-release browser verification passed on exact v9.27 candidate `04b40af60cf151b4a0c4467abcdabc31d9a688f01e8197b355e3a3d64ccb0a09`: 274 catalogue rows, 182 equipment references, 250 identified physical rows and no missing identities. There were 89 references with guide candidates and zero verified actual specifications. Phone unit/source and searchable catalogue screenshots were visually checked. Unit/load form capture, unchecked reference copying, failed-save rollback, concurrent unit/load changes, Timeline/driver/Demob hooks and 10 measured A4 supplements passed. Zero runtime errors, 71 reads and zero HTTP writes. Evidence remains private in `/workspace/private-restraint924-final927/`.
- The browser fixture explicitly isolates native subscriptions and view-permission polling while substituting an in-memory saver; it restores the record and permissions afterward. This tests native document shape and failure handling without changing production. The print container is created on demand as in the native print flow. The root task owns the full combined phone/desktop sweeps and guarded publication.
- `tests/print924.cjs` separately exercised native `dpPrint` and its existing fit/cut/PDF callback on the same final candidate. The selected 20-unit load produced 13 native pages, including 10 restraint supplements; zero image failures, no native overflow, every supplement footer inside its A4 page, zero runtime errors and zero HTTP writes. The actual PDF supplement was rendered and visually checked. This replaces the mobile print-emulation locator screenshot, which captured an incorrect viewport segment.

Commands (from repository root)

    node 03_GC500_Delivery_Control/v9.24_restraint_integration_LIVE/tests/model924.cjs
    node 03_GC500_Delivery_Control/v9.24_restraint_integration_LIVE/tests/persistence924.cjs
    python 03_GC500_Delivery_Control/v9.24_restraint_integration_LIVE/patch_v924.py <candidate.html>

For the browser test set `PAGE` to the exact combined candidate, `NODE_PATH` to the installed toolchain dependencies and `CHROMIUM_PATH` to the installed browser. The standard read-only harness aborts every HTTP write. Isolated synthetic captures replace the native saver and restore in-memory state.
