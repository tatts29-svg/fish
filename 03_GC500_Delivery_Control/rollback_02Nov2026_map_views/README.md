# Satellite and 3D restored live

Author: Andrew Fisher.

The previous v12.81 dashboard and map files were restored at **20:00:54 AEST on 2 Nov 2026**. Andrew rejected the plan-only result and explicitly instructed: “Restore both while checking 2026.” The previous views remain available while a suitable replacement is researched. This restoration does not certify imagery capture dates.

## Verified release

- Restoration implementation source: `64ac501e9f660ccf3d932d957ffa70b1a02928d3` on `ccr-061f77e8-ivjhrv`.
- Dashboard SHA-256: `3b17c3de36c8c3f2d99042b0c83dfd9fdc110ccb9db7a1c21ef6c9f72704a85b`, 16,948,844 bytes.
- Map machine SHA-256: `8256bce609ce48d30fd319ac56bce74729cfe8a980ad051228379d09b06a15e6`.
- Four original map files restored; the other 232 descriptors and all protected server blobs retained. Server v5.94 unchanged.
- Exact complete dashboard and all four restored files independently fetched from the public service after publication.

The rejected v12.83 source is preserved in `../v12.83_maps_2026_only_WITHDRAWN/`. It was published and subsequently withdrawn, not an unpublished draft. Do not republish it. The rollback guards refuse other starting or target hashes; a later release must use the current live base and the standard release process.

## Checks and preservation

The shared build reproduces the exact old page. All 223 inline scripts pass the checker. Both desktop and phone paired sweeps pass 27 routes, seven deep links and Back with zero runtime errors, console errors or record writes. The 31 mocked publication guards, 25 independent source/preservation checks, six native navigation checks and three page identity guards pass.

A fresh live phone check at 20:16 AEST verifies all restored mode controls, eight satellite tiles without missing or blank tiles, and 172 3D tiles with the visible view fully loaded. The 3D first-full signal arrived after 20.9 seconds in this test environment. Phone and full-canvas screenshots were visually inspected: ground, waterways, streets and buildings render beneath the pins. This is a rendering check, not a claim about capture year or performance on every device. No browser or console errors and no record writes occurred.

The full operational state, read using the same public view access as intake, remains byte-identical. All embedded DATA and the complete P&L script are unchanged. No financial calculation or operational record was edited by this task. Private full-state copies, manifests, screenshots and detailed receipts stay outside Git.

## Ownership and next work

The rollback hold on Claude's P&L v12.84 is lifted. Start from the restored dashboard above and retain the normal unchanged-live-base guard. Fencing v12.82 remains held under the existing operational review. Demob/building examples and the annual-plan upload workflow remain previews/design.

Andrew wants a clean off-event base with annual plans kept separate. Satellite and 3D stay available during this investigation. Any replacement needs its own source/coverage check, reviewed implementation, coordinated release, tests and public read-back. No further page upload is claimed by this restoration record.
