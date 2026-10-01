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

**READY TO UPLOAD.** Built on live v7.84 (`c9958a42…a725`). Final full page: **8,836,973 bytes**, SHA256
`2e73ac04d3c8f8105db6ff801998bbd8016a0e60b70374acfe9e4dad3e09c297`.
Standalone: **1,145,788 bytes**, SHA256
`3904d7d517e1e36161d07c2703495e8f7e83014ea19466d35fb758a288ad99e8`.

- **35/35** full-page checks, including default-off pixel equality with v7.84, four actual cameras, saved preferences,
  resource disposal, close/reopen and the 390 × 844 phone flow. The phone image was visually checked.
- **49/49** standalone checks, including animation, pause/replay, reduced motion, source geometry and GPU cleanup.
- Both navigation sweeps: **21 tabs / 7 deep links**, zero page, console or navigation errors.
- **6/6** isolated controls and **11/11** shadow-filter checks. The reviewed kerb area's abrupt luminance steps fell
  from 213 to zero, with unchanged shadow-disabled/default-off pixels. Earlier component proof is separate from final build tests.
- Independent exact rebuild and **45/45** driver-rule checks on this full-page hash; corrected kerb still reviewed
  with no remaining blocker: [coordination review](https://github.com/tatts29-svg/fish/pull/1#issuecomment-5940892989).
- Static checks pass all six inline scripts. All **7,625,870 bytes** before the renderer match the v7.84 base.
  Official upload dry-run and fresh-base check pass. No service writes were attempted by the browser tests.

Current proof is `evidence/release-*.json`, with the checked phone frame in `evidence/release-phone.png`.
Historical preview evidence is in PREVIEW_HISTORY.md. Publication will use the official fresh-base guard and
byte-for-byte public view verification; v7.85 has not been uploaded yet.

Temporary structures and detailed kerb profiles are illustrative, not surveyed. The street geometry, source building
shells and original tree positions are retained. Software rendering proves output and behaviour, not real-device or
native 4K frame rates. Original private photographs and clips remain outside this repository.
