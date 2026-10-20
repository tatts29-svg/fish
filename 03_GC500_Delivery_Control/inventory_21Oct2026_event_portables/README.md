# Event Portables inventory — every toilet unit on the servicing tracker (21 Oct 2026)

Andrew, 21 Oct 2026: "Give codex access to event portaloo inventory". This folder is the shared copy for Codex and anyone
else working on the job. Author: Andrew Fisher.

| File | What |
|---|---|
| `event_portables_inventory.csv` | 265 rows, one per unit |
| `event_portables_inventory.xlsx` | the same, with filters, plus a "By area" sheet |

**Columns:** area and name, reference, where / drop point, tracker line, what, type, servicing kind, asset number, owner on
record, pin (lat, lon, Google Maps link), and the jobs on Fri/Sat nights and on Sun night.

**Counts:** 74 references, 265 units. 236 FWF, 15 toilet blocks 6 m, 6 waste tanks, 4 accessible, 2 16-pan blocks,
2 FWF trailers. Every unit has an asset number.

## Source and how far to trust it
- Areas, references, lines, asset numbers and pins come from `servicing_tracker_DRAFT/tracker_data.json`, sha256
  `c2fad38bf7aea40c…`. That is the data in live v10.87 / v10.95 and on the live event tracker.
- Pins: Andrew's own pins lead. T0024 is two lines at two pins: 0164 at EVL, and Coates' own 1211968 at the Coates office.
- **Owner on record** is read from the live record's unit records (`unit925-record`, read-only GET, 21 Oct): 104 Event
  Portables, 7 Coates. **154 units are blank** because the record has no owner row for that number. They are not guessed.
  Seven-digit numbers are usually Coates fleet numbers, but confirm against the record or the supplier before charging on it.
- WC85 (Coates Compound, Seaway) and WC100 (no pin) are included.

## What is deliberately not here
- The servicing QR links and the tracker token. The printed codes are permanent and stay private; ask Andrew for the
  print pack if you need it.
- Crew names or phone numbers.

**Changes go through the owner.** Any change to areas, units or pins is a servicing tracker change, and Claude owns that.
Raise it on PR #1, don't edit `tracker_data.json` directly. Rebuild this inventory from the same data after any change.
