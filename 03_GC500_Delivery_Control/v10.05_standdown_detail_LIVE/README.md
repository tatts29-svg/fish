# Visible generator standdown — v10.05

Author: Andrew Fisher

VERIFIED LIVE — 12 Oct 2026, 14:25 AEST. Implementation `3717cc8d`; READY `c98b8b87`. Public SHA256 `65bba5cb7477816d587cb72025ff256f2eb8c2dbc65eb4087dccc5ad49f4622a` (14,950,116 bytes; 90 scripts).

Andrew asks: “Standdown i want the rate per day. Start and end date. And the total days then tptal inckuded”. The existing Standdown charge column now contains per-unit daily rate, actual or planned start, inclusive end, total calendar days and the shared total charge. All five facts remain visible without opening More info. Daily rate is displayed to cents as on the card; its full calculation precision remains under More info. Quantity is already included in the shared charge.

Positive standdown periods end on 22 October; 12–22 October is 11 days. The delivery date appears once, as the actual or planned standdown start. Arrivals on or after race Friday show zero days and no applicable standdown dates, retaining their separate arrival date. Unknown start dates remain unrecorded, without borrowing a planned date for an actual arrival. Rates, financial calculations, quantities, receipts, map positions and native records are unchanged.

Root owns implementation and publication; scoped independent review checked date boundaries, quantity and precision semantics. Build from exact v10.04 SHA256 `0030d7d3d6838fcad67773cdb19927ea0388591aa33cbc163e53d0d02d182443` with `toolchain/build.sh v10.05 v10.05_standdown_detail_LIVE/patch_v1005.py`.

Validation so far: 110 desktop and 110 phone checks passed against the final candidate, including every displayed rate/date/day/total, inclusive dates, missing dates, zero standdown and unchanged shared totals. Source guards confirm the shared generator source is unchanged and reject wrong/repeated bases. Both final navigation sweeps pass: 22 routes, seven deep links, Back, zero page or console errors. Phone preview inspected. No operational writes.

The public page serves the approved candidate byte for byte. Actual-public desktop and phone each passed all 110 checks; zero page errors or attempted writes. Standdown and complete generator totals are unchanged and reconcile with Costs/P&L and branches.
