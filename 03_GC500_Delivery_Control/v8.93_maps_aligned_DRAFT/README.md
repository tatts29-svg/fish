# v8.93 — every map on the 2 Oct master, aligned the same way everywhere

Andrew, 8 Oct 2026 (about 03:50 AEST): "We need to make sure the maps works off the new master and everything is aligned
correctly." And at about 04:30: "The master I have given you is the new correct locations. The master I gave you is the
new truth."

v8.89 put the 2 Oct master on the page and moved the pins it moves; v8.90 made the Map explorer draw it. This release
makes the two agree everywhere: one drawing, one frame, every pin, marker, picture and layer checked against it.
Data only on the page (the picture, the pin pictures, the media list, three pin positions); on the machine set the
scene's window clip, the tiles on its western edge, the explorer's plan items, the 3D proof's unit list and the asset
cache token. No navigation pin (`ll`), link or direction changes: the four pins v8.89 moved onto the 2 Oct master (P45,
WC51, WC38, WC39) and the new WC10 stay exactly as v8.89 set them; every other pin stays as live.

## What was misaligned, and where

| Where | What was wrong | How far | Fixed by |
|---|---|---|---|
| Page picture of the master (v8.89, `fa5081d4…`) | The whole 2 Oct render was pasted 28 px to the right so the main plan would land on the 17 Sep frame. The main plan did (phase correlation (0, 0)); the inset, the legend, the title block and the border, which did not move on the paper, came with it. | 28 px = 25.7 pt = about 18 m at 1:2000, in the inset, legend, title block and border | Picture rendered from the explorer's aligned scene (main plan moved, the rest kept), so page and explorer are the same drawing in the same frame |
| The three pins in the bottom-right inset (CP1, T0265, WC81) | v8.89 moved them 28 px with the picture; the inset had not moved | WC81 22.7 pt (16.0 m) east of its tag, T0265 7.2 pt (5.1 m) east of the OP42 label, CP1 25.7 pt east of its leader-line point | Back to their 17 Sep positions (WC81 on its tag: 0.0 pt; T0265 at the OP42 label: 0.05 pt) |
| Explorer scene (v8.90, `5c6a6ae3…`) | The main plan's window clip stayed where the paper draws it (49.46 pt) while the drawing moved 25.5 pt east, so 162 records the 2 Oct paper cuts at the window's western edge (HOUSE tags, ALOHA LN, a few lines) spilled into the 9 mm strip the new sheet no longer shows | up to 25.5 pt into the blank strip, at five places | The clip's western edge follows the content (74.96 pt on the frame); 1,059 copies of the clip, nothing else; the 277 tiles over that edge rendered again (8 of them are now blank and dropped); every other tile is byte for byte v8.90's |
| Pin pictures (close-up and context) | Made from the 17 Sep issue for 155 pins; from the 2 Oct paper pasted 28 px right for the 5 v8.89 pins | Picture content a release behind the drawing | All 260 pictures of the 130 pins that carry pictures re-made from the aligned scene (WC32 keeps its 17 Sep pictures: the 2 Oct issue does not draw it, as its card says) |
| 3D proof unit list (`poc3d/units3d.json`) | v6.89 positions: no WC10; P45, WC51, WC38, WC39 at the 17 Sep places | P45 85 m, WC51 18 m, WC38 13 m, WC39 9 m | The four follow the 2 Oct master (v8.89's `ll`); WC10 added, marked as read off the 2 Oct drawing |

Everything else was checked and found in place (next section).

## Every overlay checked against the 2 Oct drawing

Method: the 17 Sep scene and the aligned 2 Oct scene were both rendered by the explorer's own renderer at the page
picture's size (2600 × 1837); where the two differ the drawing changed (`evidence/change_map_17sep_vs_2oct.webp`,
23,921 pixels in 459 patches, nearly all of them food, bar and sector label boxes). Every overlay point was then read
three ways: against the 2 Oct text boxes from the scene (`evidence/labels893.json`), against a phase correlation of the
two renders in a 41 px window around it (does the drawing under the overlay shift?), and by eye on a close view of
every one of them (`evidence/contact_sheets/`, 342 views: 166 pins, 62 D001 markers, 19 VMS tips, 95 layer items; the
17 Sep view beside it wherever pixels near the point changed).

