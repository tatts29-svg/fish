# v7.75 — fresh after a save; the recovery ratios wait for the quotes (LIVE within v7.75 + v7.77, 1 Oct 2026 ~20:42 AEST)

Author: Andrew Fisher · 1 Oct 2026, 19:30 AEST · one patch on the live v7.76

## Why

**A save inside the v7.76 navigation hold was not seen by the rest of that draw.** Claude's cross-check of v7.76
(three review lenses, each finding verified against the code; PR #1, 19:22) found it, and a browser test reproduces it on
the live page (`evidence/regress/finding_on_live_v776.log`). v7.76 builds one asset list and one result per model for the
whole of a tab change, so a tab change builds them once. But after it draws, `go()` moves the focus to the new pane, and
moving the focus commits a box still being typed in on the old pane: its handler writes the record, `save()`s and redraws
— inside the hold, so that redraw read the asset list and the forecast and Rehire models from before the write. The
record was right; the screen was stale until the next draw, and Costs to job end could disagree with the Forecast P&L
above it. Example: an editor types 3 in a quantity box and presses the browser's Back; the record says 3, Plant still
showed 2.

**Two recovery ratios divided by the wrong cost when the Event Portables quotes do not split.** Transport Recovery and
Consumables Recovery read the quotes' split (Toilet Pumpout Costs and Consumables). If the quotes ever fail to split to
the cent, or are not approved, those costs are not on their own lines, and the live page would show Transport Recovery
×4.62. Today the quotes split and are approved, so nothing changes on the page.

## What it changes

1. `save()` marks an active hold stale; the next read in it (`allAssets`, `heldMemo`, a nested `holdAssets`) rebuilds the
   list and empties the memo once. A draw with no save builds exactly as v7.76 does. Every edit path reaches `save()`, so
   every route is covered — the focus move, the pane emptied on leaving (the v7.76 review's critic: ending the hold at
   `render()` would miss this one, since the Plant and Edit panes are emptied before it), and any other — and so is every
   held lookup, not only the two models.
2. Transport Recovery and Consumables Recovery read "not readable yet", with the reason, when the quotes do not split or
   are not approved — as Rehire Recovery already does.

No figure, rule or record changes.

## Build

```
bash toolchain/build.sh v7.75 v7.75_fresh_after_a_save_LIVE/patch_v775.py
python3 toolchain/upload_page.py build/GC500_v7.75/GC500_Delivery_Control_hosted.html
```

## Review — before the build was frozen

- **Codex's review of the first candidate (b4f5b990, withdrawn), 19:43:** the original `save()` redraws the tab bar
  itself before it returns, and the wrapper marked the hold stale only after it, so on an editing link the tab bar read
  the pre-edit list. Fixed: the hold is marked stale **before** the save as well as after (the edit is already on the
  record when `save()` is called). Test **A6** opens the editor path for the check only (`SYNC.readonly` off; the
  shared-record push, folder write and browser storage stubbed; all put back) and fails on b4f5b990, passes now.
- **Claude's adversarial review (two lenses, a skeptic, a critic):** the save lens found the same tab-bar path, and
  that the stale list was rebuilt before the memo was emptied, so the rebuilt list's own rental lookups could come from
  before the save. No figure can be wrong today (the given references those lookups read change only in click
  handlers, never inside a hold), but it is reordered: the memo is emptied first. The ratios-and-tests lens raised five
  nits, all refuted on verification.
- **The v7.76 review's critic** confirmed that ending the hold at `render()` would miss the pane-emptying route, which
  test **A5** covers with real keystrokes on the 15,095-element Plant pane.

## Results — `build/GC500_v7.75` on the live v7.76 (8,674,101 bytes, SHA-256 `449f9d0c…`), 19:49–19:54 AEST

**8,675,862 bytes, SHA-256 `0154be31194e3553d366132a99a68effd166ceee455f7fc5217e60e59a4de9c8`**, check_page PASS.

| Check | Live v7.76 | First candidate b4f5b990 (withdrawn) | v7.75 build |
|---|---|---|---|
| `evidence/fresh_after_save_tests.js` (11): A1–A4 the save during `go()`'s focus move is seen by the rest of the draw (list and both models); A5 the second route, a box typed with real keystrokes as the Plant pane is emptied inside the hold; A6 the editor path, the tab bar `save()` redraws reads the edit; B1 builds per tab change; C1–C4 the ratios today, unapproved, not splitting, put back | **5/11** | 10/11 (fails A6) | **11/11 desktop · 11/11 phone** |
| Builds of the asset list per tab change, no save (every tab) | 1 each | 1 each | 1 each — unchanged |
| Codex's v7.76 navigation regressions (on the build) | 21/21 | 21/21 | **21/21** |
| The released P&L suite | 31/31 | 31/31 | **31/31 desktop · 31/31 phone** |
| Sweeps | — | 0/0 | **21 tabs, 7 deep links, 0 page errors, 0 console — desktop and phone** |
| Every tab's text against live v7.76 | — | — | identical but for the live weather and "last confirmed" times; no agent's name; no undefined or NaN |

Claude's review: complete on this build — the critic, on 0154be31: **ready**; no path where v7.75 is worse than v7.76
(a draw with no save builds once; a save inside a hold builds again so `save()`'s own tab bar and the `render()` after it
both see the edit; the view-only link's refused saves touch nothing the list or the models read).

**Found by the critic, not caused by v7.75 — a separate follow-up, not in this build:** after a paid fence rate is typed
on the Fencing tab (`data-fck`), the handler saves and calls `renderFencing()`, which does not run `renderPass`, so
`RENDER_MEMO` is not cleared and the "Paid to Advanced, by P&L line" card (from `fencePaidSplit`) keeps the old figure
while the KPI above it shows the new one, until the next tab change or full redraw. Proposed: a save also clears
`RENDER_MEMO`. The same on v7.76 and v7.74.

**Codex's sign-off, 20:00:** rebuilt exactly to 8,675,862 bytes, SHA-256 `0154be31…`; independent source review; 11/11
desktop and phone; 21/21 navigation regressions; his own editor-save reproduction now `tabsSeen:[true]`, zero page
errors, zero writes — "the stale-tab blocker is resolved".

**READY TO UPLOAD (20:01)** — both reviews complete on the same frozen build (Andrew, 19:21: published only when both
have finished):
```
bash toolchain/build.sh v7.75 v7.75_fresh_after_a_save_LIVE/patch_v775.py
python3 toolchain/upload_page.py build/GC500_v7.75/GC500_Delivery_Control_hosted.html
```

**LIVE** within the v7.75 + v7.77 release (page `35e4b00b…`, uploaded by Codex with server v5.86). Claude fetched it fresh at 21:53 AEST on 1 Oct 2026, byte for byte, with `heldFresh775` present. The Fencing follow-up named above went live as v7.80 (`../v7.80_fencing_card_fresh_LIVE/`).
