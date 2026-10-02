# v7.95 — Today packed, with jump buttons and folding sections

Author: Andrew Fisher · 2 Oct 2026 · **READY TO UPLOAD** (Claude), not live. This release carries v7.91 and v7.93 with it.

## What Andrew asked for

- On the one-tab Today (v7.93) and the first design ideas: "We have a lot of dead space in all of them try again".
- He was then shown the packed layouts, with the empty space measured, and said "Ok" to Packed + folds.

## What changes (screen only; paper prints as before; every component is the page's own, nothing redrawn)

**Programme card in one band** (1,100 px and wider).
- The day and its bar, the next milestone and the key dates sit side by side.
- The card is about 260 px tall, down from 704 px.

**Cards packed like bricks** (900 px and wider).
- Applies to Today's work, By group and By branch.
- Each card is laid out at its natural height and the cards fill the gaps under each other, instead of every card stretching to the tallest in its row.
- Card heights come from the browser's own `ResizeObserver` report, so a card re-packs when its More info opens, a fold opens or the window changes size.

**Folding sections.**
- By branch, Money and On site each fold to one line, using the page's own words, and open with a press.
- By group and the trade-by-trade detail stay as they were.
- A fold someone opens stays open through the record's redraws and the date control.
- Print opens every fold for the paper, then closes them again.

**Jump buttons under the Today heading.**
- Today, Today's work, By group, By branch, Money, On site, Trade by trade.
- A button opens its fold on the way, and holds the part at the top while the packing settles. A person scrolling, touching the page or pressing a key takes over at once.

**Phone.** One column as before (it was only 3% empty). The folds and jump buttons apply there too.

## Empty space, measured (laptop 1,440 px)

| | v7.93 | v7.95 |
|---|---|---|
| Empty card area | 27% | **13%** with the folds closed |
| Page length | 6,693 px | **4,171 px** |

Section by section in v7.95:
- Instruments: 4%
- Today's work: 15% (was 41%)
- By group: 18% (was 28%)
- By branch: 29% when open (was 42%)
- Money: 11% when open

## Build

```
bash toolchain/build.sh v7.95 v7.91_today_tidy_full_width_DRAFT/patch_v791.py v7.93_one_tab_today_DRAFT/patch_v793.py v7.95_today_packed_DRAFT/patch_v795.py
```

- Base: live v7.92 `476f0dcc…`.
- Candidate: **8,898,905 bytes, SHA-256 `a24644fa0c3611324eb6250797746a3266cf7f6cc8a1ce6d52dad2ee78a202a6`** (rebuilt 2 Oct 2026 with Today's Fencing card kept: Andrew, "why isnt the info of fencing in today". The earlier `90bfc093…` is superseded; do not upload it).
- `check_page` passes.
- The patch refuses a second run, and refuses a page without v7.93.

## Checks on the final candidate (all read-only; every write aborted)

**`evidence/packed_tests.js`: 20/20 desktop, 14/14 phone** (rerun on the rebuilt candidate: same). It covers:
- Folds: which sections fold, and a fold's line carries words, not figures.
- Jump buttons: seven buttons, each lands its part and opens its fold.
- Packing:
  - no two cards overlap, including with every fold open, after a card's More info opens, and at a 1,000 px window;
  - the programme card sits in one band.
- State: folds stay open through a redraw and through the date control.
- Print: opens every fold; the paper shows By branch, Money and On site with their headings and nothing packed; the folds close again after.
- Navigation and errors: a round trip through tabs comes back right, and there are no page errors.

**Regression suites:**

| Suite | Result |
|---|---|
| Sweeps (21 tabs / 7 links) | 0 page errors, 0 console errors, desktop and phone |
| v7.76 navigation | 21/21 |
| v7.84 rules | 45/45 |
| v7.75 fresh-after-save | 11/11 |

**v7.93's `one_tab_tests.js` on v7.95: 22/24, as intended.**
- The 2 misses look for the By branch and Money headings in the open, and v7.95 folds those away by design.
- Under heavy machine load (five browsers at once), "Open the summary" also landed short once. Run on its own it passes.

**Speed** (open Today, median of 6, headless desktop): 312 ms on v7.95, against 357 ms on v7.93 in the same run.

**Editing link:** Your records and "Recording as" still show.

Screenshots stay out of the repo because "Who to call" shows phone numbers.

## Implementation and review

Claude implemented and tested this. Codex has not reviewed it. Upload with `toolchain/upload_page.py`. If the live page changes first, rebuild with the command above and rerun the checks. Uploading v7.95 makes v7.93 and v7.91 uploads unnecessary.
