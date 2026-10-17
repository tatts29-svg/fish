# v8.90 — the Map explorer draws the 2 Oct master (DRAFT, not uploaded)

Author: Andrew Fisher. Andrew, 7 Oct 2026: "the attached is the latest map document this is to over write the current
master so we need to remove the current and use this one instead and update all records". Approved 8 Oct 2026 00:20 AEST
("Approved and get everything done").

v8.89 changed the page: the D001 picture, the register entry and the pins. The Map explorer is a separate app in the
machine bundle (`/w/<link>/explorer/`) and draws the drawing from its own files, so it still showed the 17 Sep issue.
v8.90 is the explorer's half of the same job: a new scene, a new tile pyramid, new labels and underlay, cut from the
2 Oct PDF and placed in the frame the explorer already has, plus a small code patch. Nothing in this release writes to
the record or to the service; the publish steps are at the end and need the edit key.

## What changed, in one table

| | 17 Sep issue (live) | 2 Oct issue (this release) |
|---|---|---|
| Source PDF | `37792f0a…` | `8753d875…` (12,189,113 bytes, held encrypted in `../inputs_07Oct2026/`) |
| Scene records | 254,316 (619 images) | 301,253 (595 images) — 47,000 more paths, mostly new near-white and green hatch work |
| Search labels | 958 | 919: 809 kept, 88 moved, 61 removed, 24 added, 5 edge-cut fragments dropped |
| Aerial underlay | 64 patches | the same 64 patches of the same photograph, re-cut from the 2 Oct issue |
| Tile pyramid | 17 pre-rendered levels + 9 low levels | re-rendered with the explorer's own renderer, 26 levels, files renamed |
| Attribution | "D001 rev 03" | "D001 rev 03 · issued 2 Oct" |
| Fencing layer | checks the 17 Sep PDF hash | checks the frame hash: the lines were traced on the 17 Sep issue, and the aligned scene keeps that frame |

### The references the 2 Oct issue moves (on the sheet)

| Ref | On the 2 Oct sheet | Where the explorer's search flies now |
|---|---|---|
| P45 | moved about 86 m west (v8.89 measured 85 m), into the supply compound beside MED and P69 | sheet x 1206, y 326 (was x 1331) |
| WC51 | moved about 18 m west along the esplanade | 18 m from its 17 Sep label |
| WC38 | about 13 m, within its Commodore compound | 13 m |
| WC39 | about 9 m, within its Commodore compound | 9 m |
| WC10 | new on this issue | found; one place |
| WC32 | not drawn | no label, no place in the explorer; the page keeps its 17 Sep pin, marked as such (v8.89) |
| WC40a | the second WC40 tag is gone | WC40 has one label |
| WC69 | one tag now (its first tag sat in the western strip the 2 Oct sheet no longer shows) | one label |

All of these agree with `../v8.89_master_map_DRAFT/changes889.json` (`pt` there is the fraction of the 2600 × 1837 picture;
the sheet point is `pt × (2384, 1684)`): every v8.89 pin falls inside the explorer's new label box for the same reference —
P45 (1209.6, 329.3) in 1207.4–1211.5 × 326.1–332.9; WC10 (641.2, 654.3) in 636.8–645.3 × 649.4–659.8; WC38 (498.0, 1154.2) in
492.0–503.6 × 1152.5–1156.7; WC39 (498.6, 1174.0) in 492.7–504.2 × 1172.3–1176.5; WC51 (1953.4, 273.8) in 1948.1–1958.5 ×
271.7–276.3; WC69 (168.0, 1143.0) and WC40 (505.3, 1105.8) likewise.

