# v12.73 — labour charged by branch on the P&L tab; the tab on pack v1.12 (DRAFT)

Author: Andrew Fisher. Andrew, 1 Nov 2026 (this chat): "We Also Need to Understand How Much Labour We charged Each MEAD and NVAC and
KINP and STPS if Any so when we Journal Peoples cost into INSTALL we have a figure we know we are up against". Asked whether to put
the table on the P&L tab, he said "yes to 5".

Built on the live v12.72 (`f3d686a3929c945e4a6b181eea2e6976425ccecd7205bd8589ca2826962ec49b`, BASE pinned).

Candidate: **`84a1b3cdd9983464394b7d0e67ee4915e7f1dc07d987e3b5449d734c4f312a50`**, 16,596,299 bytes.

```
PLF_JSON=<pack dir>/GC500_PL_final.json toolchain/build.sh v12.73 v12.73_labour_charged_on_the_tab_DRAFT/patch_v1273.py
```

## What changes on the Costs & P&L tab

- **The final P&L block is replaced with pack v1.12's data.** It is pinned by SHA-256, and the patch holds no figure. The ids
  are kept, so the tab's own face still finds it.
- **Under By branch, a new table: labour we charged the V8s, by branch.** It covers every line the 18 invoices code LABOUR,
  with:
  - the labour hire already in Installs;
  - what is left for people's cost;
  - its notes (Advanced's installation on STPS; MEAD's operator line; the lines not coded labour; part hours).
- **A new fold, "Every labour line on the invoices":** invoice, contract line, hours or units, rate and amount for each line,
  and the total.
- **The rest of v12.72 stays as it is:** tiles, by branch, suppliers, every cost line, journals and open items, now on v1.12.
  Since v1.10 that means:
  - Alfie's 12–15 Oct nights are off;
  - the Event Portables units at excluded references are no longer mentioned;
  - Job Connect is named as supplier HIG025;
  - PO 4658653 is named.
- **Footer:** v12.72 → v12.73.

Nothing is typed; nothing is written to the record.

## Checks on the candidate (live record 12727)

| Check | Result |
|---|---|
| `toolchain/check_page.py` (build) | PASS |
| `tests/test_v1273.cjs` desktop | 30/30: v12.72's checks on v1.12's data, plus labour charged by branch, already in Installs and left (to the cent), every labour line and the notes word for word |
| `tests/test_v1273.cjs` phone | 30/30 |
| `tests/print_v1273.cjs` | 13/13: 9 pages A4 landscape, every figure (labour included) and every note on the paper |
| `toolchain/harness/sweep.js` desktop | 27 tabs, 0 errors, 0 console, 0 writes |
| `toolchain/harness/sweep.js` phone | running |

## State

Built and tested; upload on Andrew's word ("yes to 5"), once the phone sweep passes.
