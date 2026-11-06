# Record operation, 15 Oct 2026: P60 — 4 × Swivel chair attached

Author: Andrew Fisher · 15 Oct 2026

Andrew, 15 Oct 2026 about 09:05 AEST in Claude's chat: "P60 can we add swivel chairs qty 4".

What was done, through the page's own drawer on the edit link (`p60_accessory.cjs`, spec `p60_spec.json`): the
Accessories form on P60 (Gate 5 Ticket Box, Ticket Box 4.8m) driven exactly as a person does it — `openAsset('P60')`,
type "Swivel chair" picked from the drawer's own list, quantity 4 typed, Add pressed — so the row carries the
drawer's own fields (`4x Swivel chair`, no asset number, origin "added in this page", added by Andrew Fisher at
09:05:58 AEST) and the page's putting-back record beside it.

- Three documents written, each acknowledged 200: `accessories/P60` (now the air conditioner 1267597 Andrew added at
  09:00 and the four swivel chairs), `deleted/back/acc/P60/…` and `by/deleted/back/acc/P60/…`. Record version
  6163 → 6166. Every other document unchanged in value. VERIFIED on the service (`report_20261014T230551Z.json`).
- Backup of the whole record before the write: `backup_state_20261014T230551Z.json` (GET /api/state, view token;
  no key in it).
- Dry run first (read only, the live page through the harness, all three writes aborted) — same three documents.

The runner is the WC51 one with the stage swapped for the drawer's Add; it refuses a type the drawer does not offer,
a quantity that is not a whole number, and any write outside the reference's accessories documents.
