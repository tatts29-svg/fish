# Door-lock declaration persistence — ready for server activation

Author: Andrew Fisher

The current v5.92 tick API has no named-declaration field. This adds optional `lock_declaration: {version: 1, by, crew, units}` to an explicit completed `lockup` tick. The version refers to the fixed statement: “I hereby declare that the toilets shown below have been pumped and cleaned, and the doors are locked.” The existing tick supplies reference, line, service day, phone tap time and server receipt time. `units` must exactly match the configured completion line. One confirmer and the selected group label are retained as entered; this is a declaration, not independent verification of work.

Legacy ticks remain accepted without declarations. No historical evidence is inferred. The field is validated, flushed before acknowledgement, echoed and returned on crew/manager reads, retained on retry/restart and immutable under an existing tick ID. Undo/void leaves the original evidence in history. Capability `lock_declarations_version: 1` appears in health, crew reads and save acknowledgements. The new client requires it and validates the returned declaration before removing its durable outbox entry.

Base server v5.92: `bdb058ffe1d7e269be978546581383a85f11bd7fc7078f569d41de33b6efe396`.
Candidate v5.93: `8764451d3768fcfbfc493da48fb9901503dcd6af0f8df247478aa53fb9428f46`, 294,310 bytes.

Checks: 50 focused HTTP checks and 205 retained tracker/delivery/MMS checks passed on disposable localhost servers, with no live test ticks or external messages. The retained suite uses the original fixture and v5.87 rollback file; only its build-label expectations change. `test_declarations.cjs` additionally checks rollback to v5.92 and roll-forward without lost attribution. The page/card integration tests live beside v12.21.

## Activation handover

The runtime here has page/blob edit access but no Railway credentials. `stage.py` makes complete private backups and, with `--execute`, stages only the immutable server blob. It does not change the running server or machine manifest. Never prune the staged blob while it awaits protection by `SERVER_FILE`.

1. Run a fresh private backup with `stage.py --private-dir <new-private-directory>` and verify health still v5.92, no recovery/refusal, new and predecessor blobs present. Keep raw exports private.
2. Existing deployment owner sets `SERVER_FILE` to the exact v5.93 hash. Preserve every current `SERVER_FILE_KEEP` entry and add the v5.92 hash if absent. Preserve all other settings. Perform one redeploy using the existing process.
3. Read the boot-file hash and public health: v5.93, `crew_groups_version:1`, `lock_declarations_version:1`, no recovery/refusal. Independently confirm the exact blob remains in inventory. Compare page, full state, cards, complete tick history and signed links with the immediate backup. Legitimate concurrent additions must be identified rather than discarded. No live test ticks.
4. Report exact source/hash, deployment and preservation evidence in PR #1. Only then publish the tested v12.21 page and update the existing crew card through its native publisher, retaining tracker IDs, signatures, configuration and history.

Rollback is the v5.92 hash with one redeploy, preserving the keep list. v5.92 retains stored declaration fields on disk but cannot accept or return them; restore the predecessor crew card or hold new declarations while rolling forward. Do not describe declaration saving as available on v5.92. The v12.21 client keeps unacknowledged declarations pending when the server lacks capability.

Staged and independently read back 25 Oct 2026 17:21:46 AEST. Full state, cards, page, tick history and signatures unchanged. Running server remains v5.92. Phone and desktop card-to-server integration checks: 26/26 each. Activation remains with the existing deployment owner.