| Overlay | Count | Result |
|---|---|---|
| MASTER_LOC pins with a tag or label text | 127 | 108 on their 2 Oct text (inside the box) before this release, 110 after (WC81 and T0265 back on theirs). The 17 others are not off: PG01/03/05/29 sit 0.2 pt from the PIT LANE label by design; WB02/WB13/WB19/T0025 sit on the S08/S15/S18 sector boxes (the text is "S08", not "sector S08"); WB04/WB16/T0258/T0266 on HELEN PARK / COMMODORE PARK (two-line labels); T0005 0.6 pt from MACINTOSH ISLAND; T0085 on the SUPPLY compound; P34 on the P34/24/26/27/28/29 block; WC60 between its two tags; WC32 not drawn on the 2 Oct issue (kept, as its card says). All of these are identical on the 17 Sep and 2 Oct sheets. |
| MASTER_LOC pins marking a symbol or a leader-line point (generators, light towers, callouts) | 39 | No shift of the drawing under any of them (phase correlation (0, 0) in every window); the generator symbols and tower points are where they were. |
| D001 markers (circuit sectors, entry points, gates) | 62 | The 20 sector markers sit within 0.3 pt of their 2 Oct "S0x" text (the 2 Oct issue draws the white sector boxes differently and adds "MCM" labels, but the sector text itself did not move: both PDFs print it at the same place). Entry points and gates: no shift. G7 and G8 lie in the 9 mm strip the 2 Oct paper no longer shows (see below). |
| MASTER VMS tips (from D025) | 19 | No shift under any tip. |
| MASTER_LAYERS items (entry points, gates, screens, gensets, interfaces, barriers) | 95 | No shift under any item. Gate G7 (item 35), Gate G8 (36) and two Zone 6 barrier items (81, 82) lie in the western strip. |
| Page-side fencing geometry (127 runs, 17 Sep frame) | 127 | The frame is unchanged, the geometry binds (`master_sha256 37792f0a…`), and no run's points sit on a changed line (the 65 runs with a changed pixel within 4 px are all beside moved food/bar labels or the sector boxes). |

The western strip: the 2 Oct sheet shows 9 mm (25.5 pt) less of the main plan's western edge (Main Beach end). Six
overlays point into it — the gate markers G7 and G8 on D001, the layer items Gate G7, Gate G8, Barriers · Zone 6 (two)
— and now sit on blank paper there. They are not off (the gates and barriers have not moved; the drawing is not there any
more), so they keep their positions and are reported here rather than moved.

### The eight references flagged by the first diff (7 Oct)

"P60, P62, P63, P68, WC48, WC49, WC51 and WC81 are not shifted with the rest (inset or redrawn area)." Each one on the
page, in the explorer (same scene, same frame) and on the 3D proof, read against its 2 Oct tag (sheet points; the
offset is the distance from the pin to the tag's text box, 0.0 = on it; 1 pt = 0.71 m):

| Ref | Where | live (17 Sep) | v8.89 | v8.93 | Note |
|---|---|---|---|---|---|
| P60 | main plan, Gate 5 | (2141.4, 253.2) 0.0 pt | same | same | on its tag on both issues; the first diff saw it unshifted because the Gate 5 block was redrawn in place |
| P62 | main plan, Gate 5 | (2118.8, 254.4) 0.0 pt | same | same | on its tag |
| P63 | main plan, Gate 5 | (2108.5, 254.9) 0.0 pt | same | same | on its tag |
| P68 | inset (the CP1 crib room) | CP1 at (2160.9, 1285.7) | CP1 at (2186.6, 1285.7) | CP1 back at (2160.9, 1285.7) | P68 is not a pin of its own: it is CP1's unit. The P68 tag on the sheet is 9 pt from the WC81 pin; CP1's point comes from the D022 leader line |
| WC48 | main plan, Gate 5 | (2092.8, 270.8) 0.0 pt | same | same | on its tag |
| WC49 | main plan, Gate 5 | (2128.2, 241.8) 0.0 pt | same | same | on its tag |
| WC51 | main plan | (1976.6, 263.9) 19.8 pt off the 2 Oct tag | (1953.4, 273.8) 0.0 pt | same as v8.89 | the 2 Oct issue moved it about 18 m; v8.89 re-read it and moved its navigation pin; kept |
| WC81 | inset | (2161.3, 1250.3) 0.0 pt | (2187.0, 1250.3) 22.7 pt | (2161.3, 1250.3) 0.0 pt | the one that was off: v8.89's 28 px; back |

Also: T0265 (OP42 label, inset) 7.2 pt off in v8.89, 0.05 pt now; P45 (1209.6, 329.3), WC38 (498.0, 1154.2), WC39
(498.6, 1174.0) and WC10 (641.2, 654.3) on their 2 Oct tags, as v8.89 placed them. Full numbers:
`evidence/flagged_refs893.json`.

### Where the drawing and a navigation pin disagree

Nothing new. P45, WC51, WC38 and WC39 were moved to the 2 Oct master by v8.89 (85, 18, 13 and 9 m); WC10 is new. Every
other pin's drawing position is on its 2 Oct tag and its navigation pin is as live. WC32's tag is not drawn on the 2 Oct
issue; its pin and 17 Sep pictures stay, and its card says so.

## The page picture, proved region by region

Phase correlation of the new picture against the live 17 Sep picture, in the paper's own windows (read off the sheet's
clip paths; `evidence/sheet_compare893.json`):

