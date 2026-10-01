# v7.85 — approved Showcase track detail

Author: Andrew Fisher

Andrew approved the actual working render on 2 Oct 2026: “Wow that looks really good proceed”.
This release brings that opt-in pit-straight scene into **Showcase → Track detail**. It retains the MP4/weather,
current speedos, dashboard, existing car and driving simulation. No project records or financial logic change.

The scene adds raised kerb profiles, lit fence mesh, barrier and gantry fittings, coastal facades, foliage and
surface detail. The kerb shading fault raised in visual review is fixed by continuous shadow filtering; geometry,
paint and shadow bias are unchanged. The existing camera selector now offers four working views during Track detail,
and restores the saved camera/options when leaving, changing backdrop or closing Showcase.

## Build

```sh
bash toolchain/build.sh v7.85 v7.85_showcase_track_detail_DRAFT/patch_v785.py
python3 v7.85_showcase_track_detail_DRAFT/build_preview.py \
  build/GC500_v7.85/GC500_Delivery_Control_hosted.html \
  build/GC500_v7.85/track_detail_preview.html
```

The patch requires the v7.84 directions release and refuses a second application. The numbered 781 modules are
retained from the approved implementation; the release wrapper and runtime report identify v7.85.

## Validation and publication

Final candidate checks are in progress. No v7.85 upload has occurred yet. Publication will use the official
fresh-base guard and byte-for-byte public view verification. Historical preview evidence is in PREVIEW_HISTORY.md;
it does not substitute for the final v7.85 results.

Temporary structures and detailed kerb profiles are illustrative, not surveyed. The street geometry, source building
shells and original tree positions are retained. Software rendering proves output and behaviour, not real-device or
native 4K frame rates. Original private photographs and clips remain outside this repository.
