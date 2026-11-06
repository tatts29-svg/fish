# Record: P06's asset number is 1087453; 1097453 taken off

Author: Andrew Fisher. Applied 22 Oct 2026 12:08 AEST on the live v11.16 page (`8a19fcce…`), record version 10505 → 10509,
by Andrew Fisher via Claude. Backup of the whole record before: `backup_state_20261022T020831Z.json`. Report:
`report_20261022T020831Z.json`.

Andrew, 22 Oct 2026, on P06 (Wilclean crib room, 6 m): "on our end this is the correct number 1087453. please delete and
remove this number now 1097453". The record had carried 1097453 since 17 Oct (his word then: "It stays 1097453 my data
is truth"); today he settles it the other way, which is also what Baseplan 9968862 line 64 carries, so that line now
aligns and the Costs tab's "Site vs Baseplan · to align" card clears.

| Reference | Before | After |
|---|---|---|
| P06 Wilclean Crib Room, 6 m | 1097453 | **1087453** |

Through the page's own asset-number control (`number_on` 1087453, then `number_off` 1097453), via `p06.cjs` (the record
runner, unchanged). Dry run first with every write aborted; then `--apply` with the public page's SHA-256 checked,
exactly the four planned documents (the number document, its stamp, and the page's own two deletion records for the
number taken off), every other document verified unchanged in value, every op verified on the service. Light, Complete,
accessories untouched.
