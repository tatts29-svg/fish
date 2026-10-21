# Record: the Steps tick off P60, P62 and P63 (no steps on these buildings)

Author: Andrew Fisher. Applied 22 Oct 2026 09:03 AEST on the live v11.15 page (`d253cecd…`), record version 10491 → 10494,
by Andrew Fisher via Claude. Backup of the whole record before: `backup_state_20261021T230305Z.json`. Report:
`report_20261021T230305Z.json`.

Andrew, 22 Oct 2026: "P60. P62 p63 can we remove steps these dont have steps".

| Reference | Before | After |
|---|---|---|
| P60 Gate 5 Ticket Box (4.8 m) | steps ticked 14 Oct | steps off |
| P62 Gate 5 QFES Office (6 m) | steps ticked 14 Oct | steps off |
| P63 Gate 5 Volunteer Sign On (6 m) | steps ticked 14 Oct | steps off |

On site, Complete and Levelled are untouched. The tick came off through the drawer's own Steps control
(`setSteps(ref, false)`, which keeps the steps history on the document), via `steps.cjs` (the record runner with a
`steps_off` op). Dry run first with every write aborted; then `--apply` with the public page's SHA-256 checked, exactly
the three delivery documents allowed through once each, every other document verified unchanged in value, every op
verified on the service.

Today after: buildings 52 of 52 (unchanged); the buildings facts now read 42 with steps (was 45). The race-day
broadcast's turn 8 said forty-five and is re-voiced to forty-two in v11.16 (LIVE 09:11, `v11.16_stairs_count_LIVE/`) so the call and the record say the same.
