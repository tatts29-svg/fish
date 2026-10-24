# v10.87 — servicing areas regrouped by where the toilets are; T0024's two toilets each at their pin

LIVE 20 Oct 2026 19:29 AEST. Page sha256 `e073add8b16cdb735929b66ede2cdb45b69b7a0a31aef1208ab60f5e3c3e35f2`
(18,528,912 bytes), on v10.86 `d18ac8bf…`. Guarded upload, byte for byte. Author: Andrew Fisher.

Andrew, 20 Oct 2026: "I told you they are all here" (PG01, PG03, PG05, PG29 at his pin); "Your also missing the toilets
from here ... One that was a coates toilet and the other was one for EVL WHICH I PINNED BOTH OF THESE FOR YOU TODAY";
"Group things together that are close your making no bloody sense"; "Whole point of have areas so they are areas and
dont cross into another area or are really far apart"; "Make sure we mention all asset numbers too please for that refernce".

## What was wrong
The sheet maps placed each reference at its **text tag** on the master plan. Where the tag is printed away from the toilet,
the sheet drew the tag: PG01/03/05/29 125 m out, T0024 664 m out. Every other pinned toilet was already at its pin (median 0 m).
The areas were Andrew's first 13, and 1, 2 and 13 interleaved round the pits; Area 10 spread 687 m.

## What changed
- `print/render_maps.cjs`: a reference with a pin is drawn at its pin (through the plan's own registration) when the tag
  is more than 20 m from it. A line with its own pin gets its own spot (`line_spots` in maps.json).
- T0024 is two lines: 1 × FWF at EVL (0164, Andrew's T0024 pin) and 1 × FWF at the Coates office (Coates' own 1211968,
  Andrew's Coates office pin, 21 m away). Both on the map, each label naming its asset number.
- **14 areas regrouped by the pins**: each one patch, none inside another's outline (checked), largest span 337 m (Area 4).
  WC85 Seaway (Area 14), WC100 no pin (Area 0).
- Live tracker updated with the same token: every printed code unchanged (token and all 74 signatures compared).

## Checks
e2e 21/21 (practice day); test_card_v2 46/46; test_sheets 47/47.
