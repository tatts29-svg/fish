# Event Portables POs 4674399, 4674402, 4674406 — DRY RUN PASSED, NOT APPLIED (awaiting Andrew's go)

Author: Andrew Fisher.

Andrew, 2 Nov 2026 (this chat), with the three PO screens (all Event Portables, raised by Brenden Meek on 2 Nov, KINP, open, nothing
received): "PO 4674399 for the Hydrostation / PO 4674402 for the toilet hires / PO 4674406 for the pump outs."; then "we dont want to ruin
info that is already in the P&L", and "what are we doing about the recent p/o WE GOT FOR EVENT pORTABLES".

| PO | For | Ex GST | Inc GST | GL on the PO | The P&L carries (counted, accrued) |
|---|---|---|---|---|---|
| 4674402 | Toilet hire: 222 FWF × 105.00, 6 pee panels × 450.00, 2 × 16-pan × 2,750.00 (Q6845) | 31,510.00 | 34,661.00 | 201.KINP.2127.0 Re-hire Manual | 28,675.00 (195 FWF) |
| 4674406 | Water truck 6,800.00; 780 FWF pump-outs × 38.50; 24 tank pump-outs × 295.00; 51 block cleans × 185.00 (Q6844) | 53,345.00 | 58,679.50 | 201.KINP.3325.0 Toilet Pumpout | 41,772.00 (702 / 18 / 51) + water truck with pre-fill 9,600.00 |
| 4674399 | 6 water deliveries × 375.00; drinking-water tank 6 weeks × 350.00 (Q6846) | 4,350.00 | 4,785.00 | 2144 Consumables (water) · 2127 Re-hire Manual (tank) | 4,850.00 |

**How they go on (planned):** through the page's own `setPo`, stream `toilets` (the Finance form's "Toilets — Rehire"; a PO with no stream
is read as a fencing PO, so it is set), costed to KINP, ex-GST amount, lines and the counted figures in the note. Reference only: the P&L
keeps Event Portables at the counted quantities (accrued 101,747.00) until Event Portables invoice.

**Dry run** (2 Nov 2026 12:0x AEST, record 12798, the live v12.81 page, every write aborted): the three orders staged, 9 documents planned
(each order plus its `stamps` and `by` audit documents). P&L gate (from `left_site.cjs`, read in the stage before any send): charged
1,012,101.16, labour 67,542.42, known cost 456,889.59, KINP 283,944.30 · STPS 80,826.46 · NVAC 44,272.04 · MEAD 25,660.25 — identical before
and after. Nothing reached the service. `po_fill.cjs` is the copy from `../record_02Nov2026_po_4674741/` (P&L gate, amount optional).

Not applied: Andrew's word is awaited.
