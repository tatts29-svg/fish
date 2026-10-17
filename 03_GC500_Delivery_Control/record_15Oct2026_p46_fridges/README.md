# Record operation, 15 Oct 2026: fridges 1311992 and 1283996 off T0265, onto P46

Author: Andrew Fisher · 15 Oct 2026

Andrew, 15 Oct 2026 about 14:15 AEST in Claude's chat: "T0265 was cancelled. Fridges 1311992 and 1283996, can we add
these to P46".

What was done, through the page's own controls on the edit link (`fridges_to_p46.cjs`, spec `fridges_spec.json`):

- **Off T0265** (Fridge × 4 · OP42 Fridge, the plant line Codex recorded as arrived and complete on 14 Oct with 1318501,
  1260164, 1283996, 1311992): the unit records for 1311992 and 1283996 archived through `UnitIdentity1006.remove`
  (active false, removed by Andrew Fisher with the time), the way the drawer's Remove does it.
- **Onto P46** (QPS Command Post): each attached as a **Fridge accessory** through the drawer's own Accessories form —
  openAsset, type Fridge, the number, quantity 1, Add — after the drawer's duplicate checks and a check that neither
  number sits on any other reference. P46 now carries air conditioners 1327959 and 1327960 and fridges 1311992 and
  1283996 (Andrew had taken the replacement fridge 1272751 off P46 at 14:09 AEST; 1328957 went to P54 on 14 Oct).
- Eleven documents written, each acknowledged 200: the two archived unit records with their stamps and by,
  `accessories/P46` and the page's putting-back records beside it. Record version 6337 → 6348. Every other document
  unchanged in value. VERIFIED on the service (`report_20261015T041636Z.json`, no key in it).
- Backup of the whole record before the write: `backup_state_20261015T041636Z.json` (no key in it).
- Dry run first (read only, the live v10.25 page through the harness, all eleven writes aborted) — same eleven documents.

**Not done, Andrew's call:** T0265 itself still reads on site and complete with 1318501 and 1260164 on it and "supplied
4". "Cancelled" was stated, not asked for; the page's own deletion (`deleteAsset`) is permanent with no put-back, so it
waits for Andrew's word — and for what happens to the other two fridges.
