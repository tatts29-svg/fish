# Daily-message review fixes — VERIFIED LIVE

Author: Andrew Fisher.

Claude's READY source `cb2591a9cac8794e611e454a252cc2a9c5119cd5`, reported in PR #1 comment5995811726 and board `e4c5f806`, contains fixes for the shared daily-message feature. Codex published the original v8.61 candidate before reconciling that new handover. This release integrates the fixes against the exact current live page; the older candidate must not overwrite it.

The message is checked against the longest supported daily link before the daily page is published. Forecast text is pinned through publication, names are bounded, SMS text uses the basic GSM-7 alphabet and rejected messages return to the preview state. On phones, Message daily runs fits beside Install without an empty space. Inventory printing and existing group email controls remain available.

Base: v8.61 `a02c7b5eff2c525c69f8890dafc3f9da747da1f443e4f38a8f38360a2ed9cae7`. Claude owns the original fixes and tests; Codex owns current-base integration, final review and guarded publication. Shared records, financial models and the backend are unchanged. No real messages are sent by tests.

Andrew extended this release to addressed Event Portables email drafts and operational/financial separation. Supplier recipients come from a private build-time configuration, excluded from Git and the shared-code download. Drafts retain the PDF attachment and an explicit document subject; no email is sent automatically. Today omits the financial branch and Money renderers, including lazy expansion and print redraws, while Costs keeps its existing financial models. Costs labels distinguish customer charges from workforce costs.

Build requires GC500_EP_EMAIL_DEFAULTS_FILE pointing to a private JSON file with to and cc address arrays (email plus optional name). Do not commit destination addresses or compiled HTML.

READY. Source `cd63c2d2`; exact candidate `b2df41c3074c49838b5b093e50f17ce5c4ac363cccc296971d538b95c7a7d487`, 11,000,587 bytes. Standard build,21 weather cases,53 isolated send cases, laptop/phone financial-model and record preservation, all five load PDFs, native inventory, exact configured draft headers/attachment bytes, scanned location QR checks, cancellation/retry and both21-route/seven-link/Back sweeps pass. Phone captures inspected. Tests send no real messages and make no operational writes. A whitespace replacement error found in the first build was corrected and all affected checks rerun. Guarded uploader dry-run passes with current base unchanged. READY is not LIVE.


VERIFIED LIVE 6 Oct 2026 at 03:05 AEST. READY commit `4f344bb9`; guarded publication confirmed exact candidate bytes. Actual-public laptop/phone financial preservation and addressed PDF draft checks pass without local HTML substitution. The live draft test initially checked dialog visibility before it had settled; an explicit ready wait fixes the test timing and the complete suite passes. Public health OK, server v5.87, record3851. No backend deployment or real email/SMS sends. Claude owns v8.63 flicker work on this final live base.
