SUPERSEDED — 28 Oct 2026: later v12.42 financial releases implement overlapping decisions. Do not apply this patch or its old record runner. Current responsiveness work is in ../v12.43_responsiveness_DRAFT/; remaining consistency work is separately claimed as v12.44.

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
- `patch_v1243.py`: SHA-256 `58de06648489b74c7f569a888525810abf275f9ec9c0d3f92246631f2b70a315`.
- The patch requires the event-crew and performance modules, exactly one v12.41 or v12.42 footer, and an explicit matching base SHA-256 through `GC500_V1243_BASE_SHA256` (or the Python `expected_base_sha` argument). It refuses old bases, changed bytes and repeated application.
- Release-only rename from v12.39 follows claim `f70e3cc061f9b9dee3ea984548cd958b28e652e1`. The `ChargeTreatment1239` API, `charge-treatment1239|` keys, module marker and decision history remain unchanged.
- Verified live base: v12.41 `e106502b347cb51519f6aaed1eec5b6ba20a301b06490df04e3d29569d55b422`. Current diagnostic build: `28ea59432b7472bf76c6eba52753fdfdfc74cb4c467ac648390703642dc2c955`, 15,649,549 bytes, 213 inline scripts checked. Final publication still requires the verified v12.42 successor.

## Checks and next action

Pure resolver checks: 88/88. Native API fixture checks: 71/71. New aggregate customer-hours checks: 28/28, including the actual event-note validator with fictional evidence, changed-note/rate/scope/override holds, retained source plan and decimal-cent rounding. A thousand inactive projections perform no note scans; a thousand active projections in a held render validate membership once, without calling supplier or Finance models. Actual CLI application/refusal checks: 8/8, including missing or mismatched base SHA, old footer and missing performance module. The earlier CLI compatibility checks used a captured moving draft; the subsequent formal build above used the independently verified live v12.41 page. Neither is a publication claim.

The financial/data implementation and initial responsiveness helpers were verified on predecessor `13cfeb20458d097ffbb148ec5f9c0b2ba3f61c02cd2a99f9e5b95d3c4e002fa3`: 34/34 whole-page preservation, 36/36 isolated native edit checks and 10/10 phone checks. These retain supplier components, branch costs and source evidence, reject stale evidence, restore the exact record and produce no runtime/console errors or HTTP writes. Evidence is summarised in `RESPONSIVENESS_CHECKS.json`.

The current `28ea5943` build adds only two visibility guards to defer the hidden Costs alignment decoration; financial/data code is unchanged. Its 20 focused and 13 native phone comparison checks pass, with the same active report, preserved native records and no errors or HTTP writes (`STARTUP_ALIGNMENT_CHECKS.json`). Startup remains unresolved; the timing sample is not an overall speed sign-off. Required final gates are the verified v12.42-based build, fresh-record native checks, phone review, both complete navigation sweeps and performance verification. Use the guarded uploader and verify exact live bytes. Other agents’ scopes remain with their current owners.
