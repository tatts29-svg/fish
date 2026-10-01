# v7.81 — track detail preview (in progress, not live)

Author: Andrew Fisher

Andrew approved the supplied track-detail concept with “looks good”, after asking for an Atari-to-PS3/PS4-scale
improvement. This is an opt-in working preview of one section, built on the existing renderer and Coates #26 car.
It is not a claim that the runtime already matches the generated concept or a 4K performance promise.

The MP4 car, weather, existing speedos, project records and financial calculations are outside this change.
The separate v7.80 Fencing freshness fix is already live. This preview builds on that live page.

## Build

From `03_GC500_Delivery_Control`:

```sh
bash toolchain/build.sh v7.81 v7.81_track_detail_preview_DRAFT/patch_v781.py
python3 v7.81_track_detail_preview_DRAFT/build_preview.py \
  build/GC500_v7.81/GC500_Delivery_Control_hosted.html \
  build/GC500_v7.81/track_detail_preview.html
```

The second file is a standalone visual preview. Its data is limited to the circuit geometry and public OSM
surroundings already used by the page. It contains no project records, financial figures, credentials or network
requests. Open it in a WebGL 2 browser and select **Open animated preview**. Pause, replay, compare graphics,
select four cameras, or change quality. Reduced-motion users start paused.

The full candidate exposes **Track detail preview** in Showcase, explicitly selected. It is not ready to upload.

## Detail and evidence

- Slim advertising gantry and distinct lattice pedestrian bridge, sponsor panels, fixings and double-arm lights.
- Opt-in warm light, road/concrete materials, facade depth, shadows and procedural sky.
- Same car geometry, livery and simulation; preview camera framing and a short repeating section.
- Current tuning is in progress. Initial combined frame showed stretched sign lettering, a nominal garage wall
  and cramped framing; those findings are being corrected before final visual review.

Structures are informed by seven supplied photographs, but their scene offsets are illustrative. Andrew's
location descriptions have not been converted into verified survey coordinates. No original photos or generated
concepts are committed here. The other reviewer has not had access to those private originals; a summary is not
a source review. Existing key-plan/OSM attribution remains visible.

Initial component checks: active WebGL shaders compile, GL error 0; 12,120 track-detail triangles and 15,312
architecture triangles before ongoing tuning, each one draw call. These are development observations, not final
release evidence. Final combined desktop/phone checks and both sweeps are pending. No production upload.
