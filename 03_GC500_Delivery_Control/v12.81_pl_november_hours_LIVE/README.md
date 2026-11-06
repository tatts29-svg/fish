# v12.81: November's hours on the labour tables; Job Connect w/e 18 Oct invoiced; Kyle Gover's November off (pack v1.25)

Author: Andrew Fisher.

**LIVE 2 Nov 2026 06:33 AEST** (1 Nov 20:33 UTC), on Andrew's word "go live". A separate fetch of the view link matches the build
byte for byte. Built on the live v12.80
`3f31d69e3de1966e9aee70d198a3f1faacf52faacd5c59abdcea0a1c080a45c8` by `toolchain/build.sh`:
`build/GC500_v12.81/GC500_Delivery_Control_hosted.html`, **`3b17c3de36c8c3f2d99042b0c83dfd9fdc110ccb9db7a1c21ef6c9f72704a85b`**,
16,948,844 bytes, on pack v1.25 `10691c10fd5d6f65f4ff490346c11d0697c398750745744b7e2bb00f931189f0` (record 12749, `audit_pack.py` 598/598).

Andrew, 2 Nov 2026:

- on the Labour journals and Paid hours tables: "Also can we show what november is made up of hrs too here";
- "For w/e 18th oct its been invoiced", then "work off his hrs worked and hrly rate";
- "Kyle wont be doing any works in november" (his 2–6 Nov shifts came off the record, 12739 → 12749:
  `../record_02Nov2026_kyle_november_off/`).

## What changes

| Where | v12.80 (live, pack v1.22) | v12.81 (pack v1.25) |
|---|---|---|
| Labour journals, Paid hours | Sep · Oct (with 1–13 Nov) · total | Sep · Oct (with 1–13 Nov) · **of which 1–13 Nov** · total. October is unchanged: November's labour is counted in October (Andrew, 1 Nov) |
| November hours, the job | (inside October) | 409.00 worked, 390.00 paid (Aaron 88/84, Alfie 106/101, Andrew 110/105, Daniel 105/100) |
| Job Connect w/e 18 Oct (POs 4667755, 4668970) | accrued, 6,198.75 (running sheet) | invoiced, not accrued, at each person's hours × rate: Daniel Gough 2,539.92, Eric Lucian 634.98, Kyle Gover 3,023.85 |
| Job Connect accrual journal | 10,034.12 (w/e 18 Oct + w/e 1 Nov) | 3,835.37 (w/e 1 Nov) |
| Accruals through 31 Oct | 194,852.55 | 188,653.80 |
| October at month end | Invoiced 133,229.45 · Accrued 192,889.45 | Invoiced 139,428.20 · Accrued 186,690.70 |
| Kyle Gover, w/e 8 Nov | 3,023.85 on the running sheet (no PO) | no November work: w/e 8 Nov is Daniel Gough's PO 4674224 alone, 3,052.60 |
| Job cost · October · difference | 588,241.76 · 405,968.10 · 413,660.38 | 585,217.91 · 402,944.25 · 416,684.23 |
| Labour hire · KINP costs | 40,490.16 · 236,969.82 | 37,466.31 · 233,945.97 |

Revenue (1,001,902.14) and every other branch, category and supplier figure are as v1.22.

## How it is guarded

- `patch_v1281.py` checks the live block is v12.80's, swaps in the module (`plf1281_src.js`: the two tables' extra column; the find
  files are the live ones) and the v1.25 data, and moves the footer to v12.81.
- Its `check_delta` holds an exact map of the 36 figures that move from v1.22 (each path, what it holds and by how much: 6,198.75 or
  3,023.85) and refuses any other figure moving, any journal row but Kyle Gover's changing (his KINP row by exactly his 2–6 Nov), any
  list changing length except the no-PO list losing only his w/e 8 Nov, and any text still saying an amount is to confirm or that he
  works w/e 8 Nov. Nine tampered packs (the independent check's examples) are all refused.
- Pack v1.25 was rechecked by two independent agents from the raw 12739 and 12749 captures: every figure moved by exactly 3,023.85 or
  by hours, and every total ties. They found two stale texts (a typed 41,276.59 in the pack page's section 2; "amount to confirm" on the
  9972648 match-up row); both are fixed and the audit now checks for them.

## Build

```
PLF_JSON_OLD=<pack v1.22>/GC500_PL_final.json PLF_JSON=<pack v1.25>/GC500_PL_final.json \
  toolchain/build.sh v12.81 v12.81_pl_november_hours_LIVE/patch_v1281.py
```

## Tests

`tests/` holds the v12.80 suite with these changes: the footer is v12.81; the labour checks read the new column, check every row's
November hours against the pack and the job's 409.00 worked / 390.00 paid; the print check finds a person's type in order across a wrap
(the extra column narrows the name column); the search's PO check expects no accrual journal for PO 4667755 once invoiced, and its
week check expects w/e 8 Nov to be Daniel Gough's PO alone.

Results on `3b17c3de…`, reading the live record (12749) with every write blocked:

| Test | Desktop | Phone |
|---|---|---|
| `test_v1281.cjs` | 91/91 | 91/91 |
| `test_v1281_find.cjs` | 155/155 | 156/156 |
| `print_v1281.cjs` | 25/25 (41 pages, A4 landscape) | |
| `../v12.78_finance_fingerprint_LIVE/tests/test_v1278.cjs` | 10/10 | |
| caret (`../review_01Nov2026_pl_deeper/test_caret_focus.cjs`) | 9/9 | |
| `toolchain/harness/sweep.js` | 27 tabs, 0 errors, 0 console, 0 writes | 27 tabs, 0 errors, 0 console, 0 writes |

The same suite on the live page after upload (2 Nov 2026), the record read only: every result as above.
