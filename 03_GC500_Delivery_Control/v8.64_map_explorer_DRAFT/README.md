# v8.64: Map explorer, fast and clear (DRAFT, READY to upload)

Author: Andrew Fisher.

Andrew (Claude chat, 6 Oct 2026): "Audit map explorer very slow and clunky. Freezes . Then in fencing . Hard to close the tabs inside. Freezes in fencing lags. Slow. Slow when zoom. Csnt close chosesn selection. Inless u click on find and fencing. Fix the labeling find is silly then fencjing beside it. Confusing. It whould be a highight this map explorer.with no bug. Fast . Accurate. Quick. Smooth. No delays."

v8.64 has **two parts, both needed**:
- the dashboard page (`patch_v864.py`, on live v8.63);
- three Map explorer files for the machine (`machine_prepared/`, on registered machine `e1c9f62d`, v8.37).

## What was wrong (measured on live, inside the dashboard, desktop 1440×900 and phone 390×844)

| # | What Andrew saw | Root cause |
|---|---|---|
| M1 | Freezes in Fencing: a stall about every 4 s | While Fencing is open the map asks the dashboard for the fencing snapshot every 4 s. Building it checks each recorded photo against the Documents list, and `dropFileIndex()` rebuilt the whole 363-file list for every photo. That is about 200 rebuilds and about 120 ms of frozen page on every ask. |
| M2 | Fencing slow to open | The same snapshot build (about 130–150 ms) runs on open. |
| M3 | Hard to close the panels | The Fencing panel had no close. The only way out was the Fencing button again or a view button. On a phone, the side panel covered the map with no way back except the button that opened it. |
| M4 | Can't close a chosen selection unless you go back to Find or Fencing | A picked category, reference or fence run stayed lit. It was cleared only by reopening the same panel and pressing the same button again. Escape worked only when the map itself had keyboard focus. |
| M5 | "Find" then "Fencing" is confusing | The panel button read "Find" and quietly became "Tasks" in Fencing. On a phone it sat beside "Fencing" and a cut-off "G…". |
| M6 | Slow when zooming | Each frame of a pan, pinch or zoom glide redrew the whole canvas at full pixel density (about 11 tile draws a frame). Frame time is almost all pixels: profile in `evidence/xprof.js`. Only phones above 2x were lightened while moving. |

## The fix

**Dashboard page (`fencesnap864.js`, via `patch_v864.py` on live v8.63 `4b3a61e3`):**
- Inside one fencing snapshot, the Documents file index is built once and reused (the list cannot change mid-build).
- Every snapshot is still built fresh from the current record.
- Nothing outside the snapshot changes.

**Map explorer (`explorer/explorer-fix864.js` and `.css`, loaded after the existing explorer scripts; `patch_explorer864.py` adds them to `index.html`):**
- **Labels.** The panel button is "Search & layers" ("Search" on a phone). In Fencing, the buttons are "Fencing list" and "Close fencing" ("List" / "Close" on a phone). On a phone, each shows an icon over a short word, like the dashboard's own phone tabs. The cut-off brand is hidden on narrow screens, so Search, Fencing and the four views fit one row.
- **A way out of every panel.** "Close fencing" sits at the top of the Fencing panel. On a phone, "Back to the map" sits at the top of the side panel.
- **Clear selection on the map.** A "Clear selection" button appears on the map whenever a category, reference or fence run is picked. One tap clears it.
- **Escape anywhere in the explorer.** The first press clears the selection; the next closes Fencing. The legend and the open phone panel keep their own Escape.
- **Lighter frames while moving.** While a hand or a glide is moving, the canvas draws at 0.75 of the screen density (capped at 1.5x before that) and the browser scales it up. 160 ms after the last movement it redraws at full sharpness, as before.
- **Unchanged:** plan, geometry, positions, counts, the fencing model, records, 3D and PNG export.

## Results (paired, one browser at a time, two rounds: `evidence/speed_paired.txt`)

