# stage18: 3D mode v7.14 (fast, smooth, sharp; the status box goes away)

This is not uploaded. It was built and tested locally only.

## Files
- `poc3d/index.html` is the fixed page. It is the live stage21 copy with `patch_poc3d714.py` applied. Stage21 is stage7 plus the v7.14b status hotfix plus the v7.14c pixel-ratio fix.
- `patch_poc3d714.py` is identical to `S/patch_poc3d714.py`. It refuses any base other than stage21, and it refuses to run twice.
- `before/index.html` is the live stage21 copy.
- Test tools:
  - `bench.js`: the 3D page alone with `?embed=1`;
  - `dash18.js`: dashboard → Map explorer → 3D;
  - `cfg.js`: what each quality picks, per device;
  - `lh18.js` and `curlf18.js`: see "Harness bug".
- Data is in `out/`. Screenshots are in `shots/`.
- `explorer-merge.js` needs no change. The API it calls is unchanged: `setPins`, `showGroups`, `find`, `ring`, `stopOrbit`, `__ready`, and the tap that calls `gc500Explorer3DPick`.

## What changed
1. **Status box**
   - Inside the explorer it shows for 2.5 s after a view change, and 5 s on the standalone page (the v7.14b timings, kept).
   - Messages that matter show for 4 s: quality stepped down, and 3D imagery failed to load (at most once every 30 s).
   - Any press, touch or wheel anywhere closes it at once.
   - It fades by a CSS class and has `pointer-events: none`.
   - In the explorer it sits clear of the quality buttons and the compass. The old embed rule let it run under the compass on narrow screens.
2. **Pins**
   - No more `CLAMP_TO_3D_TILE`, which re-sampled all 732 billboards and labels every time a tile streamed in.
   - The pins are one `BillboardCollection` and one `LabelCollection`, not 732 entities.
   - They start at the measured site ground height of 44.6 m on the ellipsoid.
   - Pins within 450 m of the camera are then read once from the finest tiles with `sampleHeightMostDetailed`: 24 per batch, only when the camera is still, with the pins excluded. A pin is read again only if the camera comes within a third of the distance it was last read from.
   - The synchronous `scene.sampleHeight` returns about 2094 m on Google tiles, so the page does not use it.
   - Labels show within 650 m (450 m on a phone), the chosen group's labels within 1.5 km, and the found pin's label always.
   - One pin image per colour is kept in the texture atlas, drawn at 3×. Canvas images each took their own atlas slot and drew as black squares.
3. **Adaptive quality**
   - Still, each tier gets its full pixel ratio. Moving, it draws about 0.6× of that, capped at 2.5 MP on touch devices, with looser detail; the moving scale is tuned from measured frame times.
   - It snaps back to sharp 200 ms after the camera stops (up to 1.5 s on a very slow device).
   - `resolutionScale` is set to the target ratio divided by `devicePixelRatio`, consistent with the v7.14c fix.
   - A large foldable that asks for the desktop site is detected as a touch device by its coarse pointer.
   - MSAA is off at 1.5× or finer (FXAA stays on), and there is no multisampled backbuffer.
   - Shadows are off.
   - The compass only redraws when the heading changes.
   - The cache is 768 MB plus 384 MB overflow on touch devices, 1.5 GB plus 768 MB on a computer, and 512 MB plus 256 MB on a phone.
   - The old GUARD is gone.
   - Inside the explorer there is no auto-upgrade (as v7.14b). On the standalone page, auto-upgrade happens only on a non-touch screen that has proved fast while moving.
4. **Quality tiers, when still**

   | Tier | Pixel ratio | Detail | Cap |
   |---|---|---|---|
   | Ultra (4K) | the device's own, up to 3 | 1.5 px | 16 MP safety cap |
   | Auto | up to 2 | 4 px | 6 MP on touch devices, 8 MP on computers |
   | Light | 1 | 16 px | |

   Pressing a quality button shows a one-line explanation for 2.5 s. The minimum zoom distance is still 3 m.

## Numbers
All runs are headless Chromium on SwiftShader (software GL) on a shared machine at load average 18–23. Absolute frame times mean nothing here; compare before and after only.

**What each build draws** (`out/cfg.log`)

