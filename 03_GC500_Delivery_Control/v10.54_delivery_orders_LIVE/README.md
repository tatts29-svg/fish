# v10.54 — delivery orders locked, line 93 to HRP, unit photos back (DRAFT, waiting on Andrew's "Upload")

Author: Andrew Fisher · 17 Oct 2026

Andrew, 17 Oct 2026: "This day this order p63 then p62 then p60. Must be on this exact sequence … These need to locked in
with theirs order for future records".

**Delivery orders.** Each building in one of Andrew's day groups gets a "Delivery order · locked" card in its drawer.
The card shows the group in order, marks this building, and says "X is n of m — keep this exact order". Group 11 also
carries its rule: P04 only after the rest, with the WC05 tank before the WC05 block.
- **Timeline:** lists all 11 groups, plus the rule that WC17's two toilet blocks go in before P36 and P10, the day before.
- **Source:** `../sequences_17Oct2026/sequences.json`. The orders are built into the page, so nothing on site can
  change them; a new order comes in a page release.

**Line 93.** Baseplan 9968862 line 93 (1189410) now joins HRP, by the number Andrew recorded on site; the 15 Oct
docket label had joined it to P36. This is display only; the revenue already sat with HRP.

**Unit photos.** Andrew's photos against his own unit records on P65 and P66 (two each, 14 Oct) attach to the building
again, and so do P06's three photos from 30 Sep, tagged 1097453. This is display only.

## Build and checks

- On live v10.48, together with v10.49 to v10.53.
- Build: 18147333 bytes, sha256 `0d90f909127fabc508cb0d45b3138c62ec73785900c21fd5e8a60c4784439205`, check_page PASS.
- Tests on desktop and phone:
  - `tests/test_orders1054.cjs`: 22/22.
  - twin-steer: 36/36.
  - tick lock: 44/44.
  - drawer tidy: 24/24.
- Sweeps: 24 tabs and 7 links, 0 errors, desktop and phone.
