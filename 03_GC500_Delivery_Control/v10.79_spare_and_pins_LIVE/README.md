# v10.79 — no spare; WC05 has FWF 0164; pit lane and WC85 pins (servicing tracker)

**LIVE 20 Oct 2026 09:33 AEST.**

- **Page:** `a0f2a41bba529d8322fcbba1faae210cfbd3aa6725df8051c11abbe796932514` (18,515,086 bytes), on v10.78 `f6123867…`.
- **Upload:** guarded upload; the view link serves the build byte for byte.
- **Checks:** `test_v1079` passes on desktop, phone and the live page. Both sweeps: 0 page errors, 7/7 links, Back works. The phone sweep's only messages were the outside weather service throttling us (429), not the page.

Author: Andrew Fisher.

## What Andrew asked (19–20 Oct 2026)

- "We shouldn't have any spare now"
- "Allocate it to eventco. Allocate it in here please" (Map explorer screenshot of the Event Operations Compound: EVL, ABD, OPS)
- "Wc85 goes here https://maps.app.goo.gl/a5Ccvr1aXqedGv2K6"
- "Add to this pinned locaction https://maps.google.com/?q=-27.986807,153.428013 ... pg05 pg29 pg01 pg03"

## Record (9941 → 9963, VERIFIED)

Spec: `record_18Oct2026_vms_regos/spare_pins_spec.json`. Backup first; 22 documents written. Report: `report_20261019T231541Z.json`.

- **The spare:** the record's only spare was Event Portables FWF 0164, parked at Pit Lane since 30 Sep. It came out of spares onto **WC05**, the Event Operations Compound toilet, through the page's own `spareUse`.
  - The page won't type it as an FWF at WC05, because WC05's descriptions are a block and a tank. It sits on WC05 as an Event Portables sub-hire unit.
  - Costs are unchanged.
- **Pit lane pins:** PG01, PG03, PG05 and PG29 were placed at **-27.986807, 153.428013** through `placeHere`. They now navigate there instead of "report to the pit lane".
- **WC85:** placed at **-27.938636, 153.426477**, which is where the short link resolves. That's about 5.5 km from the drawings, at the Seaway.

## Page

The servicing tracker data (`SVC1067_DATA`) and crew card (`SVC1067_CARD`) follow the record:

- the SPARE reference is gone from area 1;
- WC05 gains "1 × FWF" (0164);
- PG01, PG03, PG05, PG29 and WC85 carry their pins.

Totals: 74 references (was 75); the FWF total is unchanged at 242. Footer v10.78 → v10.79.

`servicing_tracker_DRAFT/tracker_data.json` and the print pack's `maps.json` match.

```
bash toolchain/build.sh v10.79 v10.79_spare_and_pins_LIVE/patch_v1079.py
BASE=build/GC500_v10.79/base_live.html PAGE=build/GC500_v10.79/GC500_Delivery_Control_hosted.html [MOB=1] [LIVE=1] node v10.79_spare_and_pins_LIVE/test_v1079.cjs
```

## Print pack (DRAFT)

69 pages; `test_sheets` 44/44, with every QR decoded.

- **WC05:** it now has three lines (block, tank, FWF), so it gets a page of its own rather than overflow half a page. Any reference too tall for half a page does the same.
- **Pit lane:** the four PG sheets have a directions QR (one shared pin).
- **WC85 and the Teams Area cover:** they say "Off the plan" (pinned, but not on the drawing) instead of "No pin".

## Still without a pinned drop (Andrew: "So all toilets should have a location and pinned drop")

These need a pin from Andrew or a phone pin on site:

- **T0024:** drawn on the plan near Narrowneck, no GPS pin.
- **Teams Area:** BJR01, SVP01, T0162, T0176.
- **WC100:** two trailers, 1288823 "at The Spit" and 1248439 "at S18".
