# Build load cards — reviewed integration

Author: Andrew Fisher

DRAFT — final candidate under verification; not yet live.

Andrew accepted the reviewed design: “Sounds good presentation is key. And easy understand.”

Build load cards show load number, available arrival time, reference, destination, status and warnings first. Native progress, sizes and weights open under Details; photographs, notes and the complete delivery record remain in a named fold. Daily available staff and the approved day cards remain in place.

This integrates the compact race-card design from PR #31 at immutable source `15b25617c269d02b36d65897de95f0c89e8bb967` into current live v9.89. Untimed cards now use the available width. Short deliveries and partial installation stay visible when closed. Native progress reporting, focus, unsaved input and record-fold state survive redraws. Animation respects pause, reduced motion, hidden content and print.

The separately owned v9.90 draft and PR remain unchanged. This release changes presentation only; it does not write operational records, alter costs, invent arrival times or change the meaning of a status.

Base: `4773efd9433b7bf50b824f1c4f3966bfa4e009b99bbd2231ffa0a2c1f35612bf`.

Final candidate: `198bb721e7bff046bdfeb92c229e0dd35cb41a5edd4aa9c0d856fe8348aa9f28`, 14,741,471 bytes, 76 inline scripts.

Build with `bash toolchain/build.sh v9.91-final2 v9.91_build_load_cards_DRAFT/patch_v991.py`. The patch refuses a changed live base and repeat application. Tests run under the shared browser lock with all operational writes blocked. Public verification uses `PUBLIC=1` with no local page override and verifies the served hash. Compact verification evidence is saved here; screenshots and raw records remain private.
