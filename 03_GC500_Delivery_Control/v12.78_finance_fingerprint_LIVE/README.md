# v12.78: Finance rows fingerprint only the pay rules that set their pay; the P&L explorer and paid hours, on pack v1.18

Author: Andrew Fisher.

**LIVE 1 Nov 2026, 18:07 AEST** on Andrew's word "Upload". Built on live v12.76
`30ab13155c21c7284cde18a4d9752fad7b07cb3d703114948162833d62d9fcc9`.

Live page: `7bf7904784fa7e150bc92c252e987d07cb7cdc96e79e22824d8dbcf3f2b69de0`, 16,700,055 bytes. A separate fetch of the view
link matches the build byte for byte (`cmp` identical).

## What it is

v12.78 is two patches on the live v12.76, applied in order:

1. `../v12.77_pl_tab_explorer_LIVE/patch_v1277.py` adds find in the P&L (category, branch, month and search) and the labour
   journals. On pack v1.18 the journals also carry **paid hours, the journal basis**: each shift from start to finish, less the
   unpaid break. Coates wages are split into normal, ×1.5 and ×2 by the running sheet's rules:
   - weekday: 7.6 h normal, the next 2 h at ×1.5, then ×2;
   - Saturday: 2 h at ×1.5, then ×2;
   - Sunday: all ×2.

   The pack data is pinned (`f896184a78c9c95ae665985a73980ce1231275acb0aca8b40b49c0eaf60b5f6d`) and refused unless it ties.
2. `patch_v1278.py` fixes the Finance fold. Andrew, 1 Nov: "Fix this page fix for later".
   - **Before:** `fin745Rows` fingerprinted the whole `S.runRules`, which also holds the buildings lock. So every lock action
     turned Finance-confirmed rows to "changed".
   - **Now:** each row fingerprints only the rules its own pay calculation reads, and only where they differ from the standard.
     Those are the weekday ordinary hours and ×1.5 limit, the Saturday ×1.5 limit, and the weekday break (only for a timed
     weekday shift with no break typed). Sunday and the quoted event crew read none.
   - **Why a real change still shows:** the row's paid hours and split stay in the fingerprint.
   - The row-scope part is Codex's `review_01Nov2026_pl_v118/row_rule_scope.patch`, applied as given.

No cost, revenue, month or branch figure changes from v12.76: pack v1.18 has v1.16's totals to the cent.

## Build

```
PLF_JSON=<pack v1.18 dir>/GC500_PL_final.json toolchain/build.sh v12.78 v12.77_pl_tab_explorer_LIVE/patch_v1277.py v12.78_finance_fingerprint_LIVE/patch_v1278.py
```

The pack is built by `../review_31Oct2026_october_month_end/build_monthend.py` from the private captures. `audit_pack.py`
passes 552/552.

## Checks

| Check | On the candidate | On the live bytes |
|---|---|---|
| `test_v1277.cjs`, desktop | 85/85 | 85/85 |
| `test_v1277.cjs`, phone | 85/85 | 85/85 |
| `print_v1277.cjs` (25 pages A4 landscape) | 23/23 | 23/23 |
| `tests/test_v1278.cjs` | 10/10 | 10/10 |
| Caret (`test_caret_focus.cjs` on the active source) | 9/9 | – |
| Sweeps, desktop and phone | 27 tabs, 0 errors, 0 console, 0 writes | – |

`test_v1278.cjs` results:
- the 27 confirmed Coates wages rows read confirmed again;
- the labour hire rows confirmed before `lh_ord` went from 7.5 to 7.6 still read changed;
- a lock change leaves every status as it was;
- a Coates wages rule change, or a weekday break change, turns the affected rows to changed.

No record change (record 12729).

## Reviews

Codex's reviews are recorded in the repo:
- `review_01Nov2026_pl_deeper/`: the caret patch and the workbook print note, both applied;
- `review_01Nov2026_pl_v118/`: the Finance rule scope and the worked vs paid wording, both integrated in `82ae6b3f`.
