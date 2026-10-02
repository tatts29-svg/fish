# Showcase photo refinement — DRAFT

Author: Andrew Fisher · 2 Oct 2026

Andrew: “Revisit showcase again. Wiith new info. Must be smooth. No bugs no errors”.

The existing whole 2.91 km Showcase gains photo-informed coastal facades, mixed foliage, pit-building steelwork, clearer typeset signs and coastal daylight. The existing circuit, car, original driving simulation, cameras, media/weather and project records are retained. The detail is illustrative browser graphics; the photographs do not establish new surveyed landmark or sponsor locations.

The 39 new originals were reviewed privately. Their provenance and placement limits are recorded in `../v7.88_full_lap_detail_DRAFT/PHOTO_REFERENCES_02Oct2026.md`. This successor builds the earlier full-lap detail onto the current live page; the earlier v7.88 candidate remains frozen for history.

Rendering improvements cache context capabilities, reuse dynamic smoke/rubber storage, simplify the sky shader, replace 30,584 block-letter triangles with 224 label triangles, and reduce render resolution before losing visible detail. The automatic quality policy targets 45 FPS while useful pixel reductions remain, with the original final fallback retained. This is an adaptation target, not a measured device guarantee.

The standalone review copy now preserves pause on restart, resets elapsed time after hiding, and handles browser Back/Forward and graphics-context recovery. Context loss testing found stale-handle cleanup; it is corrected in both the review copy and the hosted page. The final candidate passes 28/28 graphics lifecycle and rendering checks, including real graphics loss and recovery. The final candidate is READY TO UPLOAD after complete-lap and page regression checks passed.

## Rebuild

Run from `03_GC500_Delivery_Control`:

```sh
bash toolchain/build.sh v7.92 v7.92_showcase_photo_refinement_DRAFT/patch_v792.py
python3 v7.92_showcase_photo_refinement_DRAFT/build_preview.py build/GC500_v7.92/GC500_Delivery_Control_hosted.html build/GC500_v7.92/full_lap_preview.html
```

## Final candidate checks

Page: **8,883,495 bytes**, SHA-256 `476f0dcca3d97de07d55c8eb7c85618a8672abf99f2c00f2892c11690b7bc265`.
Offline preview: **1,168,436 bytes**, SHA-256 `6373a7fe1782104a9f01f5df26d910631d6780910fa150a9f7384c4a5e6a33b6`.

- **74/74** full-lap checks: desktop and phone, original fixed-step physics beyond the finish, no resets or jumps, four cameras, pause, comparison and resource release. Reduced-motion configuration also checked.
- **28/28** rendering and recovery checks: desktop/phone and hosted-page context recovery; exact position/camera/pause retained, no duplicated loop or canvas, no stale GPU handles. Steady frames make no repeated capability queries or dynamic buffer reallocations.
- **23/23** hosted-page integration checks, including day/night remount, fallback and closing/reopening.
- Both **21-tab / 7-link** navigation sweeps: zero page or console errors.
- **15/15** protected-source checks and **5/5** deliberate mutation rejections; all DATA, operational-page content, route, car, physics, camera bodies and media references retained.
- **15/15** pit-geometry, **15/15** signage, **10/10** storage/quality/lifecycle and **9/9** shader cleanup checks; full-circuit facade/foliage CPU fixture passes.
- All 26 full-lap images and the hosted-page desktop/phone layouts visually reviewed. Exact rebuild, static script checks, no-secret check and upload dry-run pass.

The final browser suites report zero detected page, console or WebGL errors and no service record writes. Tests block record writes. Browser verification uses software-rendered Chromium; it establishes errors, state continuity and comparative work, not physical-phone FPS. Eight fixed 640 × 360 Balanced renders with pixel readback measured a 902.20 ms median versus 947.55 ms for v7.88 (about 4.8% lower); run-to-run variability makes this a limited comparison, not a frame-rate promise.

Implementation, independent subtask reviews and final integration verification are complete. The other external collaborator has not reviewed this final successor candidate; its independent review of v7.88 remains historical. Publication proof will be added after upload.
