# Coates Industrial Solutions | GC500 2026
## Claude handover — Satellite + Original Plan, Extreme-Zoom HTML

Prepared for Andrew · 25 September 2026

**Status: implementation brief and source inspection, not a completed satellite map.** No satellite tiles, georeferencing control points, access tokens or live-project changes are included. The original files remain unchanged. Requirements below are proposed implementation requirements, not statements that the features have already been built or tested.

## 1. Build this

Create a high-quality, interactive **Satellite Plan Explorer**: genuine photographic satellite/aerial imagery beneath the original D001 drawing information, with the existing extreme-zoom inspection experience retained.

This is not an AI-generated aerial picture, an artist's reconstruction, a Google Earth screenshot, a flattened JPEG, or a new approximation of the circuit. Use actual licensed imagery and preserve the supplied drawing's information. The imagery and the drawing are separate sources, with separate quality limits and dates.

Use the branding **Coates Industrial Solutions | GC500 2026**. Keep the existing viewer available, and do not replace or publish over the live GC500 dashboard without Andrew's approval.

## 2. Inputs and verified source findings

Attach both of these original files alongside this handover:

- `D001-26003-03-MASTER-1.pdf` — the source drawing.
- `GC500_Master_Plan_Deep_Zoom.html` — the current source-detail viewer.

The PDF title block identifies **Master Layout Plan / General Arrangement; D001; project 26003; revision 03**. Treat this as the revision supplied for this task, not proof that it is the latest issued or currently approved site document.

Static inspection of the supplied bytes established:

| Item | Observed value |
|---|---|
| PDF page count | 1 |
| PDF page dimensions | 2384 × 1684 PDF points |
| HTML size | 21,498,076 bytes |
| HTML source | 279 lines, including two very large embedded-data lines |
| Viewer maximum | `MAX_Z = 640`, displayed as 64,000% relative to fit-sheet |
| Decoded scene JSON | 46,076,705 bytes |
| Drawing records | 254,316; not a count of assets or only vector objects |
| Searchable label records | 958; not a count of assets or all visible text |
| Drawing contexts | 1,132 |
| Style records | 27,396 |
| Definition records | 1,910 |
| Native optional-content layers | Empty OCG list; no usable named PDF layer hierarchy found |
| Geographic metadata | No geographic CRS/control-coordinate transform found in the inspected PDF objects |

The PDF does contain `/VP` viewport dictionaries with `/Measure /Subtype /RL`. These are rectilinear measurement/view descriptors, **not** a geographic transformation. Do not interpret the existence of `/VP` or `/Measure` alone as GeoPDF georeferencing.

The page has a main plan, a **separate lower-right inset**, and a bottom legend/key-plan/title area. These are not one continuous geographic rectangle. The inset requires separate handling; the legend, logos and title block belong in the document interface, not draped across the landscape.

The drawing contains both vectors and raster content. Some embedded lettering and symbols already have a limited raster resolution. Preserve those originals; do not claim to have recovered detail that the source never contained.

Source PDF SHA-256:
```
37792f0a9d32e829f34d28ab41197fd2cf689fb62cd60a755aa89106cb5a0a2f
```
Current HTML SHA-256:
```
5d8a9d47d0c0a927703922ae6d2e80f703bcc8c4aa02fed3108eab86afa8ed73
```

The companion `source_inspection.json` records these findings. They are source-inspection results, not a browser performance benchmark or geographic accuracy certification.

## 3. Preserve the document before adding a basemap

Provide three clear modes:

**Original plan:** retain the complete supplied drawing, its original background, inset, legend, labels, symbols and title information. This is the reference mode and must remain available offline.

**Satellite + plan:** real imagery with correctly aligned drawing information. Retain source colours and geometry by default. Provide separate basemap brightness and overlay-opacity controls. Do not silently omit original content just to make the photograph attractive.

**Satellite only:** hide the drawing overlay without changing the current geographic location or losing the ability to return to the same detail.

Provide a source/legend panel and a distinct inset control. Preserve every source item somewhere in the viewer even where an item is non-geographic or has not yet been confidently assigned to an overlay category. Original-only content must be identified, not quietly discarded.

