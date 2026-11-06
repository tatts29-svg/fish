# Record operation, 15 Oct 2026: seven toilet references — Event Portables FWF units arrived and complete

Author: Andrew Fisher · 15 Oct 2026

Andrew, 15 Oct 2026 about 13:05 AEST in Claude's chat: "Toilets in today. Event portables WC25 0472; WC23 0960 0107
0968 0969 0992; WC47 0949; WC26 0075; WC13 0444 0036; WC24 0489; WC55 0650. All done complete".

What was done, through the page's own controls on the edit link (`ep_arrived.cjs`, spec `ep_spec.json`), the same
sequence as the 14 Oct operation and this morning's WC29/WC28: one unit identity record per number through the
drawer's own save after its clash checks (the count must equal the reference's FWF quantity — it did on all seven),
the supplied count, the install tick, the delivery date 15 Oct 2026 and the complete tick, which also set each light
green, on site. Before: every one red, not on site (3 Oct).

| Reference | Units | Supplied |
|---|---|---|
| WC25 | 0472 | 1 of 1 |
| WC23 | 0960, 0107, 0968, 0969, 0992 | 5 of 5 |
| WC47 | 0949 | 1 of 1 |
| WC26 | 0075 | 1 of 1 |
| WC13 | 0444, 0036 | 2 of 2 |
| WC24 | 0489 | 1 of 1 |
| WC55 | 0650 | 1 of 1 |

- 85 documents written, each acknowledged 200: twelve unit records, supplied, labour and delivery on each of the
  seven references, and the page's stamps and by documents beside them. Record version 6242 → 6327. Every other
  document unchanged in value. VERIFIED on the service (`report_20261015T030950Z.json`, no key in it).
- One rule learned and put in the runner: WC55's plan date is already 15 Oct, and the page's own date setter stores
  no override when the day IS the plan day ("back on its plan date"), so the check now accepts an empty date when the
  plan date equals the arrival day. The first dry run stopped on exactly that, nothing written; the second passed.
- Backup of the whole record before the write: `backup_state_20261015T030950Z.json` (no key in it).
- Dry run first (read only, the live v10.25 page through the harness, all 85 writes aborted) — same 85 documents.
