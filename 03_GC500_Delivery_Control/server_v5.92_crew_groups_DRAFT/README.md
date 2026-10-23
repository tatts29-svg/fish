# Crew-group persistence — staged, awaiting Railway switch

Author: Andrew Fisher · 24 Oct 2026

New servicing completions can carry one of five crew-group IDs. The server validates, persists and returns the ID, including after retries and restarts. Existing ticks stay unchanged and cached older crew pages can still save their original format. No roster names or phone numbers are stored in this source or required by the server.

Exact server: `bdb058ffe1d7e269be978546581383a85f11bd7fc7078f569d41de33b6efe396` (292,810 bytes). Base/rollback v5.91: `c1b8bf9c999d4e548384b682592409507dbaf8bb7c4c62c590b62127b69c89b7` (292,090 bytes).

Validation: 23 focused HTTP checks, 205 existing tracker/delivery/MMS regression checks on disposable localhost servers, and 23 phone/card-to-server checks. These cover all five IDs, invalid IDs, atomic rejection, idempotency, same-ID group changes refused, signed QR protection, manager/crew reads, restart, rollback/roll-forward retention, undo, separate clean/water crews, offline reload and retry. Existing regression fixtures are pinned to their original source rather than the changed event schedule. No test wrote to the live service or sent messages.

Rebuild with `patch_server_v592.py` on the exact original server. `test_groups.cjs` runs directly. `run_legacy.py` runs the original HTTP suites with build labels updated and their original fixture at source `4b106c0138e3d5706d58f274f8b966df3757db67`. The v11.73 folder contains the phone integration test.

`stage.py --private-dir <new-private-folder>` checks and backs up the current page, state, cards and machine inventory. Add `--execute` only for blob staging. It uploads no manifest, changes no record and does not perform the Railway switch. Keep its raw files private.

Staged at 24 Oct 2026 09:13 AEST from source `2d86df2fa6d7c0a61f4e0528358c3ac4506893c7`. Guarded blob-only PUT returned the exact hash and byte count; independent inventory read-back matched. Full state, cards, page, machine and prior blobs were unchanged. Running service remains v5.91. [Actionable handover in PR #1](https://github.com/tatts29-svg/fish/pull/1#issuecomment-6376612716); acknowledgement not yet received.

## Deployment handover

Claude owns the existing Railway switch. This execution environment has page-edit access but no Railway credential. Set `SERVER_FILE` to the exact new hash, preserve every `SERVER_FILE_KEEP` entry and add the predecessor if absent. Preserve all other settings. Before switching, privately back up full state, all card/tick history, inventory and the current page. After the switch, verify the boot log's exact running file hash and `/health` build `v5.92`, `crew_groups_version: 1`, no recovery/refusal, unchanged existing history/QR signatures/record/page/machine and all rollback blobs retained. No live test ticks.

The staged blob is not yet protected by `SERVER_FILE`. Do not import/prune the machine until the switch protects it. If it is pruned, restage and verify inventory before switching. A GitHub handover does not establish receipt.

Server goes first. Codex then publishes tested v11.73 page and existing crew-card HTML through the guarded processes. Old crew pages remain supported; new ones require the persistence capability and verify the echoed group before reporting a saved completion. A server rollback must also restore the predecessor crew HTML before crews resume: v5.91 retains stored group fields but does not accept new attribution. Never rewrite earlier ticks to infer groups. Prefer a tested roll-forward once the new crew card is live.
