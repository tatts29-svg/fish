# Confirmed customer-charge treatments — DRAFT

Author: Andrew Fisher

This change lets an evidenced customer-charge decision be recorded against an exact existing contract hire line or quoted water service. The existing Costs controls record the reason, source, named confirmation and date. An own-use hire decision removes only customer hire; a distinct hire-covered-elsewhere decision removes only that separate hire charge without classifying it as own use; a water inclusion removes only the additional customer water charge. Supplier Direct costs, original rates, source history and physical site records remain separate.

The saved decision is versioned and bound to the current source identity and rate override. A changed source, invalid decision or conflicting revision restores ordinary pricing and shows a review warning. Clearing and replacing a valid decision retains its earlier history. The generic Questions editor cannot overwrite these structured decisions.

No private decision, operational quantity or financial amount is embedded in this source. Publication alone changes no record or charge; separately authorised record updates use the page's native functions with a reviewed dry run, backup and exact read-back.

## Status and source

Implementation is frozen for native verification. This is **not READY TO UPLOAD**.

- `charge1239_src.js`: SHA-256 `634b64f055701cf86c2bac0e640a3ac07fcc0ebf8d4fbcb9c91b9e61ed6704b6`.
- `patch_v1239.py`: SHA-256 `70c95a6dc1761fcdae18dde9006f4392b47a14423222afe7689579c48a60a61e`.
- The patch requires the event-crew reconciliation module and a v12.37 or v12.38 footer; it refuses repeated application.
- Shared build: `23b78734b5bcf67020b9153526ee9da5678a7c273dc439dc880bf8f7122387e1`, 15,635,672 bytes, from verified live v12.37 `d0c7d444d9b9c1aef434478a283bb4fc5b0cbafeb70a329cc1a561f982bb986a`. The build adds one treatment module and the v12.39 footer.

## Checks and next action

Pure resolver checks: 88/88. Native API fixture checks: 71/71. Independent covered-hire adapter checks: 19/19, plus 9/9 exact patched reporting checks. Release CLI checks: 4/4, including actual application and unchanged output on refusal. The shared page checker passes 211 inline scripts. The earlier independent adapter review passed 38/38 before the covered-hire extension.

Native whole-page financial preservation, source-bound decision rehearsals, phone inspection and final navigation sweeps are still required. The publishing owner must retain the latest live base, rerun relevant checks if it changes, use the guarded uploader and verify exact live bytes. All earlier previews and the initial unchanged-base build are superseded; only the hash above is the current candidate.

The existing customer event labour agreement remains unchanged. Supplier actual hours do not replace customer contract hours. Other agents' Demob and pick-up booking work and the current release hold remain under their existing owners.
