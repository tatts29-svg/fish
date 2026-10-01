# Full-lap Showcase detail — DRAFT

Author: Andrew Fisher · 2 Oct 2026

Andrew: “the job was to keep what we have and we are upgrading the look ... its the whole track not 10 mtrs of it.”

The previous separate pit-straight scene missed that scope. v7.86 hides it on the live page. This draft applies the
visual refinements to the existing complete 2.91 km circuit, retaining its car, route, driving simulation, cameras,
stands, crowds, signs and garages. The MP4/weather, gauges, records and other page features remain in the live base.

The short-section reset and replacement camera wrappers are removed. Surface materials follow the full road and
both closed track edges; all 260 original kerb outer lips receive 0.85 m wide, 70 mm high physical profiles with metre-scale paint blocks. Additive joints and fittings
retain existing barrier paint. Roadside facade and foliage refinement select from the entire circuit, with bounded
geometry budgets. The sunlight target follows the car without reallocating a texture every time it moves.

Both supplied MP4s have been reviewed privately across 34 frames, including their joins. They show kerbs,
chicanes, a leafy corridor, overhead spans and pit sections. Their temporary signs are not treated as surveyed
2026 locations. Original building and tree placement is retained; added facade detail is illustrative.

## Build and review

```sh
bash toolchain/build.sh v7.88 v7.88_full_lap_detail_DRAFT/patch_v788.py
python3 v7.88_full_lap_detail_DRAFT/build_preview.py build/GC500_v7.88/GC500_Delivery_Control_hosted.html build/GC500_v7.88/full_lap_preview.html
```

The offline preview contains circuit/surrounds only, with no project records or service access. It uses the same
patched renderer and modules as the full candidate. Open the animated preview, then use the original camera views,
pause, restart the complete lap or compare the original graphics. This is a review copy, not the production layout.

Initial build and browser render pass with no errors. Real geometry: 498/498 boundary segments, 1,822 detail
modules, 260 kerb profiles; 80 roadside building parts, 354 facades; 337 source trees refined across all 12 equal
distance coverage bins. The bins are test diagnostics, not official race sectors. Two bins have no eligible tower
parts; this draft does not invent buildings to fill them. The route, building/tree positions and dimensions remain unchanged. Original kerb source arrays remain intact; only their visual width/paint scale is corrected.

**Not ready to upload.** Continuous full-lap desktop/phone checks, visual review and integration checks remain in
progress. No claim is made about physical-device frame rate or 4K real-time performance. The live release is v7.87;
this graphics correction has not been published.

The first complete desktop sweep passed 30/30 checks over 2,935 m, but exposed oversized original kerb shapes.
That candidate is superseded by the narrower kerb treatment above. The corrected candidate also respects the
existing performance ladder: shadow-off remains off as the car moves; if the composite is disabled or optional
geometry fails, the original scene continues. Geometry, lifecycle and forced-allocation CPU checks pass.

Current candidate: 8,854,418 bytes, SHA256 `121d183a400d95d997bfbf4db07b5cb5872b57a8e3ec80d163adc4eaec1dd91e`.
Offline review copy: 1,139,977 bytes, SHA256 `a31ccb858829675a8ae1b9364107058b823a70b80ec23d1b0467e402ce5191db`.
Full-lap browser and full-page checks are running on this revision.
