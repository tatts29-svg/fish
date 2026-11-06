# Record operation, 15 Oct 2026: WC29 and WC28 — Event Portables FWF units arrived and complete

Author: Andrew Fisher · 15 Oct 2026

Andrew, 15 Oct 2026 about 11:35 AEST in Claude's chat: "Toilets here and complete, event portables WC29 0598 0044 0707
0441 0546 0564 0079; WC28 0102".

What was done, through the page's own controls on the edit link (`ep_arrived.cjs`, spec `ep_spec.json`), the same
sequence as the 14 Oct 2026 operation (`record_14Oct2026_event_portables`):

- **One unit identity record per number** (`unit925Save`, the drawer's own save, after its clash checks): WC29 ×7
  (0598, 0044, 0707, 0441, 0546, 0564, 0079), WC28 ×1 (0102), Event Portables, FWF, note "Arrival and installation
  confirmed by Andrew Fisher, 15 Oct 2026." The runner refuses if the count does not equal the reference's FWF
  quantity (WC29 asks 7, WC28 asks 1) or if a number is already active anywhere.
- **Supplied** FWF 7 on WC29 and 1 on WC28 (`setSupplied`); the **install tick** on each (`setLabour`); the **delivery
  date** 15 Oct 2026 (`setDate`); the **complete tick** (`setDone`), which also set the light green, on site. Before:
  WC29 in transit (5 Oct), WC28 not on site (3 Oct).
- 38 documents written, each acknowledged 200: eight unit records, two supplied, two labour, two delivery, and the
  page's stamps and by documents beside them. Record version 6187 → 6225. Every other document unchanged in value.
  VERIFIED on the service (`report_20261015T021550Z.json`, no key in it).
- Backup of the whole record before the write: `backup_state_20261015T021550Z.json` (no key in it).
- Dry run first (read only, the live page through the harness, all 38 writes aborted) — same 38 documents.
