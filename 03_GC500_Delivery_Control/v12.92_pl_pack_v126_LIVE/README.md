# v12.92: the Costs & P&L tab on pack v1.26

Author: Andrew Fisher.

**LIVE 3 Nov 2026 14:25 AEST**, on Andrew's word "P&L Tab to 1.26". Built on live v12.90 (Codex, Still on site)
`ec56ffe5ef53670d286db566bd968366dfc366ad25edf6f2aa753076b10fc3e8` by `toolchain/build.sh`; page
**`49ddd53f5ff3edc7f45df2287f27568af7713a02a08751d7d70c47d82118ecf2`**, 16,983,799 bytes, on pack v1.26
`f7ace6ffe093e611804da4d900ccbbbb374a2100fedd03520dbe24a779aba715` (record 12749, `audit_pack.py` 604/604). The upload's read-back
and a separate public GET both match every byte.

## What changes (pack v1.25 → v1.26)

October stands as accrued; anything new is November (Andrew, 3 Nov).

| | v12.81 (pack v1.25) | v12.92 (pack v1.26) |
|---|---|---|
| Advanced, PO 4647522 (event week) | 71,159.70 accrued | their sheet, received 2 Nov, 80,762.00 with the 36766/36768 correction: 71,159.70 accrued in October, 9,602.30 November |
| Advanced, PO 4647523 (demob) | 8,025.00 accrued · 750.00 November | + 36784 600.00 · demob week 1 forecast 3,675.00 (ESTIMATE), November |
| 9968955 L143 | possible extra revenue | November revenue, 6,246.00 (KINP) |
| Costs (Nov) · job | 585,217.91 · Nov 32,838.66 | 599,095.21 · Nov 46,715.96 |
| Revenue · difference | 1,001,902.14 · 416,684.23 | 1,008,148.14 · 409,052.93 |
| STPS costs · KINP revenue | 328,921.00 | 342,798.30 · KINP +6,246.00 |

September, October, the month end, the accruals (188,653.80) and every other branch, category and supplier figure are as v1.25.

## How it is guarded

- The tab's code is the live v12.81 module (`../v12.81_pl_november_hours_LIVE/`, with the v12.79 find files); only the data and its
  hash change. `patch_v1292.py` checks the live block is exactly v12.81's on pack v1.25 before it swaps it.
- `check_delta` holds the exact map of the 27 figures that move and refuses any other figure moving; any list but the six named
  changing length; any old item leaving them (the facts compared with their line numbers following the three new lines); any new item
  but Advanced's three November lines and L143; and any text change outside the seven paths (three open items, the pack name, and
  the two Advanced PO texts).

## Build

```
PLF_JSON_OLD=<pack v1.25>/GC500_PL_final.json PLF_JSON=<pack v1.26>/GC500_PL_final.json \
  toolchain/build.sh v12.92 v12.92_pl_pack_v126_LIVE/patch_v1292.py
```

## Tests

`tests/` holds the v12.81 suite with these changes: the footer is v12.92; the search test's Advanced card counts a line's November
part as November (the tab's own state rule, `H.stKey`; pack v1.26: Advanced invoiced 214,225.00, November 14,627.30), and 6246 is
now 9968955 L143's own figure rather than a figure written only in a text.

| Test | Desktop | Phone |
|---|---|---|
| `test_v1292.cjs` | 91/91 | 91/91 |
| `test_v1292_find.cjs` | 155/155 | 156/156 |
| `print_v1292.cjs` | 25/25 (42 pages, A4 landscape) | |
| `../v12.78_finance_fingerprint_LIVE/tests/test_v1278.cjs` (v12.90 → v12.92) | 10/10 | |
| caret (`../review_01Nov2026_pl_deeper/test_caret_focus.cjs`, on the assembled tab script) | 9/9 | |
| `toolchain/harness/sweep.js` | 27 tabs, 0 errors, 0 console, 0 writes | 27 tabs, 0 errors, 0 console, 0 writes |

On the live page after upload, the record read only (12966): `test_v1292.cjs` 91/91 desktop and phone, `test_v1292_find.cjs` 155/155,
and the v12.89 fencing test 30/30 (fencing still 100%).
