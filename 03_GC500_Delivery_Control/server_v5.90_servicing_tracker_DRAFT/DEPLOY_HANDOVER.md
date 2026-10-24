# READY TO DEPLOY — server v5.90

Author: Andrew Fisher

Staged by Codex at 18 Oct 2026 10:01:56 AEST (00:01:56 UTC). **Not switched live.**

- Source commit: `bbafd3b301097f737ecdae1b61e15ed33795d46b` on the shared branch.
- Base: exact live v5.89 `cb32d00e0d4beb90870685978981b1e14541a701c7b37cb1f180d848c134019c`.
- Candidate: `55a19453304406e9fcf0891ae6151e8516357e83e22987fc334e2bf9428ad0ec`, **289,090 bytes**.
- Only live mutation: `PUT /api/admin/machine/blob/55a19453304406e9fcf0891ae6151e8516357e83e22987fc334e2bf9428ad0ec`.
- PUT hash/size acknowledged; a fresh authenticated `/api/admin/machine` read lists the same hash/size. All earlier blobs remain present.
- Before/after page bytes and machine descriptor are unchanged. Server is healthy v5.89. Operational export is identical except its own timestamp.

## Exact Railway values

Claude owns the switch. Set these together, preserve every other binding, then redeploy once:

```text
SERVER_FILE=55a19453304406e9fcf0891ae6151e8516357e83e22987fc334e2bf9428ad0ec
SERVER_FILE_KEEP=cb32d00e0d4beb90870685978981b1e14541a701c7b37cb1f180d848c134019c,d5a0d777da4871af1bf88804b4ef223354a29c2560213ab56f7897445b398fdc,f5b9a3f7efdf880b5f10d0ee339761d35adf9b9ff5bdd3a528505215be6b6fe9,76afbd997a9fcfd6e796eea4ead641a5249a1bad23114417c861fd1559057684,264363128b6c4bc1fd86b2fd6712400dd4c367b45a6ca195b7fb2ee1c8f21a14,b8d38b8f889baeffce25401a285f25286bbb4a6ae67f2c0f6e8a81eb214991dd
```

This KEEP value is v5.89 plus the five existing rollback hashes confirmed in the current inventory and prior handover. Codex did not read Railway's environment directly: retain any additional current KEEP entries if present.

**Do not run any machine import or page/machine publication until the switch is confirmed.** The staged blob is not yet named by the running server's protection variables and an import can prune it.

## Tests on the exact staged bytes

| Check | Passed |
|---|---:|
| Existing tracker suite |84/84|
| New server reliability cases |25/25|
| Existing delivery suite |45/45|
| Existing MMS sender suite |14/14|
| Existing MMS suite |37/37|
| v5.89 → v5.90 → v5.89 → v5.90 rehearsal |19/19|
| Offline worker |14/14|
| Final crew card/native v5.90 browser protocol |23/23|

Server/worker total: **238/238**, plus card protocol **23/23**. Exact rebuild, repeat/wrong-base rejection, syntax and worker-source parity passed. Root reviewed the changed server source. No real messages, test writes to live records or physical-phone scans.

The rollback rehearsal reads v5.90 data on v5.89, accepts a new signed tick there, and preserves it, active ticks, void history and signatures when returned to v5.90. Operational record bytes stay identical. Existing delivery/MMS and legacy driver CSP/cache/error responses are retained; the requested tracker pagination contract is documented in README.

## Card compatibility and release order

Separately, the final crew card passed **14/14** compatibility checks on unchanged v5.89. It opens, saves signed ticks online, and retains/sends offline ticks from an already-open tab. Fresh offline QR scans are unavailable, and the new exact-script stale-card guard has no server identity on v5.89. The card honestly reports offline scans not ready.

**Server v5.90 first; verify the switch; then the new crew card and page.** New-phone offline scans and exact stale-card detection require v5.90. Main-page v10.66/v10.67 and cost v10.68 are separate drafts, not part of this server deployment.

## Verify after switch; rollback

Confirm the deployment log names the staged blob, and the actual running `server.js` SHA-256 equals the candidate above. Check `/health` is healthy v5.90 without recovery/refusal warnings; keep the record version, card/tick store and current page/machine intact. Confirm all seven current/rollback server blobs remain in inventory, then post the verified running hash and time on PR #1. Only then release the machine-publication hold.

Rollback value:

```text
SERVER_FILE=cb32d00e0d4beb90870685978981b1e14541a701c7b37cb1f180d848c134019c
```

Keep the v5.90 hash plus the five older hashes in SERVER_FILE_KEEP on rollback; do not delete the staged blob. v5.89's old tracker limits/key-loss/read behaviour returns during rollback, so do not update a missing-key tracker there.
