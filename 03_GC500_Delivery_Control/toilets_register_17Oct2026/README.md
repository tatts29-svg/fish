# GC500 toilet register — every unit (17 Oct 2026)

Author: Andrew Fisher · 17 Oct 2026

Andrew, 17 Oct 2026: "can you do me an excel reference . qty asset now. pin location. area for all toilets fwf toilet
blocks and pitlane toilets evert single one if unsure leave blank", then "make sure you have all pg numbers. etc.
example pg01. or any T reference or F reference".

**`GC500_Toilet_Register_17Oct2026.xlsx`**, from the live site record (version 9704):
- **Every unit:** 257 rows, one per unit. 74 references plus spare FWF 0164 (Pit Lane, no reference). Columns: Reference, Qty,
  Asset No, Pin location, Area, then type, unit (3 of 17), owner, location name, plan section, pin source, a map link,
  status, lat and long. Every unit on a reference has its number.
- **By reference:** one row per reference, with its quantity and asset numbers.
- **Not on the record:** Tickford's FWF (Schedule 9, 21 Oct; it is not on the record, so it is not on the page), the
  22 Oct pit-lane party trailer (Q6847), the never-allocated VIP combo blocks (Q6845), drawn-only WC18 and WC-BSF, the
  cancelled WC32/WC66/T0089, and P13-P16's "+ TOILET" schedule cells.
- **Paperwork differences:** where Baseplan, dockets or the schedule disagree with the record (WC07 1317743/1317643,
  WC01 172824, WC21 1083399, WC12, WC67, WC09, WC60). The record's numbers are the ones used.
- **Notes:** what each blank means.

Totals: FWF 234 (233 on references and spare 0164), accessible 4, toilet blocks 6 m 15, 16-pan blocks 2, FWF
trailers 2. There are four PG numbers, PG01, PG03, PG05 and PG29, and no others in any source. The standalone T
toilet references are T0024, T0162, T0176 and T0243. No F reference is a toilet.

**Blank means the record does not say.**
- Pin: the reference's 2 Oct master-plan position, not a phone pin; units in a group share it. It is blank for the pit
  garages and pit-lane team toilets, which only have the pit lane report point, and for WC85 and WC100.
- Area: the drop point the page uses. It is blank where the page falls back to its default or has no position.

**Completeness check:** every source was swept for toilet references: the live record and page data, Schedule 9,
Baseplan, dockets, Event Portables plans and quotes, master plan D001/D023, record backups and the 2025 papers. That
gave 557 sightings and 133 candidates, and each candidate was checked by an independent reviewer. A final critic found
Tickford. Nothing else is missing.

```
node read_toilets.cjs toilets_record_9704.json        # read-only, GET only (from 03_GC500_Delivery_Control/)
python3 -I make_register.py toilets_record_9704.json GC500_Toilet_Register_17Oct2026.xlsx register_extras.json
```
