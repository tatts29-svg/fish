# v12.49 — priced contract labour in Installation

Author: Andrew Fisher

READY TO UPLOAD — not live. Frozen implementation/tests source `4764d0fd6dfde69ef1d93a79655285ae107c1712`. Codex independently fetched the full public v12.48 page on 28 Oct 2026 at 16:24 UTC: SHA-256 `39836e1521ace88ea9142c393fdfe1cac90cae0876a954a699121729e323416b`, 16,097,456 bytes, identical to the tested predecessor. The fresh record is byte-identical to the tested record11733. The shared live-base build then reproduced the exact v12.49 candidate below, with all 217 inline scripts passing. Claude owns guarded publication and public read-back; Codex independently verifies the result.

Six priced contract LABOUR lines carry Installation sales categories but lack the source export's `charge_line` flag. The page consequently puts their existing amounts into Hire Revenue. This bounded correction recognises those exact source identities and categories without changing the source flags. The shared classifier routes them into Installation 1047 in the headline, P&L, streams, branch details and contract summary.

The native pricing chain remains authoritative. Customer amounts, supplier Direct costs, branch attribution, source quantities, dates and operational records stay unchanged. The original contract row and every native pricing field are retained; the classification adds the correct ledger marker. The six lines are excluded from the contract summary's equipment subtotal and missing hire-rate controls. An unrelated or changed source identity, branch, sales category or sub-hire line is not reclassified.

Build's equipment Revenue summary uses the same exclusion as other job-level Installation charges: reviewed labour remains in Costs and the whole-job customer total, rather than being presented as equipment hire. The Build cards and their operational facts are unchanged.

Monthly Finance uses the existing unallocated Installation treatment for these combined labour amounts because no split by confirmed work month is established. Their complete amounts and branches remain explicit. No equipment hire period is used as a labour work date, and no invoice or payment status is inferred. Wider P&L presentation and questions cleanup are separate scopes.

## Checks and boundaries

The helper does not call the pricing function, avoiding recursive classification. The adapter preserves the existing native pricing chain. Nine exact replacements connect the shared classifier to its current consumers; reversing the patch must recover every byte of the reviewed predecessor. All original styles are preserved.

Completed on the reviewed v12.48 base: 151 synthetic classifier assertions, 15 tests of the actual native classification/contract/branch/Build equipment functions, eight patch-boundary tests, and the shared 217-script page check. The v12.49 bytes are SHA-256 `70fc77540686f3139be01049cf4d2c13e0b8e307d221f062e2177afb8586d19e`, 16,099,353 bytes. Independent source review and exact before/after reversal pass; its active Build consumer finding is resolved using the same classifier.

The native differential passes 781 assertions against one frozen private record and fixed comparison time. Source records, prices, customer totals, supplier costs and branch totals stay unchanged; the existing labour amounts move once from Hire Revenue to Installation in each affected shared presentation. Monthly Finance preserves every unrelated source, and Build retains every operational projection. Normal initialisation has no runtime or console errors and no attempted writes; no helper is preloaded by the test.

The focused mobile check opens the existing **More info · ledger lines and sources → Other Revenue** disclosure and verifies the visible **1047 Installation** card, its Current record and Job total amounts, phone bounds and unchanged documents/ledger. The actual screenshot was inspected. Detailed figures and screenshots stay outside the repository.

The full desktop and phone navigation sweeps both pass: 27 routes, seven deep links and browser Back, with zero runtime errors, console errors or attempted writes. Native view-only redirects and deep-link destinations exactly match the predecessor. Source and tests are frozen on the candidate above. The predecessor and shared-build gates closed on 28 Oct 2026 at 16:25 UTC: both exact page hashes and the current record match the existing completed tests. No implementation or candidate bytes changed. A separate read-only review confirmed the frozen source and evidence; no broader repeat test or new runtime-performance claim is made.

Run source checks with private inputs:

```sh
node tests/classification.cjs
BASE=/private/path/live48.html PAGE=/private/path/candidate49.html node tests/native_categories.cjs
BASE=/private/path/live48.html python3 tests/test_patch_v1249.py
```

Run the native differential under the shared browser lease with `BASE`, `PAGE`, `STATE`, `OUT`, `BASE_SHA`, `PAGE_SHA` and an ISO `FIXED_TIME` supplied explicitly. Both native model captures use that same Date value; normal timers continue. This prevents a Brisbane-midnight change in time-based Finance amounts from being mistaken for a page change. `OUT` must be outside the repository. The completed native and phone checks used record11733 and fixed Date `2026-10-28T14:48:00.000Z`; private evidence binds their exact state bytes. If the candidate changes, rerun the affected checks before accepting it.

Use `node tests/native_ledger.cjs` for the differential, and `MOB=1 node tests/phone_ledger.cjs` for the native disclosure with the same page, record, time and private output inputs. Run both under `/tmp/gc500-browser.lock`.

Claude: rebuild from the repository root against the independently verified live v12.48:

```sh
GC500_V1249_BASE_SHA256=39836e1521ace88ea9142c393fdfe1cac90cae0876a954a699121729e323416b \
GC500_V1249_BASE_VERSION=12.48 \
bash 03_GC500_Delivery_Control/toolchain/build.sh v12.49 \
  03_GC500_Delivery_Control/v12.49_contract_labour_ledger_DRAFT/patch_v1249.py
```

Require the exact frozen source and READY state on STATUS before publication. Require SHA-256 `70fc77540686f3139be01049cf4d2c13e0b8e307d221f062e2177afb8586d19e`, 16,099,353 bytes. Run the agreed same-record money probe: customer totals, supplier costs and branch totals must remain identical, and the reviewed labour moves once from Hire Revenue 1005 to Installation 1047 without duplicate amounts. If the source, live predecessor or current record changes, reconcile it and rerun affected checks before publication. Use the existing guarded uploader, require full public bytes to match, then archive LIVE and hand back the exact read-back. v12.50 remains a separate checked draft and requires this exact49 successor live before its shared build. No changes to contract prices, business dates, operational quantities or source documents are authorised by this release.
