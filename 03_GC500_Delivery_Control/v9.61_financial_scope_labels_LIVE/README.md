# Financial scope labels

Author: Andrew Fisher

Verified LIVE on 9 October 2026 at 16:29 AEST as part of the combined v9.63 release. READY source commit `2a9c771e`; public SHA-256 `d98bfc4b6bb8461feec1f4af31a7d69fdd0711f2979d27bae4c324d7f8001ae6`, 12,762,245 bytes. Guarded upload and fresh actual-public checks passed on unchanged record 5155. Today, Equipment and Sub-hired quantities, partial-reference badges and source qualifications agree; all 16 paper records still resolve to 17 originals. Publication verification is saved in v9.63’s evidence folder.

Integrated and published with v9.63 after v9.60. This is a description change: financial amounts,
rate rules, supplier forecasts, branch allocations and operational records are unchanged.

Traffic and Buildings no longer claim that every contract item belongs to Coates.
Existing supplier-cost captions now distinguish a linked recorded cost, a calculated
supplier-rate forecast and a missing source rate. They read the native source evidence,
forecast model and supplier/contract/line matcher. A recorded cost does not confirm
that its whole hire period has been reconciled. No new card or duplicate total is added.

The Rehire comparison is explicitly grouped by Revenue branch. Its existing group
costs remain beside the Revenue they relate to; Finance continues allocating Direct
costs to the documented cost branch. Where those branches differ, the group states
both branches. This avoids presenting a recovery comparison as a cost-ledger allocation.

Checks: the focused Node test uses the unchanged native Source949 functions, including
partial and full actuals, zero rates, unknown periods, mismatched supplier/contract/line,
idless actuals and held estimates. A fresh cleared-cache private native snapshot verifies
15 SUB lines, nine calculated forecasts and six missing linked supplier rates, plus
eight PremiAir and one Royal Wolf branch distinctions. Patch checks verify exact anchors,
wrong-base/reapplication refusal and unchanged financial model functions and source data.

Component checks use the v9.60 owner's isolated component fixture. Root owns the actual
v9.58–v9.61 combined build, final native/sweep checks, phone inspection and publication.
No standalone page or operational record has been uploaded by this worker.

Run from this folder with a valid predecessor and the private snapshot path:

```sh
BASE_PAGE=/path/to/v9.60.html node test_scope961.cjs
BASE_PAGE=/path/to/v9.60.html python test_patch961.py
```

Optional `NATIVE_SNAPSHOT` points to the cleared-cache private financial capture for
the source-linked count assertions. Original documents and detailed financial snapshots
remain outside Git.

## Combined release verification

Final pre-publication verification for v9.58–v9.63, 9 October 2026. Final standard-build SHA-256 `d98bfc4b6bb8461feec1f4af31a7d69fdd0711f2979d27bae4c324d7f8001ae6`, 12,762,245 bytes; exact live v9.57 base `1f04615f0c941e1c6c2b45e0656fc92e2bd816998a7b5f2d428f1e1b0e4a6cb0`. All 48 scripts parse. Final source checks (214 programme, 50 fencing and 65 toilet), 153 financial checks and 17 native ties pass. Both desktop and phone sweeps pass 22 routes, seven deep links and Back. All 21 incoming-record scenarios across seven tabs pass, with native record 5155 and actual charges/costs unchanged. Final phone layouts were inspected. Sixteen signed papers link to 17 original photographs. Detailed sanitised combined evidence is in the v9.63 release folder.

The final update replay exposed an intermediate WC09 partial-receipt regression. It was corrected and independently reviewed before rebuilding and repeating final checks; the superseded candidate was never published. Missing receipts and conflicting source scopes remain explicit.
