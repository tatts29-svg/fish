# GC500 Satellite Plan Explorer — review package

Coates Industrial Solutions | GC500 2026 · D001 rev 03 Master Layout Plan (issued 2 Oct 2026) on real satellite imagery.
Built 25 Sep 2026 from the v5.83 source-detail viewer; the drawing brought to the 2 Oct issue on 8 Oct 2026 (v8.90).
Separate from the live dashboard; nothing live was changed by this package.

## The drawing is the 2 Oct 2026 issue (v8.90)
Andrew, 7 Oct 2026: "the attached is the latest map document this is to over write the current master so we need to
remove the current and use this one instead and update all records".

- Source: `D001-26003-03-MASTER.pdf`, SHA-256 `8753d875cf90682e09afefae8c774144d9e9725ece87f726707882fb3711c56d` (the 17 Sep issue was `37792f0a9d32e829f34d28ab41197fd2cf689fb62cd60a755aa89106cb5a0a2f`).
- The scene is cut from the PDF the same way as before (MuPDF's SVG, record for record: 301,253 records, 595 of them
  images), and **drawn in the frame of the 17 Sep issue**: on its own paper the 2 Oct main plan sits 25.50 pt (9.0 mm)
  further left, so its content is moved back by (25.50, 0.12) pt, the inset by (-0.00, 0.06) pt and the legend by (-0.00, 0.12) pt.
  The viewport windows (main plan, inset, legend strip, border) stay where the paper has them. Measured two ways: the
  mode of the per-record offsets of matched vectors (40455 main-plan records, 36% at the mode) and phase correlation
  of the two renders (25.523 pt, 0.042 pt). Every unchanged line therefore lands on the pixel it had before, both satellite
  registrations stay exact, and the fencing lines traced on the 17 Sep issue still fit (`meta.frame_sha256`).
- What the 2 Oct issue changes on the ground: P45 moved about 85 m west into the supply compound; WC51 about 18 m;
  WC38 about 13 m; WC39 about 9 m; WC10 is new; WC32 and the second tag WC40a are not drawn; WC69 carries one tag.
- The 2 Oct sheet shows 9 mm less of the western edge of the main plan (Main Beach end); that strip is blank here, as it
  is on the dashboard's picture. The 17 Sep labels that sat in it (CRONIN AVE, ER, G7, G8, HOUSE, MAIN BEACH TOWER, OP11, PEARL, SE, USE, WC69) are not on the 2 Oct sheet.
- Search labels: 809 of the 17 Sep issue's 958 labels kept, 86 moved, 63 removed, 24 added — 919 labels on the 2 Oct sheet.
- Aerial underlay: the same 64 patches of the same photograph, re-exported from the 2 Oct issue with soft mask and viewport
  clip as alpha, placed in the 17 Sep frame. Tile pyramid re-rendered with the explorer's own renderer; tiles away from
  the changed places are pixel-identical to the 17 Sep pyramid (`review/alignment_02oct2026.json`).


## What it is
One camera, in the drawing's own space. The satellite is pulled into that space through a measured registration and
drawn under the drawing; the drawing is rendered from its own vectors at every zoom, to the original 64,000 per cent.

| Mode | What is drawn |
|---|---|
| Original plan | White sheet, the drawing's own 64 aerial patches at their places, every vector, symbol and label. The reference; works offline. |
| Satellite + plan | Mapbox satellite tiles for the visible view, the drawing over it at a chosen opacity. The sheet's old aerial and the white backdrop are lifted; nothing else is. |
| Satellite only | The tiles, the same camera, the drawing hidden. |

The page opens in Satellite + plan. `#original`, `#hybrid` and `#satellite` open that mode; otherwise the mode this
browser last picked by hand (button or 1 2 3) is kept. `?find=<ID>` works with any of them.

Controls kept from the original viewer: search on the drawing's labels, area jumps, wheel and pinch zoom, drag, box
zoom, fit, full screen, overview map, keyboard (+ − 0 Z / Esc, 1 2 3 for the modes), PNG export. Added: the modes,
overlay opacity, satellite brightness, the inset and legend toggles, the alignment panel, the source legend, and the
status line that says when the photograph is enlarged beyond its own detail.

## How it runs
- `index.html`, `explorer.js`, `scene-worker.js` — the page; the drawing's geometry lives in the worker.
- `assets/drawing-scene.bin` — the scene of the 2 Oct issue (gzip, 13.7 MB), cut from the PDF with the same converter as the original viewer's, loaded once.
- `assets/vt/` — a transparent tile pyramid of the drawing, pre-rendered with the same renderer, for the everyday zoom
  range; deeper zooms are rendered live from the vectors (few elements per tile, so they are quick).
