# v12.80: the Costs & P&L tab on pack v1.21 (Alfie Harris's 5 Oct night off; Job Connect on Installs – Temp Staff). Data only

Author: Andrew Fisher.

**Candidate, not live.** It goes up on Andrew's word "Upload". Built on the live v12.79
`73df88aeb79bd4c3dccdeafd01a9d23f72aa3d7d87257220919b0464cb6be95f` by `toolchain/build.sh`:
`build/GC500_v12.80/GC500_Delivery_Control_hosted.html`, **`e2abb4c6fd001adbea0c8312801aa10ee36ae435b470c9bd38181134e42e6aee`**,
16,946,482 bytes, on pack v1.21 `b98d222537353bf98d9073b1e417e0f9c71dd7334a01a409e97db2562153c232` (audit_pack.py 579/579).

Andrew, 2 Nov 2026:

- "No he diid not work kings bdat", "No one did", "Alfie did not work the 5th", "Alfie did not stay 5th either for the night";
- "Job connect is already coded to installls temp staff on bassplan".

The record changes are in `../record_02Nov2026_alfie_5_oct_off/`: his 5 Oct shift and his 5 Oct night came off (record 12739).

**Withdrawn before upload:** a first v12.80 (`8d919df1…`) on pack v1.20, which carried a 5 Oct shift for Alfie. Its patch and tests
were reworked here; git history keeps them.

## What changes

The page data, pack v1.19 → v1.21. The patch refuses any difference outside these, and each money change must be exactly 223.63:

| Where | v1.19 (live) | v1.21 |
|---|---|---|
| Pack and record | v1.19 · record 12727 | v1.21 · record 12739 |
| Costs (job) | 588,465.39 | 588,241.76 |
| October costs | 406,191.73 | 405,968.10 |
| Difference | 413,436.75 | 413,660.38 |
| Accruals through 31 Oct | 195,076.18 | 194,852.55 |
| KINP costs | 237,193.45 | 236,969.82 |
| Accommodation | 23,142.11 | 22,918.48 |
| Month end: Accrued at 31 Oct | 193,113.08 | 192,889.45 |
| Alfie Harris's nights | 5 (5 Oct accrued; 9–12 Nov forecast) | 4 (9–12 Nov, forecast; nothing accrued) |
| Accrual journals | 8 (one for his 5 Oct night) | 7 |
| Job Connect's account (9 lines, its journal, its branch move) | Installs (as coded) | Installs – Temp Staff, as coded on Baseplan |
| Open item 15 | his 5 Oct night has no shift on the record | 4 nights, all in November; the 5 Oct night taken off on 2 Nov (he did not work or stay; nobody worked the King's Birthday) |

Revenue (1,001,902.14), labour and every other figure are as v1.19.

The block's code is the live v12.79 code, read from `../v12.79_pl_rehire_pack_v119_LIVE/`. Outside the data, its hash and the release
footer (v12.79 → v12.80), the page is byte for byte the live v12.79.

## Build

```
PLF_JSON_OLD=<pack v1.19>/GC500_PL_final.json PLF_JSON=<pack v1.21>/GC500_PL_final.json \
  toolchain/build.sh v12.80 v12.80_pack_v121_alfie_night_off/patch_v1280.py
```

## Tests

`tests/` holds the v12.79 suite, copied with two changes:

- the footer is v12.80;
- the search's record-number check reads the record from the pack instead of a typed 12727.

Results are in `../STATUS.md`.
