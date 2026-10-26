# v12.41 — load and interaction performance (DRAFT)

Author: Andrew Fisher.

This draft addresses measured sources of repeated work. It does not change the record, financial rules, figures, equipment, maps, controls or layout.

- Demob's two startup hooks now check the selected pane's `.on` class as well as its `hidden` property. The page hides inactive panes with CSS; testing `hidden` alone built the inactive Demob screen during startup. Normal navigation and direct `#demob` navigation still use the existing renderer.
- Demob's renderer and its following decorations share one native `holdAssets` call. Deferred observer decorations also use that native boundary. Nested calls reuse the current hold; the native `finally` releases it. Saves and event-configuration changes retain the page's existing invalidation behaviour. This adds no persistent or asynchronous cache.
- The final photo projection is reused inside the existing native hold, with fresh shallow photo objects returned to callers. Native photo additions/removals immediately advance its local revision, including before a subsequent save; carried native holds therefore cannot reuse an older projection. Saves, received records and event configuration retain their existing invalidation. Legacy photos, shared-area associations and position precedence still use the original projection.
- Full Demob renders omit the legacy strip centring that was immediately replaced by modern cards. Standalone card mounts still preserve their scroll. The existing selected-date reveal runs once, synchronously, after all full-render decoration. A final outer-render boundary includes the shared decorators; nested renders coalesce and a failed render cannot leave pending geometry. Direct Demob renders still finish their positioning before returning. Map observation starts after the writes and uses the verified native `main` screen scroll container; print and unexpected structures retain the original discovery fallback.
- Ordinary zero-argument cost-ledger reads reuse one snapshot inside the native hold, returning a fresh array, row objects and problems arrays each time. Nested source references retain their original identity. Explicit pricer arguments, including an explicit `undefined`, use the original uncached path.
- The event-workforce Finance wrapper builds one local person lookup, lazily, instead of rebuilding the full cost list for each crew row. The lookup retains the first matching raw ID, matching `ourCostOf`'s strict comparison with `String(id)`. Each invocation creates a fresh lookup; ordinary rows do not create one.

The helpers live in `performance1241_src.js`; `performance1241_runtime.js` installs the final synchronous rendering boundary. `patch_v1241.py` applies exact, single-match replacements through the shared toolchain. It refuses a repeated application or an uncoordinated predecessor. The source contains no private record inputs or financial figures.

## Integration with the Demob draft

When the later Demob release rebuilds, retain both actual-pane startup guards and the native `holdAssets` boundary around the complete Demob render plus decoration. Observer-only decoration must also enter that boundary. Retain the full-render geometry boundary too: standalone mounts preserve scroll, the final date reveal remains the centring owner, and map observation follows decoration. These changes patch the current live page; they do not edit the separate Demob draft's source files. If that draft replaces these functions, preserve the same visibility and synchronous invalidation semantics, then rerun the performance and preservation checks.

## Current verification

DRAFT only; final performance, financial preservation, native interaction and navigation checks are pending. No speed improvement or release readiness is claimed.

- Base: live v12.37, SHA-256 `d0c7d444d9b9c1aef434478a283bb4fc5b0cbafeb70a329cc1a561f982bb986a`.
- Candidate: `build/GC500_v12.41/GC500_Delivery_Control_hosted.html`, SHA-256 `98dfd52b99849b454a32c5d64f5d2a7540525a0caa3ff972cedfc33de1d91fcc`, 15,619,732 bytes. Earlier candidates `602fe2de…` and `38595574…` are superseded.
- Shared build/checker: PASS, 212 inline scripts.
- Earlier candidate checks passed, including native photo/source preservation. Affected tests and timing comparisons must be repeated on the current candidate before release. The final timing comparison also runs without CPU profiling instrumentation.
- The phone comparison uses the same frozen private record for baseline and candidate. Detailed records and timing artifacts remain private.

Before release, verify the initial Today view, direct Demob links, ordinary tab navigation, local saves and received-record invalidation, alongside unchanged financial results. Both standard sweeps and an inspected phone view are required. Rebuild if the live predecessor changes.
