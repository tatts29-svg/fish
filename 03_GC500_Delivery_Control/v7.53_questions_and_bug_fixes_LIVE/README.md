# v7.53 — Questions, financial explanations and record handling

Author: Andrew Fisher · 1 Oct 2026

**LIVE 1 Oct 2026 03:12 AEST**, built on live v7.51. This release is independent of the separately claimed v7.52 Forecast P&L layout.

Questions now recognises the approved card estimates, requested generator sizes, event charging window and MEAD day rate. It keeps the two accessory rates, four water-service rates and uncertain CCB classifications visible, preserves notes after questions are answered, and separates missing asset numbers from missing deliveries. Current delivery status sits beside historical answers; recorded demarcation metres are described correctly.

Costs now uses edited servicing rates in its explanation, acknowledges priced labour estimates, and keeps forecasts apart from verified actual costs and Finance journal proposals. Recorded CNA hours remain internal even when employer text is blank. Revenue stays $555,929.94 ex GST and known Direct costs stay $235,081.76; the partial $31,823.98 labour outlook remains outside those Direct costs. No wage, customer rate or accounting allocation has been invented.

Bare imports preserve map positions and assigned task references. Task references survive sync and merge, including deliberate clears. A refused placement no longer restores a removed unit. Existing rehire asset numbers, rate edits and Finance history are preserved.

The earlier v7.50/v7.51 release corrected Revenue from $622,221.63 to $555,929.94 ex GST and added the prepared Timeline Navigate/QR controls. This patch does not replace the MP4 car, weather or current gauges.

## Build and verification

Use the shared toolchain with all three patches, in order:

```bash
toolchain/build.sh v7.53 v7.53_questions_and_bug_fixes_LIVE/patch_v753.py v7.53_questions_and_bug_fixes_LIVE/patch_v753_finance.py v7.53_questions_and_bug_fixes_LIVE/patch_v753_runtime.py
```

**131 focused checks passed** (61 Questions, 25 Finance, 31 import/sync/placement model and 14 browser checks), plus six patch guards. Both desktop and phone sweeps passed 21 tabs with zero page or console errors. Phone screenshots were inspected. Public byte proof: 8,436,993 bytes, SHA256 prefix `33eca728261a6be3`. Shared record stayed version 3077.

Evidence contains Questions desktop/phone tests, Finance tests, import/sync/placement model and browser tests, both tab sweeps, phone screenshots and a post-upload public-page check. All tests use in-memory practice and the GET-only harness; no shared record changes, SMS sends or ledger postings.

## Outstanding decisions

Questions keeps unresolved site and commercial decisions visible. These include the fork extension and tyne rotator rates, the four water services, CCB event/demarcation classification, remaining wage/actual-hours review, final transport/install figures and unresolved drawing or asset allocations. Included waste-tank hire does not waive separately recorded installation or levelling.

The separate v7.52 Forecast P&L layout remains a ready handover on the shared branch and is not included here. This earlier live source is included in the v7.54 handover PR following Andrew’s explicit request. Full browser evidence remains in the release worktree; the PR carries source, tests and compact release proof.
