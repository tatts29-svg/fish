# v8.97 — Completion on the maps (DRAFT)

Author: Andrew Fisher.

Andrew, 8 Oct 2026 ([PR #1, comment 6045529948](https://github.com/tatts29-svg/fish/pull/1#issuecomment-6045529948)):
"Need to come up with a clean way to show completions on maps when we search for things example buildings. We still want to
show but something to highlight completion keeping in reference to same look as how its highlighted."

The page and explorer patches are implemented. Fifty network-free checks pass, plus 12 browser checks each on desktop,
phone and phone with reduced motion, using the authoritative combined page with the complete v8.90 drawing preview set.
Final v8.93 drawing integration, the earlier explorer regressions and the combined release checks remain pending.
This folder is not READY TO UPLOAD or LIVE. The early preview demonstrates the completion treatment; it does not verify the
final v8.93 drawing alignment. No operational records or financial data have changed.

## What changes

- Every result remains visible, with its existing category-coloured ring and reference label. The selected result keeps its
  stronger ring and existing pulse.
- A verified complete result gets one small, static green tick at the ring's lower-right edge, and "✓ Complete" on its search
  or category row and its card. The page's finder uses the same verified status.
- Complete means the record's Complete tick **and** the Timeline's Finished reading: stage 5, no conflict and not blocked.
  On site, at location or installed alone does not count. WC31's "Review required · Complete recorded" has no new tick or pill.
- New ring ticks only appear in the current selection/category marks. The optional Done layer remains optional and unchanged;
  when it already marks a result, that result receives no second tick.
- The completion reader fails closed: an unavailable, older or unreadable host removes verified claims until it recovers.
- When completion changes, the open card's Timeline detail refreshes with its pill. Its scroll position and action-button
  focus are retained, and the camera and selection stay put. A closed card remains closed.
- No layout, tap-target or selection-motion changes. The tick has no animation; reduced motion keeps the existing behaviour.

## Files and checks

| File | Purpose |
|---|---|
| `patch_v897.py`, `source/map897.js`, `source/map897.css` | Page-side authoritative completion API and finder pill; footer advances to v8.97 |
| `patch_explorer897.py`, `source/explorer897_src.js` | Explorer ticks, row/card pills, visible-card refresh, fresh script hashes |
| `tests/test_semantics897.cjs` | 28 checks using the real Timeline projection: completion, review, moved/cancelled, failed reads, scope, Done suppression, canvas geometry |
| `tests/test_patch897.py` | 22 checks: exact output scope, script parsing/hashes, wrong-base/reapply guards, unchanged rings/labels/pulse/tap functions |
| `tests/open_map897.cjs` | Portable shared-harness wrapper; required local code/assets, no live explorer fallback, all writes blocked |
| `tests/test_browser897.cjs` | Desktop/phone/reduced-motion integration: categories/search, card refresh/focus, camera preservation, failure/recovery, errors and containment |
| `tools/mockup897.cjs`, `tools/to_webp897.py` | Real-page desktop/phone captures; financial-text check before each screenshot, nonzero exit on errors/missing assets/writes |

Run from this folder:

```bash
node tests/test_semantics897.cjs
python3 tests/test_patch897.py
```

Both passed on 8 Oct 2026 AEST, with no network requests or live writes. The patch check proves `selectCode`, `itemAt887`,
`markAt`, `startPulse`, `placePulse` and `done782Draw` remain byte-for-byte unchanged, and the original ring renderer only gains
the tick call after its existing stroke. Invalid script references are rejected before output is written. Explorer output must
be a new or empty directory separate from the source.

## Build and browser use

Apply the page patch through the shared `toolchain/build.sh` after the claimed release chain. Build the explorer against the
reviewed v8.93 code, retaining the complete unchanged code set:

```bash
python3 patch_explorer897.py ../v8.93_maps_aligned_DRAFT/machine_code_v887_v890_v893 /private/output/explorer897
```

Set `PAGE` to the final page candidate, `CODE` to the patched explorer directory, `ASSETS` to the complete verified v8.93 asset
directory and `MEDIA` to the v8.93 page images. Set `OUT` to a private evidence folder outside Git. Supply `NODE_PATH` for the
shared toolchain's `node_modules` and `CHROMIUM_PATH` if the environment needs them. Coordinate the shared browser slot first.

```bash
node tests/test_browser897.cjs
MOB=1 node tests/test_browser897.cjs
MOB=1 REDUCED=1 node tests/test_browser897.cjs
node tools/mockup897.cjs
MOB=1 node tools/mockup897.cjs
```

The browser suite's completion-change simulation replaces only in-memory display readers; it does not call a save function.
The harness serves local explorer files and reads the live record through the existing GET-only test transport. Any missing
local explorer file is a failure, never silently replaced with the live version.

The three targeted browser runs passed 12/12 each on page SHA-256
`af2a20ba27befb87880171667c5c66f2fe4f97878cfffa12a439f1e87ba0a6d8` (11,397,220 bytes), using v8.90 drawing code plus the current
v8.97 patch and the exact v8.90 assets. Every run recorded zero page errors, console errors, write attempts, missing local
files and live explorer fallbacks. The page patch was also proven to differ from the final v8.96 page only by its appended
script/style and footer. These checks validate completion behaviour, not final v8.93 drawing alignment or tile identity.

The early phone mock-up produced eight screenshots with zero page errors, console errors, missing local files, live explorer
fallbacks or write attempts, and no visible financial figures. Its four retained code dependencies were checked by SHA-256
and bytes against `retained_manifest_v864_b469a99c.json`. The first desktop run exposed missing unchanged dependencies and is
not recorded as a passing run. Private early captures live outside Git; final captures must use the final v8.93 assets.

The final release must include page + explorer + v8.93 assets in one coordinated publication plan. The page's final sweeps,
the v8.87/v8.90 explorer regressions, byte-identity checks, guarded publication and live readback belong to that combined run.
