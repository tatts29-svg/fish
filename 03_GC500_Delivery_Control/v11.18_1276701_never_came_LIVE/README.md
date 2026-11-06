# v11.18 — the 365 kVA set 1276701 (9961976 line 6, "GN20-S01") never came to site

Author: Andrew Fisher. Built on live v11.16 `8a19fcce…`. LIVE line and hashes in STATUS.md.

Andrew, 22 Oct 2026: "never came to site 1276701"; "remove the 1276701 350A".

## Why a page change and not a record change

GN20 was deleted as a reference on 20 Oct, so there is nothing left on the record to untick. The page still priced the
set because the contract line stands as Delivered in the Baseplan export the page carries, and the register (from the
schedule) still named 1276701 on GN20: the Generators costing took it as a confirmed arrival from 30 Sep and charged
$6,840.83 to 25 Oct. The export is the branch's; Andrew's word on what is on the ground overrides it (AGENTS.md: the
site record is truth, Baseplan is how the branch charges).

## What `patch_v1118.py` does (data only)

- The contract line (9961976 line 6, asset 1276701) leaves the page's on-hire rows for the source history, marked
  `removed_1118: never came to site`, delivered false, start date none, match "never delivered", with Andrew's words.
  The on-hire summary (lines 299 → 298, delivered 204 → 203, the match counts) and the 9961976 contract entry
  (37 → 36 lines, the number and the GN20 location dropped) are recounted from what is left.
- The register's GN20 entry carries no asset number and says why.
- Footer v11.16 → v11.18. (v11.17, the map coordinates, is built and not uploaded; it rebases on v11.18 when it goes.)

## Checks

`tests/test_v1118.cjs` on the build: 9/9 — line 6 off the rows and in the history as never delivered; GN20 with no
number; summary and contract recounted; the generator costing carries neither 1276701 nor GN20; the Generators tab shows
neither; record unchanged; 0 errors; 0 writes. Generators "Actual · priced" $32,367.35 → $25,526.52, exactly the
$6,840.83 the set was priced at. Toolchain PASS all checks. Sweeps: see STATUS.
