# v12.74 — the P&L tab on pack v1.14: transport checked against Schedule 17; the two forklift POs in the costs (DRAFT)

Author: Andrew Fisher. Andrew, 1 Nov 2026 (this chat), on Schedule 17: "lets make sure we double check this for any transports costs in
here we may of missed. obviously you know where things belong to VMS and Generators and forlifts etc belong to their brances". On the
forklift POs 4647983 and 4654789: "these are a cost to Coates". On PO 4658653: "if not remove this one then". The tab follows the pack
(`../review_31Oct2026_october_month_end/`, pack v1.14).

Built on the live v12.73 (`84a1b3cdd9983464394b7d0e67ee4915e7f1dc07d987e3b5449d734c4f312a50`, BASE pinned).

Candidate: **`58695330689cd54cbb1bfa48b9b4a0489ca56398d6c08913a011daf1be635bc4`**, 16,605,697 bytes. It replaces the earlier v12.74 candidate
on pack v1.13 (`4db0e937…`), which never went live.

```
PLF_JSON=<pack dir>/GC500_PL_final.json toolchain/build.sh v12.74 v12.74_pl_tab_on_pack_v1_14_DRAFT/patch_v1274.py
```

## What changes on the Costs & P&L tab

- **The final P&L block carries pack v1.14's data**, pinned by SHA-256 (`0aa4987d…`); the patch holds no figure. The ids are kept.
  - Costs 552,533.71 (Sep 149,435.00 · Oct 379,590.09 · Nov 23,508.62); difference 449,368.43; revenue and accruals unchanged.
  - The forklift POs, own use (9961976 L31 and L34 at 0.00): 4647983 at 2,820.00 on STPS, by its three lines (an estimate until
    invoiced); 4654789 at 950.00 on MEAD (invoiced).
  - PO 4658653 is gone from the open items; Job Connect's open item carries the weeks as they stand and asks for nothing more.
- **A new fold, "Transport checked against Schedule 17":** the 12 changes, each with its Schedule 17 row, docket and hire contract,
  what the record had before and the change; the total (figures, forecasts replaced, net); the notes.
- **The rest is v12.73's module, unchanged**, now on v1.14: tiles, by branch, labour charged, suppliers, every cost line, journals,
  open items.
- **On paper, every section of the final P&L has its heading** (Every cost line, Costs by branch, Every labour line, Transport
  checked against Schedule 17, Journals, Open items). The page's own print rule hid fold headings (`.plfold765>summary`) since v12.72.
- **Footer:** v12.73 → v12.74.

Nothing is typed; nothing is written to the record.

## Checks on the candidate (live record 12729)

| Check | Result |
|---|---|
| `toolchain/check_page.py` (build) | PASS |
| `tests/test_v1274.cjs` desktop | 33/33: every figure, line, branch line, journal, Schedule 17 row and open item equals pack v1.14's data, to the cent and word for word |
| `tests/test_v1274.cjs` phone | 33/33 |
| `tests/print_v1274.cjs` | 15/15: 11 pages A4 landscape; every figure, every note and every section heading on the paper |
| `toolchain/harness/sweep.js` desktop | 27 tabs, 0 errors, 0 console, 0 writes |
| `toolchain/harness/sweep.js` phone | 27 tabs, 0 errors, 0 console, 0 writes |
| `toolchain/upload_page.py --dry-run` | live page unchanged since the build (v12.73); the key is the edit key; record 12729 |

## State

Built and tested; ready. Upload on Andrew's word.
