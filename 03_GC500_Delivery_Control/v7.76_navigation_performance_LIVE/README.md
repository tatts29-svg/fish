> **LIVE — 1 Oct 2026 18:59 AEST.** Built on v7.74 and verified byte for byte. No record or ledger writes.

# Faster navigation — v7.76 LIVE

Author: Andrew Fisher

Opening a tab previously calculated its navigation alerts before entering the asset snapshot used to draw the page. That repeated asset construction and rental lookups during the same synchronous navigation.

This patch puts the existing navigation function inside the page's existing `holdAssets` scope. The tab alerts and selected page share that one snapshot. The hold is released when navigation returns, including on an error; a later record refresh, frame or navigation reads a fresh snapshot. The existing capability refresh, asynchronous page filling, financial calculations and visual presentation are unchanged.

Profiling also found Costs rebuilding its forecast and Rehire models several times during one draw. Those two models now use the existing `heldMemo` inside the same synchronous hold. Their original calculation bodies are unchanged. Calls made outside a hold are still calculated fresh, and no model result is retained after the hold ends.

The patch requires the v7.74 base and refuses a second application. It does not add a persistent cache or skip any page refresh.

## Checks

**21/21 synthetic regressions pass**, in `evidence/navigation_regressions.js`. They exercise the actual patched navigation function, render dispatch, model wrappers and existing hold implementation with synthetic records, including record replacement, deletion, errors, nested holds, scheduled callbacks, permission refreshes and fresh standalone model calls. They also check that the original navigation and model bodies are unchanged and the patch refuses a wrong base or second application. Browser comparison and both release sweeps pass; final results and timing limitations are below.

```bash
node v7.76_navigation_performance_LIVE/evidence/navigation_regressions.js
```

The test can instead read a built candidate with `PAGE=/absolute/path/to/page.html`. Without `PAGE`, it applies this patch to a temporary copy of the saved v7.74 build; it does not alter the build or contact the service.

## Paired browser verification

On the v7.74 baseline and the final candidate, **36/36 desktop and 36/36 phone checks pass**. Displayed content,
financial/labour/asset models, permissions and record freshness match; no page/console errors or page overflow.
The original navigation and both model calculation bodies are unchanged. **21/21 synthetic regressions pass.**

Five warmed navigations per view and build, one Chromium at a time, with the same private record, document index
and clock; reduced motion. The phone is a 390 × 844 emulated viewport on this host, not physical handset timing.
Full aggregate results, including p95, are in `evidence/benchmark_summary.json`; raw records/screenshots stay private.

| Costs navigation | Desktop | Phone viewport |
|---|---|---|
| Median JavaScript navigation, before → after | 426 → 330.5 ms | 368.8 → 312.8 ms |
| Change | 22.4% faster | 15.2% faster |
| Median navigation to paint, before → after | 501.1 → 404.7 ms | 442.1 → 383.8 ms |

Asset construction falls from 3 to 1 per navigation; forecast model construction from 5 to 1, and Rehire model
construction from 2 to 1 on Costs. This is a targeted improvement, not a claim that every view is instantaneous.
The phone Progress paint median was unchanged in this sample. Both release sweeps and the live-byte proof are
recorded in `evidence/release_verification.json`.