Smaller moves the drawing makes, all under 32 m and most under 7 m: BAR 10 (31 m), BAR13 (30 m), FOH (25 m), A25 (24 m), CR
(21 m), TV MEDIA, HD6 GRIP, OP77, STAGE, 8M, K3w (6–7 m), FH (6 m), EVL, S1&2 / CATERING, BAR12 (4 m), BS10, COOL, COMMODORE
PARK (3 m), WC20, P51, P08 (2 m), 44 FOOD and BAR tents. Not on the 2 Oct text layer any more (removed, or now drawn as
outlines): A12, A13, OP02, OP05, OP12, OP85, MED, 11 MERCH, STUNTZ, HERO, GRM, GO, LOCK, FOR,
UNIVERSITY, RACE TEAMS, JET BOATS, EMERGENCY HELIPAD, HELIPAD, PONTOON, HELI, FAF, TV, ATM, COFF, BAR 3, BAR14, BAR 19, CA.
New text: WC10, OP76, BAR 9, BAR 18, GEMA, SCA, COFFEE, DRINK, FOOD and BAR tents, EVL. OP21 is about 215 m from where the 17 Sep sheet
printed it (beyond the 140 m the pairing allows, so it is listed as removed and added).

### The western strip

On its own paper the 2 Oct main plan sits 9.0 mm further left, and its viewport did not move, so the sheet shows 9 mm
(25.5 pt) less of the Main Beach end and 9 mm more at the east. Placed back in the 17 Sep frame, that western strip is
blank in the explorer, exactly as it is on the page's picture (v8.89 shifts the render 28 px right and leaves the strip
white). The 17 Sep labels that sat in it — G7, G8, MAIN BEACH TOWER, CRONIN AVE, PEARL, ER, OP11, WC69's first tag and seven
HOUSE labels — are not on the 2 Oct sheet. If that matters, iEDM would need to issue the sheet with the viewport back where
it was.

## How the alignment was measured and proved

