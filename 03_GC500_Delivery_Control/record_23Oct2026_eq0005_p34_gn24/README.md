# Record: EQ0005 fork extensions arrived, P34's two pad chairs received, GN24's 1277089 identified as the 60 kVA

Author: Andrew Fisher. Applied 23 Oct 2026 13:40 AEST on the live v11.54 page (`d23c1278…`), record version 10545 → 10557,
by Andrew Fisher via Claude. Backup of the whole record before: `backup_state_20261023T034048Z.json`. Report:
`report_20261023T034048Z.json`.

Andrew, 23 Oct 2026 12:58, on the three Questions-tab items left after v11.53: "EQ0005 fork extensions arrived yes they
did and P34 pad chairs are here just add the qty no assets on these chairs you have the Gn24 numbers 1277089".

| Reference | Before | After |
|---|---|---|
| EQ0005 Fork Extensions 2.4m | light not on site; 0 of 1 received | **on site; 1 of 1 received** |
| P34 Chair Delivery (Pad Chair) | on site; nothing recorded as supplied | **2 pad chairs received, no asset numbers** (chairs are counted by quantity, v11.55) |
| GN24 Generator 60 kVA | unit record 1277089 identified as the old 80kva item, so the 60 kVA line read 0 of 1 numbered | **1277089 identified as the 60kva** (the old unit record retired, a new one saved) |

Through the page's own controls (`light`, `supplied` ×2, `unit_reidentify`), via `three.cjs` (the record runner of
`record_22Oct2026_p06_number/p06.cjs`, unchanged but for the spec file name). Dry run first with every write aborted;
then `--apply` with the public page's SHA-256 checked, exactly the twelve planned documents (the light, the two supplied
records and the two unit records with their stamps and names), every other document verified unchanged in value, every
op verified on the service. Nothing else changed. The key is never printed, logged or stored.
