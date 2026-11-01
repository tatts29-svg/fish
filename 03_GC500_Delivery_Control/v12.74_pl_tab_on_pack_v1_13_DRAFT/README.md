# v12.74 — the P&L tab on pack v1.13: transport checked against Schedule 17 (DRAFT)

Author: Andrew Fisher. Andrew, 1 Nov 2026 (this chat), on Schedule 17: "lets make sure we double check this for any transports costs in
here we may of missed. obviously you know where things belong to VMS and Generators and forlifts etc belong to their brances". The
tab follows the pack (`../review_31Oct2026_october_month_end/`, pack v1.13).

Built on the live v12.73 (`84a1b3cdd9983464394b7d0e67ee4915e7f1dc07d987e3b5449d734c4f312a50`, BASE pinned).

Candidate: **`4db0e93711fa87bdef2f42703645979e77a2a6556f61688d2448ca8718c4d8ac`**, 16,604,134 bytes.

```
PLF_JSON=<pack dir>/GC500_PL_final.json toolchain/build.sh v12.74 v12.74_pl_tab_on_pack_v1_13_DRAFT/patch_v1274.py
```

## What changes on the Costs & P&L tab

- **The final P&L block carries pack v1.13's data**, pinned by SHA-256 (`687a6466…`); the patch holds no figure. The ids are kept.
- **A new fold, "Transport checked against Schedule 17":** the 12 changes, each with its Schedule 17 row, docket and hire contract,
  what the record had before and the change; the total (figures, forecasts replaced, net); the notes.
- **The rest is v12.73's module, unchanged**, now on v1.13: tiles, by branch, labour charged, suppliers, every cost line, journals,
  open items.
- **On paper, every section of the final P&L has its heading** (Every cost line, Costs by branch, Every labour line, Transport
  checked against Schedule 17, Journals, Open items). The page's own print rule hid fold headings (`.plfold765>summary`) since v12.72.
- **Footer:** v12.73 → v12.74.

Nothing is typed; nothing is written to the record.

## Checks on the candidate (live record 12727)

| Check | Result |
|---|---|
| `toolchain/check_page.py` (build) | PASS |
| `tests/test_v1274.cjs` desktop | 33/33: v12.73's checks on v1.13's data, plus every Schedule 17 row, its total and its notes, to the cent and word for word |
| `tests/test_v1274.cjs` phone | 33/33 |
| `tests/print_v1274.cjs` | 15/15: 10 pages A4 landscape; every figure (Schedule 17's included), every note and every section heading on the paper |
| `toolchain/harness/sweep.js` desktop | 27 tabs, 0 errors, 0 console, 0 writes |
| `toolchain/harness/sweep.js` phone | 27 tabs, 0 errors, 0 console, 0 writes |
| `toolchain/upload_page.py --dry-run` | live page unchanged since the build (v12.73); the key is the edit key; record 12729 |

## State

Built and tested; ready. Upload on Andrew's word.
