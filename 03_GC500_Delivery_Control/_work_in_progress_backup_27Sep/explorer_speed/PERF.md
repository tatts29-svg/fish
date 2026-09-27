# GC500 Satellite Plan Explorer — speed and sharpness (v6.97 draft, stage 5)

Author: Andrew Fisher · Coates Industrial Solutions · GC500 2026 · 27 Sep 2026. Nothing here is live or deployed.

Andrew's brief, word for word: "this is where we need to speed up. Make smoother and fast. No load lag. When u zoom in.
No lag. No downtime. Easy to navigate quick and fast ... Nothing less than 10/10 how this looks. Smooth. No lagging. Its
lighting speed fast. The refresh rate is lightning fast. No blur.. perfection everywhere".

BEFORE is exactly what is live today (index.html, explorer.js with the merged barrier chips, scene-worker.js and
plan_items.json byte for byte the same as the live service). AFTER is `explorer/` in this folder.

## How it was measured (and what that can and can't tell you)

- Headless Chromium with SwiftShader: a *software* graphics chip. It is many times slower than any real GPU, so the
  absolute frame times below are not what a laptop or phone shows; they are useful for comparing BEFORE with AFTER on
  the same harness. True GPU frame rate and a real phone could not be measured here.
- The test machine was shared with other work (load average 10–18 on 4 cores while these ran), so single runs are noisy.
  BEFORE and AFTER runs were interleaved (B, A, B, A, B, A) and the tables give medians.
- Our own files are served with a simple network model: desktop 40 ms per request and 50 Mbit/s shared, phone 80 ms and
  20 Mbit/s. The map key, Google's session and Google's satellite tiles are live (real network through the proxy).
- A fresh browser every run: nothing cached, no Google session kept (a first visit).
- "Sharp" = every drawing tile at the exact level for the screen and every satellite tile in view has arrived, nothing
  moving. "Blank" = some part of the view has no picture at all (not even a coarser stand-in).
