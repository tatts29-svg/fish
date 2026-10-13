# Map completion verification — v10.09

Author: Andrew Fisher

This independent check opens the real page at its public address through the shared browser harness. Operational requests remain GET-only; the harness's existing Google map tile-session POST exception remains unchanged. No native record setters are invoked. Provider scenarios change read functions in the isolated browser only and restore them before exit.

Candidate mode requires `PAGE` and `MAP_CODE`. Exactly three reviewed same-origin `explorer` files (`index.html`, `explorer.js`, `explorer-merge.js`) are intercepted before the cache. All other map assets remain public. `LIVE=1` disables all local replacements and cache-busts those three public source GETs; served SHA256 values are retained with the report. Existing cached map tile/artwork data can be reused.

Run only while holding the shared browser lock, with the configured `NODE_PATH`, `CHROMIUM_PATH` and tile cache:

```bash
PAGE=/path/to/GC500_Delivery_Control_hosted.html MAP_CODE=/path/to/candidate/explorer OUT=/workspace/private-map1009-phone MOB=1 flock /tmp/gc500-browser.lock node evidence/check_map1009.cjs
```

Repeat without `MOB=1` for desktop. Public verification uses `LIVE=1` in place of `PAGE`/`MAP_CODE`. Optional `EXPECTED_SHA` pins the parent page hash. `OUT` must remain outside the repository; it contains screenshots and full diagnostic output. Only the compact review summary belongs in Git.

The check covers the real WC50/WC26 record readings, selected-reference status and shape distinctions, current provider refresh without camera movement, unavailable provider, partial/conflicted physical completion, the optional Done layer, clearing selection, reduced motion, source provenance and zero operational writes. Screen captures show actual public record data before any isolated fixture. It does not assert every map location is correct or that every project cost is complete.

Status: checker preparation; no browser run or completed-test claim yet.
