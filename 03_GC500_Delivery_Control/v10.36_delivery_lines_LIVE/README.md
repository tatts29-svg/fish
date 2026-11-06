**Published in v10.36 on 16 Oct 2026 at 06:41 AEST.** Page `d72e7f6198111f51…` (18,024,035 bytes), read back byte for byte by the view link; the stack v10.32 → v10.36 went up together on the live v10.31. Author: Andrew Fisher.

# v10.36 — a contract's "Delivery for Line Item(s) 7,14" names its units (LIVE)

Author: Andrew Fisher. Andrew, 16 Oct 2026: "You should also have transport charges we charge for delivery and pick up",
with the 2026 rate card workbook (`Rate_Card_2026 (1).xlsx`, sha256 `60a62f37…` — the same file the page already holds,
whose Transport tab is the page's cost/charge pair for every item: a 60 kVA generator $300.39 cost, $450 charge, each way).

The page had the charges. What it got wrong was one contract line. The transport model reads a contract's own transport
lines and allocates each to the hire lines it names; it read "Delivery for **HA** Line Item(s) 1,2" (9973079) but not
"Delivery for Line Item(s) 7,14" (NVAC 9961976 line 50, $359.80, the delivery of GN19 and GN04). An unread line is
"unallocated", and an unallocated delivery line held **every** generator's delivery leg at nought with the reason
"Existing transport has no exact building allocation" — so twelve generators showed a pick-up charge at the card and no
delivery charge.

| Change | Effect |
|---|---|
| `buildingTransportSource831`: "Line Item(s) 7,14" names its lines, with or without "HA" | 9961976 line 50 is GN19's and GN04's delivery (held: one line of quantity 1 for two units, nothing added at the card for them). The unread line had held the delivery leg of everything the unallocated rule reached: now 12 generators ($5,550: $450 for 50–80 kVA, $300 for 20–45 kVA, $1,200 for 200 kVA and cables), the lighting towers LT05, LT06 and T0002 ($1,050) and the access plant T0004 and T0005 ($1,500) carry the card's each-way delivery charge, as their pick-up legs already did: **+$8,100** of transport additional, 17 delivery legs, nothing else moves. GN20 (350 kVA, POA) stays held. The VMS boards stay held: the card's Transport tab says POA for a VMS board in every column, and no VMS contract carries a transport line. |
| The malformed-line check | Reads the same two spellings. |
| Footer | v10.35 → v10.36 |

No rate changes; no record changes. The Transport tab's figures on the page are unchanged.

## Checks

| Check | Result |
|---|---|
| `check_page.py` | PASS |
| `tests/test_lines1036.cjs` (page from the build, the v10.35 build as the before picture, every write aborted) | ALL 12 PASSED — the line names hire lines 7 and 14, the HA spelling still reads, the other 8 transport lines name none; 12 generator delivery legs at the card, GN19/GN04/GN20 held; exactly 17 delivery legs changed (all held by the unread line before, all the card charge now) and the transport additional rises by exactly their $8,100 (104,100 → 112,200) |
| `harness/sweep.js` desktop and phone | desktop 24 tabs, 18 shown, 0 errors (the one console line is v10.34's picture 404 until the media step runs); phone sweep result in STATUS |

Build `build/GC500_v10.36/` sha256 `d72e7f6198111f51…` (18,024,035 bytes), chain v10.32 + v10.33 + v10.34 + v10.35 +
v10.36 on the live v10.31 (`e592f9f5…`). Goes live on Andrew's "Upload", with the four before it (v10.34's picture goes
on the service first; see its README).

```sh
toolchain/build.sh v10.36 v10.32_all_today_LIVE/patch_v1032.py v10.33_seven_symbols_LIVE/patch_v1033.py v10.34_barriers_picture_LIVE/patch_v1034.py v10.35_generators_vms_LIVE/patch_v1035.py v10.36_delivery_lines_LIVE/patch_v1036.py
BEFORE=build/GC500_v10.35/GC500_Delivery_Control_hosted.html PAGE=build/GC500_v10.36/GC500_Delivery_Control_hosted.html node v10.36_delivery_lines_LIVE/tests/test_lines1036.cjs
```