| Action | Desktop live → v8.64 | Phone live → v8.64 |
|---|---|---|
| Zoom glides (normal map): main thread blocked | 1.0–1.2 s → 0.5–0.7 s | 0.8–1.0 s → 0 |
| Opening Fencing: freeze | 0.13 s → none | 0.15 s → none / 0.05 s |
| 13 s idle in Fencing | 3 freezes (~0.35 s) → none | 3 freezes (~0.32 s) → none (one 0.11 s blip in one round) |
| Zooming in Fencing | 0.72 s → 0.12 s | 0.2–0.5 s → 0 |
| Fencing snapshot build | ~120 ms → 10–20 ms | same |

These are headless Chromium without a GPU, so canvas painting costs more than on a real phone or laptop. The before and after comparison is like for like.

## Checks

- `tests/test_explorer864.cjs`: desktop 15/15, phone 16/16. It checks:
  - labels, and that the header fits without clipping;
  - the phone side panel closes with "Back to the map";
  - Clear selection shows and clears a category and a fence run;
  - Close fencing;
  - no long task over 9 s of Fencing refreshes;
  - Escape clears, then closes;
  - lighter canvas while moving, and full at rest;
  - snapshot build under 60 ms;
  - no page errors, no writes, and the candidate files are served.
- 3D mode in and out works on desktop and phone with 0 errors (`evidence/xprobe.js`, `states.js` run).
- The v8.63 flicker test on the v8.64 page: 24/24 desktop and phone.
- Dashboard sweeps desktop and phone: the same 15 tabs, 0 errors, 0 console, 0 attempted writes. `check_page.py`: PASS.

## Candidates and publication

**Page.**
- Base live v8.63 `4b3a61e3ff12921bb1efe34570e6a1ef7a65ce42104bc21ba041340eaf79b64e`.
- Candidate `d725d9acd069a208be3e3ecc757f3b914c9b98bff67a5432475dde6e2ae7a7d2`, 11,006,214 bytes.
- Build: `toolchain/build.sh v8.64 v8.64_map_explorer_DRAFT/patch_v864.py`. Upload: `toolchain/upload_page.py`.

**Machine (Map explorer).**
- Base: registered set `e1c9f62d090a8901539b9140a5d84217adab9702a98086c8608d03b47e4c70bf` (v8.37, 229 files). Explorer `index.html` `9c7e04a2baa12cdb9ad3a008a409b10b20e60f8f62fbc1cb6a1f0018b05deb99`.
- Replace `explorer/index.html` with `machine_prepared/index.html` (`f75f8f4f…`).
- Add `explorer/explorer-fix864.js` (`2b0cfadb…`) and `explorer/explorer-fix864.css` (`c37afd30…`).
- Every other file stays as registered (229 → 231 files).
- Regenerate with `python3 patch_explorer864.py <live explorer index.html> <out>`.
- The machine publisher preserves the full manifest. This folder does not register anything.

**Order.** Either part can go first. Each works on its own: the page fix removes the Fencing freeze, and the explorer fix adds the labels, closes, Clear and lighter frames. Both are needed for the full result.

## Independent public readback (Claude, 6 Oct 2026 ~05:00 AEST, GET only)

- Page `d725d9acd069a208be3e3ecc757f3b914c9b98bff67a5432475dde6e2ae7a7d2`, 11,006,214 bytes: byte-identical to the candidate.
- `/api/machine`: `v8.64-map-explorer`, `b469a99c43a30a6d165ce126c4983d0c92204c8f548f0636a008f43de60e95d8`, 231 files, registered 2026-10-05T18:45:18Z.
- `explorer/index.html`, `explorer-fix864.js` and `explorer-fix864.css` are byte-identical to `machine_prepared/`.
- `explorer.js`, `explorer-merge.js`, `fencing-map-core.js`, `fencing-map-explorer.js` and `fencing-map.css` are unchanged from v8.37.
- `tests/test_explorer864.cjs` against the actual public explorer files (no local substitution): desktop 14/14, phone 15/15 (`evidence/public_readback_*.log`).
- Test-harness note: the shared `curlfetch` disk cache can hold an older `index.html`. Run public checks with a fresh `GC500_CACHE`.
