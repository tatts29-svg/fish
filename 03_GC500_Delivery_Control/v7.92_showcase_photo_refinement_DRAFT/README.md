# Showcase photo refinement — DRAFT

Author: Andrew Fisher · 2 Oct 2026

Andrew: “Revisit showcase again. Wiith new info. Must be smooth. No bugs no errors”.

The existing whole 2.91 km Showcase gains photo-informed coastal facades, mixed foliage, pit-building steelwork, clearer typeset signs and coastal daylight. The existing circuit, car, original driving simulation, cameras, media/weather and project records are retained. The detail is illustrative browser graphics; the photographs do not establish new surveyed landmark or sponsor locations.

The 39 new originals were reviewed privately. Their provenance and placement limits are recorded in `../v7.88_full_lap_detail_DRAFT/PHOTO_REFERENCES_02Oct2026.md`. This successor builds the earlier full-lap detail onto the current live page; the earlier v7.88 candidate remains frozen for history.

Rendering improvements cache context capabilities, reuse dynamic smoke/rubber storage, simplify the sky shader, replace 30,584 block-letter triangles with 224 label triangles, and reduce render resolution before losing visible detail. The automatic quality policy targets 45 FPS while useful pixel reductions remain, with the original final fallback retained. This is an adaptation target, not a measured device guarantee.

The standalone review copy now preserves pause on restart, resets elapsed time after hiding, and handles browser Back/Forward and graphics-context recovery. Context loss testing found stale-handle cleanup; that correction and final browser checks are in progress. Not ready to upload yet.

## Rebuild

Run from `03_GC500_Delivery_Control`:

```sh
bash toolchain/build.sh v7.92 v7.92_showcase_photo_refinement_DRAFT/patch_v792.py
python3 v7.92_showcase_photo_refinement_DRAFT/build_preview.py build/GC500_v7.92/GC500_Delivery_Control_hosted.html build/GC500_v7.92/full_lap_preview.html
```

Final-candidate validation and publication evidence will be recorded here after completion. Browser verification uses software-rendered Chromium; it can establish errors, state continuity and comparative work, but cannot establish physical-phone FPS.
