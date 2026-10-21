# Servicing map clarity and completion — v11.00

Author: Andrew Fisher.

The servicing drawing now uses a quick 1600-pixel preview followed by a 4096-pixel detail image rendered from the original vector drawing. Both use the existing registered crop. World dimensions, reference positions and separate line locations remain identical to v10.99. The detail image decodes when the map is visible; the preview remains available if decoding fails.

Saved-complete references show a tick and a breathing green ring. Areas turn green and pulse only when all their references are saved complete for the selected night. Partial, pending and other-night work cannot produce a completed area. Coloured outlines identify groups of servicing locations, not surveyed boundaries. Reduced-motion preferences retain the completion indication without animation; hidden maps pause animation.

Markers persist during panning instead of being rebuilt each frame. The map keeps its viewport and keyboard focus across progress reads. Visible Servicing checks every two seconds, with immediate manual-refresh feedback and a shared in-flight read. Read failures retain the last verified progress and back off to sixty seconds. No native record, charge, crew-card template, completion code or tracker configuration changes.

## Build and verification

Use the shared toolchain against the exact v10.99 predecessor `fddc937937d41bc0a1651556b4ef28749085789271fc61c3145ed044db22f8cf`. Private `GC500_SERVICING_MAP_PREVIEW`, `GC500_SERVICING_MAP_DETAIL` and `GC500_SERVICING_MAP_MANIFEST` file paths supply the registered images. The patch validates hashes, actual dimensions, aspect ratio, provenance and unchanged registration. Private originals, assets and operational screenshots stay outside Git.

`test_patch1100.py` checks nine build guards. `test_model1100.cjs` checks twelve shared-state and registration cases. `test_map1100.cjs` checks saved-only glow, animation lifecycle, retained nodes, decoding fallback and refresh feedback with synthetic data. `test_servicing_flow.cjs` runs the actual local v5.91 service, crew card, state reader and exact candidate controller; production writes are unavailable. Standard desktop and phone sweeps, actual-image layout checks and a GET-only native live read-back are required before reporting completion.

The 4K image improves source detail but adds about 1 MB to the self-contained page. It does not create unlimited detail at extreme magnification. Performance measurements describe this browser runner, not a guarantee of zero delay on every phone or network.

Final source candidate: `42b5528f745122af6ccdfd9974fb90c47c51087e`. Candidate SHA-256 `d4a10a7fe07637fdfbb97f31ff2a07f48af4a632479acce8fd29aeb9cf9c97d7`, 20,922,036 bytes. All 150 inline scripts parse. The final candidate passes 51 actual-image desktop/phone layout and registration checks and 185 actual local-server/controller checks. The frozen module passes 35 focused regressions and 34 performance-behaviour checks. Independent source and screenshot review passed. Registered positions, native servicing data and permanent crew template are unchanged.

In the tested headless browser, desktop 4K and phone median pan/zoom frame intervals are 16.7 ms. Desktop zoom p95 is 21.7 ms; phone zoom p95 is 17 ms. The desktop map caps at 900 pixels high to bound drawing work. Panning and unchanged refresh replace no marker nodes. The preview stops painting once detail is ready and returns if geometry changes.

State: READY TO UPLOAD. Final desktop and phone sweeps each passed 25 routes, seven links and Back with zero page or console errors. An earlier transient third-party tile response cleared on the desktop rerun. Source review and final screenshots are complete; Claude has not reviewed this release. The owning session will use the unchanged-live guard and verify exact public bytes plus native saved progress after publication.
