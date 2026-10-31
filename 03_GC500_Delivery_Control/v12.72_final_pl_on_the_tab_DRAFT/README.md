# v12.72 — the final P&L on the P&L tab (DRAFT)

Author: Andrew Fisher. Andrew, 1 Nov 2026 (this chat): "make sure all the new P&L data this Becomes the new P&L in the GC500
p&L Tab we need thi Accurate to the Cent please".

Built 1 Nov 2026 on the live v12.69 (`038bd277625bf5e3be5a47edaf7c2deb2eab34ffdec098bf4b2270870d6cbabb`), with v12.71's P&L
fixes under it (`../v12.71_pl_audit_fixes_DRAFT/patch_v1271.py`: the print path, cents in the small print, the management view
and the bridge, the estimate cue; Codex verified its third candidate).

Candidate: **`f3d686a3929c945e4a6b181eea2e6976425ccecd7205bd8589ca2826962ec49b`**, 16,587,637 bytes.

Build command:

```
PLF_JSON=<pack dir>/GC500_PL_final.json toolchain/build.sh v12.72 v12.71_pl_audit_fixes_DRAFT/patch_v1271.py v12.72_final_pl_on_the_tab_DRAFT/patch_v1272.py
```

## What changes on the Costs & P&L tab

- **The tab leads with the final P&L**, pack v1.10, record 12715, as at 31 Oct 2026, AUD ex GST:
  - four tiles: charged to the V8s, what it costs us, the difference, to accrue at 31 Oct;
  - by branch: invoiced, November forecast, revenue, costs, difference;
  - costs by supplier and month of work, with what to accrue;
  - four folds: every cost line (PO, invoice or receipt, basis), costs by branch line by line, the journals at 31 Oct, the open
    items.
- **Every figure is the pack's own**: the pack's data file (`GC500_PL_final.json`, written by
  `../review_31Oct2026_october_month_end/build_monthend.py`, checked against the pack's workbook to the cent by
  `audit_pack.py`, 247/247). The file is private and is never committed; this patch holds no figure. The build refuses any file
  but the reviewed one (SHA-256 pinned in `patch_v1272.py`) and checks that it foots.
- **The live model the tab carried before** (worked from the record as it stands) folds under the final P&L as one closed fold,
  named the working figures: every card, figure and button kept. The Finance, Fencing and Workings folds follow as before.
- **Print:** the final P&L has its own Print (the tab's print, A4 landscape). On paper the final P&L prints in full, its folds
  open; the live model stays on the screen.
- **Footer:** v12.71 → v12.72.

Nothing is typed; nothing is written to the record.

## Checks on the candidate (live record 12715)

| Check | Result |
|---|---|
| `toolchain/check_page.py` (build) | PASS: every inline script parses, no keys, author line present |
| `tests/test_v1272.cjs` desktop | 27/27: every figure on the tab equals the pack's data to the cent (tiles, branches, suppliers, all 30 lines, each branch's lines, journals and moves, the 13 open items); the data in the page is the reviewed file; layout order; live model folded and still working; Print bound; no console error; no write |
| `tests/test_v1272.cjs` phone | 27/27: the same, tiles stacked, nothing off the side of the page |
| `tests/print_v1272.cjs` | 11/11: Print reaches the browser's print with the flag and the folds open; 7 pages A4 landscape; every figure and every open item on the paper; none of the live model; no refusal page; the twin-steer rule on every page; tidies after |
| `toolchain/harness/sweep.js` desktop and phone | every tab and deep link, Back, 0 errors, 0 console, 0 writes |

Screenshots and the printed PDF carry the figures, so they are kept privately with Andrew, not committed.

## State

Built and tested; upload on Andrew's word (given above). Codex is asked to verify after.
