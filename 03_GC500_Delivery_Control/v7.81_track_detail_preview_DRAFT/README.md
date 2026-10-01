# v7.81 — working track detail preview (not live)

Author: Andrew Fisher

Andrew approved the supplied track-detail concept with “looks good”, after asking for an Atari-to-PS3/PS4-scale
improvement. This is an opt-in working preview of one section, built on the existing renderer and Coates #26 car.
It is not a claim that the runtime already matches the generated concept or a 4K performance promise.

The MP4 car, weather, existing speedos, project records and financial calculations are outside this change.
This preview now builds on live v7.84, preserving the released operational corrections. The draft version label
v7.81 identifies this separate graphics work; it is not the live release number.

## Current surface refinement — 2 Oct 2026

Andrew: “Lets proceed with showcase improvments” and “don't undo everything else we have done your improving the
look not full redign”.

This additive pass raises **260 kerb profiles** within the exact footprints of the existing nominal kerb batch.
It gives the catch-fence wire consistent sun and sky lighting, adds gantry and bridge mounting plates and bolt
heads, and refines barrier joints, lower returns and material wear. The track-detail batch now holds **114 mounting
plates, 208 fixings, 100 barrier skins and 22,036 triangles**. All new detail remains in the existing additional
mesh; it adds no new draw calls or per-frame geometry construction.

The earlier facade and foliage refinement remains. Source kerb arrays, building shells, tree positions, car
geometry, livery and driving simulation are preserved. The MP4/weather, current speedos, page layout and controls
are unchanged. Kerb footprints follow the existing nominal curvature rule; their profile heights and the temporary
structures remain illustrative, not surveyed positions or measurements from the reference photographs.

