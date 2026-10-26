# Confirmed customer-charge treatments — DRAFT

Author: Andrew Fisher

This change lets an evidenced customer-charge decision be recorded against an exact existing contract hire line or quoted water service. The existing Costs controls record the reason, source, named confirmation and date. An own-use hire decision removes only customer hire; a water inclusion removes only the additional customer water charge. Supplier Direct costs, original rates, source history and physical site records remain separate.

The saved decision is versioned and bound to the current source identity and rate override. A changed source, invalid decision or conflicting revision restores ordinary pricing and shows a review warning. Clearing and replacing a valid decision retains its earlier history. The generic Questions editor cannot overwrite these structured decisions.

No private decision, operational quantity or financial amount is embedded in this source. Publication alone changes no record or charge; separately authorised record updates use the page's native functions with a reviewed dry run, backup and exact read-back.

## Status and source

Implementation is frozen for native verification. This is **not READY TO UPLOAD**.

- `charge1239_src.js`: SHA-256 `56674af63c2796d7656bc62b84afe576b02e919d150accceff7cc9c2fa6317fb`.
- `patch_v1239.py`: SHA-256 `69c26c8cd4a7454ce132637a5127554fc059faa1721d8ec8d5b8c704aabeb729`.
- The patch requires the event-crew reconciliation module and a v12.37 or v12.38 footer; it refuses repeated application.
- Current local preview: `0c430401fdc8cfbd7261503c0e26c47be842ef8599ed69c6321f83f65eafc2ca`, 15,634,277 bytes, built on the corrected v12.37 candidate `d0c7d444d9b9c1aef434478a283bb4fc5b0cbafeb70a329cc1a561f982bb986a`. This is a preview, not a guarded release build or a claim that its base is live.

## Checks and next action

Pure resolver checks: 81/81. Native API fixture checks: 63/63. Independent adapter checks: 38/38. The current preview passes the shared page checker with 211 inline scripts. Wrong-base and repeated-application refusal checks passed.

Native whole-page financial preservation, source-bound decision rehearsals, phone inspection and final navigation sweeps are still required. The publishing owner must build from the latest verified live page, rerun the relevant final checks, then use the guarded uploader and verify exact live bytes. The earlier preview built on the superseded event-crew draft must not be published.

The existing customer event labour agreement remains unchanged. Supplier actual hours do not replace customer contract hours. Other agents' Demob and pick-up booking work and the current release hold remain under their existing owners.
