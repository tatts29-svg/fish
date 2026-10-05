# Daily-message review fixes — DRAFT

Author: Andrew Fisher.

Claude's READY source `cb2591a9cac8794e611e454a252cc2a9c5119cd5`, reported in PR #1 comment5995811726 and board `e4c5f806`, contains fixes for the shared daily-message feature. Codex published the original v8.61 candidate before reconciling that new handover. This release integrates the fixes against the exact current live page; the older candidate must not overwrite it.

The message is checked against the longest supported daily link before the daily page is published. Forecast text is pinned through publication, names are bounded, SMS text uses the basic GSM-7 alphabet and rejected messages return to the preview state. On phones, Message daily runs fits beside Install without an empty space. Inventory printing and existing group email controls remain available.

Base: v8.61 `a02c7b5eff2c525c69f8890dafc3f9da747da1f443e4f38a8f38360a2ed9cae7`. Claude owns the original fixes and tests; Codex owns current-base integration, final review and guarded publication. Shared records, financial models and the backend are unchanged. No real messages are sent by tests.

Andrew extended this release to addressed Event Portables email drafts and operational/financial separation. Supplier recipients come from a private build-time configuration, excluded from Git and the shared-code download. Drafts retain the PDF attachment and an explicit document subject; no email is sent automatically. Today omits the financial branch and Money renderers, including lazy expansion and print redraws, while Costs keeps its existing financial models. Costs labels distinguish customer charges from workforce costs.

Build requires GC500_EP_EMAIL_DEFAULTS_FILE pointing to a private JSON file with to and cc address arrays (email plus optional name). Do not commit destination addresses or compiled HTML.

DRAFT. Final candidate tests and guarded publication are pending.
