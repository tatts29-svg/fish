# v8.08 Coates Way machine — crystal clear (image quality)

Author: Andrew Fisher · 2 Oct 2026 · DRAFT, not live, not uploaded

Andrew (2 Oct 2026, on the Coates Way machine): "Make this all 4k crystal clear. Improve every thing on here. 10/10".

This part of v8.08 covers image quality: sharpness, materials, lighting, the garage and the car's surfaces. Four agents
worked in parallel on separate files in `work/`. This part changed only its own files, plus one new file
(`fx-quality.js`). **`car-app.js` needs eight small edits to switch on the Ultra rung, the 4K still and the full texture
pass** (see "Edits needed in car-app.js" below). They are scripted in `evidence/fx_car_app_patch.py`. Without them,
everything listed under "Works as soon as the files land" still works, and nothing breaks.

## What changed and why

### New: `work/fx-quality.js` (one place for what sharpness depends on)
- **Anisotropic filtering on every texture.** Every texture made after this file loads uses 16× anisotropic filtering
  (8× on a phone or a touch tablet). three.js caps it at what the graphics chip supports. `upgradeTextures()` walks the
  finished scene and fixes any texture made with less, or with no mipmaps at all, including those in files this part does
  not own (crew, machinery, cog artwork). Floors, signs and decals seen at a low angle stay sharp instead of smearing.
- **Prints.** Every canvas with words or artwork on it (71 of them: the garage signs incl. DYNO CELL and COATES · 2-POST
  LIFT, the Life Saving Rules, the values wheel, the cockpit labels, plates and gauge faces, the tyre lettering) is
  registered as a print. On load each one is drawn at the same size as before, so loading costs nothing extra. On the
  Balanced rung it is redrawn at 1.5× the pixels, and on High and Ultra at 2×, a few at a time while the page is idle.
  Each print is capped at about 2.4 MP (1.2 MP on a phone) so memory stays sane. A phone on the Laptop rung never
  redraws anything.
- **The rungs**: Laptop / Balanced / High / **Ultra**. Ultra supersamples: whatever the screen, the drawing buffer gets
  at least 3840 × 2160 pixels' worth (up to 4× the CSS size). For example, a 1,440 × 900 laptop at ratio 2 draws at 3.03.
- **The 4K still** (`capture4K`): a true 3840 × 2160 frame through the same post-processing as the screen (ambient
  occlusion included). Every print is at full scale and the shadow map is redrawn. The canvas goes back to its own size
  before the browser paints.
- `?fx=aniso:1,print:1` fixes the anisotropy or print scale, for measuring what each one costs.

### Car (`car-gc500.js`, `car-scene.js`)
- **Livery atlas** ("26 Coates INDUSTRIAL SOLUTIONS", "Fisher", the yellow 26s): before, this was a single 1,024 × 512
  level with no mipmaps, so it shimmered on the far door and smeared at an angle. It is now mipmapped and anisotropic.
  The **decal shader keeps the letter edges one screen pixel wide however close you get**: it re-thresholds the glyph
  coverage by its screen-space slope, the way a distance-field font works.
- **The livery is now lit, under the same clear coat as the paint.** Highlights and the light rig's lines run across the
  lettering. Before, it glowed flat white and floated white in the floor's reflection. It keeps a faint glow of its own,
  so every word is as readable as before.
- **Paint flake.** One cell in six of a 0.6 mm grid is a tilted, smoother flake that sparkles inside a highlight. It only
  shows where a cell is at least half a pixel (close-ups and 4K) and fades out further away, so it never shimmers. The
  clear coat keeps the smooth normal, so its reflections stay clean. It is turned off on a phone on the Laptop rung.
- **Slicks.** The sidewall lettering reads "COATES · #26 · GC500 2026 · RACING SLICK", twice round each wall, with fine
  rings. It reads the right way from outside on both faces. It is worked out from the tyre's own radius and angle, so the
  original geometry and UVs are untouched and the print turns with the wheel. The walls have a satin finish, and the
  tread has the fine lengthwise grain of a used slick, which fades out at a distance.
- **Carbon fibre**: the cockpit's 2 × 2 twill as a normal map under a clear coat, replacing the 5-pixel checkerboard
  bump. **Metal grain**: 256 px of smooth two-octave noise, linear-filtered and mipmapped. Before, it was 128 px of
  per-pixel noise magnified with nearest filtering, which showed as blocky grit on chrome in a close-up.

### Garage (`pit-garage.js`)
- **All signs and sheets are prints** (above). The dyno console screen ("COATES · DYNO CELL") is drawn at up to 1.5× on
  the higher rungs.
