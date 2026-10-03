**Carried LIVE in v8.02 on 2 Oct 2026 at 15:38 AEST.**

# v8.00 — vehicle visual upgrade

Author: Andrew Fisher · 2 Oct 2026

**DRAFT component — carried by the v8.02 release candidate. Not separately uploaded.**

The coordinator carries the vehicle and Showcase changes into v8.02 after the separate v8.01 booking release. This v8.00 build is a historical integration and review intermediate; it is not the publication candidate. The fresh-live v8.02 candidate is `07d618803b0b6ee97b27265ce4eeadd0390190a4a61dd25a7c1d428ca1bc2992`, 9,070,571 bytes. Its complete business script matches live v8.01 `70ed0c49`; all seven other inline scripts match GPU-reviewed private candidate `85adb462`. Exact evidence is in `../v8.02_showcase_vehicle_finish_LIVE/evidence/source802_checks.json`.

Andrew: “I reckon the car.needs a huge upgrade as well as chosen vehicles they look very atari”; “Visually”.

The race car gains coherent curved-panel normals, shaped wheel barrels and tyre shoulders, broad dished spokes, recessed projector lights, filled rear light lenses and finished wing edges. The four existing machines and both trailers gain shaped panels, rims, tread and mechanical fittings. Shared materials distinguish painted panels, rubber, metal and glazing, with filtered highlights and mipmapped livery lettering. Detail and Front detail fit the selected vehicle, including its trailer and animated attachments. The seven vehicle choices and their driving behaviour remain the same.

The historical intermediate also carried the v7.97 photo-outbox durability fix, v7.98 drawer/print fixes and v7.94 full-lap Showcase work from the then-live v7.96 Today and Equipment page. v7.97/v7.98 are now carried by live v8.01. The final v8.02 build starts from that fresh live page and preserves its Wednesday bookings and business code.

## Historical build and integration

The following command records the earlier v7.96-based integration. It is not the command for the current live base; use the v8.02 release instructions for that build. From `03_GC500_Delivery_Control/`:

```bash
bash toolchain/build.sh v8.00 \
  v7.97_photo_outbox_durability_LIVE/patch_v797.py \
  v7.98_control_state_reliability_LIVE/patch_v798.py \
  v7.94_showcase_lap_cameras_LIVE/patch_v794.py \
  v8.00_vehicle_visuals_LIVE/patch_v800.py

python3 v8.00_vehicle_visuals_LIVE/evidence/source800_checks.py
```

The official builder fetches the public live page, applies that chain, scrubs page attributions and runs the required static check. Every patch refuses a repeated or incompatible application. `patch_v800.py` applies race geometry, selectable-vehicle geometry, shared materials and detail-camera fitting in that order, then sets non-visible release metadata and the existing Showcase report versions to v8.00. It adds no control or record field. After v8.01 is live, the coordinator's v8.02 build must start from those fresh live bytes and deliberately adapt their metadata; the strict v8.00 guards do not accept another release tag.

`source800_checks.py` independently rebuilds the same chain and compares the final bytes. HTML stages stay in `/workspace/private-v800-build-stages/`; only their hashes and test evidence are recorded here. Each vehicle suite runs against its exact component input/output, so a change elsewhere cannot make a broad source comparison misleading.

Expected fresh live v7.96 base for this intermediate: `dd16fa3bd21d9e2b3f7e412e56855670dae7ebe5d5b03954b5951ba699c7f43c`. The v7.98 stage includes the print-preview scale reset and measured toolbar clearance, and rebuilds to `9a52ec22c794a514d44936ef84335b62a6876c2664fa54f211a35f1315666d95` after the official scrub. The v7.94 corridor helper is the final seam-corrected source `cfaf3e0a4e2dbccceb594e1be3d87c2bf45ec9a5fd1eedf19175a335cbaab210`.