- `assets/underlay/` — the drawing's own aerial patches as WebP with alpha (0.95 MB), drawn in Original plan mode only.
  Each carries its soft mask and clip as the alpha channel (re-exported 26 Sep 2026 with `tools/regen_underlay.js`;
  the first export had lost the alpha and showed black). The manifest marks them `alpha: true`; a set without it is
  not used (the page falls back to the preview picture rather than draw black).
- `assets/georeferencing.json` — the two registrations (main plan, inset) with their evidence.
- `assets/classification.json` — every image record with its category and evidence.
- Satellite tiles come from Mapbox with the dashboard's public token, fetched at runtime from `/api/map-key`
  (the hosted service hands it out; `serve.js` is a local stand-in that asks the live service). The token is in no file.
- A satellite tile that fails (404, 503, no network) is tried again after 2, 4, 8, 16 then every 30 s while in view;
  the status turns amber (some missing) or red (none arriving) and a banner says "Satellite imagery isn't loading
  — Retry · Show the plan only". If the drawing itself cannot load (helper script, scene file, or over 45 s) the
  loader says so in plain words with a Try again button; the preview picture is optional.
- Nothing is fetched for a mode until that mode is opened; tile requests are cancelled when the tab is hidden; caches
  are bounded (satellite 140 tiles on a laptop, 60 on a phone; drawing tiles 220 / 90).

## Alignment (image registration, not survey)
The drawing sits on its own faded aerial photograph. That photograph was matched to Mapbox satellite by feature
matching, then refined on a grid of patches; a quarter of the points were held out as independent checks.

| Region | Points | Independent checks | Check error rms | Worst check |
|---|---|---|---|---|
| Main plan | 79 spread over 5 × 3 cells | 20 | 0.67 m | 1.61 m |
| Inset (lower right) | 1,169 to the main aerial, then 18 direct satellite patches | 5 | 0.92 m | 1.45 m |

The sheet is rotated 89.9° to north (the beach runs along the top). The fitted scale matched 1:2000 to 0.1 per cent.
The inset is the same photograph at the same scale, registered on its own and drawn with its own transform.
Imagery capture date and native resolution are not stated by the provider. Not suitable for set-out or navigation
until reviewed against an agreed tolerance; the file says `review_status: unreviewed`, and the alignment panel shows
amber "Alignment not yet signed off" until it says `reviewed`.