- Scripts: `bench.js` (the stopwatch), `probe.js` (per-frame record; wraps BEFORE's own functions, AFTER has it built
  in), `features.js` and `embedded.js` (every feature), `shots.js` (screenshots), `deep.js` (zoom past the pyramid),
  `fcost*.js` and `trace.js` (frame-cost experiments and the trace that found the bottleneck), `partial.js` (half-done
  deploys), `campaign.sh` + `summ.js` (the runs and the medians). Harness: `lh2.js` + `curlf.js` (GET only; the only
  non-GET let through is Google's createSession).

## Results

RESULTS_TABLES

## What was slow, and why (found by trace and by measuring each layer)

1. **The first view needed the whole 13.3 MB scene and an SVG of the whole drawing.** The pre-rendered pyramid started at
   L -0.75, but the first view needs L -1.1 (desktop) or -1.6 (phone), so every overview tile fell through to the SVG
   path: download 13.3 MB, unpack 254,316 records in the worker, build a 19 MB SVG for one tile, then rasterise it.
   The trace showed the renderer's graphics thread stalled 14–30 s at a time on those SVGs; Google's tiles and even the
   map key sat waiting behind them. In BEFORE the first view was never sharp inside two minutes on this harness.
2. **Everything was asked for one after another**: the 2.4 MB preview picture (only used for the minimap), then two JSON
   files, then the scene, then the manifest, then the register, then the map key, then Google's session, then tiles.
3. **Nothing stood in while zooming**: the stand-in was only another cached level within 2.5 octaves; the satellite only
   a cached parent. Zooming in far or out showed black (BEFORE: 6–8 s blank in a 12-notch wheel zoom).
4. **Per-frame graphics cost** (software GPU, measured by switching layers off one at a time): the empty full-screen
   rings canvas (~45 ms a frame), clip masks for the plan's frame and each missing tile (~35–60 ms), and 64 separate
   aerial patches in Original plan (~45 ms). The main thread itself was light (~9 ms a frame).
5. **Softness**: the satellite zoom was rounded (up to 1.41x stretched, soft on a phone), drawing levels were rounded
   (up to 9% stretched), the phone canvas was capped at DPR 2 (a Pixel 7 is 2.625, an iPhone 3), and adjacent drawing
   tiles left a faint hairline where they met (visible on solid fills at 9,000%).

## What changed (AFTER)

Opening
- The pyramid now reaches down to L -3 (new `assets/vt/Llow.bin`), so every overview is a few small pre-rendered tiles.
  The scene is not needed to open. `assets/vt/manifest.json` carries a small "boot" block (the drawing's metadata,
  record count and the aerial-underlay ids) so the page needs neither the scene nor classification.json to start.
- Search and the Find chips use `source-labels.json` (identical to the scene's own labels, checked) plus the register and
  the plan snapshot / the dashboard's `gc500PlanItems()` as before. They are usable in about a quarter of a second.
- `index.html` asks for the manifest, the georeferencing, the labels, the overview picture and the map key in its
  `<head>`, before the body and the viewer script have arrived. The first view's tiles go out as soon as the manifest is
  in (not a frame later), and the satellite's the moment the key and session are known.
- Google's session is kept in the browser until a day before it expires (only a fingerprint of the key is stored with
  it, never the key). A return visit skips createSession. A stale session is replaced once before falling back to Mapbox.
- The 2.4 MB preview is no longer loaded; a 175 KB overview (`assets/sheet-overview.webp`) serves the minimap and stands
  in under Original plan while its aerial arrives.
- The loader fades out as soon as the drawing is whole; the photograph fills in under it.
- After the first sharp view, when the hand has been still for a moment: Original plan's aerial is prepared in a worker,
  then the scene is fetched for zoom past the pyramid (desktop; a phone with 4 GB or more too; not on data saver or a
  slow link).

Never blank
- The lowest level loaded (the whole sheet in 2–6 tiles) is never evicted: it is the stand-in of last resort.
- A missing drawing tile shows the finest coarser level that covers it; at rest, finer cached tiles too.
- A missing satellite tile shows its nearest cached parent (up to six zooms up) and any cached children.
- The satellite two zooms coarser is fetched over the view and half a view round it (a few tiles): a pan, zoom in or
  zoom out always has a photograph under it at once.
- The photograph now extends about 1.8 km round the plan (was 600 m), so a phone's full view has no black bands.

Fast to sharp
- A glide's destination (wheel, +/−, keyboard, double-click, double-tap) is worked out and fetched the moment it starts,
  drawing and photograph, ahead of everything else. A glide finishes in real time even when frames are slow (it was
  capped at 50 ms a frame, so a slow device zoomed in slow motion).
- At rest: the ring of drawing tiles just outside the view and one octave closer for the middle of the view (our own
  server only), so pans and pinches open onto tiles already here. Nothing off-screen stays queued; downloads for views
  already left are stopped.
- A drawing tile that fails is retried after 1, 2, 4 … 30 s. A missing level file (a half-finished deploy) drops those
  levels and the next are used (tested: old manifest, and manifest without Llow.bin).

Smooth
- No clip masks for the plan: tiles are cropped by their source rectangle instead.
- The rings canvas is taken out of the page when it has nothing on it.
- The pick's pulse is a CSS animation on the compositor (it was a 60 fps full-canvas redraw for 20 s).
- Original plan's 64 aerial patches are composited once, in a worker, in software, at full, half and quarter size: one
  draw a frame instead of 64, and no work on the page's thread or the graphics thread.
- While the hand moves, the drawing and satellite levels hold within a band, so nothing is rebuilt at every step.
- DOM writes only when a value changes (status line, zoom box, minimap, overzoom pill).
- Every image decodes off the main thread (createImageBitmap); SVG tiles past the pyramid are rasterised once into a
  bitmap.

Sharp
- Drawing level: the first one at or above the screen's density, so tiles are drawn the same size or smaller, never
  stretched more than 5%. Past the pyramid, whole octaves from the vectors.
- Satellite zoom: at most 1.23x stretched (was 1.41x).
- Canvas at the true devicePixelRatio (up to 3), at exactly its device-pixel size (devicePixelContentBoxSize).
- At rest the drawing is laid on one seamless picture, like the photograph, so no hairlines where tiles meet.

Kept (checked in `features.js`, `embedded.js`, desktop and phone)
- Plan / Sat + plan / Satellite, by button, by 1–3 and by #original / #hybrid / #satellite; compass N/E/S/W and As
  drawn; search; the Find chips with the dashboard's numbers (v6.96) and the merged barrier chip ("12 locations · 20
  runs"); the own-window snapshot; ?find=; opacity and brightness; inset and legend toggles; box zoom; fit; zoom box;
  full screen button; PNG export (3840 px, complete); keyboard; minimap; legend; alignment panel; imagery-failure banner
  with Retry and "Show the plan only"; the phone menu.
- New for the dashboard: `window.GC500Explorer.ready` (a Promise; settles with `{mode, firstViewMs, items}` when the plan
  is on screen and search and chips work) and `window.GC500Explorer.find(code)` (selects and flies to a reference as
  ?find= does; resolves true or false). A pick made by a person in the explorer (a Find list row, a search result, a
  ring) calls `window.parent.gc500ExplorerPicked(code)` inside a try/catch; the API's own find does not.

## New and changed files

FILES_TABLE

## What is still imperfect, and why

LIMITS

## For the dashboard

DASHBOARD
