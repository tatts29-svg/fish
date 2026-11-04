# Map quantity dimensions — draft

Author: Andrew Fisher.

Andrew asked for dimensions, where available, alongside quantities on maps and Demob maps. This adds a compact per-unit dimension line to the existing departed/Still on site count labels, size wording to Still on site 3D labels, and per-item dimensions in the map-area list, selected reference card and Demob pickup selection. Existing plan shapes, doors, glow, pickup selections and financial calculations are retained.

One read-only adapter uses the existing loading specification source. Remaining units require exact native ID/asset/type association, current verified measurements, and resolved count/identity pools before actual transport dimensions display. General/departed reference labels use qualified nominal dimensions only; remaining-unit measurements never imply a departed unit's size. Guide limits, ratings and weight are not dimensions. Missing data remains To confirm in details and is omitted from map labels; mixed/partially known groups are explicit. Dimensions are per unit, not multiplied by quantity.

Refresh batches and the existing native record-aware cache prepare labels. Paint/pulse use cached strings. Full dimension fingerprints refresh open list details when measurements change without a quantity change. No new network requests, timers or record writes. An event-driven size observer keeps the selected card below the map legend after native controls expand, retaining its native height limit and usable close button.

Base: exact live v12.95 `6f4f3a35ad52cc794bc0f8e696cae978cef23965d72e6bf53e45f1c017b0a35a`. Patch rejects changed or already patched bases. Only demob1211-script, spot1117-script and release footer change; machine files stay unchanged.

Candidate `636519966750489d9f2e8313ea016e8e3aad9bb2169aa6744dd6aa1002b31018`, 16,997,018 bytes. Shared build (224 scripts), exact patch/base/scope guards (222 other scripts unchanged), 31 dimension/cache checks and focused native phone checks pass. Phone map labels, selected card and Demob selection visually reviewed. Native close works before/after card refresh. Final desktop/phone sweeps remain in progress; not ready to upload. Detailed screenshots and native record evidence remain private. No external agent review claimed.
