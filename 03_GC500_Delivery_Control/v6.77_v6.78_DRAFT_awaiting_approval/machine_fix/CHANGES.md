# Coates Way machine — v5.86 corrections (staged, not deployed)

Base: the live v5.85 set (104 files, copied by the audit to `/tmp/claude-0/machine_audit/live`). This folder is that set with the
changes below; every other file is byte-identical to live. Nothing was deployed and nothing was sent to the live service.

**Not part of the deployable set:** `CHANGES.md`, the `*.png` screenshots in this folder, and `_qa/` (test script, output,
local server, packing script). Leave them out when importing the machine.

**New files the import must include** (all use extensions the machine route already allows):
`assets/machine/coates-23.glb.gz.bin`, `assets/machine/studio.hdr.gz.bin`, `vendor/meshopt_decoder.module.js`,
`vendor/MESHOPTIMIZER-LICENSE.txt`.

## M1 — the crew in the way on first open (High)

What was actually happening: the figure in the middle of the opening shot was the **safety control officer**. He started, and
made his first patrol stop, at the near corner (−4.8, 2.6). That point sits on the line from the opening camera to the car on
both laptop and phone. The "CREW LEAD" lettering came from his own suit: v5.85's "nothing blocks the view" fade skipped skinned
bodies but not the vest (a plain mesh on his chest bone). So the vest faded to 13 % on its own (measured: vest opacity 0.13,
body 1.0) and the suit's back print showed through with "SAFETY" ghosting over it. It was one person, half-faded, not two people.

| File | Change |
|---|---|
| `crew.js` | New `SAFETY_START = [1.8, −2.95]`: the far aisle beside the car, behind it from the opening camera, facing the car. The patrol no longer stops at the near corner (−4.8, 2.6), and starts from the new spot. He still walks the whole loop and still holds the near side while the V8 runs. |
| `view-fx.js` | `buildOcclusion` takes a `group(mesh)` option. Any hit on a person (body, vest, tablet or picking box) fades **the whole figure** and brings it back as a unit. The car, the V8 and the cog still never fade. |
| `car-app.js` | New `personFade()` maps a hit mesh to its crew figure and is passed to `buildOcclusion`. Now anyone who walks between the camera and what you are looking at, in any view, fades as a whole and comes back when clear. |

## M2 — load watchdog (High)

| File | Change |
|---|---|
| `index.html` | New inline watchdog placed before the module script. (1) If a module fails to load, or throws before the app starts, the page shows the existing static-cutaway fallback **straight away**. (2) If the page spends 40 s waiting with no file arriving, it shows the same fallback. Either way the message is plain, the button reads **Try again** (reloads) and the status reads "3D unavailable". Controls that have no car to act on are switched off. Only waiting time counts: a resource arriving resets the clock, and time the main thread spends busy (shader compiles on a slow GPU) is not counted. The button label changed from "Try 3D again" to "Try again". |
| `car-app.js` | `fallback()` stands the watchdog down. If the car finishes loading after the watchdog has already shown the fallback, the app removes the fallback, turns the controls back on and shows the car ("The 3D car has loaded."). |

A model or HDR that returns 404 was already caught by the app's own `try/catch`. It now shows the same fallback with the same button.

## M3 — first-open download (High)

| File | Before (bytes) | After (bytes) | What |
|---|---:|---:|---|
| `assets/machine/coates-23.glb` | 12,938,556 | 6,474,396 | Same model with geometry in **EXT_meshopt_compression, lossless**: vertex codec on the float32 data as-is and index codec on the triangles. No quantisation and no filters. Now the plain fallback file. |
| `assets/machine/coates-23.glb.gz.bin` | — | 1,818,975 | That GLB gzipped. **This is what the page downloads.** |
| `assets/machine/studio.hdr` | 2,115,634 | 2,115,634 | Unchanged. Now the plain fallback file. |
| `assets/machine/studio.hdr.gz.bin` | — | 58,773 | The HDR gzipped (byte-identical once unpacked). **This is what the page downloads.** |
| `vendor/meshopt_decoder.module.js` | — | 29,019 | meshoptimizer 1.3.0 decoder (MIT, self-contained WebAssembly, no CDN at runtime). |
| `vendor/MESHOPTIMIZER-LICENSE.txt` | — | 1,079 | Its licence. |
| `model.js` | 7,444 | 9,843 | `fetchPacked()` fetches the `.gz.bin` and unpacks it with the browser's `DecompressionStream`. If the browser lacks it, or the packed file fails, it falls back to the plain file. If the bytes are already unpacked, they are used as-is. `unpackMeshopt()` decodes the meshopt views into one plain buffer, so the rest of the custom loader is unchanged. The model URL query changed to `?v=meshopt-1`. |

**Why `.gz.bin`:** the machine route has an allowlist of extensions (`MACHINE_TYPES` in `server/gc500-server.js`) and `.gz` is
not on it, while `.bin` is. The route never sets `Content-Encoding`, so the browser receives the gzip bytes untouched and the page
unpacks them. The existing CSP already allows `'wasm-unsafe-eval'`, which the meshopt decoder needs.