- **Epoxy floor wear**: one map across the whole hall, not tiled, using two channels:
  - clear-coat roughness: mirror-polished in the open, satin down the walkways and the forklift lane, dull rubber where
    the car's tyres came in from the door and round the rollers, plus 420 soft scuffs;
  - grime that dulls reflections along the walls.
- **Light rig**: four LED battens in a frame 5.6 m over the cell, outside the roof line, so no allowed camera looks at
  the car through one. Their diffusers are brighter than white, and the roof fittings are 2.2× brighter. The garage is
  captured into the environment map, so these become the long clean highlight lines down the flanks and across the roof.
  There is also a cool **rim light** from behind and above on the far side, which outlines the roofline and the wing. The
  rim light is left out on phones: one less light to work out for every pixel.
- Ramps and haze sprites are mipmapped like everything else.

### Cockpit and the rest (`cockpit-surfaces.js`, `car-cockpit.js`, `car-fit.js`, `view-fx.js`)
- Every cockpit print (switch panel sheet, plates, button and rim labels, gauge faces, the fire-system label, the net) is
  redrawn at up to 2× on the higher rungs. The driver's display and radio window are redrawn live by their own code, so
  they keep their size, as before.
- The firewall display and the wheel-blur disc are prints too. The blur's streaks now come from a fixed seed, so every
  redraw is the same picture.

## What did not change (on purpose)
- **Renderer basics**: `antialias: true` (4× MSAA on the canvas), sRGB output, ACES Filmic tone mapping at exposure
  1.02, PCF soft shadows (2,048 on Laptop, 4,096 above), GTAO ambient occlusion with a 4-sample MSAA target on
  Balanced and above, and the adaptive resolution that steps down only when frames are slow and back up when idle. These
  were already in `car-app.js` and are correct. ACES was kept rather than AgX so the approved look and the Coates orange
  stay as they are.
- **No FXAA or SMAA pass.** MSAA plus the device's full ratio (or supersampling on Ultra) gives clean edges, and a
  post-process blur would soften the text this work sharpens.

## Edits needed in car-app.js (not this part's file)
`python3 evidence/fx_car_app_patch.py work/car-app.js`. Each edit must match exactly once (`toolchain/rep.py`), and the
script refuses to run twice. It was checked against both `base/car-app.js` and the `work/car-app.js` being edited
today.

| # | find | becomes |
|---|---|---|
| E1 | `import {PARTS,COG_REFERENCES} from './parts.js';` | the same line, then `import * as FXQ from './fx-quality.js';` |
| E2 | `const RATIO={still:{laptop:3,balanced:3,high:3},move:{laptop:1,balanced:1.25,high:1.5}}` | adds `ultra:4` to still and `ultra:1.5` to move |
| E3 | the end of `targetRatio()`: `...return Math.max(Math.min(dev,.75),Math.min(dev,cap)*dprScales.still);}` | on Ultra, `want=FXQ.ratioFor('ultra',{dev,cssW,cssH})` from the viewport; `Math.min(want,cap)` |
| E4 | `const modes=['laptop','balanced','high'];quality=modes[(modes.indexOf(quality)+1)%3];` | `const modes=FXQ.QUALITY_ORDER;quality=modes[(modes.indexOf(quality)+1)%modes.length];` |
| E5 | `function applyQuality(){if(!renderer)return;` | then `FXQ.setQuality(quality,{renderer,scene});` |
| E6 | before `if(LOOK.garageEnv)await garageEnvironment(...)` | `FXQ.setQuality(quality,{renderer,scene});` (textures fixed before the first upload, so nothing is uploaded twice) |
| E7 | `new T.WebGLCubeRenderTarget(256,` | `new T.WebGLCubeRenderTarget(FXQ.envSize(quality),` (512 on Balanced and up, 256 on Laptop as now) |
| E8 | the whole `$('capture').onclick=...` statement | `FXQ.capture4K({renderer,camera,composer,render})`, then `download(...)` and the toast "4K image saved: 3840 × 2160." |

### Works as soon as the files land, before the car-app edits
- Tyre lettering, paint flake, lit and crisp livery, the atlas mipmaps, carbon, metal grain, floor wear, the light rig,
  the rim light, and default 16× anisotropy on every texture made after load.

### Needs the car-app edits
- The Ultra rung, print redraws on rung changes, the texture pass over other files' textures, the 512 environment
  capture, and the 4K still through the post stack. Until the edits are in, the old capture still produces 3840 × 2160,
  but without ambient occlusion and with prints at base size.

## Measured
These were measured with `fx_tests.js` and the rig (`machine_rig.js`, SwiftShader software rendering) on 2 Oct 2026.
"After" means `base/`, plus this part's files from `work/`, plus `fx_car_app_patch.py` applied to `base/car-app.js`. The
test copy was in the scratchpad, not the repo. The machine was shared with three other agents (load average 10 to 33),
so the timings are only for comparing like with like.