The verified intermediate was **9,038,581 bytes**, SHA-256 `43a74f7bc8ca4ba4339f51dea142dedc845c86274e82107c68e49c68ac264a8f`. Its official path is `build/GC500_v8.00/GC500_Delivery_Control_hosted.html`; an immutable review copy is `/workspace/private-v800-camera-integrated.html`. The exact rebuild and protected-source proof passed **21/21** checks in `evidence/source800_checks.json`. This intermediate predates the accepted race-orange material tuning and supported-AA selection carried by v8.02. Its historical evidence is retained rather than relabelled as final.

## Scope and budget

| Component | Result and bound |
|---|---|
| Race car | 81,102 triangles in Balanced and 146,246 in High, below the prior 82,722 and 174,446; 31 model parts before unchanged decals |
| Race mesh memory | 2,939,688 bytes in Balanced and 4,868,936 in High, both below the prior model |
| Machines and trailers | Six models, at most 24,668 triangles each under a 30,000 limit; 17–25 draw parts after grouping equivalent material and motion states |
| Shared materials | Existing vertex layout and material names; one existing environment lookup, no additional texture object or draw pass |
| Livery filtering | Existing pixels and dimensions, with a 174,763-byte mip chain |
| Construction | Cached model generation; no per-frame mesh generation |
| Detail cameras | Cached part bounds and local fence queries; existing camera choices and smoothing, no GPU resources |

The exact race-car envelope, wheel pivots and complete livery geometry are preserved. Plant tuning, selection labels, basket sway, hitch motion, portaloo animation and VMS display metadata remain unchanged. The source verifier compares operational DATA, driving hull, simulation, suspension, particle generation, fixed-step loop, rigid car transform and selection handoff against the declared pre-visual stage. The only business-code changes are the separately reviewed photo, sync-status and print fixes.

The models remain authored illustrations. The full-lap corridor follows the existing aerial-derived carriageway widths; it is not surveyed race-barrier alignment. Photo-informed facade and pit detail retain nominal source envelopes. The geospatial car adapter consumes the same race geometry, but its separate coarse material mapping is outside the shared vehicle shader refinement.

## Verification and remaining release gates

The final isolated stages passed: race mesh **32/32**, race patch guards **6/6**, selectable vehicles **154/154**, materials **21/21** and detail cameras **188/188**. The official checker passed all eight inline scripts and secret checks. Raw results are in the `*_integrated_checks.json` files, with their stage hashes in `source800_checks.json`.

Camera checks cover all seven choices in both detail views at four aspect ratios, retained simulation and attachment state, ordinary camera delegation, portaloo door behaviour, resize/export fitting, cache invalidation and resolved or explicitly unresolved obstruction fixtures. The source-building test and the ordinary held-pose framing tests are CPU checks. Independent captured-renderer matrix fixtures and final product screenshots are separate graphics-review evidence and are not claimed by the 188-case result.

Independent mesh review found 180 Balanced and 210 High triangles with opposing normals in the prior race model; both are zero in the refined model. Forty spoke volumes are independently checked for closed edges and outward orientation. CPU checks also cover both quality levels, immutable livery placement, deterministic caches, primitive normals, grouping and motion metadata. Shared-material review checked energy terms, filtered roughness, transparency and uniform isolation. The ordinary race renderer already sorted glass after opaque parts; the common ordered pass chiefly makes that contract explicit and corrects the unsorted trailer path.

The inherited v7.98 final print checks passed 31/31 on phone and 31/31 on desktop, including toolbar clearance, 320–390 px resize and reused A → B → A previews with all four photographs, plus 23 source cases and four exact-note PDFs. These browser results are tied to that stage; final combined browser regressions remain required.

Baseline and final desktop and phone vehicle images have been inspected. Private v8.02 candidate `85adb462` passed 82 GPU checks with ten matched images, supported Balanced 4× allocation, quality replacement and context recovery; all inspected geometry and material views are accepted. Its renderer bytes are exact to the official `07d61880` candidate. Independent camera proof passed 244 checks using captured renderer matrices, separately from the 188 core checks. Actual UI camera, real smoke/opening and application sweep evidence is recorded by the v8.02 coordinator and remains distinct from the fixed-camera inspection. CPU geometry and software-rendered captures do not establish real-device frame rate or a 10/10 visual result. No live record is written by these tests, and no publication is performed by the build.
