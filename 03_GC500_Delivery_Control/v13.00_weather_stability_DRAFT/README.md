# v13.00 — steady Demob weather across day selection

Author: Andrew Fisher

Andrew reports that weather still glitches after v12.99. A fresh public-phone check found that routine forecast repaint kept its nodes, but choosing a day or redrawing Demob still discarded all 15 weather scenes. Their animation restarted and waited for visibility observation again.

This draft preserves matching weather artwork and animation phase across native Demob redraws while keeping all native record and day-information updates. Phone browser-height changes also retain the manually scrolled date strip; actual viewport-width changes still reveal the selected date through the original handlers. Both the shared and legacy Build resize listeners are guarded. Weather observations, forecast-source labels, maps, pickup history and the existing card design remain authoritative.

A second source of stutter was the unchanged Available staff panel. Its raw HTML was compared with browser-serialized HTML, which expanded a bare attribute and made every comparison fail. Demob now compares the parsed structure before replacing the panel. Actual changed staffing still refreshes; open edit drafts retain the native protection. Weather Pause/Play label changes are excluded from the two equipment-decoration observers. Equipment calculations, geometry and record writers are unchanged.

READY TO UPLOAD — exact candidate passes all 224 inline-script checks, the scope/base guards, 16 focused Node checks, four native phone regression suites and both 27-tab/seven-link/Back sweeps. Runtime errors, console errors and attempted operational writes are zero. Screenshots reviewed. Implementation source: `bf367a3e43ac641e508dab4ebfcfa7836eb151c9`. Guarded publication and fresh public verification remain.

- Source branch: `ccr-061f77e8-ivjhrv`.
- Claim commit: `dda25eba`.
- Required live v12.99 SHA-256: `ae11b779720acbaf6b4e8d32061cc7da5c9218e9eaa017cceb0343defa73e8ee`.
- Candidate SHA-256: `6b57277fbf79511339dcae3dc098b1697e4fc4d9722c18b46a78c2170309b4a3`, 17,065,377 bytes.
- Native browser evidence remains private. Tests are read-only and block all record writes.

## Checks and limits

Focused tests cover matching and changed weather, animation phase, pause/reduced motion and both resize handlers. Native browser checks exercise real day clicks and whole Demob renders, fresh staff facts, true forecast changes, unchanged staff polling, genuine equipment mutations and phone height/width changes. Whole-page sweeps cover 27 tabs, seven deep links and Back. All browser tests block operational writes; screenshots and detailed operational evidence remain private.

The change removes demonstrated animation restarts, unwanted scroll jumps and redundant background redraws. It does not promise zero latency on every device or network. The inherited observed archive is verified through 4 November (latest day partial); this release does not alter weather data or add automatic historical observation ingestion.

## Reproduce

```sh
bash 03_GC500_Delivery_Control/toolchain/build.sh v13.00 03_GC500_Delivery_Control/v13.00_weather_stability_DRAFT/patch_v1300.py
node --test 03_GC500_Delivery_Control/v13.00_weather_stability_DRAFT/tests/*.test.js
python3 03_GC500_Delivery_Control/v13.00_weather_stability_DRAFT/check_scope.py BASE CANDIDATE
```

Run the three native tests in `tests/` through the shared read-only harness with `PAGE` and private `OUT`. The resize check uses an output JSON filename; the other checks use an output directory. `LIVE=1` omits the candidate page override. Reuse the v12.99 historical/forecast UI check to verify prior weather behavior. Guarded publication uses the shared uploader and exact public byte read-back.
