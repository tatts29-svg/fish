# Event Portables, 16 Oct 2026, batch 6: WC09 back to 10, WC30 to 8 — APPLIED, VERIFIED

Author: Andrew Fisher. Andrew, 16 Oct 2026 (about 11:00 AEST): "WC09, you should have 10. It already had 4. I gave you
6 numbers."

So the correction at 10:48 (batch 4) moved four units too many. The first four given for WC30 that morning (0428, 0440,
0024, 0419) were WC30's; only the six that followed (0993, 0584, 0089, 0553, 0081, 0140) are WC09's.

| Reference | Schedule asks | After |
|---|---|---|
| WC30 | 8 FWF | 0681, 0043, 0963, 0545 (15 Oct) and 0428, 0440, 0024, 0419 (16 Oct): 8 of 8, installed, dated 16 Oct, complete, light on site |
| WC09 | 10 FWF | 0085, 0551, 0450, 0585 (before today) and 0993, 0584, 0089, 0553, 0081, 0140: 10 of 10, supplied 10; install and complete ticks as they were; the "14 against 10" note from batch 4 cleared (WC09 carried no note before) |

Through the page's own controls: the four removed from WC09 with the drawer's Remove (history kept), added to WC30 with
the drawer's save, WC30's supplied, install, date and complete set; WC09's supplied count and note set with
`setSupplied` and `setDeliveryNote`, its ticks untouched. The runner learned `adjust` (supplied and note on a reference
units left, ticks untouched). Dry run on the live page (7143): 29 documents, every write aborted, no errors. Apply 10:58
AEST: 7143 → 7172, verified and read back (WC30 8 units, supplied 8, complete; WC09 10 FWF units, supplied 10,
complete, no note); `report_20261016T005814Z.json`, backup beside it.
