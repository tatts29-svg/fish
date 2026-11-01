# v12.80: the Costs & P&L tab on pack v1.20, with Alfie Harris's 5 Oct shift (data only)

Author: Andrew Fisher.

**Candidate, not live.** It goes up on Andrew's word "Upload". Built on the live v12.79
`73df88aeb79bd4c3dccdeafd01a9d23f72aa3d7d87257220919b0464cb6be95f` by `toolchain/build.sh`:
`build/GC500_v12.80/GC500_Delivery_Control_hosted.html`, **`8d919df150884daf96ae511e9cab1b4f2ff3e008fc9e18ab1708c5bcfbaca043`**,
16,946,989 bytes, on pack v1.20 `e9a611d0265306fc43d5a7bdc5efe21129fdb075dfa404aaede0ad642e59a85c` (audit_pack.py 577/577).

On 2 Nov 2026 Andrew answered the open item on Alfie Harris's 5 Oct night: "Oct 5  6'30-17:00". The shift went on the record that
morning (record 12729 → 12734, `../record_02Nov2026_alfie_5_oct/`). This release carries it to the tab.

## What changes

The page data, pack v1.19 → v1.20, in exactly these places and nowhere else (the patch refuses any other difference):

| Where | v1.19 | v1.20 |
|---|---|---|
| Pack and record | v1.19 · record 12727 | v1.20 · record 12734 |
| Alfie Harris at KINP, October worked hours | 250.5 | 261.0 |
| Alfie Harris at KINP, October paid hours | 238.63 | 248.63 |
| His normal / ×1.5 / ×2 (Sep and Oct) | 279.07 / 73.44 / 16.62 | 286.67 / 75.44 / 17.02 |
| Open item 15 | his 5 Oct night has no shift on the record | the night now has his shift; 5 Oct was the King's Birthday (a Queensland public holiday); the record holds no public-holiday rate, so the weekday split applies; payroll to confirm what he was paid |

No dollar figure moves. Revenue is 1,001,902.14, costs are 588,465.39, the difference is 413,436.75 and the accruals are 195,076.18, the same as
v1.19. Coates wages are carried as hours only, and the 5 Oct night was already accrued at 223.63.

The block's code is the live v12.79 code, read from `../v12.79_pl_rehire_pack_v119_LIVE/` (`plf1279_src.js`, `plf1279.css`,
`plf1279_find.js`, `plf1279_find.css`). Outside the data, its hash and the release footer (v12.79 → v12.80), the page is byte for byte the
live v12.79.

## Build

```
PLF_JSON_OLD=<pack v1.19>/GC500_PL_final.json PLF_JSON=<pack v1.20>/GC500_PL_final.json \
  toolchain/build.sh v12.80 v12.80_alfie_5_oct_pack_v120/patch_v1280.py
```

## Tests

`tests/` holds the v12.79 suite, copied with three changes:

- the footer is v12.80;
- the job's Coates wages paid hours are 1,028.5 = 692 + 180 + 156.5 (was 1,018.5 = 684.4 + 178 + 156.1; plus 5 Oct's 10 = 7.6 + 2 + 0.4);
- the search's record-number check reads the record from the pack instead of a typed 12727.

Results are in `../STATUS.md`.
