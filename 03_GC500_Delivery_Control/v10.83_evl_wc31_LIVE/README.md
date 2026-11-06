# v10.83 — 0164 is at EVL on T0024; WC31's 16-pan blocks have their location (servicing tracker)

**LIVE 20 Oct 2026 11:05 AEST.**

- **Page:** `fe480d5168ad44040dd5cd79a525bcebb444db4ccbcb91d9d0621071d7f7d4fe` (18,515,715 bytes), on v10.82 `90aa182a…`.
- **Upload:** guarded upload; the view link serves the build byte for byte.
- **Checks:** `test_v1083` passes on desktop, phone and the live page. Both sweeps: 0 errors, 0 console messages, 7/7 links, Back works.

Author: Andrew Fisher.

## What Andrew said (20 Oct 2026)

- "asset no 0164 you have in wrong area it belong here EVL wher the toilet symbol is this is an event portable toilet" (a Map explorer crop of EVL)
- "pinned location is -27.983217488199138, 153.4266422001142"
- Asked where on the record: **"Add to T0024"**, the FWF at EVL (1211968), with T0024's pin at the toilet symbol.
- "wc31 16pan Block Asset no 12 is at location -27.98253262858165, 153.42515075329888 another 16pan block asset no 74 is at location ... too"

## Record (`record_18Oct2026_vms_regos/evl_wc31_spec.json`; 10039 → 10051, VERIFIED)

- **0164:** taken off WC05 with the drawer's own `unitRemove`, and put on T0024 with `invPutOn`. It stays an Event Portables sub-hire unit, so Costs and the FWF counts don't change (checked in memory first).
- **T0024:** placed at -27.983217, 153.426642, the toilet symbol at EVL.
- **WC31:** placed at -27.982533, 153.425151. Its two 16-pan blocks already carry 12 and 74.
  - The page holds WC31 as a master-plan unit, so Navigate still uses the plan's own spot, 19 m away. The crew card uses Andrew's spot.

## Page

The tracker data and crew card:

- **WC05:** back to its block and tank.
- **T0024:** "2 × FWF" (1211968, 0164) at EVL.
- **WC31:** pin -27.982533, 153.425151.

Totals: 74 references, FWF total 242 (unchanged). Footer v10.82 → v10.83.

`tracker_data.json` matches. The DRAFT pack is 68 pages (WC05 fits half a page again); `test_sheets` 44/44.

## Open

- **T0024's servicing area:** T0024 (now 2 FWF at EVL) is in Andrew's Area 1 (Pit Lane & Paddock) but sits on Macintosh Island next to Area 3. Andrew's call.
- **WC100:** still without a pinned drop (2 trailers: The Spit and S18).
