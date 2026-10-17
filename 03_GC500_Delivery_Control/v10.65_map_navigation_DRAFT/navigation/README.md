# Costs navigation correction — draft

Author: Andrew Fisher

The Costs presentation wrapper scheduled an unconditional next-frame scroll to the position read before rendering. On arrival from a different tab, that value belongs to the previous tab. It could override the new tab's saved reading position, or scroll a different tab after the person had already navigated away.

`patch_costs_scroll1065.py` changes only that wrapper. It leaves tab arrivals to the existing navigation code. For a same-tab refresh, it restores the reading position only if the tab, address, pane, render generation and user interaction intent still match. A scroll change after rendering also cancels restoration, so a form's explicit `scrollIntoView` or continued scrolling wins. The original rendering and presentation calls are unchanged.

Validation: `test_costs_scroll1065.cjs` passes 16 deterministic scenarios against the actual original and transformed wrapper, including reproduction of the original issue, same-tab restoration, later input/navigation winning, same-event form jumps, stale renders, native call semantics and strict transformer guards. `audit_costs_scroll.cjs` separately demonstrates three original failure paths. The native desktop browser reproduced a delayed Costs refresh moving Demob from 0 to 600 px, and overriding a later user scroll from 900 back to 600 px. The ordinary first Costs arrival stayed at its correct position in that browser run. `browser_costs_scroll1065.cjs` performs the corresponding read-only browser checks; final candidate results belong in the release evidence once run.

Integrated candidate desktop (1440 × 900) and phone (390 × 844, DPR 2) results: 5/5 browser assertions pass on each (arrival, navigation away, same-tab refresh, later user input and a same-event scroll change), with no page errors or attempted record writes. The private phone screenshot was visually reviewed; the Costs content remained readable at the intentionally preserved scroll position. Screenshot: `/dev/shm/gc500-map-private-18oct/costs-phone1065.png` (private evidence; not committed).

```sh
PYTHONDONTWRITEBYTECODE=1 node test_costs_scroll1065.cjs /private/path/to/original.html
python3 patch_costs_scroll1065.py /private/path/to/original.html /private/path/to/candidate.html
node browser_costs_scroll1065.cjs /private/path/to/original.html /private/path/to/candidate.html
# After publication only: fetch the actual public page; do not supply local HTML paths.
LIVE=1 node browser_costs_scroll1065.cjs
LIVE=1 MOB=1 node browser_costs_scroll1065.cjs
```

`LIVE=1` uses the shared read-only harness with no local page override, requires the patch marker in the served scripts, and runs the same five assertions. The live mode has been prepared but has not been run by this task.

No operational records, financial calculations, shared navigation functions or persistence observers are changed. Not published by this task.
