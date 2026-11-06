# Server v5.94 Railway switch — DONE, LIVE 27 Oct 2026 05:46 AEST

Author: Andrew Fisher. Switched on Andrew's word (27 Oct 04:2x, after the stale-page wipe at 03:59:55): "Yes, add the guard (Recommended)" — the server refuses to lose Ready ticks or bookings when an old page writes, tested first — and "Read server snapshot (Recommended)" for the laptop's ticks no file held. Source and tests: `../server_v5.94_field_guard_LIVE/` (README there: the rule, why each key, known limits).

## What changed

**One Railway change on service `gc500`, production, and nothing else (no variable was read):**
- `SERVER_FILE` = `9857a9786c875e6f2ffe75bc0f09e0c05500712188222fcb86b9fccc4a6d4b98` (v5.94, 307,975 bytes).
- `SERVER_FILE_KEEP` = v5.93 `8764451d3768fcfbfc493da48fb9901503dcd6af0f8df247478aa53fb9428f46` in front of the nine entries in force since the v5.93 switch (`../server_v5.93_switch/README.md`). There had been no deployment since `a20aa7ad`, so that list was the one in force.

**One redeploy:** `bd168dc9-38c3-49c7-8d58-261de7ec2d45`, created 19:45:40Z, SUCCESS 19:45:53Z; `a20aa7ad` removed. The service answered v5.93 at 19:45:44Z and v5.94 at 19:46:06Z (one health poll in between went unanswered).

## Evidence

- **Before:** `../server_v5.94_field_guard_LIVE/stage.py --execute` (from v5.93's, record changes counted rather than refused because crews were working): private backup of health, version, full state, cards, every tracker's complete tick history, the machine inventory and the page; the v5.94 blob staged and read back; state version 11491 before and after staging, 0 documents moved; live server still v5.93. Kept in the scratchpad, never the repository.
- **Tests on the exact file:** `test_field_guard.cjs` 81/81; the retained suites through `run_legacy.py` 255/255 (tracker 84, tracker590 25, delivery 45, MMS sender 14, MMS 37, declarations 50). All on 127.0.0.1 with fake tokens.
- **`/health` after:** `ok: true`, `build: v5.94`, `crew_groups_version: 1`, `lock_declarations_version: 1`, `delivery_field_guard_version: 1`, `record_recovered: null`, `tracker_refusing: null`, files 623, cards 10.
- **After the switch** (`readback.py <backup folder>`; GET only, prints no key or link):

| Check | Result |
|---|---|
| Page | `85826c9b…`, byte for byte |
| State | version 11491 → 11491, 0 documents differ |
| Cards | equal |
| Inventory | 246 → 247 (the v5.94 blob), every blob kept with its bytes |
| Trackers (all 3) | complete histories (652 events), signed links and configuration equal |
| `/api/ticks` without a key | 401 |

- **Snapshot read used once, read-only:** `GET /api/admin/snapshots` and `GET /api/admin/snapshot/records-2026102617.json` (taken 03:45:33 AEST, record version 11251), kept privately; it gave back Andrew's 26 laptop ticks for record run 12.
- No live test writes, no QR or printed-link change.

## Rollback

`SERVER_FILE` = `8764451d3768fcfbfc493da48fb9901503dcd6af0f8df247478aa53fb9428f46` (v5.93) and one redeploy, leaving the keep list as set. v5.93 starts on v5.94's data and keeps every field (test 61); it simply stops guarding and has no snapshot read.

The edit key is never printed, logged or stored.
