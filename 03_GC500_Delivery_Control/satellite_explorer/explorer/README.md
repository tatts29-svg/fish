# GC500 Satellite Plan Explorer — review package

Coates Industrial Solutions | GC500 2026 · D001 rev 03 Master Layout Plan on real satellite imagery.
Built 25 Sep 2026 from the v5.83 source-detail viewer. Separate from the live dashboard; nothing live was changed.

## What it is
One camera, in the drawing's own space. The satellite is pulled into that space through a measured registration and
drawn under the drawing; the drawing is rendered from its own vectors at every zoom, to the original 64,000 per cent.

| Mode | What is drawn |
|---|---|
| Original plan | White sheet, the drawing's own 64 aerial patches at their places, every vector, symbol and label. The reference; works offline. |
| Satellite + plan | Mapbox satellite tiles for the visible view, the drawing over it at a chosen opacity. The sheet's old aerial and the white backdrop are lifted; nothing else is. |
| Satellite only | The tiles, the same camera, the drawing hidden. |

Controls kept from the original viewer: search on the drawing's labels, area jumps, wheel and pinch zoom, drag, box
zoom, fit, full screen, overview map, keyboard (+ − 0 Z / Esc, 1 2 3 for the modes), PNG export. Added: the modes,
overlay opacity, satellite brightness, the inset and legend toggles, the alignment panel, the source legend, and the
status line that says when the photograph is enlarged beyond its own detail.

## How it runs
- `index.html`, `explorer.js`, `scene-worker.js` — the page; the drawing's geometry lives in the worker.
- `assets/drawing-scene.bin` — the preserved scene (gzip, 13.6 MB, the same bytes the original viewer carries), loaded once.
- `assets/vt/` — a transparent tile pyramid of the drawing, pre-rendered with the same renderer, for the everyday zoom
  range; deeper zooms are rendered live from the vectors (few elements per tile, so they are quick).
- `assets/underlay/` — the drawing's own aerial patches as WebP (1.0 MB), drawn in Original plan mode only.
- `assets/georeferencing.json` — the two registrations (main plan, inset) with their evidence.
- `assets/classification.json` — every image record with its category and evidence.
- Satellite tiles come from Mapbox with the dashboard's public token, fetched at runtime from `/api/map-key`
  (the hosted service hands it out; `serve.js` is a local stand-in that asks the live service). The token is in no file.
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
until reviewed against an agreed tolerance; the file says `review_status: unreviewed`.

Evidence: `review/proof_pit_island.jpg`, `review/proof_beachfront.jpg`, `review/proof_south_east.jpg` (satellite, the
sheet's aerial, and a checkerboard of the two, after registration), `review/match_main.jpg`, `review/georef_*.json`.

## What is kept and what is lifted
`review/content_retention_and_alignment.json`. In short: 253,697 vector records, 555 raster symbols and lettering,
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

## Rotation and the compass
Every view starts the way D001 is drawn (beach along the top), the same way round as the printed plan and, from
v5.90, the dashboard's satellite pins map, its 3D satellite and the 3D proof: boot, Fit, the area jumps and the
category views keep that orientation, and the overview map is the sheet as drawn with north marked (to the left).
N turns the view north-up when wanted; As drawn (D) turns it back. The rose always shows where north is.

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
