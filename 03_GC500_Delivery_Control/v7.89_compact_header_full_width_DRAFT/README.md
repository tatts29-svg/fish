# v7.89: compact header and full-width tabs (READY TO UPLOAD)

Author: Andrew Fisher · 2 Oct 2026. One patch on the live v7.87 (`d592847a…`):

```
bash toolchain/build.sh v7.89 v7.89_compact_header_full_width_DRAFT/patch_v789.py
```

That build gives **8,861,306 bytes, SHA-256 `0d165f5f8829f0b4bdc4403d945ebfb09ef668cfbc7a09e0c139e40ba23634ac`**.
- The scrub changes nothing.
- `check_page` passes.

v7.88 is Codex's Showcase full lap. This version does not touch it.

## What Andrew asked (2 Oct 2026)

He sent screenshots of the desktop and wrote:
- "you and codex please fix asap"
- "it like this everywhere"
- "even this" (the header)
- "let's fix this first"
- "should we not be using the full page"
- "should these not all be the same size" (the clock, race-day and record pods)

## What it changes (desktop only)

The phone bar is not touched.

| | Before (live v7.87) | After |
|---|---|---|
| Header on a laptop (1333 × 693) | 273 px, **39%** of the window | 185 px, **27%**; once scrolled, 105 px, **15%** |
| Header on a wide screen (1920 × 1040) | 273 px, 26% | 185 px, 18%; once scrolled, 105 px, 10% |
| The three pods | 509 / 236 / 531 px (laptop) | **202 / 202 / 202 px** (half the header, three equal ways; 300 each on a 1,920 screen) |
| The tab under the header (1920 wide) | 1,500 px, centred | **1,888 px**: the full window less 16 px each side |

- **One row:** the lockup, the search, and the three equal pods (half the header width: Andrew, "make sure these get half the page"). Below 1,280 px wide, the pods take their own row, still equal (341 px each at 1,100 px wide).
- **Slim when scrolled:** once the page under the header scrolls past 90 px, the pods fold away and the company line hides. Only the GC500 mark, the search and the tabs stay. The full header returns within 12 px of the top. The hysteresis means it never flickers.

## Checks on 0d165f5f

All read-only: GETs only, and the harness aborts any write.

| Check | Result |
|---|---|
| `evidence/header_shots.js` at four sizes (laptop, wide, 1,100 px, phone), before and after | As in the table above. The phone is unchanged (255 px). No sideways scroll, no page errors |
| 21-tab / 7-link sweeps | Desktop and phone both clean: 0 errors, 0 console errors |
| v7.76 navigation regressions | 21/21 |
| v7.75 fresh after a save | Desktop 11/11 |

The pictures are in `evidence/` (`before_*` and `after_*`, `_top` and `_scrolled`).

## Not in this version

The phone header is still 255 px (30% of an iPhone screen). That is a separate job if Andrew wants it.
