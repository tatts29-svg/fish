# Record operation, 15 Oct 2026: GN06 — Coates asset 1320828 on, complete

Author: Andrew Fisher · 15 Oct 2026

Andrew, 15 Oct 2026 about 11:25 AEST in Claude's chat: "Also GN06 turned up. Complete this, asset no 1320828."

What was done, through the page's own controls on the edit link (`gn06_complete.cjs` — the WC51 runner with its spec,
`gn06_spec.json`):

- **1320828 put on GN06** by the drawer's rule (`numberPutOn` after the drawer's clash checks: not already on GN06, on no
  other reference; it was nowhere on the record before).
- **GN06 ticked complete** with `setDone('GN06', true)`, which also set the light **green, on site**. Before: red, not
  on site, set 3 Oct 2026.
- GN06 (Generator, 50kva) already carried 1283681 from the schedule; Andrew did not ask for it to come off, so it
  stays and the reference now shows both numbers. Open for Andrew: take 1283681 off if that was the planned unit
  and 1320828 is the one that came.
- Six documents written, each acknowledged 200: `delivery/GN06`, `assetNumbers/GN06` and the page's audit documents
  beside them (stamps, by, deleted/back). Record version 6180 → 6186. Every other document unchanged in value.
  VERIFIED on the service (`report_20261015T011930Z.json`, no key in it).
- Backup of the whole record before the write: `backup_state_20261015T011930Z.json` (no key in it).
- Dry run first (read only, the live page through the harness, all six writes aborted) — same six documents.
