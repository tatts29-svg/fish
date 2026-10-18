# Record operation, 15 Oct 2026: WC30 — four Event Portables FWF units arrived (partial, 4 of 8)

Author: Andrew Fisher · 15 Oct 2026

Andrew, 15 Oct 2026 about 12:25 AEST in Claude's chat: "WC30 get 0681 0043 0963 0545".

WC30 asks for 8 FWF; four numbers were given, so the runner refused the complete path and the arrival was recorded as
**partial** (`ep_arrived.cjs` with `"partial": true`, spec `ep_spec.json`): one unit identity record per number through
the drawer's own save after its clash checks (0681, 0043, 0963, 0545, Event Portables, FWF, note "Arrival and
installation confirmed by Andrew Fisher, 15 Oct 2026."), and the supplied count FWF 4 (`setSupplied`). **Nothing
ticked**: no install tick, no delivery date, no complete tick; the light stays red, not on site (3 Oct), until the other
four arrive or Andrew says the scope is four.

- Fifteen documents written, each acknowledged 200: four unit records, the supplied document and the page's stamps and
  by documents beside them. Record version 6225 → 6240. Every other document unchanged in value. VERIFIED on the
  service (`report_20261015T021928Z.json`, no key in it).
- Backup of the whole record before the write: `backup_state_20261015T021928Z.json` (no key in it).
- Dry run first (read only, the live page through the harness, all fifteen writes aborted) — same fifteen documents.
- The runner is the WC29/WC28 one with the partial mode added (fewer numbers than asked: units and supplied only).