Keep all wording, identifiers, duplicates, linework, leader lines, footprints and symbol appearances. Use the source terminology, including its spelling. Search aliases may help discovery but must not rewrite original labels. Do not substitute generic icons for the drawing's symbols.

## 4. Recommended rendering architecture

Andrew's established GC500 workflow uses Mapbox and TomTom. Reuse the existing approved Mapbox configuration for imagery; do not rebuild routing or remove either integration as part of this job.

For this particular source, the recommended starting architecture is to **retain the existing drawing-space camera and source-detail renderer**, and add a tiled imagery underlay transformed into that same coordinate space. This avoids throwing away the current 640× inspection behaviour.

Conceptual rendering order:

```
Viewport-limited licensed imagery tiles
    → imagery-to-drawing coordinate transform
    → preserved drawing primitives at current screen resolution
    → search highlights and approved interaction overlays
    → controls, source metadata, legend and provider attribution
```

Mapbox's Raster Tiles API supplies image-based XYZ tiles and documents their use in spatial applications, not only in Mapbox GL JS. Use an approved integration and preserve its required attribution. [S1]

If the live dashboard already uses Mapbox GL JS, keep that map intact. Integrate this as a separate, lazy-loaded explorer and share only verified configuration, georeferencing and view state. A GL-based implementation is also acceptable after a small proof demonstrates the same fidelity and zoom; do not choose a single fixed-resolution map texture as the final overlay.

**One camera contract:** drawing coordinates, satellite placement, search highlights and export must use the same transformation chain. Do not position separate DOM layers by unrelated percentages.

For an affine relationship directly between drawing coordinates and the imagery map plane, the tile compositor can combine tile-pixels → map-plane → inverse-georeference → drawing-camera → device-pixels. Account for the different Y-axis directions exactly once. For a nonlinear reprojection, use a suitably subdivided mesh or proper reprojection rather than pretending four corners describe every interior point.

Keep the first release top-down and in the drawing's orientation. North-up switching or 3D can come later after the 2D alignment is proven. They must not delay or degrade this deliverable.

## 5. Geographic alignment — the main quality gate

Do not guess geographic corner coordinates or stretch the full sheet to a loose bounding box around Surfers Paradise. Do not use the existing area-shortcut rectangles as geographic extents: they are only document navigation rectangles.

First look within the supplied project for a verified CAD/geospatial export, world file, survey coordinates or previously approved transform. Do not assume one exists. Where a known CRS and transformation are supplied, preserve that provenance.

Otherwise, create a registration workflow using stable, matching ground features visible in the plan and a permitted georeferenced reference. Georeferencing uses corresponding control points and a defined coordinate system; QGIS supports this for both raster and vector data. [S2]

As a project starting target, collect **8–12 well-distributed fitting points and at least 4 independent check points**, where suitable points exist. These counts are a proposed quality-control approach, not a guarantee of accuracy. Distribute them around the circuit and island rather than clustering them near one corner. Do not fabricate points to meet a count.

Use permanent, identifiable ground features. Avoid temporary event equipment, shadows, tree canopies, shifting beach edges and apparent roof corners displaced in aerial imagery. Record the reference source and its uncertainty. A point clicked on ordinary imagery is an image-registration point, not a surveyed ground-control point.

Start with an appropriate similarity or affine model; use the simplest model supported by the data. Document any move to a more complex transform. Do not rubber-sheet the drawing simply to hide misidentified points or conflicting source dates.

Keep main-plan and inset registrations separate, with distinct IDs, masks and control-point sets. Use the actual source clipping geometry where available. A later combination into one geographic view must preserve provenance and explicitly handle overlap; do not double-count repeated inset labels as additional equipment.

Save a versioned `georeferencing.json` containing the source hashes, coordinate conventions, target CRS, control points, independent check points, fitted coefficients, masks, fit residuals, check residuals, imagery source/date and review status. Unknown values must be null or explicitly unverified.

Report independent check-point errors in meaningful ground metres, with the conversion method stated. Do not equate raw Web Mercator coordinate differences with ground distances. A low fit residual is not proof of survey accuracy. Obtain an agreed tolerance and review before describing the overlay as suitable for equipment set-out or navigation.