The two PDFs are the same AutoCAD model plotted twice. Both were cut into the explorer's record format and matched record
for record (same style, same shape, a shape's first point carried to the sheet):

| Region | Matched records | 2 Oct minus 17 Sep, modal (pt) | Share at the mode | Applied back |
|---|---|---|---|---|
| Main plan | 40,455 | (−25.50, −0.12) | 36% at the mode; 60% within one plot unit (0.06 pt) of it | (+25.50, +0.12) |
| Inset | 5,414 | (0, −0.06) | 49% | (0, +0.06) |
| Legend strip | 697 | (0, −0.12) | 38% | (0, +0.12) |
| Border | 217 | (0, −0.06) | 50% | (0, +0.06) |

25.50 pt is 9.00 mm; the page's 28 px at 2600 px across 2384 pt is 25.67 pt, one picture pixel away. An independent check,
phase correlation of the two sheets rendered at 2 px per pt with a sub-pixel peak fit, gives 25.523 pt, 0.042 pt for the
main drawing area (peak 0.70) and −0.011, 0.033 pt for the inset (peak 0.85). The remaining spread is AutoCAD's plot grid:
every coordinate is on a 0.06 pt (1/1200 inch) grid, and a 9.00 mm move is 425.2 units, so entities land one unit apart.
One unit is 4 cm on the ground at 1:2000 and 0.57 of a pixel at the deepest pre-rendered zoom.

The viewport clips (the L-shaped main window, the inset window, the legend strip, the border) stay where the paper has
them, corrected only for the 0.06–0.12 pt plot jitter; the drawn content, its soft masks and the small symbol clips move
back by the amounts above. The result is checked tile by tile against the live pyramid (`evidence/tile_comparison.json`,
`evidence/diffmaps/`): the sub-pixel offset of each unchanged tile's drawing against the 17 Sep tile has a median of
(0.006, −0.003) pt and a 95th percentile under 0.02 pt at every level — the drawing lands where it was to within a hundredth
of a point. Tiles are not byte-identical, because the re-plotted coordinates differ by that one grid unit in about half
the records; the tiles with more than 1% of strongly changed pixels are the changed places (listed per level in the file
and painted red on the maps).

Both satellite registrations (`georeferencing.json`, main and inset `sheet_to_z18px`) are therefore unchanged and still
exact; the file now names the 2 Oct PDF and records the frame. The fencing geometry traced on the 17 Sep issue (193 records
carrying `master_sha256 37792f0a…`) sits on the same sheet coordinates; the fencing layer now checks the scene's
`frame_sha256`, which is that hash, so the overlay stays on and honest about where it came from.

## The reproduction proof (the converter is the live one)

Nobody had the tool the 25 Sep scene was made with, so it was worked out and proved on the 17 Sep PDF first:

- The live scene is MuPDF's SVG rendering of the sheet, cut into records. PyMuPDF's `page.get_svg_image(text_as_path=True)`
  is the same device. Its 2026 version leaves a hairline's `stroke-width` out and does not write `vector-effect`; the live
  scene has `stroke-width="1" … vector-effect="non-scaling-stroke"` on every one of the 52,467 hairlines, so the converter
  puts them back (that is exactly the set of paths PyMuPDF reports with no width). Boxes get 0.23 pt plus half the stroke
  width on the sheet, times the miter limit for mitred joins; a record is "broad" when it spans more than 24 grid cells.
- Run on the 17 Sep PDF, the converter gives 254,316 records with the same geometry, the same 27,396 styles (byte for byte),
  the same 1,132 contexts, the same 1,910 definitions in the same order, the same grid and broad list. 254,300 boxes are
  identical and 16 differ by 0.001 in one value (floating-point rounding at the third decimal). The 46 MB JSON differs from
  the live file in those 16 values only (`evidence/reproduction_17sep_scene.txt`).
- Rendered with the explorer's own renderer (its `scene-worker.js` making the SVG, Chromium rasterising a 512 px tile),
  the reproduced 17 Sep scene gives tiles pixel-identical to the live pyramid: 20 of 20 at L0, 247 of 247 at L2
  (`evidence/renderer_proof_live_scene_L0_L2.json`). So the renderer used for the new pyramid is the one the live tiles came
  from, and any difference in the new tiles is the drawing's, not the tooling's.
- `evidence/views_side_by_side/`: the 17 Sep and 2 Oct scenes side by side at fit, 316%, 1,000% and 4,000% over the pit
  island, the changed references, an unchanged beachfront, the inset and the title block.

## What is in the machine set after this release

Changed or added under `explorer/` (hashes and sizes in `evidence/changed_files890_on_live_b469a99c.json` and `_on_v887.json`;
`evidence/changed_files890.sha256` lists every asset file that goes up):

- `assets/drawing-scene.bin` — the 2 Oct scene, 14.3 MB gzip; `meta` carries `sha256` (the 2 Oct PDF), `issued`,
  `frame_sha256` (the 17 Sep PDF) and `frame_note`.
- `assets/source-labels.json` — 919 labels, the live list carried across with the 2 Oct issue's moves, removals and additions,
  every box re-read from the 2 Oct text layer (and placed in the frame).
- `assets/classification.json`, `assets/georeferencing.json`, `assets/plan_items.json` (the page's own plan snapshot, taken
  from the v8.89 build over the live record, GET only).
- `assets/underlay/manifest.json` and 64 `underlay/x<xref>-02oct.webp` (683 KB): the photograph with its soft mask and the
  viewport clip as alpha, placed in the frame; the old 64 files are dropped.
- `assets/vt/manifest.json` (with the boot block for the 2 Oct scene) and 18 level files `vt/L<level>-5c6a6ae30507.bin`
  (the scene's hash in the name, so a browser holding last hour's files cannot mix the issues); the old 18 are dropped.
- `assets/sheet-overview.webp`, `assets/original-preview.webp` — composed from the new L1 tiles over the white sheet and
  the underlay.
- `README.md` (the served review package README, brought to the 2 Oct issue) and `review/alignment_02oct2026.json`.
- `index.html` and `explorer.js`, patched by `tools/patch_explorer890.py` (below); every other code file as it was.

### The code patch

`tools/patch_explorer890.py <explorer code dir> <assets dir> <out dir>` applies anchor-based, exact-once replacements and
refuses to run twice. It applies to the live v8.64 files and, unchanged, on top of the v8.87 output (`evidence/patch_on_live.txt`,
`evidence/patch_on_v887.txt`):

- `explorer.js`: the fencing adapter's `masterHash()` returns `meta.frame_sha256` when the scene has one; the three
  attribution strings and the export stamp read "D001 rev 03 · issued 2 Oct"; the Sources legend adds the issue date and
  the frame note; the scene, manifest, labels, underlay manifest, classification, overview and georeferencing are fetched
  with `?v=<scene hash>`.
- `index.html`: the same tokens in the `<head>` prefetch, the subtitle, the Sources card and the attribution line, and a fresh
  content-hash token for `explorer.js`.

## Checks

`tests/test_explorer890.cjs` opens the v8.89 page build at the live address (read-only, every write aborted), serves the
explorer's code and assets from disk with byte ranges, and checks: the scene is the 2 Oct issue; attribution; the 26-level
manifest and range-fetched level files; tiles held in all three modes; search flies to P45's new place and finds WC10,
WC51, WC38, WC39; WC69 and WC40 have one label each; WC32 behaviour; the fencing layer accepts the frame with no "Master
drawing changed" alert and a run is drawn at its traced place (overlay screenshot); deep zoom past the pyramid draws from the
2 Oct scene; no page errors; no failed request for anything of the explorer's (the page's own 404s for the v8.89 pictures
that are not uploaded yet are listed and excluded); `counts.blocked` 0.

