# Financial refresh follows verified source documents

Author: Andrew Fisher

Shared site records can finish loading before the document registry. Reviewed fencing schedule credits depend on that registry, so financial calculations correctly withhold those credits while the source cannot yet be checked. A delayed redraw could then leave an earlier P&L calculation cached after the documents became available.

This release invalidates dependent calculations as the registry starts loading and whenever it settles, including failed or unavailable reads. Costs, P&L and Finance then use the same current evidence without waiting for a screen redraw. Source hashes, schedule caps, rates and operational records retain their existing rules. No native record changes are part of this release.

Exact base: live v10.14, SHA256 `b1bd7bc843632a5ccb99bcead3dfd47a31f2d9810ac1459b4218d1d13d91df7a`.
Candidate: `bc7885b1bed08bafd75353ec3666ca9a4c52a59d17ad3bb0eb5896f011586f67`, 15,220,215 bytes and 109 inline scripts.

The focused regression delays the real document manifest and defers redraws. The previous page fails seven checks; the candidate passes all fifteen, including failure, changed-source and recovery cases. Nine exact-source/repeat guards also pass. Fresh reconciliation checks now wait for both the shared record and the source registry; the cold-read failure was investigated separately and reproduced against the previous page.

LIVE 14 Oct 2026 at 15:14 AEST, exact public bytes matching the candidate SHA above. Source 5ff4a8b4; READY 28b60d31. Both final navigation sweeps passed: 22 routes, seven deep links and Back on phone and desktop, with zero application errors or attempted operational writes. The map-session POST was deliberately rejected before transport. The settled phone P/O presentation was inspected; guarded upload dry-run passed. Fresh actual-public verification passes: 24 saved-native/forecast checks and 18 P/O/source/rendered checks. Native version 6075 is unchanged; no page substitution, browser errors or operational writes. Root owns integration and publication; a separate scoped reviewer checked the source dependency and fresh native values. This is not an external three-assistant review. Private documents, quantities, amounts and raw browser evidence are excluded from this public folder.