No usable control points are supplied in this handover. Build a registration workspace if needed, but show **Alignment pending** until registration is genuinely completed. Do not invent a successful alignment.

## 6. Reveal the photograph without destroying drawing information

The current viewer paints white in more than one place:

- `draw()` fills the sheet white and paints the original full-sheet preview.
- `makeSVG()` inserts an explicit full-page white rectangle.
- Additional opaque backgrounds and fills can exist inside the source primitives.

For satellite mode, make the drawing renderer genuinely transparent, suppress the old photographic/full-sheet preview under that mode, and separately manage verified background objects. Preserve the original behaviour in Original plan mode.

Do **not** remove every white pixel, remove every image, delete all large polygons, or classify solely by colour. White fills can belong to symbols, label backgrounds or structures; embedded images can contain real operational information. A blanket rule would lose detail.

There are no usable named PDF layers to toggle. Inspect the drawing's objects and create a reviewed classification manifest with stable primitive IDs, evidence, proposed category and confidence. Keep unknowns. Identify removable old imagery/background patches separately from event linework, raster symbols and text.

Use exact appearance rendering as the fidelity layer. Separately add semantic hit areas only for confirmed objects. A text bounding box is a **label location**, not necessarily an equipment footprint, entrance or drop point. Do not turn all 958 text records into operational pins.

Validate transparent overlays on plain light and dark backgrounds before compositing over imagery. Check clipping paths, masks, fill rules, stroke widths, text outlines and painter order. Produce a content-retention report and close-up comparisons against the original, not just a pretty overview.

## 7. Zoom and photographic quality

Retain the existing maximum of 640× fit-sheet magnification for drawing inspection, with honest labelling. The current percentage is a document-camera scale, not a tile zoom level or photographic-resolution specification.

If Mapbox GL JS is used, its currently documented `maxZoom` range is 0–24. Never set `maxZoom: 640`, and do not equate tile level 24 with 64,000%. Use the drawing-space deep-inspection compositor when necessary to preserve the required magnification. [S3]

At extreme zoom, keep imagery visible as an explicitly overzoomed photographic underlay while re-rendering original vector geometry at the current device resolution. Do not scale a stale full-sheet raster and call it vector quality. If performance requires a temporary interaction preview, refine the visible area when movement pauses.

Satellite/aerial photography has finite native detail. Beyond that point, enlargement does not reveal newly captured objects. Mapbox explicitly describes the loss of clarity from raster overzoom. [S4] Show a neutral status such as **Imagery enlarged beyond source detail**; do not advertise unlimited sharpness.

Mapbox Satellite combines imagery from multiple sources, with differing coverage and updates. Its general high-resolution coverage statement does not establish the actual capture date or ground-sample distance at this site. [S5] Verify the local imagery available through the authorised account and document what is known. Tile timestamps, retrieval dates and zoom levels are not substitutes for capture dates or native resolution.

Retina/@2x tiles can improve display sampling; they do not prove that the ground was captured at a finer resolution. To gain genuine photographic detail, support replacement with a demonstrably higher-native-resolution, licensed, top-down aerial image or georeferenced orthomosaic. Verify coverage, capture date, positional accuracy and usage rights before committing to one. Do not use generative upscaling to invent operational features.

## 8. Performance and packaging

Do not paste the HTML's giant embedded payload into the Claude conversation or duplicate it across dashboard sections. The included extraction helper separates existing bytes into reviewable code, a preserved compressed scene, preview and labels. It does not perform the satellite conversion.

Reuse the existing spatial grid and culling; draw only the required primitives. Preserve dependency resolution and painter order. Avoid loading 254,316 SVG objects into a live DOM just to pan the map.

Load the explorer and imagery only when opened. For the hosted build, externalise scene resources and lazy-load them. Avoid embedding the 21.5 MB source viewer or new imagery directly into the live dashboard's initial document. Keep an unchanged offline original separately.

Request only visible imagery tiles plus a small buffer. Use bounded concurrency, cancellation, deduplication and bounded caches. Respect provider caching rules; do not bulk-download a city or quietly manufacture an offline tile archive.

