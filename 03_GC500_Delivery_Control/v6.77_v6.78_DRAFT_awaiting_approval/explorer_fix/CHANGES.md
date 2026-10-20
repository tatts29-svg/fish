# GC500 Satellite Plan Explorer — fixes staged 26 Sep 2026 (not deployed)

Base: the LIVE files (`/w/<view token>/explorer/`), which are newer than the repo copy (they carry `?find=`).
Nothing was written to the live service; all testing was GET-only with local files served in place of the changed ones.

## What to upload (paths relative to `explorer/`)
Only changed files are staged. Everything else on live (drawing-scene.bin, vt pyramid, georeferencing.json,
classification.json, register.json, original-preview.webp, scene-worker.js) is unchanged and not duplicated here.

| File | Change |
|---|---|
| `index.html` | phone layout, satellite banner, Try again button, status colours |
| `explorer.js` | E1 guard, default mode, E3 retry and status, E6 load failures, alignment status |
| `README.md` | the notes below, briefly |
| `assets/underlay/manifest.json` | new byte sizes, `"alpha": true` on every item, note updated. Bboxes and record ids unchanged |
| `assets/underlay/x*.webp` (64 files) | re-exported **with** their soft masks as alpha (0.95 MB in total; was 1.2 MB) |

The machine set is registered whole (`machine_set.py`). Use `--keep <current manifest> --add stage/explorer=explorer`,
where added files replace kept files that have the same path. The file count stays the same (64 patches + manifest).

## E1 (Critical): black areas in Original plan
- **Cause:** all 64 patches in `assets/underlay/` were RGB with no alpha channel. The PDF draws each one through a
  luminance soft mask and a clip. The export had dropped both, so every masked-out pixel came out black. Most patches
  are only 4–35 % visible (a faded white-ish overlay), so they were 68–100 % black. The PNG export looked right only
  because its full-scene SVG paints over the patches.
- **Fix, `assets/underlay/*` (regenerated):** `tools/regen_underlay.js` renders each patch in Chromium. It uses the
  scene record the manifest names (`record_id`) with that record's own clip group, clip path and mask from
  `drawing-scene.bin`, which is exactly what the worker emits for Original plan. It renders at the image's native
  pixel size onto a transparent canvas and saves as lossy WebP with alpha. Three patches (x39, x42, x1785) come out
  fully transparent because the PDF clips or masks them out entirely. That matches the export.
- **Guard, `explorer.js` boot:** the patch set is used only if every manifest item says `alpha: true`. If the old
  set were uploaded again, Original plan falls back to the preview picture plus the drawing tiles (tested: 2.8 %
  near-black) and never draws black.
- **Proof** (`tools/compare.py`, sheet area only). Each row compares the on-screen canvas at 1440 × 900 ×2 with the
  PNG export of the same view:

  | View | before: mean abs diff / near-black on screen | after | export near-black |
  |---|---|---|---|
  | Fit | 115.8 / 48.7 % | 3.8 / 0.5 % | 0.5 % |
  | Macintosh Island 500 % | 171.1 / 76.1 % | 4.8 / 3.1 % | 4.0 % |

## Opens in Satellite + plan (`explorer.js`)
- `startMode()` decides the mode at the end of boot. A `#original` / `#hybrid` / `#satellite` hash wins. Next comes
  the mode this browser last picked by hand (a mode button or the 1/2/3 keys, stored in `localStorage` under
  `gc500.explorer.mode`). Otherwise the page opens in Satellite + plan.
- If the user picks a mode while the page is still loading, that choice is kept.
- `?find=` still works with every mode.
- A `hashchange` listener also switches the mode on a page that is already open.
- The original plan is still what shows under the loader.

## E2 (High): 390 px phone (`index.html`)
- The header now fits on one line at ≤ 900 px: ☰, a short "GC500 2026" name, and short mode labels
  (Plan / Sat + plan / Satellite, with full `aria-label`s).
- The four page links move into the ☰ menu (`#xnavSide`, filled by the existing nav script and hidden in a frame, as
  before).
- Added `.app>*{min-width:0}` and `header{overflow:hidden}`, so nothing can widen the page again.
- The attribution stays on one line in full at the bottom right. The status pill and compass sit above it with no
  overlap. The view-name pill moves below the zoom bar.
- Result at 390 × 844: document and header are 390 px wide (the header was 620). All 15 controls checked are on
  screen, the attribution is not clipped, and the 4 links are in the menu.

## E3 (High): satellite tile failures (`explorer.js`, `index.html`)
- A failed tile (non-OK status or network error) is no longer cached as an error for good. It is fetched again after
  2, 4, 8 and 16 s, then every 30 s while it is in view. Retries use `cache: 'reload'`. The retry count survives cache
  eviction.
- A timer repaints when the next retry is due.
- Each frame counts the visible tiles that failed against the tiles actually shown:
  - **Some failed:** amber status "Some satellite tiles did not load · retrying" and an amber banner.
  - **None arriving, or the map key is missing or refused:** red status "Satellite imagery not loading · plan shown
    on its own" and a red banner that reads **"Satellite imagery isn't loading — Retry · Show the plan only"**, with
    one plain line saying why (the server's answer, no connection, or no key).
- Retry clears the failures, refetches the map key if needed, and asks again at once.
- Show the plan only switches to Original plan and remembers that choice.

## E6 (Medium): load failures (`explorer.js`, `index.html`)
- `worker.onerror` is handled, and scene loading has a 45 s timeout.
- The loader shows a plain-English message instead of the raw one:
  - missing helper script: "Part of the viewer … did not load"
  - scene 404: "The drawing file is missing from the server (it answered 404)…"
  - scene 5xx: "…could not send the drawing file (it answered 503)…"
  - timeout: "…taking too long to load (over 45 seconds)…"
- A **Try again** button reloads the page, and the progress bar turns red.
- `original-preview.webp` is now optional. If it is missing, the minimap is hidden and the overview draws from the
  drawing tiles.
- The JSON side files already failed soft; network errors on them do too now.
- A worker crash after boot rejects pending renders and shows a toast.

## Alignment status (`explorer.js`)
- The dot is green only when `review_status` is reviewed, approved or signed off (and the residuals are under 1.5 m).
- Until then it is amber and the line starts "Alignment not yet signed off · main plan check 0.67 m rms…".
- No alignment numbers or files were changed.

## Tests: `tools/tests.js` (output in `work/tests_after.log`, baseline in `work/tests_before.log`)
- Checks: no page errors on load, start mode and deep links, the E1 black-pixel check, no phone overflow, every tile
  and load failure path, and recovery by backoff and by the Retry button.
- `tools/harness.js` opens the live address in Chromium, serves the staged files locally and takes everything else by
  GET through curl. Every non-GET request is aborted.
- `tools/shots.js` makes the screenshots in `shots/`.
- Note: the lead's swiftshader GL flags made 2D canvas screenshots time out (tiles took 40–75 s). The runs use
  `--no-sandbox` only, as the earlier audit did. Set `GL=1` to use the flags.
