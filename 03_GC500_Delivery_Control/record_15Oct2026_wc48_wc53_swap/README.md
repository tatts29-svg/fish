# Record operation, 15 Oct 2026: WC48 and WC53 — Event Portables unit numbers swapped

Author: Andrew Fisher · 15 Oct 2026

Andrew, 15 Oct 2026 about 10:05 AEST in Claude's chat: "WC48 can we add 0471 and take off 0952, and with WC53 take
off 0471 and add 0952".

What was done, through the page's own unit-identity controls on the edit link (`wc_swap.cjs`, spec
`swap_spec.json`): the two Event Portables FWF unit records were swapped between the references — 0952 taken off
WC48 and 0471 taken off WC53 first (each record archived, `active: false`, removed by Andrew Fisher with the time,
the way the drawer's Remove does it), then 0471 put on WC48 and 0952 put on WC53 (a new identity record each, through
the same save the drawer's form uses, after the page's own clash checks). Both off before either on, because the
page refuses to put a number on while it is still active on another reference.

- Twelve documents written, each acknowledged 200: the four unit records (two archived, two new) and the page's
  stamps and by documents beside them. Record version 6168 → 6180. Every other document unchanged in value.
  VERIFIED on the service (`report_20261015T011756Z.json`, no key in it).
- After: WC48 carries 0050, 0289, 0486, 0471; WC53 carries 0951, 0074, 0952 (all Event Portables, FWF). The two
  archived records keep their history (Codex's arrival note of 14 Oct); the new records carry no note.
- Backup of the whole record before the write: `backup_state_20261015T011756Z.json` (GET /api/state, view token;
  no key in it).
- Dry run first (read only, the live page through the harness, all twelve writes aborted) — same twelve documents.
