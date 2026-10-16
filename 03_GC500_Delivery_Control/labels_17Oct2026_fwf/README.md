# FWF service labels — Avery 959030 (template L7169)

Author: Andrew Fisher · 17 Oct 2026

Andrew, 17 Oct 2026: labels for the FWFs we pay to have pumped out, cleaned and restocked, with the WC, PG or reference
number. Each has day boxes, and the cleaners put a dot sticker in the box as each service is done. There's also a
final pump-out box. "I don't want to over complicate it or have stickers taken off the FWF either."

- **Labels:** one per FWF on the event-night servicing, from the live record (version 9527): **238 labels for 65
  references, on 60 sheets** (a 100-sheet pack is plenty).
- **On each label:**
  - the reference, big;
  - the unit number, with "3 of 17" on a group;
  - the location name;
  - three boxes for Fri 23, Sat 24 and Sun 25 Oct nights, each with a dashed circle for a 14 mm dot;
  - a Final pump-out box ("before it is picked up; never load one that is not pumped out").
- **WC31's** accessible FWF has no unit number on the record, so its label says "Unit —".
- **The sheet:** Avery 959030 = L7169, A4, 2 across × 2 down, 99.1 × 139 mm, top margin 9.5 mm, side margin 4.65 mm.
- **Print at "Actual size" (100%), not "Fit to page".** Print `GC500_FWF_labels_alignment_test.pdf` on plain paper
  first and hold it over a label sheet against the light.

```
python3 -I make_labels.py fwf_service_units.json .
```

`fwf_service_units.json` is the list read from the page: each reference's event-night servicing, with its FWF units.
Rerun it if FWFs are added or removed before the event.
