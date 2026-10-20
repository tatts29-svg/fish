LIVE as part of combined v9.48 — 9 Oct 2026 08:48 AEST. Exact public page SHA256968cd3a850584736fcfa28b403e9b7fd2d280557e86984c8be87c2b5bf8c0ca1. Component notes below retain their implementation history.

# Supplier render performance

Author: Andrew Fisher.

READY for root's combined release; not independently published.

Company switching rebuilt the full asset collection hundreds of times. This patch wraps `renderSubhired932` in native `holdAssets` and moves its unchanged body into `renderSubhired936Held`. Company pointer/keyboard selection, retained company-select handler, native tab rendering and Today's supplier route all call the same entry point. Existing outer holds are reused. The native `finally` cleanup releases the snapshot and memo; later record changes rebuild fresh data. There is no persistent supplier cache and no layout, ownership, photo, supplier plan, cost or operational-record change.

Apply `python patch_v936.py <candidate>` after release34 or35; footer advances36. `test_v936.py <base>` proves the entire source is identical after undoing only the wrapper and footer; repeated application is refused. Canonical `check_page.py` passes40inline scripts.

`browser936.cjs` uses the canonical harness with its Google POST allowance removed before initial navigation. Run serially via `/tmp/gc500-browser.lock`, with BASE, PAGE, NODE_PATH and CHROMIUM_PATH; MOB=1 is phone. Both actual-record contexts wait for all native sync collections before comparing. Desktop baseline560builds/2238ms becomes1build/72.3ms; phone baseline560builds/2108.7ms becomes1build/69.4ms. These are headless test timings, not universal device guarantees. Supplier DOM/data is identical. Company pointer/keyboard and retained select work; Today go+company-click builds once per draw (two renders). Updated synthetic in-memory data is observed by the next render, then restored without any native save. Exception cleanup leaves native snapshot/memo clear. Shared record is unchanged and page errors are zero. Ambient background work may add up to two unrelated builds during Playwright pointer waits; the supplier render itself builds once.

Private actual-record candidate/results/screenshots live under `/workspace/private-supplier936*` and are not committed. Root owns combined final browser sweeps, publication and live readback.
