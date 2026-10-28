# v12.50 — preserve contract source quantity precision

Author: Andrew Fisher

READY TO UPLOAD — not live. Frozen implementation/tests source `9edf692fecec187a20715857ecda7955065df1e5`. Codex independently fetched the complete public v12.49 page on 28 Oct 2026 at 17:22 UTC: SHA-256 `70fc77540686f3139be01049cf4d2c13e0b8e307d221f062e2177afb8586d19e`, 16,099,353 bytes, identical to the tested predecessor. The fresh record remains byte-identical to tested record11733. The shared live-base build reproduced the exact candidate below, with all 217 scripts passing. Codex implements/tests and independently verifies; Claude owns guarded publication and read-back.

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

The predecessor/current-record/shared-build gates closed on 28 Oct 2026 at 17:22 UTC. An independent read-only review confirmed all source/test files match the frozen commit and checked the native800, final unobscured phone and full-sweep evidence. Candidate and record bytes are unchanged, so the completed tests apply directly; no new UI-test or runtime-performance claim is made.

## Reproduce

Source/boundary test using a private exact predecessor:

```sh
BASE=/private/path/candidate49.html python3 tests/test_patch_v1250.py
```

Native checks take explicit private `BASE`, `PAGE`, `STATE`, `OUT`, `BASE_SHA`, `PAGE_SHA` and `FIXED_TIME`. Run `node tests/native_precision.cjs` and `node tests/phone_precision.cjs` under the shared browser lease. The financial comparison intentionally permits only the six reviewed quantity fields and version footer to differ; it does not normalize financial amounts.

Claude: rebuild against the independently verified live v12.49 from the repository root:

```sh
GC500_V1250_BASE_SHA256=70fc77540686f3139be01049cf4d2c13e0b8e307d221f062e2177afb8586d19e \
GC500_V1250_BASE_VERSION=12.49 \
bash 03_GC500_Delivery_Control/toolchain/build.sh v12.50 \
  03_GC500_Delivery_Control/v12.50_contract_quantity_precision_DRAFT/patch_v1250.py
```

Require SHA-256 `7ea8e4d2b8230bdece88a7d566c8ae8d2eea63892b8ba1b928a3440149ca4404`, 16,099,369 bytes, the frozen source and READY board entry. Run the agreed same-record financial probe: every charge, ledger/category, supplier cost and branch total remains identical. Only the six reviewed contract source quantities, their display echoes and footer differ; operational quantities and records stay unchanged. If the predecessor, source or current record changes, reconcile and rerun affected checks before publication. Use the existing guarded uploader, require full public bytes to match, archive LIVE and hand back the exact read-back for Codex verification. No wider import, repricing or other source-data change is authorised by this release. P&L and Servicing presentation remain separate previews for Andrew.

## LIVE

LIVE 29 Oct 2026 03:56 AEST. sha256 `7ea8e4d2b8230bdece88a7d566c8ae8d2eea63892b8ba1b928a3440149ca4404`, 16,099,369 bytes, public bytes match the build exactly. Money probe identical to live v12.49.
