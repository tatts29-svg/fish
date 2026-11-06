# Explorer loading and reliability component

Author: Andrew Fisher · 2 Oct 2026

This component is frozen for integration. It changes `explorer.js` only, from verified live SHA-256 `ad9ab5e488d690444c59730f8ad286b2df60ab0353cd1d21dabc40e398a3b5a4` to `b312edb6cd07a02dcdad4f1ace57f06921b2f3d597d9e23cbd3de6c8f6e6cd43` (130,850 bytes). The entry, selection and 3D components are applied separately after this patch.

The first sharp view no longer starts the 13.6 MB source scene and all 64 original aerial patches in the background. Original plan still requests its aerial when selected. Detail beyond the pre-rendered pyramid, export, and missing boot/label fallbacks still request the full source scene. No plan geometry, georeference, pin coordinates, imagery resolution, DPR policy or v7.90 coordinate-family fitting was changed.

Tile results now retain ownership through bitmap decoding. Cancelled or old-provider results are discarded and their bitmaps closed; late failures cannot affect the new provider. Downloads have a 20-second deadline, cancelled slots are released once, error caches are bounded, and explicit Retry can recover a failed Google session. Google session requests are coalesced. Fit, reference jumps, typed zoom and direct camera controls stop earlier motion. Cancelled touch gestures do not commit a pick or box zoom.

## Measured result

Fresh actual Explorer browser contexts used the same live index/assets/provider transport, with only the selected Explorer JavaScript overridden. Each case had an empty, separate transport cache. At eight seconds after the first sharp view:

| Measure | Desktop before → after | Phone before → after |
|---|---:|---:|
| Received payload | 17.90 → 3.46 MB | 17.50 → 3.06 MB |
| Heavy scene/aerial requests | 65 → 0 | 65 → 0 |
| First sharp view | 1,579 → 1,643 ms | 1,970 → 863 ms |
| Median input-to-first-frame, three zooms | 35.8 → 30.0 ms | 29.7 → 31.8 ms |
| Median input-to-sharp-view, three zooms | 790.1 → 793.0 ms | 874.7 → 807.8 ms |

Both devices received exactly **14,439,157 fewer bytes** in that interval. This is a demonstrated loading reduction; latency was mixed. One pair and three zoom samples per device do not establish a general faster-zoom or physical-device frame-rate claim. Payload counts are decoded response sizes through the read-only curl harness, not compressed wire traffic. The first requested deep view still pays the deferred source fetch/decode cost.

Actual desktop and phone controls successfully requested deeper source detail and Original plan aerial. The phone demand fixture initially tried the desktop-only hidden percentage input; its failed raw report is retained. A separate bounded check using the phone's visible + control passed. Completed startup/zoom/Fit measurements were not rerun or relabelled. All runs had zero page exceptions and zero operational write attempts.

## Checks and replay

The component has **52 passing CPU checks**: 29 camera/DPR/demand/source checks, 12 adversarial request checks and 11 patch/source guards. The unchanged live source fails 11 of the 12 request checks. Source fragments and exact candidate hashes are recorded in the reports. Desktop and phone sharp-view screenshots were visually inspected.

```sh
python3 patch_performance813.py LIVE_EXPLORER_JS PRIVATE_CANDIDATE_JS
node evidence/performance813_camera.cjs --base LIVE_EXPLORER_JS --source PRIVATE_CANDIDATE_JS --output camera.json
node evidence/performance813_requests.cjs --source PRIVATE_CANDIDATE_JS --output requests.json
python3 evidence/performance813_guards.py LIVE_EXPLORER_JS PRIVATE_CANDIDATE_JS guards.json
```

`evidence/performance813_summary.json` binds the CPU reports, private browser results and screenshot hashes. Browser harness: `evidence/performance813_browser.cjs`. Private results remain in `/workspace/private-maps813/reliability/`.

The existing map reuses its canvases and changes backing-store dimensions only when required; no new renderer is introduced. Two-dimensional context-loss injection and inherited underlay-worker failure teardown are outside this bounded component. The 3D lifecycle and host pending-open fixes have separate owners and evidence. No operational records, credentials or source assets were modified by these tests.
