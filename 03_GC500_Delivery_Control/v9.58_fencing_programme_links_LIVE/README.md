# Reviewed fencing programme links — v9.58

Author: Andrew Fisher

Verified LIVE on 9 October 2026 at 16:29 AEST as part of the combined v9.63 release. READY source commit `2a9c771e`; public SHA-256 `d98bfc4b6bb8461feec1f4af31a7d69fdd0711f2979d27bae4c324d7f8001ae6`, 12,762,245 bytes. Guarded upload and fresh actual-public checks passed on unchanged record 5155. Today, Equipment and Sub-hired quantities, partial-reference badges and source qualifications agree; all 16 paper records still resolve to 17 originals. Publication verification is saved in v9.63’s evidence folder.

Eight signed agreements now have guarded references to their named tasks in the supplied 2026 fencing programme. These references appear in existing docket details; the two affected CW1 task rows and weekly basis also show the planning adjustment. No map position or whole-area completion is inferred.

Docket 36592 records 132.5 m clean fence at Monster on 9 October. Its matching CW1 allowance is 135 m clean fence plus one vehicle gate. Docket 36588 records 95 m clean and 95 m scrim at Club 500 Toilets on 9 October, against a retained CW1 allowance of 85 m of each. Those actuals remain in Week 2, with all original money, dates, scope, components and source records unchanged.

The weekly comparison has a separate `forecastOnPlan` quantity. It removes the full 227.5 m clean and 95 m scrim from Week 2 plan credit and applies only 217.5 m clean and 85 m scrim to Week 1. Monster retains 2.5 m clean fence and one gate outstanding. Club 500's 10 m clean and 10 m scrim above its allowance remain actual variance; they do not reduce unrelated task allowances. The existing cost-to-complete calculation uses the resulting `remaining` quantities. Actual `done`, `onPlan`, `offPlan`, docket counts and money remain unchanged.

Every match requires one exact current docket, its signed photo, the verified current programme file, one unchanged programme row, and matching file hashes. The two forecast adjustments additionally require the verified CW1 PDF, unchanged current task snapshots/totals/revision and unique native work-week mappings. Missing, changed or duplicated evidence withholds the entire paired adjustment and displays the reason. It never removes only one side. Six other associations provide source references only; planned scrim and gates are not proof they were installed.

The reviewed programme source is `GC500_2026_Coates_Fencing_Programme_Reviewed_09Oct2026.xlsx`, SHA-256 `836a3e1036c660caa89b1b36d4b821e2f84df7a8d8b977068b13a4f07602d9db`. CW1 is `05_CW1_Fencing_Installation_Plan.pdf`, SHA-256 `d7287c2cb05f69677d954c6daf9bd086666ba54535ecb91e7d8fe6e0847fa661`. The full exact cell references, source hashes and reviewed native fingerprints are in `programme958.js`.

The strict patch requires v9.57, rejects repeat application and uses unique replacement anchors. Local validation passed 214 source, quantity, mutation, preservation and script-parsing checks plus five patch guards. Evidence is in `evidence/component_checks.json`. Release coordination owns final combined build, native/browser/financial verification and publication; this folder does not claim publication.

Run the focused tests with `PAGE`, `BASE_PAGE`, `SNAPSHOT` and `NATIVE_SNAPSHOT` pointing to private candidate, exact v9.57 base, reviewed association snapshot and final native capture respectively. Run `test_patch958.py` with `BASE_PAGE`. Private original files and native snapshots are not copied into this folder.

## Combined release verification

Final pre-publication verification for v9.58–v9.63, 9 October 2026. Final standard-build SHA-256 `d98bfc4b6bb8461feec1f4af31a7d69fdd0711f2979d27bae4c324d7f8001ae6`, 12,762,245 bytes; exact live v9.57 base `1f04615f0c941e1c6c2b45e0656fc92e2bd816998a7b5f2d428f1e1b0e4a6cb0`. All 48 scripts parse. Final source checks (214 programme, 50 fencing and 65 toilet), 153 financial checks and 17 native ties pass. Both desktop and phone sweeps pass 22 routes, seven deep links and Back. All 21 incoming-record scenarios across seven tabs pass, with native record 5155 and actual charges/costs unchanged. Final phone layouts were inspected. Sixteen signed papers link to 17 original photographs. Detailed sanitised combined evidence is in the v9.63 release folder.

The final update replay exposed an intermediate WC09 partial-receipt regression. It was corrected and independently reviewed before rebuilding and repeating final checks; the superseded candidate was never published. Missing receipts and conflicting source scopes remain explicit.
