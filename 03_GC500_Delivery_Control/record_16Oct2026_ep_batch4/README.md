# Event Portables, 16 Oct 2026, batch 4: WC19, PG03, and WC30's ten moved to WC09 — APPLIED, VERIFIED

Author: Andrew Fisher. Andrew, 16 Oct 2026 (about 10:45 AEST): "Here and installed WC19 0435. Sorry my mistake, the
ones I told you for WC30 are for WC09. PG03 FWF installed asset no 0100."

| Reference | Schedule asks | What changed | After |
|---|---|---|---|
| WC19 | 1 FWF | 0435 | 1 of 1, installed, dated 16 Oct, complete, light on site |
| PG03 (Toilet, Pit Garage) | 1 FWF | 0100 | 1 of 1, installed, dated 16 Oct, complete, light on site |
| WC09 | 10 FWF | 0428, 0440, 0024, 0419, 0993, 0584, 0089, 0553, 0081, 0140 moved here from WC30 | **14 FWF against the schedule's 10** (0085, 0551, 0450, 0585 were on the record before today), supplied 14, install tick on; WC09 was already complete for its toilet block, so the complete tick and date are left as they were; a delivery note says the quantity or the earlier four are to be checked |
| WC30 | 8 FWF | the ten taken off | back to its 15 Oct state: 0681, 0043, 0963, 0545 on, supplied 4, install tick off, complete off, date off the record, note cleared; the light stays on site (four units are) |

## How the move was made

Through the page's own controls, nothing else. Each of the ten was removed from WC30 with the drawer's own Remove
(`UnitIdentity1006.remove`, which keeps the unit's history under WC30 marked inactive) and added to WC09 with the
drawer's own save (`unit925Save`), then WC09's supplied count and install tick were set. WC30's revert used the same
setters the person would click: supplied 4 (`setSupplied`), install off (`setLabour`), complete off (`setDone`), date
back to the plan (`setDate`), note cleared (`setDeliveryNote`). The runner (`ep_arrived.cjs`, from batch 3) learned
`moved_from` on a row and `revert_from` for the reference the units left; the install tick coming off WC30 is the one
document removal the plan allows, gated like every other write.

Dry run on the live page (record 7017): 85 documents, every write aborted, no page errors — PASSED. Apply at 10:48
AEST: record 7017 → 7102, every document acknowledged, read back and verified, other documents unchanged;
`report_20261016T004811Z.json`, backup `backup_state_20261016T004811Z.json`.

## Still open for Andrew

WC09 now reads 14 FWF units against 10 on the schedule. Either the schedule row is short, or the four recorded
before today (0085, 0551, 0450, 0585) belong elsewhere. The record carries what was said; nothing was guessed.
