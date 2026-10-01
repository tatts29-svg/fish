# v7.75 — fresh after a save; the recovery ratios wait for the quotes (DRAFT — under review)

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
   every route is covered — the focus move, the pane emptied on leaving, and any other — and so is every held lookup, not
   only the two models.
2. Transport Recovery and Consumables Recovery read "not readable yet", with the reason, when the quotes do not split or
   are not approved — as Rehire Recovery already does.

No figure, rule or record changes.

## Build

```
bash toolchain/build.sh v7.75 v7.75_fresh_after_a_save_DRAFT/patch_v775.py
python3 toolchain/upload_page.py build/GC500_v7.75/GC500_Delivery_Control_hosted.html
```

## Results — `build/GC500_v7.75` on the live v7.76 (8,674,101 bytes, SHA-256 `449f9d0c…`), 19:23–19:28 AEST

**8,675,497 bytes, SHA-256 `b4f5b990aad9e60f6175ee402a8138b8659c6d4918ce035094fa4f0418bc3e08`**, check_page PASS.

| Check | Live v7.76 | v7.75 build |
|---|---|---|
| `evidence/fresh_after_save_tests.js` — a box commits during `go()`'s focus move, writes and saves; the rest of the draw must see it (list and both models); builds per tab change; the ratios with the quotes unapproved and not splitting | **5/9 — fails the four the patch fixes** (the save not seen; Transport Recovery ×4.62 unapproved) | **9/9 desktop · 9/9 phone** |
| Builds of the asset list per tab change, no save (every tab) | 1 each | 1 each — unchanged |
| Codex's v7.76 navigation regressions (`v7.76_…_LIVE/evidence/navigation_regressions.js`, on the build) | 21/21 | **21/21** |
| The released P&L suite (`v7.70_…_LIVE/evidence/practice_tests.js`) | 31/31 | **31/31 desktop · 31/31 phone** |
| Sweeps | — | **21 tabs, 7 deep links, 0 page errors, 0 console — desktop and phone** |
| Every tab's text against live v7.76 | — | identical but for the live weather and "last confirmed" times; no agent's name; no undefined or NaN |

Under review: an adversarial review of the patch (two lenses, a skeptic, a critic), then Codex's review of the same
frozen build — Andrew, 19:21: updates are published only when both have finished.
