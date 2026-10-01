# v7.81 — working track detail preview (not live)

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

Actual runtime screenshots: [desktop](evidence/desktop-preview.png) and [phone](evidence/phone-preview.png).
These are an environment study, still below the approved concept's realism. More accurate vegetation, individual
building modelling, physically richer surfaces and verified temporary-structure placement remain visual work.

Structures are informed by seven supplied photographs, but their scene offsets are illustrative. Andrew's
location descriptions have not been converted into verified survey coordinates. No original photos or generated
concepts are committed here. The other reviewer has not had access to those private originals; a summary is not
a source review. Existing key-plan/OSM attribution remains visible.

## Frozen candidates and checks

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

## Review and release state

Implementation, local checks and final independent code review are complete for this preview. The reviewer rebuilt
both files byte-identical at source a67c9d4 and recorded no blocking findings on 2 Oct 2026 at 01:35 AEST:
[final review](https://github.com/tatts29-svg/fish/pull/1#issuecomment-5934777145). All four early findings are resolved.
The reviewer saw the committed runtime frames, not the private photographs; no source-photo fidelity review is
claimed. Sponsor lettering is reconstructed typography, not supplied official artwork.

Visual fidelity remains unfinished against the approved concept. **Not READY TO UPLOAD.** No graphics publication,
record changes or real texts. The live page was freshly checked after the review and still matches v7.80 byte for byte.

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
next; then matched camera framing and controlled sun/shade. These are proposed implementation changes, not
changes already made. The current runtime has overly uniform towers, faceted foliage and even road lighting.

The source clips do not establish their filming year, surveyed dimensions or the 2026 sponsor layout. Current
photographs and the master plan take precedence for those decisions. No dimensions or map positions are inferred
from the wide-angle camera alone. Broadcaster overlays and the reference car are not proposed product assets.

Source identities: Part 01 is 17,370,560 bytes, SHA256
`0fd0246faa834e338cebbd0e088c81f202500c81fac5aca9bf9eea8d45f21be2`; Part 02 is 17,337,172 bytes, SHA256
`b9bca4fe70c71295b684b6878a523eddd756c807b68cea0171f213e772bffb89`.
Original clips and extracted stills remain in the private workspace, outside this repository. The external reviewer
has not yet confirmed access to these uploads; shared notes are not a substitute for their own source review.
The frozen preview code and hashes are unchanged; no graphics publication or record edits.
