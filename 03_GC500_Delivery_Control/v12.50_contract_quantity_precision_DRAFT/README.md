# v12.50 — preserve contract source quantity precision

Author: Andrew Fisher

DRAFT CHECKED — not READY and not live. This successor requires exact v12.49 SHA-256 `70fc77540686f3139be01049cf4d2c13e0b8e307d221f062e2177afb8586d19e`. Codex implements/tests; Claude owns guarded publication after the predecessor is independently verified live and the shared build reproduces the tested bytes.

Six imported contract quantities were truncated to integers even though the source workbook retains decimals. This patch restores only those six existing source quantities and changes the footer version. It preserves the separate approved event-scope hours and pricing. It does not multiply those quantities into new charges, replace the import, change rates or alter site quantities and completion records.

The public source is the already-tracked `review_27Oct2026_baseplan8/GC500_Baseplan8_vs_Site_27Oct2026.xlsx`, sheet **Every line**, cells F136, F137, F231, F270, F386 and F387. Git blob `c4dd2a1d5ce7dcb96064fddd748958bdb1fc40af` is present at source commit `752328e1c4bd88c2292dc62a23b92465668fc9e4`. The accompanying JSON records the bounded identities and source provenance. No new private workbook or operational fixture is included.

## Exact boundary and tested candidate

Candidate SHA-256: `7ea8e4d2b8230bdece88a7d566c8ae8d2eea63892b8ba1b928a3440149ca4404`, 16,099,369 bytes.

The patch requires the explicit predecessor hash/version and exact source-manifest fingerprint. Each row must match its contract/line, original quantity, description, item type, branch, sales category and absence of an operational reference. It replaces only the exact original row object, without reserializing the dataset. Full reversal recovers the exact predecessor byte for byte; all original code and styles remain.

- Ten source-workbook, identity, old-value, wrong-base, repeat, CLI and reversal tests pass.
- Shared page checker: all 217 inline scripts parse; author/key checks pass.
- Native differential: 800 assertions pass on record11733 at one fixed instant. All 378 native charges, ownership/categories/branches, financial ledgers, customer and supplier totals, approved scope, monthly Finance, Build and physical asset projections stay unchanged. Only the six source quantities, their billing-quantity echoes and footer differ. Documents remain exact, with zero runtime/console errors or attempted writes.
- Actual phone proof opens the existing Costs street-card disclosure. All six complete decimal quantities are visible using native horizontal table scrolling. Exact text-range bounds and three hit-tests across each quantity prove the digits are not covered by the existing sticky column. All six screenshots were inspected. The native footer text identifies v12.50; the existing phone footer is ellipsized, so no visual version claim is made. Native ledger, scope and documents remain unchanged. The existing table layout is retained; this is not a layout redesign. Phone screenshots are inspected and kept privately.
- Full desktop and phone navigation sweeps pass: 27 tab attempts, seven deep links and Back on each, zero runtime/console errors or writes. Existing view-only redirects match v12.49.

## Reproduce

Source/boundary test using a private exact predecessor:

```sh
BASE=/private/path/candidate49.html python3 tests/test_patch_v1250.py
```

Native checks take explicit private `BASE`, `PAGE`, `STATE`, `OUT`, `BASE_SHA`, `PAGE_SHA` and `FIXED_TIME`. Run `node tests/native_precision.cjs` and `node tests/phone_precision.cjs` under the shared browser lease. The financial comparison intentionally permits only the six reviewed quantity fields and version footer to differ; it does not normalize financial amounts.

After exact v12.49 is independently verified live, run from the repository root:

```sh
GC500_V1250_BASE_SHA256=70fc77540686f3139be01049cf4d2c13e0b8e307d221f062e2177afb8586d19e \
GC500_V1250_BASE_VERSION=12.49 \
bash 03_GC500_Delivery_Control/toolchain/build.sh v12.50 \
  03_GC500_Delivery_Control/v12.50_contract_quantity_precision_DRAFT/patch_v1250.py
```

Require exact tested output, current-record preservation and a READY entry before guarded upload/public read-back. This draft is not authority to upload out of sequence or to alter other source data.
