# v12.41 — load and interaction performance (DRAFT)

Author: Andrew Fisher.

This draft addresses measured sources of repeated work. It does not change the record, financial rules, figures, equipment, maps, controls or layout.

- Demob's two startup hooks now check the selected pane's `.on` class as well as its `hidden` property. The page hides inactive panes with CSS; testing `hidden` alone built the inactive Demob screen during startup. Normal navigation and direct `#demob` navigation still use the existing renderer.
- Demob's renderer and its following decorations share one native `holdAssets` call. Deferred observer decorations also use that native boundary. Nested calls reuse the current hold; the native `finally` releases it. Saves and event-configuration changes retain the page's existing invalidation behaviour. This adds no persistent or asynchronous cache.
- The final photo projection is reused inside the existing native hold, with fresh shallow photo objects returned to callers. Native photo additions/removals immediately advance its local revision, including before a subsequent save; carried native holds therefore cannot reuse an older projection. Saves, received records and event configuration retain their existing invalidation. Legacy photos, shared-area associations and position precedence still use the original projection.
- Full Demob renders omit the legacy strip centring that was immediately replaced by modern cards. Standalone card mounts still preserve their scroll. The existing selected-date reveal runs once, synchronously, after all full-render decoration. A final outer-render boundary includes the shared decorators; nested renders coalesce and a failed render cannot leave pending geometry. Direct Demob renders still finish their positioning before returning. Map observation starts after the writes and uses the verified native `main` screen scroll container; print and unexpected structures retain the original discovery fallback.
- Ordinary zero-argument cost-ledger reads reuse one snapshot inside the native hold, returning a fresh array, row objects and problems arrays each time. Nested source references retain their original identity. Explicit pricer arguments, including an explicit `undefined`, use the original uncached path.
- The event-workforce Finance wrapper builds one local person lookup, lazily, instead of rebuilding the full cost list for each crew row. The lookup retains the first matching raw ID, matching `ourCostOf`'s strict comparison with `String(id)`. Each invocation creates a fresh lookup; ordinary rows do not create one.

- The Finance people rollup also uses one lazy, invocation-local first-person index with the native case/whitespace normalization. Duplicate names retain the first source row; the global branch reader and source rows stay unchanged.

The helpers live in `performance1241_src.js`; `performance1241_runtime.js` installs the final synchronous rendering boundary. `patch_v1241.py` applies exact, single-match replacements through the shared toolchain. It refuses a repeated application or an uncoordinated predecessor. The source contains no private record inputs or financial figures.

## Integration with the Demob draft

When the later Demob release rebuilds, retain both actual-pane startup guards and the native `holdAssets` boundary around the complete Demob render plus decoration. Observer-only decoration must also enter that boundary. Retain the full-render geometry boundary too: standalone mounts preserve scroll, the final date reveal remains the centring owner, and map observation follows decoration. These changes patch the current live page; they do not edit the separate Demob draft's source files. If that draft replaces these functions, preserve the same visibility and synchronous invalidation semantics, then rerun the performance and preservation checks.

## Verification

LIVE — guarded publication at 08:10:52.147 UTC / 18:10:52.147 AEST on 26 October 2026. READY source `5d36b6e1c6b9c88c7b83b46ce26d4e621cafc437`. Independent public GET at 08:12:36.185959 UTC matched every byte, both performance modules, the Finance index and footer. An actual-public phone check passed 8/8 with no local page substitution, runtime/console errors or write attempts; the release owner inspected the phone capture.

- Implementation source: `1e8d7ad1597f60e79c3d63571da3da5f40a69957`; the final native test adds branch-freshness assertions in this commit.
- Base: live v12.37, SHA-256 `d0c7d444d9b9c1aef434478a283bb4fc5b0cbafeb70a329cc1a561f982bb986a`.
- Candidate: SHA-256 `e106502b347cb51519f6aaed1eec5b6ba20a301b06490df04e3d29569d55b422`, 15,620,153 bytes. Earlier candidates are superseded.
- Shared checker: 212 scripts. Offline behavior: 108/108. Financial/map/people preservation: 26/26. Native phone interactions: 42/42. Photo equality and invalidation: 18/18.
- Both full shared sweeps passed: each 27 tabs, 19 visible panes, 7 deep links and Back. Zero runtime/console errors or record-write attempts. Final phone screenshots inspected by implementer/tester and release owner.
- Guarded upload and exact public read-back passed against unchanged predecessor bytes. No operational record is changed by this release. Independent release checks were performed within this session; no external agent review or receipt is claimed.

The matched phone comparison of the preceding candidate against the same baseline reduced startup from 50.9s to 16.6s, Costs synchronous work from 19.9s to 7.1s, Demob from 15.3s to 5.3s and Today from 8.0s to 3.3s. The final additional Finance index was checked in the same browser with alternating exact original/final functions: median 494.7ms to 299.35ms, identical outputs and source state. Whole-page timings varied: settled final Costs runs were 6.8–8.4s. A 35.15s immediate, no-idle Costs run is retained in private evidence; its individual cause remains unproven. These results support the bounded corrections, not a claim that all loading latency has been eliminated. Detailed records, all timing runs and phone captures remain private.

Later Demob work must retain these corrections and repeat its timing checks. Rebuild if the live predecessor changes. This release used the shared guarded uploader and exact public read-back. Codex owns the following customer-treatment and financial-branch releases; the Demob owner rebuilds and renumbers its remaining drafts as required.
