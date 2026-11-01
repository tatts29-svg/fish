# Alfie Harris's 12–15 Oct accommodation nights taken off — 1 Nov 2026

Author: Andrew Fisher. Andrew was asked whether Alfie Harris's 5 and 12–15 Oct nights should stay, since none of those dates
has a shift for him on the record. His answer, 1 Nov 2026 (this chat): "alfie never worked 12–15". Those four nights come off
the record. The 5 Oct night stays.

On 12–15 Oct the record held only these four accommodation lines for him, at 223.63 each. There were no meals or other lines.

## Applied

1 Nov 2026 09:55 AEST (31 Oct 23:55 UTC), on the live v12.72 page (`f3d686a3…`), by Andrew Fisher, through the page's own
`removeOurCost`. This is the same as clearing the night on the Costs tab. Each line is set aside with a tombstone, so it can
be put back.

Runner: `accom_fill.cjs`. It is `../record_01Nov2026_alfie_nights_off/accom_fill.cjs`, changed so that the whole-record backup
goes to a private folder (`GC500_BACKUP_DIR`). It refuses a folder inside this public repository.

Spec: `accom_spec.json`. Four `accom_remove` operations (12, 13, 14 and 15 Oct), each with Andrew's words.

1. **Dry run** (`dryrun_20261031T235517Z.json`): the four nights found, each at 223.63; 12 documents planned; nothing sent.
2. **Backup:** the whole record was backed up first. It is kept privately and **not committed**.
3. **Write:** the public page's sha256 was checked. Then 12 documents were written, each acknowledged 200:
   - each night's tombstone;
   - its author;
   - the removal of the line.
4. **Read back** (`report_20261031T235545Z.json`):
   - record version 12715 → 12727;
   - every planned document is as sent;
   - no other document changed;
   - verification OK.

## What it means for the figures

- **Costs:** the record's accommodation falls by 894.52 (4 × 223.63), all in October.
- **Accrual:** because these were October nights, the accrual falls by the same 894.52.
- **Alfie's priced nights in the pack:** 5, 9, 10, 11 and 12 Nov, made up of:
  - 5 Oct, accrued, 223.63;
  - 9–12 Nov, forecast, 894.52.