| Run | Result |
|---|---|
| Laptop 1440 × 900 | 17/17 pass; 0 writes attempted; 149 live GETs, 282 local explorer files, 192 byte-range tile fetches; the only 4xx are the page's 5 v8.89 pictures not uploaded yet (`evidence/test_explorer890_laptop.log`) |
| Phone 390 × 844 @2 | 17/17 pass; 0 writes attempted; 162 live GETs, 205 local explorer files, 115 byte-range tile fetches; same 5 page pictures (`evidence/test_explorer890_phone.log`) |

Candidate machine sets (offline plans, `evidence/candidate_manifest890_*.json`, `evidence/changed_files890_*.json`):

| Base | Candidate digest | Files | Bytes | Changed / added / removed |
|---|---|---|---|---|
| live v8.64 `b469a99c` (231 files) | `8206c9469d5c…` | 232 | 169,734,353 | 12 / 83 / 82 |
| v8.87 candidate `7a457a494a9d` (233 files, as found on 7 Oct 16:00) | `1960faf3e4a3…` | 234 | 169,757,587 | 12 / 83 / 82 |

Both stay under the service's 600 files and 192 MB. 95 blobs go up (about 149 MB); 137 preserved blobs stay on the volume.
The v8.87 digest moves whenever that draft changes; the plan is re-made at publish time (step 4) from the set that is live then.

Scene `drawing-scene.bin` SHA-256 `5c6a6ae3050767533184bf4aa65011d36377278f14a6b459c8b7c443f8a82e54`, 14,340,912 bytes. Pyramid 131,950,886
bytes in 18 level files; underlay 683,172 bytes in 64 files. Archive: `archive/assets890.tar.enc.part00` and `part01`
(89,128,960 + 59,340,832 bytes; `archive/assets890_parts.sha256`); the tar inside is 148,469,760 bytes, SHA-256
`cbfdff41941a69e643fbfe2e7b8b7e70c33df0000d96976b7928d3d9beba5484` (`archive/assets890.tar.sha256`), round trip verified.

`tests/shots890.cjs` takes the before (live files) and after (this candidate) pictures at each changed spot, in Original
plan and Satellite + plan, laptop and phone: `evidence/shots/` (88 pictures); the test's own pictures are in `evidence/test_screens/`.

## Publish (needs the edit key; nothing here was uploaded)

The v8.87 explorer code release goes in the same machine set. Compose it this way, in one sitting:

1. Confirm the live set is still `b469a99c` (v8.64): `curl -sS -H "x-gc500-token: Coates-GC500-2026" https://gc500-production.up.railway.app/api/machine`.
2. Take the v8.87 prepared explorer folder (`../v8.87_map_explorer_DRAFT/`, its `patch_explorer887.py` output; it must be
   READY on `STATUS.md`), add the v8.64 files it does not carry because it does not change them (`fencing-map-core.js`,
   `fencing-map.css`, `scene-worker.js`, `explorer-fix864.css`, fetched from the live set), and apply this patch on top:
   `python3 tools/patch_explorer890.py <v8.87 prepared folder> <v8.90 assets> build/explorer890_code`
   (if v8.87 is not going up, run it on the live files instead: `code_live_in` as fetched from `/w/Coates-GC500-2026/explorer/`).
