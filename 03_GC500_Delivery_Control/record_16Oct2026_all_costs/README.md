# All costs in: demob and pick-up on everything on site, fire extinguishers where recorded — APPLIED, VERIFIED (16 Oct 2026, record 8077 → 9515)

Author: Andrew Fisher. Andrew, 16 Oct 2026: "I want us to have all cost in now please. Include demob and pick up
charges. I want all costs showing as complete if I have it on site on my records." Then: "don't add things I never
ticked, I never ticked all those fire extinguishers … if I have added they have them, if I have not added they don't."

Through the page's own setLabour (and setDone), `all_costs.cjs` (extended from `record_16Oct2026_here_costs`), backup
first, held sender, write gate, read-back. A tick a person took off is never put back.

| Step | What | Record | Result |
|---|---|---|---|
| 1st apply (all lines) | interrupted by the runner's own guard (an automatic retry) after 54 stamps landed with no ticks — 16 fire extinguisher, 15 demob, 23 pick-up | 8077 → 8131 | STOPPED; backup `backup_state_20261016T090919Z.json` |
| fix 1 | the 16 fire extinguisher stamps taken off entirely, so those lines read as never ticked | 8131 → 8147 | VERIFIED `report_20261016T091527Z.json` |
| fix 3 | fire extinguisher ticked on the 10 buildings that carry a fire extinguisher accessory on the record: P08, P25, P45, P46, P51, P52, P54, P57, P66, P69 (10 × $52.05 = $520.50) | 8147 → 8177 | VERIFIED |
| fix 2, batches 1–4 of 40 references | demob 316 and pick-up 130 on every reference on site (the 38 interrupted stamps treated as this run's own, not a person's untick) | 8177 → 9515 | VERIFIED each; batch 5 found nothing left |

Every on-site reference was already ticked complete. Six ticks a person had taken off stay off. Totals at the card:
demob $19,956.73, pick-up $51,640.00, fire extinguishers $520.50.

Buildings breakdown from the record after this: `../buildings_charges_16Oct2026/GC500_Buildings_Charges_16Oct2026.xlsx`.

Page note found while checking: the reference's "arrived charges" list leaves the fire extinguisher line out ($603.78 on
P08) while the labour money counts it ($655.83). A display gap for a later release; the record is right.
