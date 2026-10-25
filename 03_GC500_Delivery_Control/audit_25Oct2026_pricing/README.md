# Independent pricing regression audit

Author: Andrew Fisher

Read-only audit of the v12.16 pricing/data changes retained in verified live v12.17, source `83a84b8aea5149e9e26b8e99d6043557f14b9d84`.

These checks characterise the existing docket calculation. They do not approve the newer invoice-based workbook at `744dd539a5c93411f978fb72c9a5a9008456e38e` or its proposed page/P&L change. Claude's hold in [comment 6393794320](https://github.com/tatts29-svg/fish/pull/1#issuecomment-6393794320) remains in force; Claude retains that scope. No production pricing function, fencing line or P&L calculation is changed by this audit.

Page SHA-256: `1c1a981c3f674c481a0c99e13cb4b93d311396132af54bef5bd66d401addd5f5`.

The synthetic contract suite protects new installations, later scrim retrofits, mixed work, approved supplier pricing, unpriced lines, source quantity preservation and repeated application. Its invented rates and references are fixtures only. Run with:

```sh
node tests/test_fence_contract.cjs
```

Live operational snapshots, source notes and financial results remain in private evidence outside the repository. This is an audit and test addition, not a page release or operational record change. It does not establish physical-device performance or crew readiness.

## Result

13/13 synthetic contract checks and 14/14 retained-release regression checks pass against the verified current page. The live page and record version stayed stable throughout the review; no page errors or record-write attempts were observed. No new confirmed code defect was found in this bounded scope. Actual handset behaviour remains outside this evidence.

The original release comparison can be rerun on the pinned archived baseline and audited current page:

```sh
BASE=/private/v12.15.html BUILD=/private/v12.17.html PRIVATE_LOG=/private/regression.log node tests/run_retained_regression.cjs
```

The wrapper keeps the original 14 checks and adapts only its import path and expected current footer. Output containing financial details is captured to the private log.
