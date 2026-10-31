# T0268 removed — GN24 is the spare generator (20 Oct 2026)

**Andrew, 20 Oct 2026:** "can we remove and delete the T0268 gN24 is the Spare generator".

**What T0268 was:** the schedule row "100KVA TRAILER · SPARE" (Event Week, 20 Oct; 1197215 scheduled; Coates compound). It was never on site, with no tick and no note.

**What stays:** GN24, the 80 kVA generator 1277089, on site and complete, is the spare.

**Checks:** a read-only in-memory `deleteAsset('T0268')` left Costs unchanged.

**What was done** (`remove_t0268_spec.json`, with `remove.cjs` copied from `record_18Oct2026_t0159_removed`):
- Backup first, then a dry run (5 documents: the deletion tombstone and its note).
- Applied: record 9973 → 9978, VERIFIED (`report_20261019T235119Z.json`).
- A deletion has no put-back.

Author: Andrew Fisher.