| Region (sheet pt) | 17 Sep render vs live | v8.93 picture vs live | v8.89 picture vs live |
|---|---|---|---|
| main plan, left arm (49–1469 × 41–1464) | (0, 0) | (0, 0) | (0, 0) |
| main plan, top arm (1469–2334 × 41–859) | (0, 0) | (0, 0) | (0, 0) |
| inset (1483–2334 × 873–1464) | (0, 0) | (0, 0) | (−28, 0) |
| legend (49–1176 × 1479–1640) | (0, 0) | (0, 0) | (−28, 0) |
| title block (1176–2344 × 1479–1654) | (0, 0) | (0, 0) | (−28, 0) |
| border, top / right / bottom bands | (0, 0) | (0, 0) | (−28, 0), (27, 0), (−28, 0) |
| border, left band (crop marks only, weak peak) | (0, −1) | (1, 0) | — |

Western strip (picture x 55–81, the 9 mm the 2 Oct paper no longer shows): 48 non-white pixels in the new picture (the
frame line's edge), against 37,898 in the live 17 Sep picture and 573 in the render before the window-clip fix.

Picture: 2600 × 1837, WebP quality 82, 669,426 bytes, SHA-256
`ab53369376bb31f814d1a1b1ff04c8c71540658bc9c1dd15df65fb3a718070a0` (v8.89's `fa5081d4…` leaves the media list).
The look is the live picture's (same renderer as the explorer; mean absolute grey difference to the live picture 5–7
levels in the drawn regions, the anti-aliasing of two renderers).

Pin pictures: `evidence/thumbnails_before_after/` shows P45 and WC51 close-up and context, v8.89 (cropped from the
PDF) beside v8.93 (rendered from the scene): the same crop, the same ring, the same drawing.

## What changes on the page (`patch_v893.py`, data only)

- `DATA.sheets` D001: `src.media` → the new picture. Subtitle, markers and everything else unchanged.
- `DATA.media`: +259 files (the picture and 258 distinct pin pictures: the four Pit Lane garages share one pair, their
  pin is one point), −259 (the v8.89 picture and the 258 pictures nothing uses any more). 1,958 entries before and after.
  Media manifest `cd70f758d382effa…` (`media_manifest_v893.json`, canonical `gc500-media-v1`, as the service computes it).
- `MASTER_LOC`: `pt` for CP1, T0265 and WC81 (back to 17 Sep); `img` for 130 pins. `ll`, `how`, `near`, `next`,
  `beside`, `prec`, `sec` untouched for every pin (`tests/test_identity893.py` proves it).
- Footer: the one ` · v8.89` (or ` · v8.91` / ` · v8.92` if they go first) becomes ` · v8.93`.

Build: `toolchain/build.sh v8.93 v8.84_today_wide_layout_DRAFT/patch_v884.py v8.85_where_we_are_DRAFT/patch_v885.py
v8.86_event_portables_days_DRAFT/patch_v886.py v8.87_map_explorer_DRAFT/patch_v887.py v8.88_costs_transport_DRAFT/patch_v888.py
v8.89_master_map_DRAFT/patch_v889.py v8.93_maps_aligned_DRAFT/patch_v893.py` → `build/GC500_v8.93/GC500_Delivery_Control_hosted.html`
SHA-256 `64898a6be4178abf…` (11,257,007 bytes) on live `88a3584e…` (v8.83); `media_manifest_v893.json` beside it.
check_page: PASS all checks.

## What changes in the machine set (one registration: v8.87 + v8.90 + v8.93)

- `explorer/assets/drawing-scene.bin`: SHA-256 `84e7872ac15766e31e7943c85ac151151f5a29d70d964ea56f4559892d3508b1`
  (14,340,982 bytes): v8.90's scene with the main plan's window clip following its content (`tools/fix_scene_clip893.py`,
  `evidence/scene_fix893.json`); `meta.window_clip` says so. Records, labels, styles, images unchanged (301,253 records).
- `explorer/assets/vt/`: the pyramid re-packed with the 277 tiles over the western edge rendered again from the fixed
  scene (`tools/strip_tiles893.py`); 8 tiles there are blank now and are not written; every other tile is v8.90's render.
  Level files `L<level>-84e7872ac157.bin` and `Llow-84e7872ac157.bin`: 131,874,562 bytes in 18 files, 26 levels, 4,795
  tiles; `vt/manifest.json` 113,597 bytes with the boot block rebuilt from this scene (`tools/boot893.py`: meta with the
  window-clip note, 301,253 records, 595 images).
- `explorer/assets/original-preview.webp`, `sheet-overview.webp`: re-made by the packer from the new tiles.
- `explorer/assets/plan_items.json`: the v8.93 page's `gc500PlanItems()` snapshot (161 items, 8 layers; the inset trio at
  17 Sep, WC10 placed, WC32 not placed) — `tools/plansnap893.cjs`.
