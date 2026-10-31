# Six purchase orders on the record, each against the branch in its GL code (31 Oct 2026)

Author: Andrew Fisher. Andrew, 31 Oct 2026 (this chat), with six Coates purchase orders: "we have a few Purchase orders too Do
you want to See These obviously go Against the branch let me know if you need more details with them", then the GL code for
each, read from the branch's system. None of the six was on the record (it held only Advanced's fencing orders and Job
Connect's labour-hire orders).

| PO | Date | Supplier | What | Ex GST | GL code | Account |
|---|---|---|---|---|---|---|
| 4666720 | 15 Oct | BSF Mobile Cranes | GC500 building unloads (crane), completed order | 2,896.00 | 201.KINP.2144.0 | Consumables - Held for Resale |
| 4670876 | 24 Oct | Bunnings | Hand soap (30) | 180.00 | 201.KINP.2144.0 | Consumables - Held for Resale |
| 4663216 | 7 Oct | CCI Supplies | Cable ties for the GC500 fencing | 2,538.64 | 201.STPS.2144.0 | Consumables - Held for Resale |
| 4655573 | 18 Sep | Bunnings | Star pickets 1200 mm (10) | 100.00 | 201.STPS.2144.0 | Consumables - Held for Resale |
| 4669481 | 26 Oct | Bunnings | Siphon hose (2), completed order | 42.34 | 201.NVAC.2150.0 | Consumables - Workshops |
| 4670270 | 23 Oct | Event Elec | Sync the concert generators, completed order | 579.68 | 201.NVAC.2144.0 | Consumables - Held for Resale |
| | | | | **6,336.66** | KINP 3,076.00 · STPS 2,638.64 · NVAC 622.02 | |

The concert sync (4670270) is costed to NVAC, as its GL code has it, with KINP as its revenue branch: the V8s are charged
for the sync on KINP's concert contract 9994954 (12 h at 150.11). The page flags the two branches as differing.

## Applied

31 Oct 2026 16:19 AEST on the live v12.69 page (`038bd277…`), through the page's own `setPo` (the function behind the
Finance handover card's Add button), by Andrew Fisher, with `po_fill.cjs` and `po_spec.json`. Steps:

- Dry run on the live page: passed, 18 documents planned (the six orders, their stamps and author documents), nothing sent
  (`dryrun_*.json`).
- The whole record backed up (`backup_state_20261031T061926Z.json`) and the public page's sha checked.
- 18 documents written, each acknowledged 200.
- Read back: record version 12622 → 12640, every other document unchanged (`report_20261031T061926Z.json`).

Each order carries its supplier, a description, its branch, its ex-GST amount, confirmed, and a note with the GL code, the
account, the PO date, whether it is a completed order, and the amount including GST. Stream "Other", as the form offers.

## What it means for the figures

The orders are on the record and on the Finance handover card under their branches. The page's P&L does not yet read orders
outside the fencing, labour-hire and transport streams, so the 6,336.66 joins the P&L as a Consumables line by branch in the
final P&L release (previews first, live on Andrew's word).
