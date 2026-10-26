# v12.43 responsiveness and confirmed customer-charge treatments — DRAFT

Author: Andrew Fisher

The existing Costs controls can record an evidenced customer-charge decision for an exact contract hire line, quoted water service or confirmed whole-crew event scope. The decision keeps its reason, source, named confirmation, date and revision history. Own-use hire and hire covered by another customer charge remain distinct. A water inclusion removes only the separate customer water charge.

An explicit customer event-hours decision uses the three recorded daily crew totals at the unchanged customer rate. Supplier actual hours alone do not change customer Revenue. The entire original individual plan remains visible as source only; no individual actual hours are inferred. Other customer roles, supplier Direct costs, physical records, source quantities and rates remain separate.

Each decision binds the current source and relevant overrides. Changed evidence, unsupported scope or a conflicting revision restores ordinary pricing and shows a review warning. Native save checks the source again independently of the render cache. Clearing or replacing a valid decision retains its history. The generic Questions editor cannot overwrite these decisions.

No private approval, operational quantity or financial amount is embedded in this source. Publication alone changes no record or charge. Separately authorised record updates require native functions, a reviewed dry run, backup and exact read-back.

The release also removes measured repeated work in navigation and native calculations. [RESPONSIVENESS.md](RESPONSIVENESS.md) records the bounded changes, evidence and remaining performance limits. The existing record and financial preservation gates apply to the combined candidate.

## Status and source

The aggregate customer-hours extension has passed its narrow source review and the current draft has passed native desktop financial checks. This is **not READY TO UPLOAD**. The newer v12.42 handover asks this release to wait; final publication checks must use a rebuild on the verified v12.42 page and a fresh record. All earlier v12.39 and moving-base builds are superseded.

- `charge1239_src.js`: SHA-256 `6538a36a34b525c64f8173dccd4a3f02a73cb892dadbedfe6b69982b8457b394`.
- `patch_v1243.py`: SHA-256 `f024f3a90757ae0003305a4fc7f392428ab2ab8effceb0dff48fd4b7c57be8f8`.
- The patch requires the event-crew and performance modules, exactly one v12.41 or v12.42 footer, and an explicit matching base SHA-256 through `GC500_V1243_BASE_SHA256` (or the Python `expected_base_sha` argument). It refuses old bases, changed bytes and repeated application.
- Release-only rename from v12.39 follows claim `f70e3cc061f9b9dee3ea984548cd958b28e652e1`. The `ChargeTreatment1239` API, `charge-treatment1239|` keys, module marker and decision history remain unchanged.
- Verified v12.41 base: `e106502b347cb51519f6aaed1eec5b6ba20a301b06490df04e3d29569d55b422`. The earlier customer-treatment-only formal build produced candidate `3a87e830f88f96fdebc3880b322ef28c8e1e6538f1061d2151591961645bc5d4` (15,647,033 bytes; 213 inline scripts checked). This is retained draft evidence, not the final v12.42-based release candidate.

## Checks and next action

Pure resolver checks: 88/88. Native API fixture checks: 71/71. New aggregate customer-hours checks: 28/28, including the actual event-note validator with fictional evidence, changed-note/rate/scope/override holds, retained source plan and decimal-cent rounding. A thousand inactive projections perform no note scans; a thousand active projections in a held render validate membership once, without calling supplier or Finance models. Actual CLI application/refusal checks: 8/8, including missing or mismatched base SHA, old footer and missing performance module. The earlier CLI compatibility checks used a captured moving draft; the subsequent formal build above used the independently verified live v12.41 page. Neither is a publication claim.

The earlier covered-hire review passed 19 adapter and 9 reporting checks; the narrow aggregate source review passed, including the original customer-plan binding and monetary projection. The v12.41-based draft passed 34/34 whole-page preservation checks and 36/36 native desktop decision checks, with unchanged supplier components and branch costs, retained source evidence, stale-evidence holds, exact state restoration, and no runtime errors, console errors or HTTP writes. Its private financial review keeps embedded customer-charge metadata distinct from supplier cost components. The combined responsiveness candidate has also passed eight phone navigation checks; later aggregate reuse and control fast paths are under final verification. Both complete navigation sweeps remain required on the final v12.42-based candidate. Required final gates are the verified v12.42-based build, fresh-record native checks, phone review, both navigation sweeps and the performance comparison. The release owner must use the guarded uploader and verify exact live bytes. Other agents’ scopes remain under their existing owners.