- `poc3d/units3d.json`: 261 pins; P45, WC51, WC38, WC39 at v8.89's `ll` with a note; WC10 added with a note. Nothing
  else in the file moves. `poc3d/index.html` unchanged.
- Explorer code (`machine_code_v887_v890_v893/`): the v8.87 + v8.90 files with the asset cache token `5c6a6ae30507` →
  `84e7872ac157` (11 places in `explorer.js` and `index.html`) and a fresh content token for `explorer.js`
  (`eba8f3b88286`). No other change (`prepared893.json` lists every file's hash).
- `explorer/README.md`: the served review package note with a v8.93 section (`explorer_text/README.md`).

Candidate: base `b469a99c43a30a6d165ce126c4983d0c92204c8f548f0636a008f43de60e95d8` (the live set, 231 files) →
`96dee047a785117e0f96aa1365a391d38a72904c42c67dcd76e6bc7ca40325da`, 233 files, 169,673,361 bytes: 16 files changed,
84 added, 82 removed, 6 sent again with the same bytes; 100 new blobs to upload. `evidence/candidate_manifest893.json`
is the full manifest (`tools/publish_machine893.py --offline --write-manifest`); `evidence/changed_files893.json` lists
every changed, added and removed file with its SHA-256. The 16 changed files:

| File | SHA-256 (first 16) | Bytes |
|---|---|---|
| explorer/README.md | 4e9acb2b478456c8 | 16,489 |
| explorer/assets/classification.json | f84c3cf9b9bde807 | 180,174 |
| explorer/assets/drawing-scene.bin | 84e7872ac15766e3 | 14,340,982 |
| explorer/assets/georeferencing.json | 2487feea8f15fb94 | 3,055 |
| explorer/assets/original-preview.webp | 6b40fae56cdcde58 | 1,114,988 |
| explorer/assets/plan_items.json | 5e0ff2eeeade8b98 | 42,166 |
| explorer/assets/sheet-overview.webp | 859b6c27219d1d7a | 178,792 |
| explorer/assets/source-labels.json | b6ce83a52bfea9d7 | 40,207 |
| explorer/assets/underlay/manifest.json | ad65696d0c24acf7 | 14,426 |
| explorer/assets/vt/manifest.json | 06437801844c717f | 113,597 |
| explorer/explorer-fix864.js | d7041320fc3ff63a | 7,399 |
| explorer/explorer-merge.js | 161dabb105c15f5e | 27,134 |
| explorer/explorer.js | eba8f3b8828644c8 | 143,186 |
| explorer/fencing-map-explorer.js | e3a4bef6c17d7288 | 51,564 |
| explorer/index.html | b99c48b16d4414dd | 28,136 |
| poc3d/units3d.json | e7e642f8de49ddc2 | 33,517 |

Added: the 64 underlay patches (`underlay/x<xref>-02oct.webp`, v8.90's), the 18 level files, `explorer-fix887.css` and
`explorer-fix887.js` (v8.87's); removed: the 64 17 Sep underlay patches and the 18 17 Sep level files. The classification,
georeferencing, labels, underlay manifest, fix864/merge/fencing-map-explorer code are v8.90's and v8.87's files, unchanged
since those releases; they count as changed only against the live set.

Archive (`archive/`): `assets893.tar` 148,398,080 bytes, SHA-256
`7a1825ddd095de84f0020aa5e1911a675ae9583904c404dfdf450e71713ab4b2` (drawing-scene.bin, original-preview.webp,
sheet-overview.webp, underlay/, vt/ without boot.json), encrypted with the papers password (AES-256-CBC, PBKDF2
300,000 iterations) and split: `assets893.tar.enc.part00` 89,128,960 bytes, `part01` 59,269,152 bytes
(`assets893_parts.sha256`); round trip proved by `tools/archive893.sh`. With `assets_small/` laid over the untarred
folder, the asset tree is exactly the candidate's `explorer/assets/`.

## Checks

| Check | Result |
|---|---|
| `tests/test_identity893.py` (v8.89 full chain → v8.93) | PASS: only the D001 picture, the media list (+259/−259), 3 inset pins (pt) and 130 pins' pictures changed; every navigation pin as in v8.89 |
| `tests/test_master889_v893.cjs` (v8.89's master test read against v8.93: pins, register, pictures, inset at 17 Sep) | 17/17 laptop, 17/17 phone (`evidence/master889_v893_*.log`) |
| `tests/test_align893.cjs` laptop (1440 × 900) | **21/21** on the combined candidate `5e786047…` (8 Oct 2026; `../v8.89_full_chain_08Oct2026/evidence_h1final/align893_laptop.log`) |
| `tests/test_align893.cjs` phone (390 × 844, iPhone 13) | **21/21** on the same bytes. The suite's first phone run was 20/21: the one failing check held every marker to a fixed 1e-4 of the picture, which a narrow phone stage cannot meet because the page writes each floater as `translate(X.toFixed(1)px, Y.toFixed(1)px)`. The check now bounds the deviation by the page's own rounding — 0.05 CSS px per axis — and reports the worst deviation in px; the tag, navigation, inset and image checks are unchanged. Codex found the same on its build and corrected its wrapper the same way ([6049323871](https://github.com/tatts29-svg/fish/pull/1#issuecomment-6049323871), [6049429498](https://github.com/tatts29-svg/fish/pull/1#issuecomment-6049429498)) |
| v8.90's explorer test on the v8.93 code and assets (`../v8.90_explorer_master_DRAFT/tests/test_explorer890.cjs` with `CODE=machine_code_v887_v890_v893` and this release's untarred assets with `assets_small/` over them, inside the combined candidate) | **17/17 laptop, 17/17 phone** (`../v8.89_full_chain_08Oct2026/evidence_h1final/explorer890_v893_*.log`): the 2 Oct scene, the pyramid by byte range, the five changed references at their 2 Oct places, the fencing layer, deep zoom, no errors, no writes |
| Regression set (`run_all.sh` + `run_all_extra.sh` on the v8.93 build) | Run on the combined candidate (this release + v8.94, v8.91, v8.92 and v8.95 on the chain), 8 Oct 2026 10:00–10:45 AEST, by `../v8.89_full_chain_08Oct2026/tools/run_h1.sh`: every suite clean apart from the two out-of-date legacy suites, which fail on the same lines on live v8.83; the explorer card test on this release's code and assets 23/23 laptop and 24/24 phone; `identity893` PASS; `master889_v893` 17/17 on both widths. The full table is in that README's Handover 1 section |

Two checks in the regression set fail on this build by design and are replaced: `test_identity889.py` (it allows only
v8.89's own changes; v8.93 adds the picture, the pictures and the inset revert — `test_identity893.py` is the same guard
for this release, and it passes) and `test_master889.cjs` (it asserts the inset pins at v8.89's +28 px; the copy in
`tests/` asserts the 17 Sep positions and passes 17/17 on both widths).

Every browser check runs the local build at the live address, reading the live record with GET only; writes are aborted
and counted (0 in every run). The explorer's code and assets, the page's new pictures and the 3D proof's unit list are
served from disk, so the checks ran on the exact bytes in this folder and in the archives.

## Publish steps (in this order; the page and the machine set go up together)

1. Media first (the page is refused until its manifest is registered):
   `openssl enc -d -aes-256-cbc -pbkdf2 -iter 300000 -pass file:<papers password file> -in media893.zip.enc -out media893.zip`
   (SHA-256 of the zip `36d11c8ce371882cce59da38c0fca321dc9d9ac7f7850306d4aaae5a99551b7e`, 259 files), unzip into a folder, then
   `python3 upload_media893.py <that folder> build/GC500_v8.93/media_manifest_v893.json --dry-run`, then without `--dry-run`.
2. The page, as usual: `python3 toolchain/upload_page.py build/GC500_v8.93/GC500_Delivery_Control_hosted.html`
   (or the full chain's page when v8.93 is built into it: the same patch, the same media).
3. The machine set (one registration carrying v8.87, v8.90 and v8.93):
   - join and decrypt the asset archive: `cat archive/assets893.tar.enc.part* > assets893.tar.enc`,
     `openssl enc -d -aes-256-cbc -pbkdf2 -iter 300000 -pass file:<papers password file> -in assets893.tar.enc -out assets893.tar`
     (tar SHA-256 in `archive/assets893.tar.sha256`), untar into an assets folder and copy `assets_small/*.json`,
     `assets_small/vt/*`, `assets_small/*.png` over it (not `assets_small/poc3d/`);
   - `python3 tools/publish_machine893.py --base-manifest ../v8.87_map_explorer_DRAFT/machine/retained_manifest_v864_b469a99c.json
     --code machine_code_v887_v890_v893 --assets <that assets folder> --over assets_small --readme explorer_text/README.md
     --expect-candidate 96dee047a785117e0f96aa1365a391d38a72904c42c67dcd76e6bc7ca40325da --dry-run`. The publisher fails
     closed (Codex review, 8 Oct): a missing folder, an asset set without the v8.93 scene, any tile file the published
     `vt/manifest.json` names but the set lacks, or any candidate digest other than the reviewed `96dee047…` stops it before
     any network step; checked offline: the right inputs reproduce `96dee047…` (233 files), v8.90's assets are refused
     (GET-only preflight:
     the key is the edit key, the live set is still `b469a99c…`, every preserved blob is on the volume);
   - the same without `--dry-run`: uploads the new blobs, registers the manifest, reads back `/api/machine` and every
     changed public asset; writes a private `publication893.json`.
   `GC500_EDIT_TOKEN` is read from the environment and never printed or written.

## Files in this folder

- `patch_v893.py`, `changes893.json`, `media_manifest_v893.json`, `media893.zip.enc` (the picture and the pin pictures),
  `upload_media893.py`.
- `machine_code_v887_v890_v893/` (the explorer code for the registration, with `prepared893.json`), `assets_small/`
  (plan_items.json, poc3d/units3d.json, vt/manifest.json, vt/boot.json, classification.json, georeferencing.json,
  source-labels.json, register.json, google_logo_white.png, sheet-overview.webp), `archive/` (the scene, pyramid,
  underlay and preview pictures, encrypted and split), `explorer_text/README.md`.
- `tools/`: `audit_overlays893.py`, `check_labels893.py`, `contact_views893.py` (the audit), `compare_sheet893.py`
  (the picture proof), `fix_scene_clip893.py`, `strip_tiles893.py`, `make_thumbs893.py`, `make_changes893.py`,
  `patch_explorer893.py`, `plansnap893.cjs`, `publish_machine893.py`, `archive893.sh`. The renderer, packer and scene
  tools are v8.90's (`v8.90_explorer_master_DRAFT/tools/`).
- `tests/`: `test_identity893.py`, `test_master889_v893.cjs`, `test_align893.cjs`.
- `evidence/`: the audit (`overlay_audit893.json`, `labels893.json`, `flagged_refs893.json`, `contact_sheets/`,
  `change_map_17sep_vs_2oct.webp`), the picture proof (`sheet_compare893.json`, `thumbnails_before_after/`,
  `western_strip_v890_scene_vs_paper.webp`), the scene fix (`scene_fix893.json`), the candidate manifest and change
  list, the test logs and screenshots, the regression logs (`regression/`), `build893.sha256`.

## Left as it is

- The sector label boxes the 2 Oct issue redraws (wider, with "MCM" labels) cover a few unit tags in the drawing itself
  (WC20, WC50, WC69, WC86, WC-BSF, BS06 and T0243's toilet block lie under a white sector box on the 2 Oct sheet). The
  pins are on the tags; the paper hides them. Nothing to do on our side.
- The six overlays in the western strip (above) keep their positions.
- The search label ALOHA LN starts 4.6 pt inside the strip (its text is cut by the window on the 2 Oct paper, as it
  now is in the explorer); the label box is left as the scene lists it.
- WC32: pin, pictures and card as v8.89 left them.
