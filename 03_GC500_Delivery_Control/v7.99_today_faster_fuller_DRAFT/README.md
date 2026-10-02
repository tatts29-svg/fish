# v7.99 — Today opens faster, and its cards fill their columns

Author: Andrew Fisher · 2 Oct 2026 · **DRAFT — review findings fixed, re-review in progress (Claude)**, not live. Built on live **v8.01** (`70ed0c49…`, uploaded by Codex after v7.96).

## Why

Codex handed these over when v7.96 went live (PR #1, 2 Oct): "By group 19.1% empty, expanded By branch 33.2%; combined Today/Equipment tab opening slower than separate live tabs. Please own these follow-ups in your Today/Equipment scope."

Andrew: "We have a lot of dead space", "Layout needs to be perfection now".

Nothing is redrawn and no figure changes. It is the same page, drawn with less work and packed tighter.

## What changes

**Today opens faster.**
- **The money figures are worked out once, not twice.**
  - Today's own cards asked for the money summary as "today". Where we are asked for it by today's date.
  - The memo filed these as two different days, so the whole money summary ran twice on every opening.
  - They now share one result. The summary only ever reads the day, so the figures are identical.
- **By branch and On site are drawn when they're opened.**
  - They sit folded on Today. Their plates are worked out the first time someone opens one, presses its jump button, or prints. Print opens every fold, so it draws them first.
  - The fold's line still says "4 branches and all of them together".

**The cards fill their columns.** This covers Today's work, By group and By branch.
- **Each card goes where the bottom edge comes out most even**, instead of strictly in page order. Cards keep their own size and look. The two-wide plates (Fencing, All branches together) stay two wide.
- **A card left alone at the bottom with an empty column beside it widens into that column.** In By branch, the MEAD plate now sits under "All branches together" across both its columns, instead of leaving a hole.
- **Phone:** one column, as before.
- **Paper:** prints as before. The placement is screen only.

**Jump buttons find their part when pressed.** A fold drawn as it opens is a new element on the page, so the buttons no longer hold the old one.

## Measured against live, the same machine, Codex's own tools

First against v7.96 (`dd16fa3b…`); then, after Codex uploaded v8.01, against v8.01 (`70ed0c49…`), on the final candidate. Today and Equipment are the same on both.

Speed uses `evidence/speed799.cjs`, Codex's `review796_speed.cjs`: six `go()` samples per tab, the median, one browser at a time, three paired runs.

| Open | Live v7.96 | v7.99 |
|---|---|---|
| Today | 346.6 / 322.5 / 313.1 ms | **257.1 / 271.7 / 267.9 ms** (about 17% faster on the median) |
| Equipment | 101.2 / 99.2 / 97.0 ms | 107.6 / 106.3 / 100.8 ms (Equipment code unchanged; within noise) |

Against live v8.01 on the final candidate `8a770bc0…`, three paired runs:
- **Today:** 334.2 / 583.1 / 367.7 ms on live, against **282.4 / 297.4 / 304.7 ms** on v7.99.
- **Equipment:** about the same on both.

The 583 ms live run is an outlier from a busy machine; even leaving it out, Today is about 16% faster. Earlier runs on the near-final build gave 247–263 ms against 339–373 ms on live. Timings on this machine swing by ±30 ms between runs, so read the medians, not one number.

Today is still slower than the old Today alone was before Where we are joined it. It now draws both in one go, with less work than live.

Empty card area uses `evidence/layout799.cjs`, Codex's `review796_layout.cjs`, at 1,440 px. The figures are the same against v7.96 and v8.01.

| Section | Live v7.96 | v7.99 |
|---|---|---|
| By group | 18.0%, 1,214 px | **11.3%, 1,122 px** |
| By branch (opened) | 28.7%, 996 px | **15.5%, 892 px** |
| Today's work | 10.8% | 10.8% |
| Money (opened) | 11.4% | 11.4% |
| All of Today, folds open | 15.9%, 5,551 px | **10.5%, 5,355 px** |
| All of Today, folds closed | 11.8%, 3,906 px | **8.7%, 3,814 px** |

By branch is just over the 15% target. Its five plates have very different heights, and the remaining space is under the shorter branch plates. Nothing more can move without changing what is in them.

Codex measured 19.1% and 33.2% on its own machine. Fonts differ slightly between machines, so the comparison above is like for like on one.

## Build

```
bash toolchain/build.sh v7.99 v7.99_today_faster_fuller_DRAFT/patch_v799.py
```

- Base: live **v8.01** `70ed0c49213a910ae33dd062ecd3ada5f1752a69b0c1665c19c6bb25bcea1f11` (8,950,159 bytes).
- Candidate: **8,959,606 bytes, SHA-256 `8a770bc06a3ff127ee65f1a3c52fd4738d1d8b661d03d38259f5376ceded86a5`**.
- `check_page` passes. The patch refuses a second run and a page without v7.96.
- One patch, no dependence on Codex's v8.0x code, so it rebuilds on whatever goes live last.

## Checks on the candidate (all read-only)

`evidence/run_all.sh` runs every check below.

| Suite | Result |
|---|---|
| `v799_tests.js` (this release) | **23/23 desktop, 18/18 phone** |
| Every money tab word for word against live: Today (folds open), Costs, Fencing, Questions, Coates Way, Running sheet, Equipment (`same_figures.js`) | **every line matches** |
| v7.95 packed | 20/20 desktop, 14/14 phone |
| v7.96 Equipment (Codex's live copy of the test) | 22/22 desktop, 22/22 phone |
| v7.96 results (Codex's arrival and hydration test) | 9/9 desktop, 9/9 phone |
| v7.93 one tab | 22/24 each: the same two misses as live v7.96 (they look for headings v7.95 folds) |
| v7.76 navigation | 21/21 |
| v7.84 rules (BASE = live) | 45/45 |
| v7.75 fresh-after-save | 11/11 |
| Sweeps, 21 tabs | 0 page errors, 0 console errors, desktop and phone |
| Repeat checker | 156, the same as live: nothing added, nothing hidden from it |

What `v799_tests.js` covers:
- one money summary per opening;
- both folds wait, and their lines still count;
- opening each draws it word for word as a full draw, and it stays drawn through a record redraw;
- every fold opened at the same moment stays open, and all draw;
- print draws both in full and opens every fold, then closes them after;
- every jump button lands its part;
- the cards are placed and the two-wide plates stay two wide;
- no overlap and nothing outside its box at 1,440, 1,280 and 1,000 px;
- phone: one column, nothing placed, no sideways scroll;
- widening is decided afresh after the window changes;
- a print from Equipment leaves its list and Today alone;
- opening a fold by its own line keeps it in the same place on screen, with the focus kept;
- **paper has as many pages as live**, measured from real Chromium PDFs:

  | | Ctrl+P on Today | A4 report |
  |---|---|---|
  | Live | 15 pages | 8 pages |
  | v7.99 | 15 pages | 8 pages |
- the date control replays the day with the folds still waiting;
- no page errors.

## Found and fixed while building

1. The two-wide cards were read as one wide (`grid-column: span 2` is a span on the *start*). Caught on the screenshots before any number was reported.
2. In a narrower window the old column positions added columns of their own. Positions are now cleared before the columns are counted.
3. Jump buttons held the fold they were made with. They now find it by name when pressed.
4. Folds opened in the same moment could come back closed. The page's own open folds are now read just before the redraw.

## Pictures

Desktop By group and By branch, and phone By branch closed and opened, were looked at. They stay out of the repo because Today shows "Who to call" phone numbers.

## Independent review (a separate agent, 2 Oct 2026)

It confirmed three things and found six problems. All six are fixed or answered below.

**Confirmed:**
- The money summary only ever reads the day, so the shared result is safe.
- The fold line's branch count uses the same condition as the plates.
- Jump buttons find their part.

**Findings:**

1. **Blocker: printing.** The card places were inline styles that paper kept, so the A4 report went from 5 to 13 pages and Ctrl+P from 15 to 30, with blank pages and a squeezed plate.
   - *Fixed:* places are now variables applied only by a screen rule at 900 px and wider. Paper never sees them.
   - *Tested:* page counts equal live, from real PDFs.
2. **Blocker: printing from another tab.** The print hook redrew the hidden Where we are pane from any tab. That reset the list Equipment's "branch on every listed asset" button reads, so on some days that button could write to the wrong references.
   - *Fixed:* the hook only acts on Today, with Where we are inside it.
   - *Tested:* a print from Equipment leaves the list unchanged.
3. **Should fix: opening a fold.** Opening a fold by its own line made the page jump about 560 px and lost keyboard focus.
   - *Fixed:* the redrawn fold is held at the same place on screen while the cards measure, and gets the focus back. A jump button still takes its part to the top.
   - *Tested:* 525 px before and after, focus kept, on desktop. Phone gives the same place.
4. **Nit: widening stuck.** A widened card stayed wide at every width.
   - *Fixed:* widening is decided afresh when the column count changes.
5. **Nit: reading order.** On screen, cards now sit where they fit best, so the reading and Tab order (the page's own order, unchanged) can differ from the visual order more than v7.95's packing did.
   - *Answered:* by design. Andrew asked for no dead space; nothing moves in the page's order, only on screen.
6. **Nit: the search's limit.** The placement search stops at 30,000 steps, so it gives the most even arrangement it finds within that limit, not always the best possible. The worst case measured was about 15 ms.
   - *Changed:* when nothing has changed (columns, heights, widths), the last arrangement is reused without searching.

The reviewer also noted that the tests didn't cover print layout, printing from another tab, scroll and focus, or resizing after widening. All four are tested now.

**Re-review of the fixes: in progress.** This is not marked READY until it reports.
