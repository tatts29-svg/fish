**Carried LIVE in v8.02 on 2 Oct 2026 at 15:38 AEST.**

# Showcase complete lap, cameras and reference detail — DRAFT

Author: Andrew Fisher · 2 Oct 2026

Andrew asked for the missing half of the lap, better cameras, a fresh review of both MP4s and the photos, and finer visual detail. The original wall-clock stop could end playback after only 52.9% of the lap at an 8 Hz callback cadence. Playback now waits for the full circuit and the figures, with pause/replay/loop and appearance recovery preserved.

Route-aware cameras spend most of the tour at road level and use the actual screen aspect when setting their lenses. The opening shows the complete circuit; its progress map appears in road views. Desktop's old intended 68° driver lens was effectively 90.7°. The corrected lens and lower chase views keep the route legible on desktop and phone.

The render corridor now follows the existing centre-line carriageway width metadata instead of the much wider schematic source contours. This is an illustrative rendering correction, not surveyed race-fence placement. Original DATA/source loops, simulation and operational placements remain unchanged. Pavement, kerbs, walls, mesh and their owned banners share coherent derived boundaries. All eight road-camera laps and the conservative car envelope clear them. The original D001 master plan behind Map Explorer was visually read; its separate inset is surrounding streets, not a missing racing lap. Its three pedestrian crossings, five over-track signs and stand locations need a verified source-to-scene crosswalk before additional placements.

Both MP4s and 39 photos informed quieter asphalt, joined kerb profiles, irregular foliage, recessed facades and 26 open pit structures. Original media remain private. These are source-informed illustrative structures; no unsupported building heights or surveyed anchors are claimed.

## Current verification

- Playback:52 exact-source CPU cases.
- Camera:17 focused cases;4,056 route samples across four aspect ratios. All12 sections covered; no settled road-camera fallback or lost tracked car.
- Structure:38 architecture,27 pit,14 vegetation,13 kerb and17 surface checks. Geometry/resource budgets recorded in evidence.
- Corridor:48 CPU cases passed independently on integrated candidate5270f18; whole lap car clearance3.49m, kerb lip0.571m, eight settled camera laps clear. Upload rollback and fatal fallback are tested.
- Integrated intermediate5270f18:61 browser checks passed, zero page/GL errors or live record writes.30 desktop/phone views reviewed. Day/night, detail switch and actual WebGL loss/recovery retain coherent geometry and the current paused lap.
- Visual review found one pre-existing first/last fence-banner overlap exposed by narrower geometry. A bounded seam-spacing correction is now undergoing its new49-case check and targeted visual verification;5270f18 is not final sign-off for that correction.

A fresh official build on the current live Today/Equipment release, final standing suites, final screenshots and guarded publication remain. Software-rendered Chromium proves execution and geometry, not physical-phone frame rate. The vehicle appearance is a separately claimed v8.00 improvement requested after this draft; the old car model is not being described as visually finished.
