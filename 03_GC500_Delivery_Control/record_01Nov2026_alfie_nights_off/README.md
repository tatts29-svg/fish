# Alfie Harris's 23–25 Oct accommodation nights taken off — 1 Nov 2026

Author: Andrew Fisher. Andrew, 1 Nov 2026 (this chat), answering whether Alfie Harris's October nights were real (none of
them has a shift for him on the record): "alfie nevere worked 23-25". He did not work the event weekend, so there were no
accommodation nights for him on 23, 24 and 25 Oct. Those three nights come off the record.

## Applied

1 Nov 2026 08:11 AEST (31 Oct 22:11 UTC) on the live v12.69 page (`038bd277…`), by Andrew Fisher, through the page's own
`removeOurCost`. This is the same as clearing the night on the Costs tab. Each line is set aside with a tombstone, so the
removal travels with the record and the night can be put back.

Runner: `accom_fill.cjs`. It is `../record_01Nov2026_alfie_accommodation/accom_fill.cjs` with one new operation,
`accom_remove`. The operation:
- checks the line is that person's accommodation on that night;
- removes it;
- checks it now has a tombstone.

Spec: `accom_spec.json`.

1. **Dry run** (`dryrun_20261031T221028Z.json`): three nights found, each at 223.63; 9 documents planned; nothing sent.
2. **Backup:** the whole record was backed up first. The backup is kept privately and **not committed**, because this
   repository is public.
3. **Write:** the public page's SHA-256 was checked, then the three nights were taken off. That is 9 documents, each
   acknowledged 200:
   - each night's tombstone;
   - its author;
   - the removal of the line.
4. **Read back** (`report_20261031T221058Z.json`):
   - record version 12676 → 12685;
   - the 9 documents are as sent;
   - no other document changed;
   - verification OK.

## Fresh reads after (read only)

`../review_31Oct2026_october_month_end/inputs/dated_costs.cjs` (with `OUT=`) was run on 12685 and compared with the 12676
capture:
- Labour, transport and fencing are identical.
- The only difference in the cost lines is the three nights gone: Alfie Harris on 23, 24 and 25 Oct, at 223.63 each.
- Accommodation on the record is now 109 lines, all priced: Sep 6,370.36 · Oct 12,970.04 · Nov 4,696.23 (24,036.63).
- Alfie Harris has 36 accommodation lines.

## What it means for the figures

- **Costs:** the record's accommodation falls by 670.89 (3 × 223.63), all in October.
- **The pack:** v1.9 has Alfie's nights at 9: 5 in October (5 and 12–15 Oct, accrued) and 4 in November (9–12 Nov,
  forecast).
- **Still open with Andrew:** the five October nights 5 and 12–15 Oct also have no shift for him on the record.