**First open (sum of Content-Length up to ready, local copy of the route):** before 17,681,805 → after 4,541,651 bytes
(−74 %). The `gltf-transform` CLI (`npx @gltf-transform/cli`, v4.5.0) installed fine. `validate` reports **no errors** on the
new GLB. Its only new notice is "cannot validate EXT_meshopt_compression" (the validator does not support that extension). The
GLB was built with `_qa/pack_assets.mjs` using meshoptimizer's own encoder, not the CLI's `meshopt` command. The CLI command
quantises by default and would add node transforms that the custom loader ignores.

**Proof the model is unchanged:**
- **At pack time:** every one of the 72 attribute views decodes byte-identical, and all 192,279 triangles are the same (same vertices, same winding).
- **In the browser:** the page's own `buildModel()` produces an identical hash over every geometry's positions, normals, UVs and triangles in both builds. Both have 108 geometries, 176 parts and 15 materials.
- **Studio light:** decodes to identical floats.
- **Artwork:** the PNG inside the GLB is byte-identical.
- **Pixels:** the cockpit (cog) view was rendered to a 960×600 render target with the crew hidden and the loop stopped. First a control: live against live loaded again gives 0 differing pixels, so the render is deterministic. Then this set with only the live `crew.js` swapped back in against live: **0 of 576,000 pixels differ**, the cog's 46,412 included.
  - Against this whole set, about 5 % of pixels differ (at most 40/255), including 488 on the cog. That comes from M1, not the model. At start-up the page bakes the garage into the reflection map with the crew standing in it, so moving the safety officer changes the reflections.
  - Images: `_qa/cog_render_*.png`.

Carry-over for the pipeline: if `build_machine.py` rebuilds `coates-23.glb` it will write the uncompressed file again.
Run `_qa/pack_assets.mjs` after it (it needs `npm i meshoptimizer@1.3.0`).

## M4 / M7 — wording (low risk)

| File | Change |
|---|---|
| `car-app.js` | Ring chips "Connected"/"Disconnected" → **"Fitted"/"Not fitted"**. Count "310 / 310 connections engaged" → **"310 / 310 parts fitted"**. Status "Drive ready" → **"Ready to run"**. The tour line that quoted "Drive ready" now says "Ready to run". Help text: "The displayed rpm is the slow inspection speed" → "The Cog speed readout is the cog's slow inspection speed, not the V8's revs (the dash shows those)". |
| `index.html` | Overlay label "INSPECTION SPEED" → **"COG SPEED"**. New always-visible line **"Interactive illustration — not a performance measure"** (`#model-note`) directly under the fitted count. Progress bar aria-label "Connected components" → "Parts fitted". |
| `car.css` | Style for `#model-note`. |

Coates Way values and pillar wording are untouched. The in-hall telemetry screen prop ("V8 STOPPED · DRIVE READY") and the
parts register's per-row "Connected" are also left as they were.

## Byte sizes of changed code files

| File | Before | After |
|---|---:|---:|
| `index.html` | 8,857 | 11,143 |
| `car-app.js` | 94,919 | 96,080 |
| `model.js` | 7,444 | 9,843 |
| `view-fx.js` | 5,020 | 5,471 |
| `crew.js` | 137,571 | 138,344 |
| `car.css` | 24,001 | 24,200 |

## Evidence

- `before_first_view.png` / `after_first_view.png` (1440×900); `before_first_view_390x844.png` / `after_first_view_390x844.png` (phone)
- `after_running.png`: V8 running; overlay reads COG SPEED, dash shows the engine revs
- `load_failure_fallback.png`: a module (crew.js) aborted → immediate fallback
- `watchdog_fallback.png`: the studio light hangs → watchdog fallback
- `_qa/after_person_in_the_way_fades.png`: a crew member put on the camera line fades as one figure
- `_qa/cog_render_before.png`, `_qa/cog_render_before_again.png`, `_qa/cog_render_after_with_live_crew.png`, `_qa/cog_render_after.png`: cockpit renders used for the pixel comparison
- `_qa/test_machine_v586.js` + `_qa/test_output.txt`: the checks and their output. `_qa/serve.js` is the local stand-in for the route (same MIME table, extension allowlist and page CSP). `_qa/pack_assets.mjs` is the packer with its round-trip proof.

**Result of the final run (`_qa/test_output.txt`): 29 / 29 checks passed**, no page errors. Checks cover: opening shot unobstructed at 1440×900 and 390×844 (0 of 182 rays to the car meet a person; before: 133 and 77, all the safety officer); crew ≥ 2.47 m apart; a person on the camera line fades whole and returns; officer never half-faded; patrol clean for 120 s simulated; wording; download size; model identical; module abort → fallback in ~0.2 s; Try again reloads and builds; model 404 → fallback; hung HDR → watchdog fallback ~40 s after the last file.

## Not done / limits

- Tested on Chromium with SwiftShader (software rendering) only, not on a real phone or GPU, and not on Safari or Firefox. `DecompressionStream` needs Safari 16.4+ or Firefox 113+; older browsers fall back to the plain files (6.5 MB + 2.1 MB).
- The server was not changed. If gzip/brotli is later added for `.glb`/`.hdr` on the route, the plain fallbacks get smaller as well; the page does not depend on it.
- The old v5.82 node test `tests/crew.test.mjs` already fails on live v5.85 ("six roles": v5.85 added the officer), so it could not be used as a regression check. The browser test covers his patrol instead: 120 s simulated, never inside a floor footprint, never stopping on the opening line.
