# v11.19 — GN24 is the 60 kVA trailer set 1277089; the 80 kVA on 9961976 line 17 (1276412) never came

Author: Andrew Fisher. Built on live v11.18 `61971684…`. LIVE line and hashes in STATUS.md.

Andrew, 22 Oct 2026: "so the gn24 we charge as a 60KVA asset no 1277089".

## Why a page change

The record already had GN24 right: on site 19 Oct (Andrew), its item set to 60 kVA (so the card's 60 kVA rate), and
1277089 identified as the unit on 19 Oct by Andrew. A dry run of the asset-number control refused 1277089 for exactly that
reason ("already recorded at GN24"), so no record change was needed. What held the charge back was the page's copy of the
Baseplan export: two contract lines named GN24 — line 17 (1276412, the 80 kVA asked for, Pending) and line 49 (1277089,
the 60 kVA trailer, Del Req) — against a register quantity of one, so the Generators costing said "Contract quantity needs
allocation" and priced nothing. Baseplan (6) itself no longer has line 17.

## What `patch_v1119.py` does (data only)

- 9961976 line 17 (1276412) leaves the on-hire rows for the source history, marked `removed_1119: never came to site`,
  delivered false, with Andrew's words (the v11.18 pattern). The on-hire summary (298 → 297 lines) and the 9961976 contract
  entry (36 → 35 lines, the number dropped) are recounted from what is left. GN24 keeps line 49 alone.
- The register's GN24 entry carries the why; the rate-hold note that had left GN24 open says it is settled (the old wording
  kept beside it).
- Footer v11.18 → v11.19. (v11.17, the map coordinates, stays built and not uploaded; it rebases when it goes.)

## Result

GN24 prices as one 60 kVA set from 19 Oct: $96.50 × 4 standby days to 22 Oct = $386.00, plus the three race days at
$193.00 = $965.01 to 25 Oct. Generators "Actual" $25,526.52 → $26,491.53. The costing block does not list 1277089 under
GN24 because that reading takes numbers from the register, the typed numbers and delivered contract lines, not from the
unit record where 1277089 sits; the drawer shows it.

## Checks

`tests/test_v1119.cjs`: 12/12 on the build and on the live page — line 17 off the rows and in the history; line 49 kept;
register and rate-hold note; summary and contract recounted; the costing sees one confirmed 60 kVA set, no issue; the
Generators tab shows 1 × 60kva, $386.00, $965.01, nothing "Not priced"; record unchanged; 0 errors; 0 writes. Toolchain
PASS all checks. Sweeps desktop + phone 25 tabs / 7 hashes / Back, 0 errors, 0 blocked writes.
