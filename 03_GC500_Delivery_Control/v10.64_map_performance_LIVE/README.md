# Map loading recovery and exact label fitting — v10.64 LIVE

Author: Andrew Fisher

Map scope comes from PR #1 handover comment 6241118435; current ownership is recorded in STATUS.md. Main-page performance v10.61 and servicing tracker v5.89/v10.63 remain separately owned. Starting source: `976b24fa052cf505a29eb6f40167b2601dad1581`; claim: `14ad25becb419c5f1232dd0855207d03f863f934`.

## Confirmed defect and change

Six stalled drawing-tile requests could occupy the whole pyramid queue indefinitely. Reproduced with the actual existing `pumpVT`: stalled fetches, response bodies or bitmap decoding leave six occupied slots and a seventh tile waiting even after 60 simulated seconds. A 20-second deadline now releases each slot exactly once and uses the existing 1, 2, 4 … 30-second retry backoff. Stale results cannot overwrite newer pixels, and late bitmaps are closed. Missing tiles are never reported as valid empty tiles after a timeout.

Label fitting now traverses the rectangle boundary directly. The exact sample coordinates and their order are unchanged; discarded interior loop iterations are removed. This does not change geometry, zoom resolution, rendering detail, statuses or quantities.

The parent shape injector accepts exactly the existing six-script set and the reviewed set with the new explorer script. All other changed script lists remain rejected. This allows the tested page to publish first, followed by the two-file machine update. Existing open frames retain their loaded scripts; reload after publication to receive the recovery change.

## Bound sources

- Page base: v10.60.2, 18,301,333 bytes, SHA-256 `8222e47b800cc1412df12b9d9d9c80d3b944a65803ad3282114b1487313dfca3`.
- Page candidate: 18,301,601 bytes, SHA-256 `34ac94742f81bfce7e784589a502df515d76dffbee418c048fc3e07a238f2067`.
- Machine base: `43c59fc5ea41cfabe9941d72cead4d4a61b6c2e86ec883e5b0f2b067f2962f7c`.
- Machine candidate: `1348bf1bbcf69400aab0e510e7239d68dac567d40d103898323bf9abdef7bf6f`.
- Only `explorer/explorer.js` and its script URL in `explorer/index.html` change. The other 234 of 236 descriptors remain identical.
- New script: `c096837cb410bce216876ab8b49a9bf10c54ba4e4749bbb337979b71fb367f9d`; new index: `b5f7c16560f12ebcea6a84bfa7697e603ee46580c3950414e79bc31308d02843`.

Full live pages, records, CPU profiles and screenshots remain private. Repository files contain transformations, tests, technical manifests and aggregate results only.

## Validation so far

- Shared build/static checks: 139 scripts parsed; passed.
- Tile regression: 15 scenarios passed, including reproduction on the original code.
- Label traversal: 1,440 exact sample/result comparisons across six pixel densities passed.
- Shape build guard: 17 valid/invalid script, origin and path checks passed.
- Machine preparation/publication guards: 19 mocked-network tests passed.
- Desktop and phone: 62/62 shape checks, 11/11 map navigation checks, 24 tab routes and 7 deep links, 0 page errors, 0 console errors. Record unchanged in shape checks; no record writes attempted.
- Independent source review found no release blockers. Phone screenshots inspected.
- LIVE 18 Oct 2026 07:33 AEST. Tested source: `ab1cc0a6b758e206334b4a2bb91a0ac64770deaf`. Page and both changed machine files read back byte for byte.
- Fresh-cache live desktop and phone checks: 11/11 each, new recovery code loaded, shape layer attached, navigation/refresh preserved, no page errors or record writes.
- Aggregate validation and publication evidence: `evidence/validation.json` and `evidence/publication.json`.

Phone CPU ×4 profiling separates the shared parent calculations (the separately owned v10.61 scope) from map drawing. This bounded change does not claim all page-load delays or all frame-time targets are resolved. Real-device GPU performance remains outside the headless test's proof.

## Reproduce and publish

Use the current live page with the shared `toolchain/build.sh v10.64 path/to/patch_v1064.py`. `release/README.md` gives the retained-manifest machine preparation and guarded publisher commands; supply the shared `satellite_explorer/tools/machine_set.py` from this source branch. Tests only read the service.

Browser tests can preload `tests/candidate_machine.cjs` with `CANDIDATE_MACHINE` pointing to the two prepared files and `source-bound.json`. `PAGE` selects the built page. The existing shape test accepts `EXPECT_PAGE=v10.64`; default stays v10.60. Set `OUT` to private evidence storage. Run all browser jobs serially under the existing browser lock.

Before publication reread PR #1, the board and both live bases. Publish the page with the shared guarded uploader, then the two-file machine union with explicit `--publish` and a fresh empty private output directory. Verify exact public bytes and the resulting mounted shape layer. Never override a moved base. Update this record with the source commit, tests and read-back before calling it live.
