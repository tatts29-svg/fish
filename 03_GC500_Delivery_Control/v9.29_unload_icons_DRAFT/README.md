# v9.29 Unload-order icons in Arrange loads

Author: Andrew Fisher

**State: READY TO UPLOAD**, 9 Oct 2026 about 05:20 AEST. Built by Claude. Not live. Claude has no upload key, so Codex publishes.

| | |
|---|---|
| **Base (live v9.28)** | `592e73b38e8c5fb1d5bf98d00915c49550ab860b322f82fb957a99acc0369093` |
| **Candidate** | `2fa3fa3fcc9601979b393229376a038050568fb0243797d43a5c0f4b53a60556`, 12,273,073 bytes, footer ` · v9.29` |
| **Build** | `toolchain/build.sh v9.29 v9.29_unload_icons_DRAFT/patch_v929_unload_icons.py` |

## What Andrew asked

"icons for unload order". He said it to Claude in chat at about 04:50 AEST on 9 Oct 2026, right after the Arrange loads and shapes work went live in v9.28.

## What it does

Each row in Arrange loads' arrival order now shows a small icon for every item coming off that truck. The count sits beside it when there is more than one, for example `[FWF] ×4  [pee panel] ×6`.

**Unload order:**
- **Stops** follow the load's own order, separated by `›`. For example, 14 Sep load 8 reads `[toilet trailer] ×2 › [FWF] ×2 › [FWF] ×4 › [FWF] ×6`.
- **At one stop**, a waste tank comes off before the toilet block or toilet that sits on it. The tank uses the block's shape, greyed and labelled **TANK**, as Andrew asked on 8 Oct ("same shape as the toilet block greyed. Clearly to say waste tank"). Everything else keeps the schedule's order.

**What the icons cover:** toilet (FWF), accessible toilet, pee panel, toilet block (6 m and 16-pan), waste tank, toilet trailer, generator, lighting tower, VMS board, forklift, trakmat, container, portable building, water-filled barrier, distribution board, fridge, chair, and equipment for anything else. Water-filled barriers are yellow and white, as on the master. `evidence/icon_legend.png` shows them all.

**Where the items come from:**
- The rows read the same `dpItems` the load card and run sheet already use, so nothing is counted twice or differently.
- Kinds come from the v9.26 `Shapes926.kind`, so the icons agree with the shapes panel.
- When a row has no schedule item, the reference's discipline decides the icon, with no count. A count that isn't a plain number is never guessed.

**Unchanged:**
- no record writes;
- no money;
- the arrival order and its ↑ / ↓ buttons;
- the door-side choice;
- the map, its badges and the shapes panel;
- the printed sheets.

If anything fails, the row draws exactly as before.

## Checks (all on the exact candidate above)

- **`toolchain/check_page.py`**: PASS (37 inline scripts parse, no keys, author line present).
- **`node tests/test_unload929.cjs <candidate>`**: 13/13 pure checks. They cover:
  - the patch going in once and the footer;
  - every kind from the real schedule words;
  - the discipline fallback;
  - tank before block, and stops in order;
  - counts adding up, with an unreadable count never guessed;
  - a split reference shown as one stop;
  - escaping;
  - failure leaving the row untouched;
  - removals never drawn;
  - every kind has an icon;
  - no setter or network calls.
- **`node tests/test_unload_actual929.cjs <candidate> <live> <out>`**: real page, live record, GET only, 1440 px and 390 px. Results in `evidence/results.json`.
  - **Coverage:** all 31 delivery days and 172 rows, with exactly one strip per row (188 items, 4 waste tanks).
  - **Stops:** each strip's stops equal the load's references in order. Every scheduled item is named in the strip's spoken label.
  - **Tanks:** every tank comes before its block and is labelled.
  - **Unchanged rows:** apart from the icons, every row is byte-identical to live v9.28.
  - **Tapping an icon** still selects the load.
  - **Clean run:** no sideways overflow, 0 page errors, 0 writes attempted.
- **Both sweeps** (`evidence/sweeps.json`): 21 tabs, 0 page errors, 0 blocked writes, laptop and phone.
  - **Console noise:** 72 (laptop) and 76 (phone) console 404s for the Map explorer's vector-tile files `/w/Coates-GC500-2026/explorer/assets/vt/L*.bin`.
  - **Not this change:** live v9.28 shows the same on the same sweep (78, 0 page errors). Raised for Codex separately.
- **Speed:** building the icons for the busiest day (19 Oct, 30 loads) takes about 15–20 ms, almost all of it the page's own `programmeDays()`, the same call the v9.26 shapes panel makes. It runs once per list build, never per map frame.
- **Screenshots looked at:**
  - laptop 14 Sep and 9 Oct;
  - phone 9 Oct, with WC05 showing TANK then block;
  - the icon legend.

## Files

- `patch_v929_unload_icons.py`: the patch. It refuses to run twice and refuses a base without v9.26 shapes.
- `unload929_src.js` and `unload929.css`: the source.
- `tests/`: the two tests above.
- `evidence/`: results, sweeps and screenshots.
