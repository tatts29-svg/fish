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
RESULTS_PLACEHOLDER
