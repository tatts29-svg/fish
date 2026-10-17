# Costs navigation correction — draft

Author: Andrew Fisher

The Costs presentation wrapper scheduled an unconditional next-frame scroll to the position read before rendering. On arrival from a different tab, that value belongs to the previous tab. It could override the new tab's saved reading position, or scroll a different tab after the person had already navigated away.

`patch_costs_scroll1065.py` changes only that wrapper. It leaves tab arrivals to the existing navigation code. For a same-tab refresh, it restores the reading position only if the tab, address, pane, render generation and user interaction intent still match. The original rendering and presentation calls are unchanged.

Validation: `test_costs_scroll1065.cjs` passes 16 deterministic scenarios against the actual original and transformed wrapper, including reproduction of the original issue, same-tab restoration, later input/navigation winning, same-event form jumps, stale renders, native call semantics and strict transformer guards. `audit_costs_scroll.cjs` separately demonstrates three original failure paths. The native desktop browser reproduced a delayed Costs refresh moving Demob from 0 to 600 px, and overriding a later user scroll from 900 back to 600 px. The ordinary first Costs arrival stayed at its correct position in that browser run. `browser_costs_scroll1065.cjs` performs the corresponding read-only browser checks; final candidate results belong in the release evidence once run.

```sh
PYTHONDONTWRITEBYTECODE=1 node test_costs_scroll1065.cjs /private/path/to/original.html
python3 patch_costs_scroll1065.py /private/path/to/original.html /private/path/to/candidate.html
node browser_costs_scroll1065.cjs /private/path/to/original.html /private/path/to/candidate.html
```

No operational records, financial calculations, shared navigation functions or persistence observers are changed. Not published by this task.
