# v7.99 — Today opens faster, and its cards fill their columns

Author: Andrew Fisher · 2 Oct 2026 · **DRAFT, under independent review (Claude)**, not live. Built on live v7.96.

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

## Measured against live v7.96 (`dd16fa3b…`), the same machine, Codex's own tools

Speed uses `evidence/speed799.cjs`, Codex's `review796_speed.cjs`: six `go()` samples per tab, the median, one browser at a time, three paired runs.

| Open | Live v7.96 | v7.99 |
|---|---|---|
| Today | 346.6 / 322.5 / 313.1 ms | **257.1 / 271.7 / 267.9 ms** (about 17% faster on the median) |
| Equipment | 101.2 / 99.2 / 97.0 ms | 107.6 / 106.3 / 100.8 ms (Equipment code unchanged; within noise) |

Earlier runs on the near-final build gave 247–263 ms against 339–373 ms on live. Timings on this machine swing by ±30 ms between runs, so read the medians, not one number.

Today is still slower than the old Today alone was before Where we are joined it. It now draws both in one go, with less work than live.

Empty card area uses `evidence/layout799.cjs`, Codex's `review796_layout.cjs`, at 1,440 px.

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

- Base: live v7.96 `dd16fa3b…` (8,907,669 bytes).
- Candidate: **8,914,500 bytes, SHA-256 `8596da6e0319c000188c11c62a12536f638bf08d26a40f2103daa53548d8039c`**.
- `check_page` passes. The patch refuses a second run and a page without v7.96.

## Checks on the candidate (all read-only)

`evidence/run_all.sh` runs every check below.

| Suite | Result |
|---|---|
| `v799_tests.js` (this release) | **18/18 desktop, 15/15 phone** |
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
- the date control replays the day with the folds still waiting;
- no page errors.

## Found and fixed while building

1. The two-wide cards were read as one wide (`grid-column: span 2` is a span on the *start*). Caught on the screenshots before any number was reported.
2. In a narrower window the old column positions added columns of their own. Positions are now cleared before the columns are counted.
3. Jump buttons held the fold they were made with. They now find it by name when pressed.
4. Folds opened in the same moment could come back closed. The page's own open folds are now read just before the redraw.

## Pictures

Desktop By group and By branch, and phone By branch closed and opened, were looked at. They stay out of the repo because Today shows "Who to call" phone numbers.

## Review

Claude implemented and tested this. An independent review by a separate agent is in progress; its findings and answers go here before this is marked READY.