| Device | Quality | stage19 (what Andrew had) | stage21 (live now) | stage18 (this build) |
|---|---|---|---|---|
| Fold, realistic 884×1104 at DPR 2.6 | Auto, still | 1.75×2.6 = 4.55×, about 20 MP | 1.75×, 3.0 MP, MSAA 2, detail 8 | 2.0×, 3.9 MP, no MSAA, detail 4 |
| same | Auto, moving | same as still | same as still | 1.2×, 1.4 MP, detail 10 (measured: 1060×1324 moving, back to 2.0× on stop) |
| same | Ultra, still | 2.6×2.6 = 6.76×, about 45 MP | 2.6×, 6.6 MP, MSAA 2 | 2.6×, 6.6 MP, no MSAA, detail 1.5 |
| Brief's fold, 1800×2000 at DPR 2.6 | Auto | 5.2×, about 97 MP | 2.0×, 14.4 MP, MSAA 4 | 1.29×, 6 MP still; 0.75×, 2 MP moving |
| same | Ultra | about 164 MP | 2.6×, 24.3 MP, MSAA 4 | 2.1×, 15.9 MP still (16 MP cap) |
| Phone, 390×844 at DPR 3 | Auto | 5.25×, 2047×4431 = 9.1 MP (measured) | 1.75×, 1.0 MP | 2.0×, 1.3 MP still; 1.2×, 0.5 MP moving |

**Phone bench** (`out/bench_*_phone.json`). Before = stage19, the build Andrew was on. After = this build. Same 10 s time-based pan-and-turn path.

| Measure | stage19 | stage18 |
|---|---|---|
| First full view | not reached in 120 s | 105 s (SwiftShader) |
| Frames in 10 s of movement | 1 (under 0.1 fps) | 4 (0.3 fps, median 4.5 s/frame) |
| Draw commands while moving | 125 | 80 |
| Draw commands when still | 54 (tiles never finished) | 330 (finer tiles, detail 4 vs 8) |
| Tile requests during movement | 0 (stalled) | 47 (3 MB) |
| Pins on the ground, close-up | clamped (n/a) | 30 pins: median 0.05 m, worst 0.22 m from the model's ground |
| Page errors | 0 | 0 |

Time to fully sharp when still did not finish within the 120 s cap in either build under SwiftShader: the tiles keep streaming at software-render speed. No stage21 bench was run for lack of time; its pixel counts are in the first table.

**Embedded in the dashboard** (kit716 dashboard page, stage16 explorer; `out/dash_final.log`)

| Check | Result |
|---|---|
| 3D mode opens | yes |
| Pins | 368 |
| Status box 3 s after load | gone (`opacity 0 / hidden`) |
| Find GN04 | rings it |
| A real mouse tap on pin Z10 2 | `LEFT_CLICK` picks Z10 2, `gc500Explorer3DPick('Z10 2')` is called, the explorer card shows "Z10 2 Barriers · Zone 10" |
| Back to 2D | `in3d` false, frame hidden |
| Page errors | 0 |

In the phone bench, `bench.js` also found no overlap between the status box and the quality buttons, the compass or the view buttons.

## Screenshots (`shots/`)
- `after_phone_overhead.jpg`
- `after_phone_angled_status_gone.jpg` (the box is gone after 3 s)
- `after_phone_closeup.jpg`
- `after_phone_superzoom.jpg` (camera about 15 m from GN04, pins on the road, ring)
- `after_embed_overhead.jpg`, `after_embed_tap_card.jpg`
- `before19_phone_overhead.jpg`, `before19_phone_angled_status_gone.jpg`
- `after19_*` are an earlier intermediate build.

The `before_embed_*` shots were taken with the old harness, so the model is blank.

## Harness bug (it matters for every earlier 3D test)
`stage7/curlf.js` caches any GET without `session=` in its URL, and that includes Google's `root.json?key=…`. The stale root made every tile request return 400 (no key or session on the request). Every earlier headless 3D screenshot showed a blank white model: the model never drew in any earlier test. `curlf18.js` never caches `googleapis.com`.

## Not done / notes
- No fold-profile frame-time bench: at the brief's 1800×2000 at DPR 2.6, the old build's canvas is about 97 MP, which SwiftShader cannot move in a useful time. The fold results are pixel counts (`cfg.js`) plus the moving/still resolution probe.
- The status box's 2.5 s timer checks were measured in the dashboard run. In the SwiftShader phone bench, frames take about 5 s, which also delays timers, so the "3 s" readings there are not meaningful.
