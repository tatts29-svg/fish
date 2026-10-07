# v8.97 — Completion on the maps (DRAFT: mock-up for Andrew, not built for release yet)

Author: Andrew Fisher. Andrew, 8 Oct 2026 (relayed on PR #1, comment 6045529948): "Need to come up with a clean way to show
completions on maps when we search for things example buildings. We still want to show but something to highlight completion
keeping in reference to same look as how its highlighted."

**Where it is up to:** a working draft and a real-page mock-up (`mockup/`, screenshots from a real candidate build) for Andrew
to approve. Nothing is published, nothing is registered, and no test is final. Phase 2 (final patches on v8.93's explorer
files, tests, the machine-set plan) follows his yes.

## What Andrew sees

- Every result stays as it is: the category-coloured glow ring, the reference label at the upper right, the stronger ring and
  pulse on the one picked.
- A result that is **complete** gets one small, static green tick on the lower-right edge of its ring, and "✓ Complete" on its
  result row (search or category list) and on its card.
- **Complete means** the record's Complete tick AND the Timeline's Finished reading, the same state the Timeline and the unit
  card already show. On site, at location or installed alone does not count. A Complete tick the Timeline holds for review
  ("Review required · Complete recorded", WC31 today) shows no tick and no "✓ Complete".
- The accents are scoped to the current search or category results. The optional Done layer (v7.82/v7.90) is not turned on
  and is not changed; where it is on, its own badge stands and no second tick is drawn.
- No new motion: the tick is static, the selection pulse is as it was, reduced motion is as it was.

## Where the rings are drawn, and where completion comes from

| Where | What | File |
|---|---|---|
| Map explorer ring renderer | `drawMarks(v)` draws the glow, the ring, the selection pulse and the label for every `marks` entry. A category chip puts every unit of that trade in `marks`; a search pick puts the picked unit in `marks`. | `explorer.js` (machine set) |
| Map explorer rows | `search()` builds `#results`; `showCategory()` builds `#findList` | `explorer.js` |
| Map explorer card | `card(code)` reads the dashboard's `gc500PlanCard` (v8.87: the Timeline stage) | `explorer-merge.js` |
| Optional Done layer | `done782*`: centre badge + double beat for every unit with the record's Complete tick, from `gc500DoneKeys()` every 4 s while the map is on screen and still | `explorer.js` |
| The page's own sheet views | `renderMap_held` already draws a ✓ glyph (`okx`) in a marker's pill when the record's Complete tick is on; the finder's `mapLocate` rings the found marker in orange | the page |
| The page's finder rows | `finderRow` shows the delivery light and word (On site …), not completion | the page |

Completion today: `gc500DoneKeys()` = `deliveryOf(key).done` (the record's Complete tick). `timeline841State(a)` = stage 5
"Finished" when that tick is on and no completion conflict; a conflict reads "Review required · Complete recorded".
v8.97 adds `gc500CompleteKeys897()`: both agree (`done` and stage 5, no conflict, not blocked).

## Files

- `patch_v897.py` + `source/map897.js`, `source/map897.css` — the page part: `gc500CompleteKeys897`, `gc500IsComplete897`,
  "✓ Complete" on the finder's asset rows, footer ` · v8.97` (accepts ` · v8.89` … ` · v8.96`).
- `patch_explorer897.py` + `source/explorer897_src.js` — the machine part, applied on the v8.93 explorer code
  (`machine_code_v887_v890_v893`; it also applies on the v8.90 set): the v8.97 block beside the Done layer, the tick in
  `drawMarks`, "✓ Complete" in the rows and the card title, fresh script tokens in `index.html`.
- `tools/mockup897.cjs` — the real-page mock-up (page build at the live address, explorer code and assets from disk, GET only,
  every write aborted, a $-figure check on every shot); `tools/to_webp897.py`.
- `mockup/` — the pictures and Andrew's one-page README.

## Build used for the mock-up

```
toolchain/build.sh v8.97 v8.84_today_wide_layout_DRAFT/patch_v884.py v8.85_where_we_are_DRAFT/patch_v885.py \
  v8.86_event_portables_days_DRAFT/patch_v886.py v8.87_map_explorer_DRAFT/patch_v887.py v8.88_costs_transport_DRAFT/patch_v888.py \
  v8.89_master_map_DRAFT/patch_v889.py v8.93_maps_aligned_DRAFT/patch_v893.py v8.94_lighting_basis_DRAFT/patch_v894.py \
  v8.97_map_completion_DRAFT/patch_v897.py
python3 v8.97_map_completion_DRAFT/patch_explorer897.py <v8.93 machine_code_v887_v890_v893> <out>
```

v8.95 (the 7 Oct Baseplan export) is data-only on the contract lines and needs the encrypted workbook; it is not in the
mock-up build and does not touch the maps.

## Still to do (Phase 2, after Andrew's yes)

- Rebase `patch_explorer897.py` on v8.93's final explorer files once v8.93's README says complete; `prepared897.json`.
- Tests on laptop and phone: ticks only on complete results in the current search or category; tick = the page's verified
  completion for every result (WC31 included); no tick with Done off on unrelated categories and no duplicate with Done on; tap
  target unchanged; reduced motion; no errors; no writes. The explorer regressions (v8.87, v8.90).
- The machine-set plan: v8.87 + v8.90 + v8.93 + v8.97 in one registration.
