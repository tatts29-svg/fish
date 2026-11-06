# Alfie Harris's 12 accommodation nights priced at 223.63 — 1 Nov 2026

Author: Andrew Fisher. Andrew, 1 Nov 2026 (this chat): "Yes enter 223.63 for Alfie's nights on the record". Alfie Harris
had 12 accommodation nights on the tracker with no amount: 5, 12–15 and 23–25 Oct, and 9–12 Nov. Each now carries 223.63,
the amount on all 8 of his latest priced nights (26–29 Oct and 2–5 Nov).

## Applied

1 Nov 2026 04:35 AEST (31 Oct 18:35 UTC) on the live v12.69 page (`038bd277…`), through the page's own `setOurCost` (the
amount only; each line's person, date, kind, hotel, nights, note and category are checked unchanged), by Andrew Fisher. Runner `accom_fill.cjs` is
`labour_fill.cjs` with one operation, `accom_set`, which refuses a night that already has an amount. Spec: `accom_spec.json`.

1. Dry run first (`dryrun_20261031T183502Z.json`): 12 nights found, none priced, nothing sent.
2. Backup of the whole record (`backup_state_20261031T183528Z.json`). It is kept privately and **not committed**, because
   this repository is public and the backup holds the whole record.
3. The public page's SHA-256 was checked, then the 12 amounts were written. That is 36 documents (each line, its stamp and
   its author), each acknowledged 200.
4. Read back (`report_20261031T183528Z.json`):
   - record version 12640 → 12676;
   - the 36 documents are as written;
   - no other document changed;
   - verification OK.

## Fresh reads after (read only)

- `../review_31Oct2026_october_month_end/inputs/alfie_nights.cjs`:
  - Alfie Harris has 39 accommodation lines, none without an amount;
  - the 12 nights are each 223.63.
- `../review_31Oct2026_october_month_end/inputs/dated_costs.cjs` (with `OUT=`), on record 12676, compared with the same
  capture on 12640:
  - labour, transport and fencing are identical;
  - the cost lines differ only in Alfie's 12 amounts.
- Accommodation on the record is now 112 lines, all priced: Sep 6,370.36 · Oct 13,640.93 · Nov 4,696.23 (24,707.52).

## What it means for the figures

The 12 nights were the record's only accommodation lines with no amount. The record's accommodation rises by 2,683.56
(8 × 223.63 = 1,789.04 in October; 4 × 223.63 = 894.52 in November).

The P&L pack has costed these nights at 223.63 since v1.7, so its figures are unchanged:
- job cost 543,508.93;
- to accrue at 31 Oct 211,703.93.

Pack v1.8 names record 12676. Its three accommodation rows equal the record by month, to the cent; `audit_pack.py` checks
this.
