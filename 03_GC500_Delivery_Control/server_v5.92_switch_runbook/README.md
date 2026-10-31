# Server v5.92 Railway switch — runbook (Claude)

**DONE — LIVE 24 Oct 2026 10:04 AEST.** Deployment d8e7fa2c-269c-400a-8435-80af3b861ae7; boot log names `bdb058ff…` as `/app/server.js`; `/health` v5.92 with `crew_groups_version: 1`; everything preserved. Full report: [PR #1 comment 6377390954](https://github.com/tatts29-svg/fish/pull/1#issuecomment-6377390954). The list below is kept for the record and for rollback.

Author: Andrew Fisher · 24 Oct 2026

**Go-ahead:** Andrew, in the chat on the morning of 24 Oct 2026: "Lets do it".
**Blocker:** the session that got the go-ahead has no Railway access, and connectors only load when a session starts.
Connect Railway at https://claude.ai/customize/connectors, then start a new session. That session works through
this list. Nothing here has been switched yet.

Codex's handover: [PR #1 comment 6376612716](https://github.com/tatts29-svg/fish/pull/1#issuecomment-6376612716);
source and tests in `server_v5.92_crew_groups_LIVE/` (`_DRAFT` until the switch). Codex holds the v11.73 main and crew publication until this
switch has been read back, and holds any machine import or prune until `SERVER_FILE` protects the new blob.

## Exact values

| | |
|---|---|
| New `SERVER_FILE` (v5.92) | `bdb058ffe1d7e269be978546581383a85f11bd7fc7078f569d41de33b6efe396` (292,810 bytes) |
| Predecessor, rollback (v5.91) | `c1b8bf9c999d4e548384b682592409507dbaf8bb7c4c62c590b62127b69c89b7` (292,090 bytes) |
| New `SERVER_FILE_KEEP` | `c1b8bf9c999d4e548384b682592409507dbaf8bb7c4c62c590b62127b69c89b7,55a19453304406e9fcf0891ae6151e8516357e83e22987fc334e2bf9428ad0ec,cb32d00e0d4beb90870685978981b1e14541a701c7b37cb1f180d848c134019c,d5a0d777da4871af1bf88804b4ef223354a29c2560213ab56f7897445b398fdc,f5b9a3f7efdf880b5f10d0ee339761d35adf9b9ff5bdd3a528505215be6b6fe9,76afbd997a9fcfd6e796eea4ead641a5249a1bad23114417c861fd1559057684,264363128b6c4bc1fd86b2fd6712400dd4c367b45a6ca195b7fb2ee1c8f21a14,b8d38b8f889baeffce25401a285f25286bbb4a6ae67f2c0f6e8a81eb214991dd` |

The keep list is the seven entries set at the 18 Oct v5.91 switch
([PR #1 comment 6244962648](https://github.com/tatts29-svg/fish/pull/1#issuecomment-6244962648), values from
[6244841898](https://github.com/tatts29-svg/fish/pull/1#issuecomment-6244841898)) with v5.91 added in front. Nobody
else holds Railway access, so that is the list in force. Railway variables are never read: set these two, change
nothing else.

## Pre-flight (GET only), checked 24 Oct 2026 09:47 AEST

- `/health`: ok, build v5.91, record 10793, files 613, cards 10, no recovery, no refusal.
- Live page: v11.72 `84cb7d6c1eccf57ba1cca2802e149fd7ef28b4300c94ae2441f0164697af50ea`.
- Machine inventory, 245 entries: the staged v5.92 blob (292,810 bytes), v5.91 (292,090) and all seven keep blobs present.

Run these again immediately before the switch. If the v5.92 blob is missing, stop: Codex restages and re-verifies first.

## The switch

1. **Back up privately.** `python3 server_v5.92_crew_groups_LIVE/stage.py --private-dir <scratchpad>/v592_backup`
   (no `--execute`). GET-only: it saves health, version, full state, cards, all ticks, machine inventory and the page,
   and refuses unless the server is v5.91 and the page is `84cb7d6c…`. The folder stays in the scratchpad, never the
   repository. If the page has moved on, stop and ask Codex rather than editing the check.
2. **One Railway change:** `SERVER_FILE` and `SERVER_FILE_KEEP` to the values above, then the one redeploy.
3. **Read back:**
   - boot log names `bdb058ff…` as the volume blob and as `/app/server.js`;
   - `/health`: `ok:true`, `build:v5.92`, `crew_groups_version:1`, `record_recovered:null`, `tracker_refusing:null`,
     record version and card count as before;
   - inventory still holds all nine server blobs (v5.92, v5.91, the seven keep);
   - page bytes unchanged; full state, cards and tick history equal to the backup (signed QR links unchanged);
   - `/api/ticks` with no key → 401.
4. **No live test completions**, no record writes.
5. **Report** on PR #1 (Ack 6376612716): exact boot-file hash, health line, preservation results. Then STATUS.md LIVE
   entry, rename `server_v5.92_crew_groups_DRAFT` → `_LIVE` only after Codex agrees (done 24 Oct), and tell Andrew in plain words.

## Rollback

`SERVER_FILE=c1b8bf9c999d4e548384b682592409507dbaf8bb7c4c62c590b62127b69c89b7` and one redeploy; leave the keep list as
set. If v11.73's crew card has gone out by then, Codex restores the predecessor crew HTML before crews carry on:
v5.91 keeps stored group fields but does not accept new ones. Earlier ticks are never rewritten to guess a group.
A tested roll-forward is better once the new crew card is live.
