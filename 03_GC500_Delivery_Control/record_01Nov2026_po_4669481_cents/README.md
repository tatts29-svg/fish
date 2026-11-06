# PO 4669481 corrected to 42.33 on the record — 1 Nov 2026

Author: Andrew Fisher. Coates' system has PO 4669481 (Bunnings, siphon hose) as 2 at 21.1650 ex GST, 46.56 inc GST: 42.33 ex GST.
The record held 42.34, from the printed PO, which rounds the unit cost to 21.17. Asked whether to correct the record, Andrew said, 1 Nov
2026 (this chat): "yes to 4669481".

## Applied

1 Nov 2026 10:57 AEST (00:57 UTC), on the live v12.73 page (`84a1b3cd…`), by Andrew Fisher, through the page's own `setPo` (the
function behind the Finance handover card's Add button). `setPo` merges the change into the order and keeps every other field.

Runner: `po_fill.cjs`. It is `../record_31Oct2026_purchase_orders/po_fill.cjs` with two changes:
- a `po_set` operation for an order already on the record. Its fields must first read as `was`; it changes only the amount and the
  note, and checks every other field is unchanged;
- the whole-record backup goes to a private folder (`GC500_BACKUP_DIR`). It refuses a folder inside this public repository.

Spec: `po_spec.json`. One `po_set`: amount 42.34 → 42.33; the note gains "2 × 21.1650 = 42.33 ex GST".

1. **Dry run** (`dryrun_*.json`): 2 documents planned (the order and its stamp); nothing sent.
2. **Backup:** the whole record, kept privately and **not committed**.
3. **Write:** the public page's sha256 was checked, then 2 documents were written, each acknowledged 200.
4. **Read back** (`report_*.json`):
   - record version 12727 → 12729;
   - the order is as sent;
   - no other document changed;
   - verification OK.

A fresh read after: PO 4669481 is 42.33, branch NVAC (its GL code, 201.NVAC.2150.0), updated by Andrew Fisher.

## What it means for the figures

None. The P&L pack has carried 42.33 since v1.13, from Coates' system; the record now agrees with it. `audit_pack.py` checks the six
consumables POs against the record as it now stands.
