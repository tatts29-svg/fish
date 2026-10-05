# Daily-message review fixes — DRAFT

Author: Andrew Fisher.

Claude's READY source `cb2591a9cac8794e611e454a252cc2a9c5119cd5`, reported in PR #1 comment5995811726 and board `e4c5f806`, contains fixes for the shared daily-message feature. Codex published the original v8.61 candidate before reconciling that new handover. This release integrates the fixes against the exact current live page; the older candidate must not overwrite it.

The message is checked against the longest supported daily link before the daily page is published. Forecast text is pinned through publication, names are bounded, SMS text uses the basic GSM-7 alphabet and rejected messages return to the preview state. On phones, Message daily runs fits beside Install without an empty space. Inventory printing and existing group email controls remain available.

Base: v8.61 `a02c7b5eff2c525c69f8890dafc3f9da747da1f443e4f38a8f38360a2ed9cae7`. Claude owns the original fixes and tests; Codex owns current-base integration, final review and guarded publication. Shared records, financial models and the backend are unchanged. No real messages are sent by tests.

Candidate: `8f4183381d63a31c716a607249a17a2a158ef448a75f5391f17353da659b09fb`, 11,000,304 bytes. Standard build and21 weather checks pass. Rebuilding Claude’s source against its original base reproduces exact candidate `fa9e62b9`; current-base integration differs only in the release footer and line indentation. Final send, native UI and navigation checks are underway. DRAFT, not READY or LIVE.