**Tests (`fx_tests.js`)**
- After, desktop 1,440 × 900 at ratio 2: **21/21 checks passed**.
- After, phone 390 × 844 at ratio 3: **21/22 checks passed**. The one failure was the test's own Ultra pixel check: it
  demanded 8.3 MP on a 390 px-wide phone, where Ultra stops at 4× the screen (3.31 MP, which the run reached at ratio 4).
  The check now asks for whichever is smaller. It has not been rerun since that change.
- Base: 4 failures on each device: no fx-quality, 5 textures without mipmaps (the livery atlas among them), 12 textures
  under 16× anisotropy, and the atlas at 1× with no mipmaps.
- `work/` as it stands (this part's files, not wired, plus the other agents' changes), phone: no page or console errors.
  The only failures are three textures in files this part does not own (`model.js` 128 px bump, `crew.js` tablet at 4×,
  `pit-machinery.js` board at 4×). The car-app edit E5/E6 fixes them at run time.

| | base | after |
|---|---|---|
| Still pixel ratio, laptop 1,440 × 900 @2, Laptop / Balanced / High | 2 (2,260 × 1,604) | 2 (2,260 × 1,604) |
| Ultra (new rung), same laptop | n/a | **3.025 → 3,418 × 2,426 = 8.29 MP** (3840 × 2160 worth) |
| Phone 390 × 844 @3, Laptop | 3 (1,170 × 1,589) | 3 (1,170 × 1,589); Ultra 4 (1,560 × 2,119) |
| Canvas multisampling / post-stack target | 4 / 4 | 4 / 4 |
| Textures mipmapped and at full anisotropy | 100 of 105, 12 under target | **106 of 106** (16× desktop, 8× phone) |
| Prints (71) | 27 MP, never redrawn | 27 MP Laptop · 49 MP Balanced · 71 MP High/Ultra, redrawn when idle |
| 4K capture | 3,840 × 2,160, no ambient occlusion | **3,840 × 2,160 PNG (11.8 MB), through the post stack**, canvas restored; also from the phone |
| Shader programs at load (phone) | 86 | 88 |
| Draw calls / triangles (phone, Laptop) | 959 / 814,083 | 967 / 814,275 |
| Load to ready (phone, three alternating pairs, s) | 91 · 79 · 79 | 86 · 80 · 91 (within the noise) |
| Build cost (median of 5, same page): garage / body / materials (ms) | 439 / 882 / 3 | 436 / 856 / 10 (the weave is now built here once and the cockpit reuses it) |
| Phone frame, Laptop rung (software, ms) | 29 · 26 | 23 · 49 · 34 |

**Sharpness** (mean gradient and Laplacian variance of the canvas; higher is crisper. Some of the rise is new detail:
tyre print, floor wear and the light rig's lines.)
- 1,440 × 900 @2, Laptop: 5.51 → 6.40 · 569 → 726. Balanced: 6.06 → 7.04 · 658 → 875.
- 3,840 × 2,160 viewport @1, Laptop: 4.50 → 5.23 · 408 → 537.
- Close-ups on High, 1,440 × 900 @1, same camera (before/after):

| close-up | mean gradient | Laplacian variance |
|---|---|---|
| floor sign DYNO CELL | 2.97 → 3.37 | 139 → 227 |
| door livery | 7.35 → 8.29 | 595 → 825 |
| rear tyre | 5.66 → 8.69 | 537 → 1,243 |
| console | 1.04 → 1.06 | 29 → 41 |

**Looked at** (pictures in the session scratchpad, not the repo)
- Before/after at 1,440 × 900 @2 and 3,840 × 2,160 (Laptop and Balanced), the four close-ups, the phone on every rung,
  the Ultra frame and both 4K captures.
- The letter edges of DYNO CELL and "26 Coates INDUSTRIAL SOLUTIONS" are visibly harder.
- The tyre lettering reads correctly round both sidewalls.
- The livery now takes the paint's shading.
- The floor shows polished and worn areas.
- The 4K still has ambient occlusion and readable console text.
- No errors on any run.

**Seen but not changed (not this part's scope, or present in base)**
- On Balanced and up, the planar floor reflection shows the bright livery and orange parts but hardly the dark navy body,
  so "26 Coates" seems to float in the floor. This is the same in base. Lit decals soften it but do not remove it. The
  reflector's tint and strength are set in car-app.js `applyQuality` and in `pit-garage.js`.
- The rig's SwiftShader trips the page's "under 24 fps, drop to Laptop" check on every run, and on Laptop that also caps
  the ratio at 2 for good (`lowDpr`). The tests step the frame loop by hand and move the rung to Balanced first, so each
  rung is measured as asked. A real graphics chip does not trip it.
