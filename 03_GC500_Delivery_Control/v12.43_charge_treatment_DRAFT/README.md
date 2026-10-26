# v12.43 confirmed customer-charge treatments — DRAFT

Author: Andrew Fisher

The existing Costs controls can record an evidenced customer-charge decision for an exact contract hire line, quoted water service or confirmed whole-crew event scope. The decision keeps its reason, source, named confirmation, date and revision history. Own-use hire and hire covered by another customer charge remain distinct. A water inclusion removes only the separate customer water charge.

An explicit customer event-hours decision uses the three recorded daily crew totals at the unchanged customer rate. Supplier actual hours alone do not change customer Revenue. The entire original individual plan remains visible as source only; no individual actual hours are inferred. Other customer roles, supplier Direct costs, physical records, source quantities and rates remain separate.

Each decision binds the current source and relevant overrides. Changed evidence, unsupported scope or a conflicting revision restores ordinary pricing and shows a review warning. Native save checks the source again independently of the render cache. Clearing or replacing a valid decision retains its history. The generic Questions editor cannot overwrite these decisions.

No private approval, operational quantity or financial amount is embedded in this source. Publication alone changes no record or charge. Separately authorised record updates require native functions, a reviewed dry run, backup and exact read-back.

## Status and source

The aggregate customer-hours extension has passed its narrow source review and is frozen for final native verification. This is **not READY TO UPLOAD**. All earlier builds are superseded.

- `charge1239_src.js`: SHA-256 `f87092bc21613af356677890f18300a2f9c366b8c19b65e911e62e09b9cdf7e0`.
- `patch_v1243.py`: SHA-256 `61c06e5e21570a68fe663a1a5d0fcce9c62a325a0be15b90a54f2cbff425c563`.
- The patch requires the event-crew and performance modules, exactly one v12.41 or v12.42 footer, and an explicit matching base SHA-256 through `GC500_V1243_BASE_SHA256` (or the Python `expected_base_sha` argument). It refuses old bases, changed bytes and repeated application.
- Release-only rename from v12.39 follows claim `f70e3cc061f9b9dee3ea984548cd958b28e652e1`. The `ChargeTreatment1239` API, `charge-treatment1239|` keys, module marker and decision history remain unchanged.

## Checks and next action

Pure resolver checks: 88/88. Native API fixture checks: 71/71. New aggregate customer-hours checks: 28/28, including the actual event-note validator with fictional evidence, changed-note/rate/scope/override holds, retained source plan and decimal-cent rounding. A thousand inactive projections perform no note scans; a thousand active projections in a held render validate membership once, without calling supplier or Finance models. Actual CLI application/refusal checks: 8/8, including missing or mismatched base SHA, old footer and missing performance module. This was offline compatibility testing on a captured moving v12.41 draft; it is not a verified-live build or release proof.

The earlier covered-hire review passed 19 adapter and 9 reporting checks; the narrow aggregate source review passed, including the original customer-plan binding and monetary projection. Required remaining gates are the final latest-base build, native whole-page financial preservation, exact decision rehearsal, phone review, both navigation sweeps and performance comparison against the latest performance release. The release owner must use the guarded uploader and verify exact live bytes. Other agents’ scopes remain under their existing owners.