Evidence: `review/proof_pit_island.jpg`, `review/proof_beachfront.jpg`, `review/proof_south_east.jpg` (satellite, the
sheet's aerial, and a checkerboard of the two, after registration), `review/match_main.jpg`, `review/georef_*.json`.

## What is kept and what is lifted
`review/content_retention_and_alignment.json`. In short (17 Sep issue; the 2 Oct issue has 300,658 vector records, 531 raster symbols and lettering and 919 labels): 253,697 vector records, 555 raster symbols and lettering,
958 labels and the legend are kept in every mode; 64 aerial patches (each proven against the PDF's image placements)
and the white backdrop are lifted in the satellite modes; nothing is removed by colour; no large white fills were
found; nothing is unclassified.

## Find on the drawing (category rings and the search glow)
Chips for the categories D001 labels (portable buildings, toilets, stands, gates, big screens, bars, Armco access,
emergency egress, over-track signage, pedestrian bridges) and three the register knows but D001 does not label
(generators, light towers, water barriers). A chip draws a soft ring at every place the sheet prints that code; the
list beside it names each one with its register name and asset number, and says plainly which references are in
the register but not labelled on D001 (and which drawing keys them). Search takes a reference (WC69, P12, S08), a
name or an asset number; the pick flies to the label and a glow pulses there for 20 s, then stays lit. Rings are
where the sheet prints the code, never a surveyed position, and nothing is inferred. No pointer arrows: rings and a
halo only. Tapping a ring picks it; Esc clears.

## Rotation and the compass (v6.90, 27 Sep 2026)
In Satellite + plan and Satellite only the photograph is the map. It fills the view at any angle, like a real map, and
the frame never turns: the view turns inside it. The plan is laid on the ground where it belongs:
- The main plan is drawn inside its own frame. The legend, title block and the inset's box are left off, because they
  are not ground.
- The lower-right inset is drawn at its true place north of Surfers Paradise, through its own registration. It is
  drawn only where the main plan does not already show the ground, so nothing is doubled.
- Search, category rings, the area jumps and `?find=` all go to the true place. For example, P68, printed in the inset,
  lands at the Cypress Ave car park.
- Original plan is the sheet as printed and turns as a sheet, exactly as before.

The compass sits in the top-right corner (bottom-right on a phone):
- It shows N, E, S and W where they really are, with the needle pointing north.
- Press a letter to face that way. The view glides there in 0.4 s.
- Drag the ring (from anywhere on it) to turn freely.
- "Facing …" says which way the top of the view looks. As drawn (or D) turns it back to the sheet's own orientation.
- Two fingers still twist it, Alt- or Shift-drag still turns it, and N or R still work.

### Google's aerial photograph
- Satellite + plan and Satellite only now use Google's satellite (Map Tiles API 2D tiles, satellite). At the circuit
  this is Vexcel's 2026 aerial, to zoom 21 ("Imagery ©2026 Airbus, Vexcel Imaging US, Inc.").
- It comes through the dashboard's own Google key, the one the 3D proof uses. No new key and no server change: the
  service's policy already admits tile.googleapis.com.
- Google's logo and imagery credit are shown whenever its tiles are.
- If Google's session cannot be had, or the tiles are refused, Mapbox takes over automatically.
- Cost: each tile is one billable event. There are 100,000 free a month, then US$0.60 per 1,000.
- Google marks its highest-zoom tiles with a faint "© 2026 Google".

### The Google Maps feel
- Wheel, buttons, double-click and double-tap zoom glide about the point under the cursor or finger.
- While a zoom glides, tiles are fetched only for where it lands.
- A flick coasts and slows to a stop.
- Reduced-motion settings get the old instant steps.

### One seamless photograph
The tiles are laid edge to edge on one picture, which is turned and scaled in a single draw. Drawn one by one at an
angle, each tile's smoothed edge left a dark hairline where tiles met.

### Smoothness
- While the view moves, the photograph is drawn with fast smoothing. The high-quality pass lands 160 ms after the hand
  stops. In the test browser's frame work this cut the drawing cost of a wheel burst from about 7.0 s to 0.23 s.
- The canvas keeps its full sharpness while moving. It used to drop to one pixel per point, which was the blur seen
  while panning.
- The photograph is fetched for the view out to about 600 m round the plan, never the whole coast.

## Hosting (live since 25 Sep 2026)
The explorer and the 3D proof are carried by the dashboard service itself, inside its machine set (the same
content-addressed store as The Coates Way machine, one set registered whole):

- Explorer: `/w/<view or edit token>/explorer/index.html`
- 3D proof: `/w/<view or edit token>/poc3d/index.html`

The tile pyramid is packed one file per level (`assets/vt/L*.bin`, 17 files, 125 MB) and a tile is fetched by byte
range; the service already honours ranges. The Mapbox and Google keys are asked from `/api/map-key` with the link's
own token. Server v5.79 lets a machine page reach Mapbox tiles, Google 3D tiles and CesiumJS on jsDelivr and run
WebAssembly (`wasm-unsafe-eval` only; string eval stays refused), and sends the page's origin as referrer, which
both keys are restricted to. Nothing else in the service changed and the dashboard page was not touched.

The set is rebuilt and registered with `machine_set.py` (repo: `03_GC500_Delivery_Control/satellite_explorer/`):
the Coates Way machine's own manifest is kept file for file, the explorer, the 3D proof and the server file are
added. **Importing the Coates Way machine alone from the admin page again would drop the explorer and the server
file from the set; use the combined manifest.** The service now boots from `SERVER_FILE` (the server blob's SHA-256
inside the set) and falls back to `SERVER_B64` (v5.78) if that blob is absent.

## Performance (measured)
Chromium 1440 × 900 at 2 device pixels per CSS pixel, in a container with software rendering only (no GPU), so
these are pessimistic; a laptop or phone with a GPU draws each frame far faster.

| What | Measured |
|---|---|
| Scene decode (13.6 MB gzip, in the worker) | 0.66 s |
| Overview to full detail, Satellite + plan | about 1 s after the tiles arrive |
| Zoom step to detail (316 % → 1,000 % → 4,000 % → 16,000 % → 64,000 %) | 1–3.5 s each, drawing from the pyramid; deeper steps render live from the vectors |
| Frame cost during a 30-notch wheel burst (software GL) | 145 ms average; the drawing stays crisp at rest |
| Satellite fetched for the whole test ladder | 444 tiles, 25.7 MB |
| Search glow | 57–63 animation frames per second on the overlay canvas; the map is not redrawn while it pulses |
| Live service, first load of the explorer page | ready with tiles in a real browser run; 0 errors, 0 policy violations |

## Limits and open items
- Mapbox Satellite's capture date at this site is not stated; the photograph is a basemap, not a live feed.
- Beyond zoom level 19 the tiles are enlarged; the status line says so. The drawing keeps re-rendering from its vectors.
- The registration is unreviewed. Ground-surveyed control points would be needed before any set-out use.
- The export is a raster at 3,840 px on the long edge with attribution stamped; incomplete tile loads are stamped INCOMPLETE.
- Generators, light towers and water barriers are not labelled on D001: they are listed from the register with the
  drawing that keys them, never placed by guess.
- Colouring rings by live delivery state (the record) is not done yet; it needs the record read with the link's token.