Cache keys must distinguish source revision, viewport/scale, display mode, overlay classification, georeferencing revision, imagery source and export size. Otherwise old opaque or misregistered renders can reappear after switching modes.

Keep device-pixel-ratio and canvas-memory caps. Release image bitmaps, temporary canvases, blob URLs and WebGL resources. Hide or suspend background work when the explorer is closed. Benchmark on a normal Surface-class device; report actual initial transfer, decode time, stable-detail time and memory behaviour rather than promising a frame rate without testing.

## 9. Controls and truthful information

Retain wheel/pinch zoom, drag-to-pan, box zoom, fit, full screen, focus mode, overview navigation, original-label search and save-view controls.

Add the three modes, overlay opacity, basemap brightness, a source/legend panel, a clearly named inset control and an alignment-status indicator. Use a professional orange/charcoal interface without changing source symbology. Make controls usable on a phone and keyboard.

Optional category toggles are permitted only after categories are verified. Do not display a convincing list of filters that merely guesses what each source element represents. Allow an unclassified layer and report its content.

Show drawing revision separately from imagery capture information. Describe the photograph as a basemap, not a live race-site feed. Temporary fences, toilets, buildings and equipment drawn on D001 may not appear in the photography. Do not infer installed/delivered status from either source.

In an imagery or credential failure, keep Original plan available, preserve the user's document location, and display an actionable error. Do not present a blank grey screen or quietly substitute an unapproved provider.

## 10. Access, provider rights and export

Follow the current project's approved runtime configuration pattern. Do not hardcode credentials into deliverable HTML, source control or exported files. Browser map requests may use a restricted public token supplied through approved runtime configuration; it remains observable in browser network traffic and is not a secret. Never expose a secret-scoped token. Use least-privilege scopes and authorised-domain restrictions. [S6]

Do not change account permissions, subscribe to paid imagery, create billable resources or publish new tilesets without approval. Provide any actual incremental service requirements and cost basis before committing them.

Keep provider attribution/logo visible in interactive modes and in permitted exports, and preserve the source drawing's credits. Check the applicable service terms for exports, caching, redistribution and offline use; normal API access is not permission to bundle all imagery into a downloadable file. [S7]

Default satellite mode to online. Offline satellite packaging is a separate deliverable requiring rights-cleared imagery and an explicit storage/distribution plan. The original drawing-only viewer can remain fully offline.

For PNG export, re-render the selected geographic view and drawing layer at the requested output size, wait for imagery and vector rendering to finish, enforce memory limits, and preserve attribution. Label the output as raster and state dimensions. Preserve original plan-only SVG export. A combined SVG containing aerial photographs is mixed vector/raster, not an all-vector satellite image.

Keep source credits and rendering metadata distinct. Do not print API keys in exports. Make incomplete imagery loads an export error or explicit incomplete watermark, not a silently approved result.

## 11. Build and acceptance sequence

**First: source preservation.** Verify the hashes, unpack without altering source data, and demonstrate unchanged Original plan rendering/search/zoom. Inspect raw drawing structures without flooding the chat with base64.

**Second: alignment proof.** Establish main-plan registration and independent checks. Produce a correctly aligned photographic proof around a representative island/pit area, then check the beachfront and opposite end of the circuit. Handle the inset separately. Do not use a single attractive local fit as evidence for the whole sheet.

**Third: transparent fidelity.** Show paired original/overlay close-ups and a retained-content report. Resolve opaque patches without losing white symbols, labels or small raster objects.

**Fourth: full viewer.** Add modes, tiled imagery, source metadata, retained search, extreme zoom, error handling, exports and performance controls.

**Fifth: review package.** Deliver an isolated working preview, source, assets manifest, georeferencing file, control/check-point report, content-retention report, screenshots and measured performance notes. Explicitly state any unresolved classification, date, resolution, access or alignment limitation.

Acceptance must cover the complete main plan plus the inset, tiny vector text, source raster symbols, repeated labels such as WC69, area jumps, deep zoom, mode switching, touch, keyboard, offline fallback, expired credentials, missing tiles and export. Browser tests must distinguish actual rendering tests from static code checks. Include no-regression evidence for the existing dashboard before integration.

**Do not publish until Andrew has reviewed the working preview and alignment evidence.**

