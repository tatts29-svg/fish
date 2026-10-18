**VERIFIED LIVE — 18 Oct 2026 12:58 AEST.** Claude performed the Railway switch and recorded the running-file hash in PR #1 comment6244962648. Codex independently verified healthy v5.91, unchanged page/full shared state/machine, all retained server blobs and unauthenticated ticks rejection. At13:09 AEST, all55 exportable collections and54 native aliases matched the actual v10.71 native export field-for-field, including records, loads, fence_dockets and costs. No operational writes. Source4b106c0138e3d5706d58f274f8b966df3757db67; serverc1b8bf9c999d4e548384b682592409507dbaf8bb7c4c62c590b62127b69c89b7,292,090 bytes. Author: Andrew Fisher.

The staging instructions below are retained for reproduction and rollback; the deployment is complete.

# v5.91 staging and Railway switch handover

Author: Andrew Fisher · 18 Oct 2026

**READY TO STAGE:** 282/282 assertions and three rebuild/guard checks passed on the exact source below.
This is a frozen source handover, not a live claim. Page publication remains the release owner’s first priority.
After the final checks in `validation.json` pass, stage only:

- v5.91: `c1b8bf9c999d4e548384b682592409507dbaf8bb7c4c62c590b62127b69c89b7` — 292,090 bytes.
- Predecessor and rollback v5.90: `55a19453304406e9fcf0891ae6151e8516357e83e22987fc334e2bf9428ad0ec`.

The release owner records the exact source commit and staged inventory; the named Railway owner switches only
`SERVER_FILE` to the tested hash, retains every existing `SERVER_FILE_KEEP` entry and adds the predecessor if absent.
Keep the candidate blob for a roll-forward. Preserve all other Railway bindings, page bytes and machine descriptors.
Never replace the keep-list with an example list from a test.

Before staging/switching, privately save `/api/state`, the current export, page hash, machine manifest hash, health,
record version and server-blob inventory. The export is already known to omit fields on v5.90: `/api/state` is the
source for comparing preservation, not an incomplete export by itself. Do not publish raw records or credentials.

Use the existing guarded blob upload, confirm exact inventory bytes, then perform the Railway switch once. After
restart verify the running server file hash and `/health.build === 'v5.91'`; record version and raw documents must be
unchanged. Read `/api/export` through authorised GETs and compare every exportable collection against native folding
of the saved/current state, accounting for any genuine concurrent site update. The expected differences from v5.90
are the restored fields, correct paper values/list order and native atomic scope projection. `mapKeys` and tracker
secrets must stay absent. Check view/edit export permissions, tracker health, page hash, machine manifest and protected
blob inventory. Only then record verified live with source, server and read-back evidence.

Rollback uses `SERVER_FILE=55a19453304406e9fcf0891ae6151e8516357e83e22987fc334e2bf9428ad0ec`, preserving all keep
entries and the v5.91 blob. No migration or record repair is needed: the stored data format is unchanged. v5.90’s
incomplete export returns during rollback; the separate documents, tracker data and existing pages are retained.

No staging, Railway change, live record write or page/machine publication was performed by this source task.
