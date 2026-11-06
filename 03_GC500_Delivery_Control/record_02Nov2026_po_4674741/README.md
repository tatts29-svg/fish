# PO 4674741 — Daniel Gough, week ending 1 Nov 2026, on the record — APPLIED, VERIFIED

Author: Andrew Fisher.

Andrew, 2 Nov 2026 (this chat), after asking whether Daniel had a PO for week ending 01/11/2026 (the record held none): "4674741 W/E
is this one for Daniel", then "P/O o gave you os for daniel".

- **Applied:** 2 Nov 2026 11:36 AEST (01:36 UTC), on the live v12.81 page (`3b17c3de…`), by Andrew Fisher, through the page's own `setPo`
  (the Finance handover card's Add button).
- **What went on:** Job Connect, stream labour, "Daniel Gough - week ending 1 Nov 2026", period w/e 1 Nov 2026, costed and revenue
  branch KINP, confirmed — the same fields as his October POs on the record (4670882 and the rest). **No amount**: none was given, so none
  is entered, as with his October POs. The week stays in the P&L at the running sheet until Job Connect invoices.
- **Record:** 12784 → 12787. Three documents acknowledged 200: `purchaseOrders/4674741` and its two audit documents (`stamps`, `by`).
  Every other document unchanged; verification OK. Read back from the service: the PO as above, by Andrew Fisher.
- **Backup:** the whole record before the run, kept privately outside the repo (not committed).

## The P&L gate (new in this runner)

Andrew, 2 Nov: "we dont want to ruin info that is already in the P&L". `po_fill.cjs` is a copy of
`../record_31Oct2026_purchase_orders/po_fill.cjs` with three changes:

1. **The P&L gate from `left_site.cjs`.** What is charged to the V8s, the known costs, the labour charged and every branch total are read
   from the page's own `moneySummary` / `pl752Rows` before the stage and again inside the stage, straight after the page saves the orders
   and before anything is sent (in a dry run the page rolls an aborted send back, so a later read would miss the staged orders).
   `spec.expect` is required; any movement other than what it says (here nothing), to the cent, stops the run with nothing sent.
   - Both the dry run and the apply read: charged 1,012,101.16, labour 67,542.42, known cost 456,889.59, KINP 283,944.30 · STPS 80,826.46
     · NVAC 44,272.04 · MEAD 25,660.25, before and after. Gate passed.
2. **An amount may be left out**, for a PO given without one (as the October Job Connect POs on the record).
3. The rest is as the 31 Oct runner: page sha check, the write gate allows only the planned documents once each, verification on the
   service and every other document compared.

Files: `po_spec.json`, `dryrun_20261102T013604Z.json`, `report_20261102T013627Z.json`.

## Still without a PO

- Kyle Gover's day in week ending 1 Nov (29 Oct, 10.5 h, 604.77 on the running sheet).
- The pack (v1.25) still lists week ending 1 Nov as "no PO yet: accrued at the running sheet"; the next pack picks up 4674741 for Daniel's
  part (3,230.60 on the running sheet).