Frozen base: **v7.84**, **8,767,811 bytes**, SHA256
`c9958a42085aef90aab8f7e81fdafddf6e49859669bf2b15fecff5818139a725`
([live release PR #23](https://github.com/tatts29-svg/fish/pull/23)).

| Current file | Bytes | SHA256 |
|---|---:|---|
| Full-page draft | 8,834,099 | `d5cd59c5df09caadfa835f3c10f1aef2a073852ec6922474107f97efefb67c21` |
| Offline visual preview | 1,142,904 | `8908db45cee553841abc33c5c5bf87195d8486d2d6edfd058180d716bf702a5e` |

Checks on those exact candidate hashes:

- Standalone **49/49**: desktop and phone, the existing camera/animation controls, source preservation, added
  kerb profiles, finite geometry, comparison restoration and resource disposal. See `evidence/surface-standalone.json`.
- Full-page **25/25**: default-off equality with the v7.84 scene, preview lifecycle, controls/preferences,
  close/reopen and resource disposal. See `evidence/surface-full-page.json`.
- Both navigation sweeps: **21 tabs and seven deep links each**, zero errors. See `evidence/surface-sweeps.json`.
- All **7,625,870 bytes** before the renderer match the v7.84 base exactly. See `evidence/surface-preservation.json`.
- Independent internal code review found no blockers in the surface changes. A separate no-GPU geometry check
  confirmed valid normals/indices and unchanged source data for both kerb orientations, excluding subsequent
  grid paint from the source copy. This is not a new external reviewer sign-off.

Render capture is being completed separately; no completed video or native 4K result is claimed here. The intended
current visual evidence is `surface-desktop.png`, `surface-phone.png`, `surface-kerb.png` and `surface-render.json`
under `evidence/`. Earlier `refinement-*` and unprefixed images below show historical candidates.

**Preview only; not READY TO UPLOAD.** Live graphics have not changed. Private photographs and video references
remain private; no project records, journals or real messages were changed. Visual fidelity against the approved
concept and performance on physical devices remain unfinished. A 4K still, when captured, will not establish a
4K animation frame rate.

## Previous facade and foliage refinement — historical checks, 2 Oct 2026

Andrew: “don't undo everything else we have done your improving the look not full redign”.

This pass retains the previous preview layout, camera rigs, controls, sequence, car and circuit geometry.
It adds facade depth to the existing nearby buildings, refines foliage at existing tree positions, and improves
road/concrete materials and their lighting. It does not extend the earlier omission of nominal garages/stands.
All source building shells, top heights and 1,392 tree positions remain; 159 nearby trees receive detailed crowns,
palm leaflets and smoother shading. Four coastal facade palettes use additive slabs, rails, glazing and podiums
on 14 existing building parts. These are illustrative details, not surveyed reconstructions of named buildings.

The first rendered colour pass was too bright. Leaf values now account for the existing tone mapper and use deep
coastal greens with restrained highlights. The road has stable, filtered aggregate, small illustrative repairs and
paving joints aligned with the existing straight. No racing behaviour or new camera sequence is introduced.

Historical files from the preceding facade and foliage pass (superseded by the current surface refinement):

| File | Bytes | SHA256 |
|---|---:|---|
| Full-page draft | 8,744,684 | `34e5defbe3fe39bcb40d8715d3d032ebb5c9841dbea35e90b47090c427bfbcb5` |
| Offline visual preview | 1,138,328 | `4b07428254f7a84535820f65b0ed065b05df7f4c2acfb0f775fce43be98b1288` |

Actual runtime frames: [before](evidence/refinement-before.png), [desktop refinement](evidence/refinement-desktop.png)
and [phone refinement](evidence/refinement-phone.png). The before and desktop refinement use the same camera and
simulation advance; the car, control layout and underlying scene composition are retained.

- Standalone **45/45** on that historical standalone hash: desktop, phone, four cameras, animation, pause/replay, reduced
  motion, unchanged car, finite foliage geometry, exact original-tree restoration and GPU buffer disposal.
  Zero external requests, page/shader/console errors or WebGL errors.
- Both navigation sweeps: **21 tabs and seven deep links each**, zero page or console errors.
- All **7,540,964 bytes** before the renderer remain byte-identical to the v7.80 base. Static checks pass all six
  inline scripts. Phone rendering and controls were visually inspected.
- An independent internal code review found no blockers and confirmed matching full/standalone renderer cores,
  one copy of the foliage module and preserved source geometry. This is not an external reviewer sign-off.

- Full-page **25/25** on the final full hash: lifecycle hooks execute before opening Showcase; the default scene
  has exact pixel equality with v7.80; preview exit restores controls/preferences and releases all 14 tracked GPU
  resources, including foliage buffers. Running/paused states, legacy backdrop preferences and close/reopen pass.
  Zero service-write attempts or page/shader/console errors. Evidence: `refinement-full-page.json`.

The external review below applied to the older prototype. These historical checks do not replace the current
surface-pass evidence above. Neither console-quality realism nor native 4K performance was established.

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

## What the preview shows

- Slim advertising gantry and distinct lattice pedestrian bridge, sponsor panels, fixings and double-arm lights.
- Opt-in warm light, road/concrete materials, facade depth, shadows and procedural sky.
- Same car geometry, livery and simulation; preview camera framing and a short repeating section.
- Correctly proportioned sign lettering, closer phone framing, and a visible procedural sky.
- All 2,704 OSM building rows retained. The preview omits 26 explicitly nominal garages and the original
  decorative crowd/stands. **Original scene** restores them; this comparison changes composition as well as detail.
- Leaving the full-page preview restores the saved backdrop, camera selection, calm-drive choice and paused/running
  state. The normal race restarts at the grid; it does not resume its earlier track position. Closing Showcase also
  restores the saved preference. A manually chosen new backdrop stays selected. Added GPU resources are released.

Historical prototype screenshots: [desktop](evidence/desktop-preview.png) and [phone](evidence/phone-preview.png).
These show the earlier environment study, not the current surface candidate. The current checks and visual
evidence are identified at the top of this document.

Structures are informed by seven supplied photographs, but their scene offsets are illustrative. Andrew's
location descriptions have not been converted into verified survey coordinates. No original photos or generated
concepts are committed here. The other reviewer has not had access to those private originals; a summary is not
a source review. Existing key-plan/OSM attribution remains visible.

## Previous frozen prototype — historical checks

Built from live v7.80, SHA256 `303029e3e64d5a43654bafc400d09e5bed2efbb93060a964214502cc04b96fc7`.

| File | Bytes | SHA256 |
|---|---:|---|
| Full-page draft | 8,725,360 | `cd8bbbc5207541836de42001ff1e1dc471f9ec8d54e40ba69c131c0dadd5db7b` |
| Offline visual preview | 1,117,998 | `22ac12d01aa8938c4d1f40113229a2dccf4aece3917ff0db592db6e1afb843ba` |

- Full-page checks **24/24**: exact default-off pixel equality with v7.80, preference restoration, exit/reopen,
  manual backdrop selection, normal restart/resume and resource disposal. Zero service-write attempts or errors.
- Final desktop and phone sweeps: **21 tabs and 7 deep links each**, zero page, console or navigation errors.
- Standalone checks **43/43**: real framebuffer comparison, unchanged car geometry/position, four distinct cameras,
  animation, pause/replay, reduced motion, phone controls and zero external requests or page/shader/console errors.
  That run used `f0cb213548f5cc824caab27873cc40612a8010217839f517547e8c54caeb4ecc` (1,117,971 bytes).
  The final file adds only a 27-byte flag reset in the full-page-only handler, which the standalone never attaches;
  `evidence/standalone-final-delta.json` proves the exact difference. The changed handler passes the full-page checks.
  A further **13/13 focused smoke checks** pass on the exact final `22ac12d0…` file; see `evidence/final-smoke.json`.
- All **7,540,964 bytes** before the GC3D renderer match the live base, including page data, operational/financial
  code, MP4, weather and existing speedos. Static checks pass all six inline scripts with no new credentials.
- Track detail: **14,564 triangles**; facade detail: **6,312 triangles**; one additional draw call for each mesh.
  Existing city vertex/index arrays restore exactly when comparison returns to the original scene.

Evidence and repeatable test scripts are in `evidence/`. Browser rendering used software Chromium; no physical
phone, console-quality, 4K frame-rate or hardware performance claim is made.

## Previous prototype review and release state

Implementation, local checks and final independent code review were complete for that historical prototype. The reviewer rebuilt
both files byte-identical at source a67c9d4 and recorded no blocking findings on 2 Oct 2026 at 01:35 AEST:
[final review](https://github.com/tatts29-svg/fish/pull/1#issuecomment-5934777145). All four early findings are resolved.
The reviewer saw the committed runtime frames, not the private photographs; no source-photo fidelity review is
claimed. Sponsor lettering is reconstructed typography, not supplied official artwork.

Visual fidelity remains unfinished against the approved concept. **Not READY TO UPLOAD.** No graphics publication,
record changes or real texts. At that historical review, the live page still matched v7.80 byte for byte; the current preview base is v7.84.

## Additional visual reference from Andrew

Andrew supplied [YouTube video VEavLG5dwc8, starting at 0:20](https://www.youtube.com/watch?v=VEavLG5dwc8&t=20s)
and asked us to use **0:20–1:30** for ideas on how the track looks. Direct access was refused with HTTP 403.
Andrew then supplied **GC500_Codex_Part_01.mp4** and **GC500_Codex_Part_02.mp4**, both received and visually
reviewed on **2 Oct 2026**. Each contains 35 seconds of 1920 × 1080 video at 25 fps. Review used sampled frames
across both clips and full-resolution frames at the points below; audio was not reviewed. The uploads supplement
his photographs and approved concept. All times below are **relative to each uploaded clip**, not independently
verified offsets into YouTube.

| Source and time | Observed detail | Use in the next graphics pass |
|---|---|---|
| Part 01, 0.8 s | Close mesh fencing, barrier runs, varied tower profiles and layered street frontage. | Establish believable foreground, middle distance and skyline in each sector. |
| Part 01, 5.5 s and 27.5 s | Raised red/white kerbs, narrow yellow edge paint, orange blocks on islands and dark tyre traces around chicanes. | Model kerb height/profile and island shape; use local wear and rubber following the corner. |
| Part 01, 11.7 s | Tight corner enclosed by barriers; deep balconies, distinct building shapes, palms and ordinary street markings. | Replace repeated glass-box facades with recognisable balcony/recess profiles; verify camera perspective before altering geometry. |
| Part 01, 18.5 s and 32 s | Foliage and buildings cast broken shadows; lane markings, surface seams, barrier feet/joints and spectators behind fencing remain visible. | Add layered foliage, ground contact, varied concrete and restrained road repair/paint detail. |
| Part 01, 23.7 s | Overhead Queensland sign, 200 boards, street lamps, road markings and differing spectator structures on each side. | Give each section a recognisable sequence of landmarks; avoid repeating the same roadside modules everywhere. |
| Part 02, 0–5.2 s | Narrow street enclosure, 100/50 boards, Hino panels and the pink GOLDCOAST. bridge among balcony towers and foliage. | Further bridge/streetscape reference; this does not verify Breaker Street or a map coordinate. |
| Part 02, 5.2 s onward | Edit into cockpit view; bright exterior framed by dark cabin. Coates wall panels appear later in this sequence. | Study exposure balance and a low-mounted viewpoint. Preserve the approved car identity and MP4. |
| Part 02, 20–22.7 s | Boost Mobile panels around a bend, spectators/canopies, yellow kerb and a small green island. | Sector-specific event detail and landscaping; sponsor placement/year is unverified. |
| Part 02, 25.2–34.7 s | Straight opens out, with grandstands left, close fence/barriers right, road/grid markings and overhead signage ahead. | Vary enclosure by section; do not narrow the entire circuit from the earlier street views. |

**Priority:** recognisable buildings and dense vegetation first; physical kerbs, barriers and surface variation
next; then matched camera framing and controlled sun/shade. These observations set the refinement priorities below. The previous prototype had overly uniform towers,
faceted foliage and even road lighting.

The source clips do not establish their filming year, surveyed dimensions or the 2026 sponsor layout. Current
photographs and the master plan take precedence for those decisions. No dimensions or map positions are inferred
from the wide-angle camera alone. Broadcaster overlays and the reference car are not proposed product assets.

Source identities: Part 01 is 17,370,560 bytes, SHA256
`0fd0246faa834e338cebbd0e088c81f202500c81fac5aca9bf9eea8d45f21be2`; Part 02 is 17,337,172 bytes, SHA256
`b9bca4fe70c71295b684b6878a523eddd756c807b68cea0171f213e772bffb89`.
Original clips and extracted stills remain in the private workspace, outside this repository. The external reviewer
has not yet confirmed access to these uploads; shared notes are not a substitute for their own source review.
Those reference notes did not change the then-frozen preview. The current surface refinement above supersedes its hashes;
no graphics publication or record edits.

## Next visual milestones — plan, 2 Oct 2026

Author: Andrew Fisher

The next build should prove the visual improvement on one representative straight before extending it around the
circuit. Its current owner implements the Showcase build. Share separable source/location or visual checks with
the other agent when available; coordinate ownership rather than changing the same files concurrently. The facade,
foliage and surface refinements above advance milestone 1; the complete milestones are not yet delivered.

1. **Make one section convincing.** Match the road enclosure and landmark sequence to the current photographs
   and plan. Replace uniform nearby towers with distinct balcony depths, recesses, podiums and setbacks. Replace
   angular placeholder foliage with layered trees and palms, with believable scale and ground contact. Add physical
   kerb profiles, road seams and restrained rubber/paint wear; refine fence supports, barrier joints and gantry
   construction. Make sun, shade and material response consistent across this section.
   **Proof:** a short playable loop plus before/after frames from the same camera, location and lighting preset;
   identify any changes to scene composition rather than presenting them as material-detail improvements.
   The section must read as the photographed Gold Coast street circuit from both low and elevated viewpoints.
   Temporary structures stay illustrative until their locations are verified; footage alone is not a survey.
2. **Make the journey convincing.** Extend the same standard to a chicane and a bridge approach. Connect chase,
   low trackside and overhead views with deliberate, smooth transitions. Vary enclosure, skyline and roadside
   furniture by section. Check camera clipping, distant detail changes, fence shimmer and road texture stability
   while moving. Refine cornering and wheel/steering presentation only where the existing 3D simulation needs it;
   the user's MP4 is a separate asset and is not replaced or treated as an editable 3D model.
   **Proof:** an actual rendered animated sequence covering the three sections, including pause/replay and Motion
   Off behaviour. Offer a sunset treatment after the daylight scene reads correctly.
3. **Connect the presentation and finish.** Add restrained sector titles and verified project-record callouts
   without obscuring the car or existing speedos. Keep project figures distinct from decorative racing telemetry.
   Test the integrated Showcase on desktop and phone, check text readability, and measure rendering performance
   before selecting quality defaults. Scale shadows and distant detail to device capability; native 4K and a
   frame-rate target are goals to test on suitable hardware, not promises from the software-rendered preview.
   **Proof:** working preview for Andrew to see before live graphics change, followed by the appropriate regression
   checks and byte-verified release once the visual direction is accepted. Keep the original scene available as a
   fallback. No project-record edits are part of this graphics work.

The MP4 car, weather and current speedos remain. The approved concept is the visual target; actual runtime frames
and video will demonstrate progress. AI may assist with asset or material drafts, but verified source geometry,
legible branding and measured browser performance decide what is used.
