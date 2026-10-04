Author: Andrew Fisher
v8.37 fencing map, docket and purchase-order trace — READY TO UPLOAD.

This component adds a read-only area-to-record view within the existing Map detail and Fencing source cards. Reviewed area buttons work with touch and keyboard, and records without defensible map locations remain discoverable. Unmapped register cards expose the same source allocations and shared P/O detail directly, without creating a location or attaching an unnumbered residual to a docket. The existing geometry, camera, planned tasks and completion evidence are preserved. Amber marks recorded work; green remains an actual area sign-off. Neither proves a complete fence line.

The map shows whole-docket supplier estimates and customer Revenue separately. Shared P/O records appear once per selected group. Optional supplier-summary allocations and signed credits are another evidence view, with unnumbered residuals retained and no automatic apportionment to a map section. They never post a cost, alter Revenue, confirm payment or certify an audit. Unknown rates, partial known subtotals and no separately priced lines remain distinct.

Private inputs are not committed. FENCE_TRACE837_INPUT and FENCE_TRACE837_INPUT_SHA256 bind reviewed record signatures, exact existing anchor geometry/source revisions, original document hashes and local pages, and explicit parent relationships. Every original PDF/JPEG is checked at build time. Absolute paths are stripped before embedding. The optional FENCE_TRACE837_COMMERCIAL_INPUT and FENCE_TRACE837_COMMERCIAL_SHA256 bind supplier-summary allocations, unique charge-line IDs, credits and residuals. They reconcile to the source total before use. An exact record/source mismatch suspends the relationship. The independent verified original can remain accessible when only physical fields change.

The v8.36 resolver remains the authority for source-reviewed docket-to-P/O associations. The dependency lookup supports its DRAFT-to-LIVE folder rename. Exact machine signature names are JSON-escaped narrowly so the standard attribution scrub does not change their values; visible narrative still follows the existing scrub.

patch_v837.py is the standard single-working-copy release wrapper owned by the release integrator. It requires the exact reviewed v8.36 predecessor and refuses repeat application. fencing_trace837.py changes guarded host anchors only, including an explorer index cache token. patch_explorer837.py requires the three exact registered predecessor assets and prepares only fencing-map-explorer.js, fencing-map.css and index.html. Its index refers to new script/style hashes. Host-only register styles separate and group supplier allocation labels without changing the map assets; map-to-record reveal scrolls only the main content pane and preserves the outer header/footer. The publisher must preserve the complete existing asset manifest and every other asset. These helpers do not register or upload anything.

CPU checks:
  python3 tests/test_trace837.py
  node tests/test_trace837.cjs
  node tests/test_trace_view837.cjs
  node tests/test_trace_host837.cjs
  ASSET=/private/prepared/fencing-map-explorer.js node tests/test_explorer837.cjs

The Python tests use synthetic originals and include the actual standard attribution scrub. Pure core/view tests use synthetic relationships, monetary examples and source fingerprints. Explorer tests exercise the patched marker/filter functions: a reviewed relationship cannot create completion, and explicit reverse navigation clears conflicting filters without changing geometry. No test writes an operational record.

Status: READY TO UPLOAD. Final candidate and checks are recorded in RELEASE_REVIEW.txt. Root owns guarded publication and actual-public verification; not yet LIVE.
