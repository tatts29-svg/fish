# Server v5.93 Railway switch — DONE, LIVE 25 Oct 2026 17:45 AEST

Author: Andrew Fisher. Switched by Claude on Andrew's word: "talk to codex we need servicing working now", then "read message from codex", where Codex asked for the activation (PR #1 comment 6394986897). The handover was 6394837198; the source and tests are in `../server_v5.93_lock_declaration_LIVE/` (Codex, source `159c9674`). Report: PR #1 comment 6395039307.

## What changed

**One Railway change on service `gc500`, production, and nothing else:**
- `SERVER_FILE` = `8764451d3768fcfbfc493da48fb9901503dcd6af0f8df247478aa53fb9428f46` (v5.93, 294,310 bytes).
- `SERVER_FILE_KEEP` = v5.92 `bdb058ffe1d7e269be978546581383a85f11bd7fc7078f569d41de33b6efe396` in front of the eight entries set at the v5.92 switch (`../server_v5.92_switch_runbook/README.md`).
- No variable was read. Nobody else holds Railway access, and there had been no deployment since `d8e7fa2c`, so that list was the one in force.

**One redeploy:** `a20aa7ad-c555-4685-b39d-7b0086aeddc9`, created 07:45:23Z, SUCCESS 07:45:37Z. The previous deployment, `d8e7fa2c`, was removed.

## Evidence
- **Boot log:** `8764451d…  /app/server.js` and "server from volume blob 8764451d…". The banner reads "server v5.93", with records v10981, files 623, drop cards 10, and the servicing tracker at 3 trackers and 426 ticks.
- **`/health`:** `ok: true`, `build: v5.93`, `crew_groups_version: 1`, `lock_declarations_version: 1`, `record_recovered: null`, `tracker_refusing: null`, files 623, cards 10.
- **Before the switch:** a private backup at 17:44:46 AEST with Codex's `stage.py` (no `--execute`). It covered health, version, full state, cards, every tracker's complete tick history, the machine inventory and the page. It is kept in the scratchpad, never the repository.
- **After the switch** (`readback.py <backup folder>`; GET only, prints no key or link):

| Check | Result |
|---|---|
| Page | `6ccc030d…`, byte for byte |
| State | version 10981 → 10981, 0 documents differ |
| Cards | equal |
| Inventory | 246 → 246, every blob kept with its bytes |
| Trackers (all 3) | complete histories (426 events), signed links, configuration, epoch and voids all equal |
| `/api/ticks` without a key | 401 |

- No live test ticks, no record writes, and no QR or printed-link change.

## Rollback
`SERVER_FILE` = `bdb058ffe1d7e269be978546581383a85f11bd7fc7078f569d41de33b6efe396` (v5.92) and one redeploy, leaving the keep list as set. v5.92 keeps stored declarations on disk but cannot take new ones. Codex restores the predecessor crew card first if v12.21's card is out.

The edit key is never printed, logged or stored.
