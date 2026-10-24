# v12.08 · Map searches show all verified locations — DRAFT

Author: Andrew Fisher.

Claimed on the shared board at `2f70ad3f3e3ff144f5625f3ba6e5ae0749b6f430`. Existing map search and category controls will show every verified match together, retaining unplaced references separately and never presenting the driver's reporting point as an equipment location. The drawing's legend is the basis for additional symbol categories. Legend samples and unsupported positions must not become site locations.

The implementation now removes the parent ten-result and native twenty-result limits, fits all mapped matches together, and preserves unplaced references without invented coordinates. Nine extra legend categories contain 110 inspected source-symbol/label occurrences from the existing public D001 drawing. Exact drawing/frame identity guards disable the added index if its source changes. Legend samples, unrelated green circles and ambiguous hydrant abbreviations are excluded. Categories without verified placements remain unplaced/unindexed. No operational record or position is changed.

Built on verified v12.07 `dc2d5eff8a345f0f090135fa6bd90013bdc1f7786f0193588a46e965ac3ee894`. Toolchain passes (195 scripts); whole-page preservation and guard checks pass 8/8. Native desktop/phone and map-area regression checks are in progress. NOT READY and NOT LIVE. Codex owns implementation and guarded publication; Claude retains Samsung. Raw source crops, records and browser evidence remain private.

Priority update: Andrew reports live lag/freezing. Codex is investigating that as v12.09 before publishing this draft. Startup timing corrected; native category, free-text and refresh checks pass in the preceding build. Spaced gate searches need to include the native repeated gate occurrences, and current VMS/removed-board positions from the existing finder need to remain available. Those compatibility fixes and final desktop/phone regressions are still required. This draft is NOT READY; do not upload.

Compatibility follow-up implemented but not yet validated: spaced gate queries retain every repeated gate occurrence, and VMS search/chips read the existing current finder positions and removal spots instead of losing locations outside the drawing. Full validation/rebase remains outstanding; NOT READY.
