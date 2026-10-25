# v12.24 — charge assurance

Author: Andrew Fisher

**DRAFT — final native and release checks in progress. Codex owns publication.**

Andrew asked for the charges to reconcile to the cent before finalising the bill. Costs now has a compact charge-check card with the recorded charge, priced job-end subtotal excluding fencing demob, forecast bridge, Revenue by branch and actionable source/coverage reviews. Arithmetic reconciliation does not certify a bill.

The shared model now applies existing exclusions and superseded-reservation decisions consistently, retains cents in the difference calculation, corrects two bounded source-rate errors against the existing card, and restores an installation rate for an exactly identified restored reference. Explicit rate overrides, unticks, actual receipts and successive hires are preserved.

Five priced contract-service rows already documented in the repository's review workbook are included once through the canonical contract reader. Installation, Transport and miscellaneous services keep their source categories and branches. Miscellaneous ledger allocation and combined work-month allocation remain explicitly unresolved. Existing raw rows and operational records are preserved; no physical completion, per-unit allocation or invoice issuance is inferred. Source-rate explanations respect existing viewer access restrictions. Private source findings stay outside this repository.

- Branch: `ccr-061f77e8-ivjhrv`; original claim `a50f193f7f9c4611af2d93d2ecf95ba14fb30236`.
- Base: verified v12.23 `8112a63d10c5b6c88206a539af5a59dc1037176e414a95f20d253b16f844e257`.
- Final batch candidate: `26aa75e2b2bbbebd104bd1662562614da8b40151001cdf835e1dcb3fdfaaee61`, 15,425,337 bytes.
- Shared checker: 202 inline scripts, passed.
- Focused checks: 126 passing cases across decimal cents, treatment/projection, adapter, rate reconciliation, reservation transitions, restored identity and contract-service coverage.
- Strict source/script preservation: 27/27, retaining all 299 prior runtime rows and permitting exactly five source additions.
- GET-only native checks: desktop 19/19, phone 20/20, no errors or write attempts. Source-category and installation tie checks passed; phone card and restricted editor explanation inspected.
- Both complete navigation sweeps are running on this exact candidate. Current state is DRAFT, not READY.
- All earlier v12.24 candidates are superseded and must not be uploaded.

Implementation and testing: Codex, with independent arithmetic, scope-coverage and source review. No Claude review of this release claimed. Detailed evidence stays in authorised private storage.

## Reproduce

Build with the shared toolchain:

```sh
bash 03_GC500_Delivery_Control/toolchain/build.sh v12.24 03_GC500_Delivery_Control/v12.24_charge_assurance_DRAFT/patch_v1224.py
```

Run `node --test` on `tests/test_checks1224.cjs`, `tests/test_assurance1224.cjs`, `tests/test_scope1224.cjs`, `tests/test_source1224.cjs`, `tests/test_superseded1224.cjs`, `tests/test_generator_identity1224.cjs` and `tests/test_bulk1224.cjs`. Tests that inspect a candidate take `PAGE`; the bulk test also takes `BASE_PAGE`. Preservation takes `PAGE` and `BASE`.

Native checks take `PAGE`, private `OUT` outside the checkout, optional private `BASE_MODELS` for before/after preservation, and optional private `EVIDENCE` for screenshots; `MOB=1` selects phone. Every native request uses the shared read-only harness. Run both shared harness sweeps and the guarded uploader only after the final gates. The patch requires the exact base and rejects repeated application.
