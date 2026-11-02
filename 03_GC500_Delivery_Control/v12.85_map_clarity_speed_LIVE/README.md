# Map clarity and responsiveness

Author: Andrew Fisher.

LIVE — 3 Nov 2026 03:10:18 AEST (2 Nov 2026 17:10:18.492 UTC), published from source `8344fc6cf332c5f272edb7dcc7765317cb4a229e` on `ccr-061f77e8-ivjhrv`. Guarded publication and fresh live verification are complete. Implemented and tested by Codex with independent Codex-agent guard review and public read-back; Claude has not reviewed this release.

Andrew approved the Mapbox preview and asked for clearer imagery with fast loading, rendering and refresh. The Explorer previously waited for a Google 2D session before using its already-available Mapbox access, and could switch back to the unwanted background. This release uses the approved Mapbox background directly, keeps that source through retry, and retains the existing plan, search, registration and Google 3D views. The temporary image's capture date remains unverified; it is not labelled a 2026 capture.

On an empty cache, up to four coarse tiles take priority so the map fills while sharp detail arrives. Resting views use native pixel density where available. Existing movement quality, bounded caches, concurrency, hidden-view pausing and plan geometry remain. A preconnection starts the imagery connection early. 3D starts its independent library and access requests together after the user opens 3D; failed or abandoned startup cancels the access request. Static 3D quality is unchanged.

## Subsequent regression and correction

Andrew subsequently identified missing equipment shapes/door swings and incorrect raw completion labels. The v12.85 tile/navigation checks missed two parent adapter gates still pinned to the previous map script identities. v12.86 corrects those exact gates and verifies actual equipment/door and departure layers in both the candidate and live UI. See `../v12.86_map_shape_status_restore_LIVE/`. The v12.85 statement that the existing map presentation was preserved did not account for this adapter regression.

## Exact release inputs

- Base dashboard v12.81: `3b17c3de36c8c3f2d99042b0c83dfd9fdc110ccb9db7a1c21ef6c9f72704a85b`.
- Final dashboard: `be38bdbeffbf82adbb6a6f51b03bba66a1184dd3618b3d0c5504fdb6f7ca196a`, 16,948,844 bytes. The complete difference is the release footer; all other parent bytes, including DATA and financial logic, are identical.
- Base map machine: `8256bce609ce48d30fd319ac56bce74729cfe8a980ad051228379d09b06a15e6`.
- Prepared map machine: `674404701b251917625f8589420d33896fbbf13d018da2a20591b3d31eb4e90a`. Four files change; 232 other file descriptors and the protected server inventory are retained.

| Changed file | SHA-256 |
|---|---|
| `explorer/explorer.js` | `641db3a7b3242127e7966252cad34b5acc7509c65a22f36bb61faa92af124fca` |
| `explorer/index.html` | `eeb4366effda57a45e6fd76018c445c7cb18ed0d25c6f1aa53ea3491234c02c0` |
| `explorer/explorer-merge.js` | `c62854961e0d7d990a92684faa00c90ae9c96ac290ff68df6897d0f7a2608971` |
| `poc3d/index.html` | `6b436ba331ed23cfdf9f42638c4ead462b8596215157d36d5e802746d4e6e53a` |

The source patches reproduce these files from their pinned bases and reject another base or a second application. The parent uses the shared `toolchain/build.sh`; its 223-script check passes. Private original files, live records, map access and screenshots stay outside Git.

## Measured results and limits

These single-run browser samples use the same Mapbox provider before and after, a DPR2 phone viewport or desktop, and the read-only curl-backed Chromium harness. They isolate the tile/render changes; the old baseline deliberately uses its existing Mapbox fallback, excluding any failed Google-session wait. They are not physical-device or network guarantees.

| Measurement | Phone before | Phone after | Desktop before | Desktop after |
|---|---:|---:|---:|---:|
| Cold full background | 2.126 s | 1.629 s | 2.149 s | 1.757 s |
| Cold final detail | 2.126 s | 2.019 s | 2.149 s | 2.336 s |
| Warm full background | 0.544 s | 0.497 s | 0.502 s | 0.468 s |
| Pan drawing p95 | 1.1 ms | 1.7 ms | 1.2 ms | 0.8 ms |

The new resting image is visibly sharper at the same device pixel ratio. Requesting this extra detail can take slightly longer after coverage appears; phone warm final detail is 0.703 s versus 0.544 s. Candidate zoom drawing p95 is 8.1 ms on the phone and 9.1 ms on desktop. A desktop baseline with HTTP 503 responses is retained as a failed network sample and excluded from the comparison; the affected run was repeated successfully.

3D resource timing proves that library and access now overlap. In one phone/software-graphics pair, readiness was 6.69 s before and 4.58 s after, while complete visible tiles took 22.26 s and 29.35 s. These variable network/graphics samples do **not** establish a faster full-detail 3D load. Both retain the same quality settings, reuse the existing frame and perform no hidden rendering after exit. No instant-loading guarantee is made.

## Verification and publication

- Sixteen executing 2D behaviour checks and six exact-base/reproduction guards pass.
- Seven executing 3D async order/cancellation/failure checks and three inline-script parse checks pass.
- Thirty-nine mocked machine publication checks pass, including source/base races, protected inventory, permitted writes, receipt roles, credential redaction and exact read-back. The publisher also received independent guard review.
- Actual phone and desktop 2D runs pass without errors, console errors or record writes. Normal and zoomed phone screenshots were inspected.
- Paired dashboard phone integration passes all four modes, visible satellite and full 3D ground/buildings, source retention, and retaining the iframe when navigating away and back. Both phone screenshots were inspected. No errors or record writes.
- Final desktop and phone dashboard sweeps each pass 27 routes, seven deep links and Back, with no runtime errors, console errors or attempted writes. Routes match the restored predecessor.
- The standard page uploader dry run confirms unchanged live base and edit access.
- Authenticated machine preflight confirms the current base, edit access, server v5.94 and the complete retained inventory. Publication retained all 236 manifest paths and the exact protected server inventory.

The guarded publisher staged only four reviewed map blobs, registered machine `674404701b251917625f8589420d33896fbbf13d018da2a20591b3d31eb4e90a`, and verified every served map file. The standard page uploader then published dashboard `be38bdbeffbf82adbb6a6f51b03bba66a1184dd3618b3d0c5504fdb6f7ca196a` and proved complete byte identity. A separate reviewer freshly fetched the public page, manifest and all four files and independently confirmed their exact hashes.

The fresh live phone run passes with the approved satellite background, all four map modes, full 3D ground/buildings (173 visible-view tiles), and the existing map frame retained after switching tabs. Screenshots were inspected. There are no runtime errors, console errors or record writes. The public-view state before and after publication is byte-identical. Private runtime samples, screenshots, originals and records remain outside Git. See `verification.json` for the public-safe technical check summary.

P&L and operational records remain with their existing owner. Fencing v12.82 remains held. This release does not publish the Demob/building previews or implement annual-plan uploads.
