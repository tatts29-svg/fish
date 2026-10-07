# v8.87: Map explorer — fast, smooth, says what has been done, and Fencing closes (READY, not live)

Author: Andrew Fisher. Built 8 Oct 2026 by Claude on live v8.83 `88a3584e`, with the unpublished v8.84 and v8.85 chained in. Not
published: this session has no edit key. Two parts, each works on its own, both wanted for the full result:

- **the dashboard page** (`patch_v887.py` + `source/map887.js`): the unit card's progress and the Escape key;
- **seven Map explorer files for the machine set** (`patch_explorer887.py` → `explorer/`): the speed, the stuck pointer, the card
  itself and the Fencing close. The explorer is not in the page; the Map tab hosts a frame that loads the machine set's
  `explorer/index.html`.

The investigation this builds on was `v8.86_master_map_DRAFT/explorer_findings.md`; it now lives at
`v8.89_master_map_DRAFT/explorer_findings.md`.

## Andrew's words

Andrew, 7 Oct 2026 13:46 AEST: "maps need some work its very very clunky its hard to use its slow its not smooth it juts doesnot
functione well. when you click on example building nothing is clearly saying what has been done. also yuou need to tap fencing or
close fencing to close that. its very bad does not functione well." Approved 8 Oct 00:20 AEST: "Approved and get everything done".

## What was wrong, and what changed

| # | What Andrew saw | Root cause (live v8.64 explorer, machine set `b469a99c`) | Fix |
|---|---|---|---|
| 1 | Slow, not smooth | The fencing layer rebuilt its geometry on **every frame** of a pan or zoom, Fencing on or off: filters, task lookups and a duplicate check that turned every line into text twice (`fencing-map-explorer.js` `visibleGeometry` → `dedupeGeometry`). | The geometry on the map is worked out once per filter, selection or data change and kept (`visCache`), with each line's task, colour and bounds; lines off the screen are skipped. With Fencing off the layer is not painted at all and its canvas is hidden. |
| 2 | A hitch and a blur at the start and end of every gesture; a slow phone stutters through a pan | v8.64 shrank the three canvases to 0.75 of the screen's density at the start of every gesture and grew them back 160 ms after it: a reallocation at both ends and a blurry-then-sharp jump, on fast devices too. Worse, on a slow device a single frame longer than 160 ms counted as "rest", so the store flipped back and forth through one gesture (58 resizes and a 6 s stall in one pan on the loaded phone emulation). | A gesture starts at full sharpness. Only when three moving frames in a row average over 14 ms does it drop to the lighter store (the next gesture starts there; every sixth tries full again). Rest means no glide, no fling and no hand moving for 160 ms, however slow the frames. The size changes only at the start of a frame, so no frame is shown blank. A fast laptop or phone never resizes. |
| 3 | A freeze every few seconds while the map is open, and work going on behind other tabs | The Done list was asked for every 4 s on every tab (`gc500DoneKeys`: a delivery read for every unit); a 700 ms heartbeat ran too; the parked frame kept drawing; while Fencing was open the dashboard's snapshot (~460 KB) was built and turned into text every 4 s, and every dashboard redraw forced a full fencing rebuild. | The Done poll, the heartbeat and every repaint pause while the map is hidden or parked (`setHostShown`, plus the frame checks for itself whether it sits in `#expPark`). The fencing poll is a 20 s idle safety check that never runs while a hand or a glide is moving; a dashboard redraw nudges the layer and the nudge is signature-checked, so a rebuild happens only when the fencing data actually changed. |
| 4 | Jumps | Picks, chips, areas and Fit set the camera at once. | They glide (320–680 ms, eased, destination tiles asked for first). Reduced motion, 3D and a change between plan and ground coordinates still land at once. |
| 5 | Per-frame waste | A new radial gradient and a text measurement per ring per frame; `getBoundingClientRect` on every pointer move; a debug log keeping 30,000 frames. | One gradient per colour and size and one width per label (cached); the stage's rectangle read once per gesture and on resize; the log keeps 600 frames. |
| 6 | The map follows the mouse after a fence tap; the next finger reads as a pinch | Tapping a fence line stopped the `pointerup` before the map's own handler saw it, so the pointer never left the map's pointer table. Reproduced on the live files (`perf887_live_*.log`, `stuckPointer.mapFollowedMouse: true`). | The release reaches the map; the **click** that follows is the one swallowed, so the tap does not also pick a ring. A new gesture also drops any pointer whose release was lost. |
| 7 | "Nothing is clearly saying what has been done" | Nothing was tappable until a category chip was on (chips are in the drawer a phone hides). The card showed one delivery word (On site / In transit / Not on site / No delivery record), and "On site" for on-hire records the Timeline calls unconfirmed. It vanished on any touch of the map. | Any placed unit can be tapped, chip or no chip. The card shows the Timeline's own five-stage reading (`timeline841State`: Off site → In transit → On site → At location → Installed → Finished) as a lamp strip and label, the why sentence, who recorded each step and when (the light, At location / Installed, Levelled, Steps, Finished), the due day (moved from the plan where it was) and "Still to come: …". On-hire unconfirmed reads exactly as the Timeline does. Open record and a new Progress button (the Timeline's delivery progress dialog). The card stays through a pan or a zoom; a tap on the map, × or Escape closes it. |
| 8 | "You need to tap fencing or close fencing to close that" | Fencing was an on/off mode: the same header button relabelled, a close bar inside the drawer (hidden on a phone), Escape only with the map focused and a second press if anything was selected; entering Fencing left the category chip pressed, which swallowed the first Escape; a fence tap on a phone opened the drawer over the map. | A **Fencing view · × Close** bar on the map itself, laptop and phone. Escape closes Fencing in one press, from the frame or with the focus in the dashboard (the page listens too). A tap on the map closes the fencing details; Close clears the pick. No chip is left pressed. On a phone the map stays in view: Fencing does not open the drawer, and a tapped line gets a card at the foot of the map with a Details button. |