3. Rebuild the assets, or decrypt the archive (`archive/assets890.tar.enc.part*`, joined with `cat`, papers password):
   `openssl enc -d -aes-256-cbc -pbkdf2 -iter 300000 -in assets890.tar.enc -out assets890.tar` → `tar -xf` into `<v8.90 assets>`
   next to the small JSON files committed in `assets_small/`. Check `sha256sum -c evidence/changed_files890.sha256`.
4. Dry run, GET only:
   `python3 tools/publish_machine890.py --base-manifest ../v8.87_map_explorer_DRAFT/machine/retained_manifest_v864_b469a99c.json --code build/explorer890_code --assets <v8.90 assets> --readme explorer_text/README.md --review evidence/alignment_02oct2026.json --dry-run`
   It proves the base manifest's digest, lists changed/added/removed paths and the candidate digest, confirms the key is the
   edit key and the live set is the base, and stops.
5. The same without `--dry-run`: uploads only the blobs the volume lacks, registers the manifest once, reads back
   `/api/machine` and every changed public asset byte for byte, and writes `publication890.json` beside the assets.
6. Record the LIVE time and the digest on `STATUS.md`; rename this folder `_LIVE`.

If v8.87 goes live first on its own, point `--base-manifest` at its candidate manifest (the set that is live then) and run
the patch on the live files; the publisher refuses any base that is not the live set.

## Left as it is, and why

- The record: no pin, docket or fencing record is touched. The page side (pins, picture, register) is v8.89.
- Fencing tracing records keep `master_sha256 37792f0a…`: true provenance (traced on the 17 Sep issue), and the aligned frame
  keeps their coordinates exact.
- The western strip is blank, as on the page picture; the labels it held are listed above.
- The aerial photograph under the drawing is the same old aerial the CAD file carries; the satellite modes lift it as before.
- Tiles are not byte-identical to the 17 Sep pyramid (the plot grid), so the whole pyramid was re-rendered rather than
  patched; the comparison shows where the drawing really changed.
- `plan_items.json` is the page's snapshot for the explorer opened in its own window; inside the dashboard it reads the live
  page, as before. P47 and P53 are no longer placed by the page (record changes since 27 Sep), WC32 is not placed, WC10 is.

## Files

- `tools/` — `build_scene890.py` (+ `mupdf_scene.py`): the deterministic generator, PDFs in, scene/labels/classification/
  georeferencing/underlay/boot out, with the alignment report; `render_tiles.cjs` + `render.html` + `serve_static.cjs`: the
  pyramid and view renderer (the explorer's own `scene-worker.js`); `pack890.py`: lossless WebP tiles, packed levels, low
  levels, manifest, overview and preview; `compare_tiles.py`, `compare_views.py`, `compare_old.py`, `analyse_shift.py`:
  the proofs; `patch_explorer890.py`, `publish_machine890.py`; `plansnap890.cjs`; `make_review890.py`,
  `make_explorer_readme890.py`; `archive890.sh`.
- `assets_small/` — the small JSON assets and pictures as built.
- `archive/` — the encrypted binary assets (scene, pyramid, underlay, pictures), split under 90 MB, round-trip verified.
- `explorer_text/README.md` — the served README.
- `tests/`, `evidence/`.

Rebuild everything from the two PDFs:
```
python3 tools/build_scene890.py <17 Sep PDF> <2 Oct PDF> <live explorer assets dir> out
node tools/serve_static.cjs out 8892 &   # with tools/render.html and the live scene-worker.js copied into out/
node tools/render_tiles.cjs tiles http://127.0.0.1:8892/ out/underlay_ids.json render
python3 tools/pack890.py render out/assets
```
