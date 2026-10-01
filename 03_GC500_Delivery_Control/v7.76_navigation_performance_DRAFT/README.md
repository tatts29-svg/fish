# Faster navigation — v7.76 draft

Author: Andrew Fisher

Opening a tab previously calculated its navigation alerts before entering the asset snapshot used to draw the page. That repeated asset construction and rental lookups during the same synchronous navigation.

This patch puts the existing navigation function inside the page's existing `holdAssets` scope. The tab alerts and selected page share that one snapshot. The hold is released when navigation returns, including on an error; a later record refresh, frame or navigation reads a fresh snapshot. The existing capability refresh, asynchronous page filling, financial calculations and visual presentation are unchanged.

Profiling also found Costs rebuilding its forecast and Rehire models several times during one draw. Those two models now use the existing `heldMemo` inside the same synchronous hold. Their original calculation bodies are unchanged. Calls made outside a hold are still calculated fresh, and no model result is retained after the hold ends.

The patch requires the v7.74 base and refuses a second application. It does not add a persistent cache or skip any page refresh.

## Checks

**21/21 synthetic regressions pass**, in `evidence/navigation_regressions.js`. They exercise the actual patched navigation function, render dispatch, model wrappers and existing hold implementation with synthetic records, including record replacement, deletion, errors, nested holds, scheduled callbacks, permission refreshes and fresh standalone model calls. They also check that the original navigation and model bodies are unchanged and the patch refuses a wrong base or second application. Browser comparison and both release sweeps are required before release; no speed improvement is claimed until the comparison finishes.

```bash
node v7.76_navigation_performance_DRAFT/evidence/navigation_regressions.js
```

The test can instead read a built candidate with `PAGE=/absolute/path/to/page.html`. Without `PAGE`, it applies this patch to a temporary copy of the saved v7.74 build; it does not alter the build or contact the service.
