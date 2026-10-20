# Toilets — reference and all charges from the site record, 16 Oct 2026

Author: Andrew Fisher. Andrew, 16 Oct 2026: "next let's do the toilets and all costs. Include the delivery, install,
clean, demob, pick up, levelling and steps if applicable, as well as Friday, Saturday, Sunday pump out rates (FWF
$72.87, tank $624.60, sewer connect $260.25)" and "Accessible treat it as a FWF".

`GC500_Toilets_Charges_16Oct2026.xlsx` — one row per toilet reference on site (74): units, hire, delivery, install,
levelling, steps, cleaning, demob, pick-up, Fri / Sat / Sun night servicing, three-night servicing, total; plus
Servicing by type and Not on site (WC32, cancelled). Read with `toilets.cjs` from the v10.49 build (accessible
toilets as FWF) against the live record 9515; `build_xlsx.py` builds the sheet.

| | |
|---|---|
| Hire (contract) | $68,641.91 |
| Delivery / pick-up | $21,330.00 / $21,520.00 |
| Install / demob | $13,069.96 / $13,069.96 |
| Levelling / steps / cleaning | $3,018.90 / $2,654.55 / $4,528.35 |
| Servicing, Fri + Sat + Sun | $24,026.28 a night, **$72,078.84** |
| **Total** | **$219,912.47** |

- Every card cost on every toilet on site is ticked (a dry run of the all-costs runner found nothing left to tick).
- WC01's install was taken off by a person and stays off.
- WC02, WC04, WC06: delivery was billed on the Coates contract (a reviewed contract delivery line, e.g. 9968955
  line 135 $278.39); the card delivery is held so it is not charged twice — that is the $190 between delivery and
  pick-up.
- Servicing: FWF 239 units incl. 4 accessible ($72.87), 6 waste tanks ($624.60), 11 sewer-connect blocks ($260.25).
  Pee panels carry none.
