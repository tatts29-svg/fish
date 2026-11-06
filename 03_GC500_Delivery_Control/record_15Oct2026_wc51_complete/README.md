# Record operation, 15 Oct 2026: WC51 — Coates asset 1197174 on, complete

Author: Andrew Fisher · 15 Oct 2026

Andrew, 15 Oct 2026 about 08:20 AEST in Claude's chat: "Asset no 1197174, WC51 accessible toilet turned up in
location. Coates asset, mark as complete."

What was done, through the page's own controls on the edit link (`wc51_complete.cjs`, spec `wc51_spec.json`):

- **1197174 put on WC51** by the drawer's rule (`numberPutOn` after the drawer's clash checks: not already on WC51,
  on no other reference; it was nowhere on the record before).
- **WC51 ticked complete** with `setDone('WC51', true)`, which also set the light **green, on site** (the page's rule:
  complete means it is on the ground). Before: red, not on site, set 3 Oct 2026.
- Six documents written, each acknowledged 200: `delivery/WC51`, `assetNumbers/WC51`, and the page's own audit
  documents beside them (`stamps/assetNumbers/WC51/1197174`, `by/assetNumbers/WC51/1197174`,
  `deleted/back/num/WC51/1197174`, `by/deleted/back/num/WC51/1197174`). Record version 6128 → 6134. Every other
  document unchanged in value. VERIFIED on the service (`report_20261014T223438Z.json`).
- Backup of the whole record before the write: `backup_state_20261014T223438Z.json` (GET /api/state, view token;
  no key in it).
- Dry run first (read only, the live page through the harness, all six writes aborted) — same six documents.

Not done: the "supplied" line for the Accessible Toilet item on WC51 (the record carries FWF × 6 supplied, 13 Oct);
the positioned-and-levelled and steps ticks; a number plate. Those are Andrew's to tick on the page when he
wants them on the record.
