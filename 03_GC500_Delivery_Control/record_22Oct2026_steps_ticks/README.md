# Record: the Costs tab's Steps labour tick off P60, P62 and P63

Author: Andrew Fisher. Applied 22 Oct 2026 11:51 AEST on the live v11.16 page (`8a19fcce…`), record version 10499 → 10505,
by Andrew Fisher via Claude. Backup of the whole record before: `backup_state_20261022T015100Z.json`. Report:
`report_20261022T015100Z.json`.

Andrew, 22 Oct 2026: "P60. P62 p63 can we remove steps these dont have steps" (the drawer's Steps tick came off at
09:03, `../record_22Oct2026_no_steps/`), then "we charge for the works we do we cant charge for things that have not
been done". The Costs tab keeps its own labour tick per building and line, and the Steps tick on these three was still on,
so the page still priced steps for them ($156.15 each on the card). The three labour ticks came off through the page's
own labour control (`labour_off`, the same document removal the Costs tab makes when an editor unticks it), named in the
spec's `allowRemove` so the runner's removal guard let exactly those three through.

| Building | Before | After |
|---|---|---|
| P60 Gate 5 Ticket Box (4.8 m) | Steps labour tick on | off |
| P62 Gate 5 QFES Office (6 m) | Steps labour tick on | off |
| P63 Gate 5 Volunteer Sign On (6 m) | Steps labour tick on | off |

Dry run first with every write aborted; then `--apply` with the public page's SHA-256 checked, exactly the six planned
documents (three labour documents removed, their three stamps), every other document verified unchanged in value, every
op verified on the service. On site, Complete and Levelled untouched; Today unchanged. Buildings with steps on the Costs
tab now 40 of 47, the same seven without as the drawer (P06, P38, P39, P42, P60, P62, P63).
