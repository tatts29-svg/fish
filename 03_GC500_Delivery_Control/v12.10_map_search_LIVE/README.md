# v12.10 · Map searches show all verified locations

Author: Andrew Fisher.

LIVE, 25 Oct 2026 08:59:46 AEST. Independently implemented and tested; no second-agent review claimed.

Andrew asked map searches to show all matching locations, including the plan legend. The parent ten-result and native twenty-result caps are removed. Find and Show all fit every mapped match together; the result list folds so the map regains screen space. Individual results still open their map location and details. Current VMS and removal-spot names, warnings and coordinates are retained exactly. Unplaced references stay explicit without invented equipment pins. Asset details load when selected instead of rebuilding the register for every result.

Nine additional legend categories index 110 reviewed symbol/label occurrences from the existing public drawing. The source drawing and registration frame must match their pinned identities. Legend examples, unrelated green circles and ambiguous abbreviations are excluded. Categories without verified placements receive no invented locations. Landmark labels do not carry equipment placeholders. No operational record is changed.

This supersedes the unpublished v12.08 draft. Base: verified v12.09.1 `06b9435ca8451fc638b40d65f8ce9450d9c61f7c6a93e9fe168c3f0890f7f09d`. Candidate: `00056a857827a22519fe0ac095cf19ae94d2dbb7a06c2843c740f208adb3365c`, 15,271,939 bytes, 195 inline scripts. The Servicing report/hook, Showcase and all bytes outside the map modules and footer are preserved exactly.

Checks: toolchain PASS; preservation/guards 8/8; native desktop and phone 39/39 each; both full sweeps 27 routes / 19 direct panes / 7 deep links / Back, zero errors or attempted writes. Phone image inspected; guarded dry run passed. Earlier area-sharing regressions passed 29/29 desktop and 27/27 phone before the final landmark-label-only adjustment and Servicing rebase; area model/geometry remain unchanged. Source extraction is reproducible from the existing public drawing; raw crops, browser output and records stay private.

Guarded upload passed at 08:59:46 AEST. Separate public GET at 09:00:00 AEST matched every byte, footer and search module. Public native phone tests passed 39/39; public screenshot inspected. READY source ce7431734c69a29b9051998651f5157398279f07. This map-search claim is complete. The separate Servicing draft and Samsung investigation remain with their existing owner; the Servicing draft must rebuild and renumber on v12.10 or newer.
