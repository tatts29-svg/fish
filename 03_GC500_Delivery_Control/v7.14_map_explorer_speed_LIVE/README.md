# v7.14: Map explorer speed (LIVE)

Author: Andrew Fisher

Andrew, 27 Sep 2026: "I'm back onsite tomorrow so we need to ensure maps is faultless: no lagging, no slowness, no issues
with zooming, rendering, viewing or refresh. Must be seamless and quick." ... "moved in and out, turned in every direction,
zoomed right in and out ... 4K ultra, pure crystal clarity".

Seven explorer files replaced or added in the machine set: `release/` holds the files, and `release/MANIFEST.txt` the md5s.
- The map opens from pre-rendered tiles instead of the 13.3 MB scene.
- Coarser stand-ins mean a zoom never shows blank.
- The destination is fetched as a zoom starts.
- A phone renders at true device resolution at rest, and at DPR 2 while a finger is moving.
- The hidden 2D map does no work under 3D.
- The reference card no longer covers "As drawn" or the credit on a phone, and closes on a tap on the map.

**Measured** on a simulated phone (CPU 4×, 390 px; SwiftShader on a heavily loaded machine, so only the before/after
comparison is meaningful), first sharp view: live never within 120 s, new 5–11 s.
- On a desktop: first picture 5.2 s → 1.2 s, and blank while zooming 21 s → 0 s.
- `PERF.md` has every table and its limits.
- The real test is Andrew's phone on site.

**LIVE: 27 Sep 2026, about 22:45 AEST.**
- Machine set 7253ae1d89da (219 files, 164.1 MB), version v7.14-map-explorer-speed.
- All 7 files were verified byte for byte on the view link.
- The page is unchanged (v7.12).
- Map explorer checks with page v7.12: tab, card, Open → drawer, old 3D link → 3D, overlay. No errors on desktop or phone.
