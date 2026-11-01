# v12.80: the Costs & P&L tab on pack v1.22 (Alfie Harris's 5 Oct night off; Job Connect on Installs – Temp Staff; transport as deliveries and pick-ups, fencing semis on STPS). Data only

Author: Andrew Fisher.

**LIVE 2 Nov 2026 04:55 AEST** (1 Nov 18:55 UTC), on Andrew's word "Upload go live". A separate fetch of the view link matches the
build byte for byte. Built on the live v12.79
`73df88aeb79bd4c3dccdeafd01a9d23f72aa3d7d87257220919b0464cb6be95f` by `toolchain/build.sh`:
`build/GC500_v12.80/GC500_Delivery_Control_hosted.html`, **`3f31d69e3de1966e9aee70d198a3f1faacf52faacd5c59abdcea0a1c080a45c8`**,
16,947,679 bytes, on pack v1.22 `5029e24ce4ea151bf5a7f7abbaffcb617f15fa54faeabb8a585cfea927a9d9cc` (audit_pack.py 583/583).

Andrew, 2 Nov 2026:

- "No he diid not work kings bdat", "No one did", "Alfie did not work the 5th", "Alfie did not stay 5th either for the night";
- "Job connect is already coded to installls temp staff on bassplan";
- "Fencing semis should be  stps  in transport can we show  delivery   and pick up too. If its worth to.", "Femcing is stps".

The record changes are in `../record_02Nov2026_alfie_5_oct_off/`: his 5 Oct shift and his 5 Oct night came off (record 12739).

**Not uploaded:**

- a first v12.80 (`8d919df1…`) on pack v1.20, which carried a 5 Oct shift for Alfie: withdrawn;
- a second (`e2abb4c6…`) on pack v1.21: superseded by this build before upload.

Git history keeps both.

## What changes

The page data, pack v1.19 → v1.22. The patch refuses any difference outside these. Each money change must be exactly 223.63, and each
branch's transport rows must add to its v1.19 transport line:

| Where | v1.19 (live) | v1.22 |
|---|---|---|
| Pack and record | v1.19 · record 12727 | v1.22 · record 12739 |
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
| Open item 15 | his 5 Oct night has no shift on the record | his own line holds 4 nights, 9–12 Nov (his 2–5 Nov nights are in the 97 on the tracker); the 5 Oct night taken off on 2 Nov (he did not work or stay that day) |
| Transport on each branch | one line per branch | deliveries and pick-ups, each with its load count; on STPS the fencing semis on their own line (12,095.01: 21 semis in 11 loads to Phillip Park, 12 Sep–6 Oct, all deliveries). Every branch total is unchanged (KINP 47,097.85 · STPS 27,477.65 · NVAC 10,484.57 · MEAD 9,508.65). All branches: deliveries 51,707.58, fencing included; pick-ups 42,861.14 |
| Open item 18 (new; supplier invoices to come) | — | no semi for the fence going back is on the record or on Schedule 17; if the return is a Coates cost, it is not in this P&L yet |

Revenue (1,001,902.14), labour and every other figure are as v1.19.

The block's code is the live v12.79 code, read from `../v12.79_pl_rehire_pack_v119_LIVE/`. Outside the data, its hash and the release
footer (v12.79 → v12.80), the page is byte for byte the live v12.79.

## Build

```
PLF_JSON_OLD=<pack v1.19>/GC500_PL_final.json PLF_JSON=<pack v1.22>/GC500_PL_final.json \
  toolchain/build.sh v12.80 v12.80_pack_v122_night_off_transport/patch_v1280.py
```

## Tests

`tests/` holds the v12.79 suite, copied with three changes:

- the footer is v12.80;
- the search's record-number check reads the record from the pack instead of a typed 12727;
- the search's accommodation check accepts that nothing is accrued when no accommodation journal exists. Since v1.21 nothing is
  accrued; it still requires the journal's figure when there is one.

Results on the build `3f31d69e…`, reading the live record (12739) with every write blocked:

| Test | Desktop | Phone |
|---|---|---|
| `test_v1280.cjs` | 89/89 | 89/89 |
| `test_v1280_find.cjs` | 155/155 | 156/156 |
| `print_v1280.cjs` | 25/25 (40 pages, A4 landscape) | |
| `../v12.78_finance_fingerprint_LIVE/tests/test_v1278.cjs` | 10/10 | |
| caret (`../review_01Nov2026_pl_deeper/test_caret_focus.cjs`) | 9/9 | |
| `toolchain/harness/sweep.js` | 27 tabs, 0 errors, 0 console, 0 writes | 27 tabs, 0 errors, 0 console, 0 writes |
