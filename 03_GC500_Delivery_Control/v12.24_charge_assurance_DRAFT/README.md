# v12.24 — charge assurance

Author: Andrew Fisher

**DRAFT — revised model corrections and final checks in progress. Codex owns publication.**

Andrew asked for the charges to be reconciled to the cent before finalising the bill. Costs now has a compact charge-check card showing recorded charges, the priced job-end subtotal excluding fencing demob, the existing forecast bridge, Revenue by branch and referenced scope/coverage reviews. Figures reconcile is an arithmetic result, not invoice approval. Outstanding supplier actuals remain a separate Direct-cost review.

The patch applies existing charge treatments consistently in the shared source-request and generator forecasts, retains cent precision in the shared difference model, reconciles a bounded source-rate typo to its existing card line, and suppresses one superseded reservation only when the confirmed physical allocation and charge coverage establish it. Explicit rate overrides, actual receipts and successive hires are preserved. Contract details visibly explain the retained source rate beside the corrected charge, using the same shared calculation basis. It does not introduce a new rate table, change operational records or branch attribution, or issue an invoice. Exact private findings and figures are kept outside this public repository.

- Branch: `ccr-061f77e8-ivjhrv`; claim `a50f193f7f9c4611af2d93d2ecf95ba14fb30236`.
- Base: verified v12.23 `8112a63d10c5b6c88206a539af5a59dc1037176e414a95f20d253b16f844e257`.
- Revised candidate: `cffcb51b699ca504381c6dbf4a5587695a7d978d17781a8b8860a9c1cc3cb684`, 15,410,423 bytes.
- Shared checker: 202 inline scripts; no new credentials.
- Pure checks: 97 passing cases: 9 decimal-cent, 13 treatment/projection, 14 assurance-adapter, 12 card-reconciliation and 49 reservation-transition cases.
- Exact preservation: 209 checks; existing styles, source data and all unrelated scripts retained.
- GET-only native checks passed: 17 desktop and 18 phone, zero page errors or record-write attempts. Recorded charges change only by the bounded card reconciliation; all other recorded contract amounts, source fields and Direct costs remain unchanged. Phone card framing and the editor-only reconciliation explanation inspected. Existing viewer restriction is explicitly tested.
- Both full release sweeps are running on this candidate; not READY until they pass.
- Earlier candidate `f3cb938456281fef3e9ea7a1ac912be52576c09e7101a2bb8d8faa8034432430` passed both full sweeps but is superseded; do not upload it. The adapter also applies the existing exclusion authority to review flags.

Implementation and testing: Codex, with independent arithmetic, scope-coverage and source review. No Claude review of this release claimed. Source reconciliation and arithmetic checks remain distinct from invoice approval. Detailed evidence stays in authorised private storage.

## Reproduce

Build with the shared toolchain:

```sh
bash 03_GC500_Delivery_Control/toolchain/build.sh v12.24 03_GC500_Delivery_Control/v12.24_charge_assurance_DRAFT/patch_v1224.py
```

Run `node --test` on `tests/test_checks1224.cjs`, `tests/test_assurance1224.cjs`, `tests/test_scope1224.cjs`, `tests/test_source1224.cjs` and `tests/test_superseded1224.cjs`; the scope/source/superseded tests take `PAGE` pointing at the candidate. The preservation test takes `PAGE` and `BASE`. Native checks take `PAGE`, `OUT` pointing to a private capture outside the checkout, optional private `BASE_MODELS` for before/after preservation, and optional private `EVIDENCE` for screenshots; `MOB=1` selects phone. Every native request is guarded by the shared read-only harness.

Use both shared harness sweeps and the guarded uploader after final checks. The patch requires the exact base and rejects a repeat application.