Unchanged: the plan, the geometry, the positions and counts, the fencing model and records, 3D, PNG export, the drawing assets, the
master-drawing hash check and the "Drawing © iEDM D001 rev 03" attribution strings (both byte-identical to the live files, so the
v8.90 anchors still apply).

## Files

| Path | What |
|---|---|
| `patch_v887.py`, `source/map887.js` | the page part: `gc500PlanCard` carries the Timeline stage, lines, due day and what is left; `gc500ExplorerProgress`; Escape in the page closes Fencing, a map selection or the card; footer `v8.87` |
| `patch_explorer887.py`, `source/explorer-fix887.js`, `source/explorer-fix887.css` | the machine part: exact-once replacements in `explorer.js`, `fencing-map-explorer.js`, `explorer-merge.js`, `explorer-fix864.js` and `index.html` (hashes of the live files asserted), plus the two new files |
| `explorer/` | the seven prepared files, as the machine set must carry them (`python3 patch_explorer887.py <live explorer files> explorer`) |
| `machine/retained_manifest_v864_b469a99c.json` | the live set's full manifest, 231 files: rebuilt from `v8.09_coates_way_machine_LIVE/evidence/manifest_v809.json` plus the v8.28, v8.37 and v8.64 deltas; its canonical digest equals the registered `b469a99c…`, and every descriptor was confirmed against the live service by ETag and length (`evidence/live_set_verify_b469a99c.json`) |
| `machine/candidate_manifest887.json`, `machine/prepared887.json` | the candidate set (233 files) and the seven descriptors the publisher asserts |
| `machine/publish_machine887.py` | the guarded publisher (below) |
| `tests/` | `test_explorer887.cjs` (the new checks), `perf887.cjs` (before/after), `lib887.cjs`, `xembed.js` (the harness that serves the explorer from disk), `run887.sh` (the full regression chain as it was run, adapted from v8.85's) |
| `evidence/` | logs, measurements, screenshots, hashes |

## Build and check

```bash
# the page, on live v8.83 with v8.84 and v8.85 chained in (drop them once they are live)
toolchain/build.sh v8.87 v8.84_today_wide_layout_DRAFT/patch_v884.py v8.85_where_we_are_DRAFT/patch_v885.py v8.87_map_explorer_DRAFT/patch_v887.py
# the explorer files, from the exact live ones (read-only GET of /w/Coates-GC500-2026/explorer/<file>)
python3 v8.87_map_explorer_DRAFT/patch_explorer887.py <folder with the live explorer files> v8.87_map_explorer_DRAFT/explorer
# the checks (one browser at a time)
NODE_PATH=toolchain/node_modules CHROMIUM_PATH=/opt/pw-browsers/chromium PAGE=$PWD/build/GC500_v8.87/GC500_Delivery_Control_hosted.html \
  LOCAL=$PWD/v8.87_map_explorer_DRAFT/explorer GC500_CACHE=$(mktemp -d) [MOB=1] node v8.87_map_explorer_DRAFT/tests/test_explorer887.cjs
```

## Hashes

See `evidence/hashes887.txt`.

- Page base: live v8.83 `88a3584e919d8acd32ac3905099c1d606ec2fe5c1da2793363e8ff870f212457`.
- Page candidate: `33c6501f8e52aeca15df4bb902b14ecf3b1d747038bcedc58066eb94851a8f3d`, 11,173,489 bytes (`build/GC500_v8.87/GC500_Delivery_Control_hosted.html`).
- Machine base: set `b469a99c43a30a6d165ce126c4983d0c92204c8f548f0636a008f43de60e95d8` (231 files, `v8.64-map-explorer`).
- Machine candidate: set `c96c1d1baedf38228264a0adec32c38d758dddf3430e8baa68ba8eaf82b71d45` (233 files, `v8.87-map-explorer`), i.e. the live set with these seven descriptors:

| file | bytes | sha256 |
|---|---|---|
| `explorer/index.html` | 28,023 | `c2b68066f5d908e92394761fdacea5ecb5070553bf353c3bd5573306dd2b167f` |
| `explorer/explorer.js` | 142,543 | `a3bd8a13f227e405c7130f761f2d309939061ab8f624bb98517226238012edbf` |
| `explorer/explorer-merge.js` | 27,134 | `161dabb105c15f5efca5a199c625191ed54343237f6af2d8c327c6d365921679` |
| `explorer/fencing-map-explorer.js` | 51,564 | `e3a4bef6c17d7288f0a51c14732129fba32f1f5bbf849d113c3124dc5b55739f` |
| `explorer/explorer-fix864.js` | 7,399 | `d7041320fc3ff63a133cc8e3ce859bbce3e6dc669e2a990bb0fc5f7b27a7ac3b` |
| `explorer/explorer-fix887.js` (new) | 3,240 | `6996471a6a0f568d9136d1165cccba84b411af85638674420fe360d223a44543` |
| `explorer/explorer-fix887.css` (new) | 4,481 | `b64b6341ee142e33e21ef41651d8c0f9e2aeda4661b9f2621ff5b3895e52eb99` |

Every other file of the set (`fencing-map-core.js`, `fencing-map.css`, `explorer-fix864.css`, the assets, the machine, poc3d) stays
exactly as registered.

## Publish (needs the edit key; nothing here was uploaded)

Either part can go first. Order with v8.90 (the explorer's D001 drawing assets for the 2 Oct issue, built in
`v8.90_explorer_master_DRAFT/`): **v8.87's seven files first, then v8.90's assets into the same machine set.** v8.90 patches on top
of these files; its anchors (the master-drawing hash check and the attribution strings) are untouched here.

1. Pull, read `STATUS.md`, confirm live is still v8.83 `88a3584e` and the machine set is still `b469a99c` (`GET /api/machine`
   with the view token). If the page moved, rebuild with `toolchain/build.sh` and rerun the checks; if the set moved, rebuild
   `machine/retained_manifest_v864_b469a99c.json` from the new live set first (the publisher refuses otherwise).
2. The page: `python3 toolchain/upload_page.py build/GC500_v8.87/GC500_Delivery_Control_hosted.html --dry-run`, then without
   `--dry-run`. It refuses if the live page changed since the build and proves the view link serves the candidate byte for byte.
3. The machine set, from `03_GC500_Delivery_Control` with `GC500_EDIT_TOKEN` in the environment:
   ```bash
   python3 v8.87_map_explorer_DRAFT/machine/publish_machine887.py --explorer v8.87_map_explorer_DRAFT/explorer --dry-run
   python3 v8.87_map_explorer_DRAFT/machine/publish_machine887.py --explorer v8.87_map_explorer_DRAFT/explorer
   ```
   The dry run is GET-only: it checks the seven files against `machine/prepared887.json`, rebuilds the candidate manifest, confirms
   the key is the edit key, that the live set is `b469a99c` and that every preserved blob is on the volume. The publish PUTs the
   seven blobs under their SHA-256, POSTs the manifest once, reads `/api/machine` back (`c96c1d1b…`) and GETs each changed public
   asset to prove the bytes, then writes `publication887.json` beside the explorer folder. The five unlisted private blobs the
   server protects (`SERVER_FILE`, `SERVER_FILE_KEEP`) are untouched by a registration.
4. Read back with the public checks: `LOCAL` unset, `node tests/test_explorer887.cjs` laptop and phone against the live page.
5. Record it on `STATUS.md` with the LIVE time and both hashes; rename this folder `_LIVE`.

## Results

The headline numbers (laptop 1440×900 and phone 390×844 emulation, headless Chromium without a GPU, one browser at a time; the
machine was shared with other agents' browsers, so the frame intervals carry noise from run to run, while the fencing layer's own
paint time, the resize counts, the poll counts and the pointer state are exact):

- **The fencing layer's own paint per frame** (the per-frame rebuild that was the slowness): zooming 3.4–3.8 ms (p95 5.6–6.8) → 0.3–0.5 ms (p95 0.6–1.0); panning 3.3–3.5 → 0.7–0.8 ms. With Fencing off it is not painted at all (0 paints; the live layer still cleared and re-sized its full-screen overlay every frame).
- **Main-thread time over a pan with Fencing on:** laptop 951 → 663 ms, phone 815 → 720 ms; frames over 50 ms on the phone 0 → 0, zooming 1 → 0.
- **Canvas resizes per gesture (the hitch):** 2 → 2 on a phone pan, 14 → 2 on a laptop zoom in this run. In an earlier run under heavy machine load (8 Oct 2026, about 15:10 UTC, the log since overwritten by the paired re-run) the live files re-sized the canvas 58 times in one phone pan with a worst frame of 6.2 s, because every frame over 160 ms ended the "interaction" and the store flipped back and forth; v8.87's rest rule (no glide, fling, pending frame or moving hand) is written for that case, and the final paired run at lower load shows the plain two resizes each.
- **Stuck pointer:** reproduced on the live files (the map followed the mouse after a fence tap; 1 pointer left in the map's table, the gesture still open); in v8.87 the table is empty (0) and the next drag pans normally.
- **Escape with a fence pick:** 2 presses to leave Fencing → 1.
- **Hidden (another tab for 10 s):** Done polls 3 → 0 (laptop), 3 → 0 (phone), frames drawn 0. **Idle in Fencing for 10 s:** snapshot builds 2 → 0.
- **Frame intervals (rAF)** in the table are soft: headless Chromium without a GPU paints every frame in software and the machine was shared with other agents' browsers, so they vary run to run by more than the difference between the two builds on a laptop. The exact counts above are what to read.
- No page errors and no write attempted in any run.

### Before and after (headless Chromium, no GPU; `tests/perf887.cjs`; live = the registered v8.64 explorer files, v8.87 = the prepared files; one browser at a time)

| Measure | Laptop live | Laptop v8.87 | Phone live | Phone v8.87 |
|---|---|---|---|---|
| Wheel zoom, Fencing off: frame interval (rAF) | mean 55.67 · p95 266.6 · max 566.7 ms | mean 21.53 · p95 50 · max 116.7 ms | mean 17.41 · p95 16.8 · max 83.4 ms | mean 20.11 · p95 33.4 · max 66.6 ms |
| Wheel zoom, Fencing off: frames over 50 ms / over 33 ms | 33 / 83 of 185 | 8 / 37 of 209 | 2 / 5 of 223 | 2 / 32 of 189 |
| Wheel zoom, Fencing off: main-thread task time over the gesture | 8675 ms | 3833 ms | 2494 ms | 2957 ms |
| Wheel zoom, Fencing off: canvas backing-store resizes | 14 | 2 | 2 | 2 |
| Drag pan, Fencing off: frame interval (rAF) | mean 17.1 · p95 16.8 · max 49.9 ms | mean 16.88 · p95 16.7 · max 33.3 ms | mean 18.06 · p95 16.8 · max 166.8 ms | mean 17.63 · p95 16.7 · max 133.3 ms |
| Drag pan, Fencing off: frames over 50 ms / over 33 ms | 0 / 3 of 154 | 0 / 2 of 157 | 1 / 4 of 143 | 1 / 2 of 138 |
| Drag pan, Fencing off: main-thread task time over the gesture | 764 ms | 807 ms | 920 ms | 840 ms |
| Drag pan, Fencing off: canvas backing-store resizes | 2 | 2 | 2 | 2 |
| Wheel zoom, Fencing on: frame interval (rAF) | mean 19.74 · p95 33.4 · max 50 ms | mean 18.49 · p95 33.3 · max 50 ms | mean 17.65 · p95 16.8 · max 66.6 ms | mean 17.07 · p95 16.8 · max 33.4 ms |
| Wheel zoom, Fencing on: frames over 50 ms / over 33 ms | 0 / 31 of 190 | 0 / 18 of 201 | 1 / 9 of 203 | 0 / 5 of 208 |
| Wheel zoom, Fencing on: main-thread task time over the gesture | 2732 ms | 2239 ms | 2574 ms | 1828 ms |
| Wheel zoom, Fencing on: fencing layer paint per frame | mean 3.39 · p95 5.6 · max 11.3 ms, total 532.3 ms over 157 frames | mean 0.28 · p95 0.6 · max 2.5 ms, total 46.8 ms over 166 frames | mean 3.75 · p95 6.8 · max 10.3 ms, total 645.8 ms over 172 frames | mean 0.53 · p95 1 · max 2.9 ms, total 91.8 ms over 173 frames |
| Wheel zoom, Fencing on: canvas backing-store resizes | 2 | 2 | 2 | 2 |
| Drag pan, Fencing on: frame interval (rAF) | mean 17.51 · p95 16.8 · max 66.8 ms | mean 18.17 · p95 33.3 · max 33.4 ms | mean 17.31 · p95 16.8 · max 49.9 ms | mean 17.22 · p95 16.8 · max 33.4 ms |
| Drag pan, Fencing on: frames over 50 ms / over 33 ms | 1 / 6 of 158 | 0 / 12 of 133 | 0 / 5 of 154 | 0 / 5 of 151 |
| Drag pan, Fencing on: main-thread task time over the gesture | 951 ms | 663 ms | 815 ms | 720 ms |
| Drag pan, Fencing on: fencing layer paint per frame | mean 3.54 · p95 5.4 · max 11.1 ms, total 148.5 ms over 42 frames | mean 0.65 · p95 1.2 · max 2.4 ms, total 27.3 ms over 42 frames | mean 3.27 · p95 5.3 · max 6.6 ms, total 134.1 ms over 41 frames | mean 0.76 · p95 1.2 · max 2.8 ms, total 31.3 ms over 41 frames |
| Drag pan, Fencing on: canvas backing-store resizes | 2 | 2 | 2 | 2 |
| Tap a fence line, then move the mouse: map follows (stuck pointer) | yes (pointers left 1) | no (pointers left 0) | no (pointers left 1) | no (pointers left 0) |
| Escape presses to leave Fencing with a pick | 2 | 1 | 2 | 1 |
| 10 s on another tab: Done polls / fencing snapshots / frames drawn / main-thread ms | 3 / 0 / 0 / 329 | 0 / 0 / 0 / 345 | 3 / 0 / 0 / 286 | 0 / 0 / 0 / 280 |
| 10 s idle in Fencing on the map: snapshot builds / main-thread ms | 2 / 196 | 0 / 141 | 2 / 257 | 0 / 122 |
| Page errors / writes attempted | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 |

### Checks on the candidate (page `33c6501f…` with the prepared explorer served from `explorer/`)

| Check | Laptop | Phone |
|---|---|---|
| New: Map explorer (`test_explorer887.cjs`) | 23/23 | 24/24 |
| Today layout 876 | 18/18 | 18/18 |
| Crew 883 | 34/34 | 34/34 |
| VMS 874 | 18/18 | 18/18 |
| Finance 866 | 24/24 | 24/24 |
| Asset 873 | 40/40 | 40/40 |
| Loading 872 | 26/26 | 26/26 |
| Unloading 881 | 34/34 | 34/34 |
| Paired 881 | 18/18 | 18/18 |
| Handling 875 (known out of date; same on live) | 22/28 | 22/28 |
| Paired 879 (known out of date; same on live) | 17/18 | 17/18 |
| 15-tab sweep | 15 tabs, 0 errors, 0 blocked | 15 tabs, 0 errors, 0 blocked |
| Where we are 885 (2560 / 1600 / 1440 / phone) | 24/24 / 24/24 / 24/24 | 24/24 |
| Wide layout 884 (2560 / 1600 / 1440 / phone) | 21/21 / 21/21 / 21/21 | 21/21 |
| v871 / supplier 870 / KINP 869 | 12/12 / 17/17 / 17/17 | — |
| DATA identity (`test_source875.py`) | PASS all protected source sections and unrelated item/event fields remain identical | |
| Progress model 881 | 12/12 passed | |

Screenshots: `evidence/shots/explorer887_card_laptop.png`, `explorer887_card_phone.png` (the unit card), `explorer887_fencing_open_laptop.png`,
`explorer887_fencing_open_phone.png` (Fencing with its close bar) and `explorer887_fencing_phone_card_phone.png` (a tapped line on a phone).

## Not done, and Andrew's calls

- The machine set and the page both wait for the edit key.
- On-hire-unconfirmed units: none is placed on the master plan on today's record, so that card reads were checked by the all-units
  invariant (every placed unit's card equals its Timeline stage) and by the code path, not by eye.
- Headless Chromium without a GPU paints canvases far slower than a real device: the before/after numbers are like for like, not a
  guarantee of a particular frame rate on a particular phone.
