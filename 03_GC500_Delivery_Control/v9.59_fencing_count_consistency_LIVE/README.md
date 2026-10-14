# Fencing counts and source consistency — v9.59

Author: Andrew Fisher

Verified LIVE on 9 October 2026 at 16:29 AEST as part of the combined v9.63 release. READY source commit `2a9c771e`; public SHA-256 `d98bfc4b6bb8461feec1f4af31a7d69fdd0711f2979d27bae4c324d7f8001ae6`, 12,762,245 bytes. Guarded upload and fresh actual-public checks passed on unchanged record 5155. Today, Equipment and Sub-hired quantities, partial-reference badges and source qualifications agree; all 16 paper records still resolve to 17 originals. Publication verification is saved in v9.63’s evidence folder.

Published with v9.63 after combined release testing. No live record changes are made by this patch.

The fencing count readers now include every programme metre category, including 42 m of flat-feet CCB work against its 256 m programme. Physical components show the separate 19 flat-feet barriers without adding them to bases or ordinary CCBs.

Hire agreement 36595 has 10 m / four CCBs whose Event or Demarcation category remains unproven. Its dated, usable record and original photo checksum must match exactly before the 10 m joins the shared pending CCB quantity. It is counted once across the two possible categories and once in the Fencing overview. No category, rate or charge is inferred. Missing or altered evidence withholds the affected percentage. The existing source drilldowns support flat-feet and unclassified CCB work.

Reviewed service notes 24469 and 24474 add 17.5 m and 25 m of temporary-fence relocation to physical work. Original photos, full record fingerprints and the existing red-book overlap snapshot must all match. Dates remain 6 October and 9 October. The patch neither creates new hire nor changes Revenue, Direct costs, invoices or native state.

Source reconciliation also verified that S10 scrim 150 m from service note 24472 is **already counted** by native service-work record F-AFV-0026, linked to hire agreement 36532. It is not added again. The original 36532 expressly says the existing 150 m fence was not yet scrimmed. Service 24471 describes 65 m CCB relocation, which does not belong in the temporary-fence relocation denominator. Service 24473’s 150 m Pit Lane existing-fence scrim remains a reconciliation item: no unidentified overlap is assumed away. Collection piece counts remain separate gross activity; they are not converted to new removal metres or subtracted from installed work.

On frozen record 5155, at 9 October 2026:

| Reading | Before | After |
|---|---:|---:|
| Programme work metres recorded |13,652.5|13,747|
| Programme work metre denominator |22,107|22,363|
| Qualified overall work percentage |61.76%|61.47%|
| Temporary-fence relocation work |327.5 m|370 m|
| Scrim work |1,507.5 m|1,507.5 m|
| Flat-feet work |omitted from Today|42 m / 256 m|
| Flat-feet components |omitted from component reader|19 each|
| Fencing overview CCB work |3,977 m|3,987 m|

The percentage measures recorded work against each category's capped scope, not unique standing fence stock or signed physical completion. Clean work, scrim and relocation may concern the same fence. No excess in one category satisfies another category's shortfall. Overall progress retains provisional programme warnings; gates and components remain separate units.

Validation: isolated frozen-record tests cover all three confirmed quantities, exact fingerprints, altered/missing photo hashes, duplicate records/operations, changed overlap, as-of dates, independent component/collection counts, bounded percentages, preservation of native state, and byte-identical v9.58 charging/forecast functions. `test_patch959.py` checks predecessor and second-application rejection. Final combined native checks, desktop/phone sweeps and screenshot inspection are owned by the release coordinator.

Private evidence inputs: central snapshot `/workspace/private-fencing958/cross-tab/snapshot.json` (record 5155) and current GET-only files index `/workspace/private-fencing958/files959.json`. The release source embeds only the minimum source metadata and exact record signatures required for read-only guards. The original papers remain linked in the native document library.

Current checks: 50 model and preservation checks, five patch/build-scrub guards, and eight independent review checks pass. The final combined run includes the optional byte-preservation comparison against the standard v9.58 predecessor. Independent review also replayed the initial component checks; final combined native and visual checks are recorded separately.

The standard build exposed an attribution-scrub regression in a reserialised source fingerprint. The patch preserves its exact runtime name using a JSON Unicode escape. A fifth patch regression check runs the actual standard scrub and requires the entire source catalogue to remain equal; all 49 count checks pass on the standard combined build. This changes no record or displayed name.

## Combined release verification

Final pre-publication verification for v9.58–v9.63, 9 October 2026. Final standard-build SHA-256 `d98bfc4b6bb8461feec1f4af31a7d69fdd0711f2979d27bae4c324d7f8001ae6`, 12,762,245 bytes; exact live v9.57 base `1f04615f0c941e1c6c2b45e0656fc92e2bd816998a7b5f2d428f1e1b0e4a6cb0`. All 48 scripts parse. Final source checks (214 programme, 50 fencing and 65 toilet), 153 financial checks and 17 native ties pass. Both desktop and phone sweeps pass 22 routes, seven deep links and Back. All 21 incoming-record scenarios across seven tabs pass, with native record 5155 and actual charges/costs unchanged. Final phone layouts were inspected. Sixteen signed papers link to 17 original photographs. Detailed sanitised combined evidence is in the v9.63 release folder.

The final update replay exposed an intermediate WC09 partial-receipt regression. It was corrected and independently reviewed before rebuilding and repeating final checks; the superseded candidate was never published. Missing receipts and conflicting source scopes remain explicit.