## 12. Existing code map — reuse this work

The supplied viewer stores a base64 WebP preview in `script#previewData` and base64 gzip JSON in `script#mapData`. Its data object is called `P` after loading.

```
P.r[i]      = [x0, y0, x1, y1, contextIndex, styleIndex, pathOrSvg]
P.labels[i] = [text, x0, y0, x1, y1]
P.c         = context wrappers and dependencies
P.s         = style attributes, path-merge flag and dependencies
P.d         = referenced SVG definitions and dependencies
P.grid      = spatial grid (38 columns × 27 rows; cell size 64)
P.broad     = records checked across large extents
P.meta      = original filename, title, drawing, project, revision and PDF hash
```

The bounding boxes use the viewer's top-left drawing coordinates. Styles and definitions can contain their own transforms; do not double-apply them. A `styleIndex` of `-1` means a raw SVG record, not an ordinary path string.

Relevant functions and original file locations:

| Location | Role |
|---|---|
| `MAX_Z`, line 69 | Document magnification cap |
| `regions`, lines 70–78 | Approximate document-navigation rectangles, not geographic data |
| `currentView`, `screenToSource`, lines 84–86 | Drawing-camera mapping |
| `draw`, lines 95–106 | Preview/cache compositing and full-sheet white fill |
| `query`, lines 134–142 | Visible-primitive spatial query |
| `makeSVG`, lines 144–160 | Dependency-aware, ordered source SVG renderer; inserts white backdrop |
| `renderSharp`, lines 166–180 | Fresh viewport render from source primitives |
| `exportView`, lines 183–193 | Existing PNG and SVG exports |
| `search`, `chooseResult`, lines 195–200 | Original label search and document bounds |
| `boot`, lines 262–274 | Embedded-payload loading |
| `window.GC500Viewer`, line 276 | Read-only state and useful inspection controls |

The example main-plan clipping definition `clip_1` is an L-shaped path in the extracted scene. Inspect its dependencies and actual use before adopting it as a geographic mask; do not replace reviewed clipping with a guessed rectangle.

To unpack without modifying the source:

```bash
python extract_viewer_assets.py GC500_Master_Plan_Deep_Zoom.html \
  --pdf D001-26003-03-MASTER-1.pdf \
  --out extracted_source
```

Read the small output manifest and runtime code first. The `.json.gz` is the preserved source scene, not a semantic asset database. The helper does not generate coordinates, change backgrounds, fetch imagery or build a working satellite viewer.

## 13. Primary implementation references

These references were consulted on 25 September 2026. Recheck the relevant current documentation during implementation. The architecture and acceptance targets above are project recommendations, not claims made by the documentation.

- **S1 — Mapbox Raster Tiles API:** XYZ imagery tiles, API integration, high-DPI requests and request-based billing.
- **S2 — QGIS Georeferencer:** raster/vector registration, coordinate systems, control points, transformation choices and residual reports.
- **S3 — Mapbox GL JS Map API:** documented map-camera zoom limits.
- **S4 — Mapbox overzoom glossary:** raster clarity limits when magnified beyond available source tiles.
- **S5 — Mapbox Satellite reference:** composite imagery, varying geographic coverage and unscheduled updates.
- **S6 — Mapbox security guide:** public/secret scopes, browser visibility and URL restrictions.
- **S7 — Mapbox attribution guide:** attribution and logo requirements; check separately for the chosen product and export workflow.

```text
S1 https://docs.mapbox.com/api/maps/raster-tiles/
S2 https://docs.qgis.org/3.44/en/docs/user_manual/managing_data_source/georeferencer.html
S3 https://docs.mapbox.com/mapbox-gl-js/api/map/
S4 https://docs.mapbox.com/help/glossary/overzoom/
S5 https://docs.mapbox.com/data/tilesets/reference/mapbox-satellite/
S6 https://docs.mapbox.com/help/dive-deeper/how-to-use-mapbox-securely/
S7 https://docs.mapbox.com/help/dive-deeper/attribution/
```

**Start by confirming the actual inputs and inspecting the existing renderer. Then build the smallest geographically validated, source-faithful satellite proof before extending to the complete viewer.**
