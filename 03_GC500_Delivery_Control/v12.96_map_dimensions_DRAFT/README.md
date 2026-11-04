# Map quantity dimensions — draft

Author: Andrew Fisher.

Andrew asked for dimensions, where available, alongside quantities on maps and Demob maps. This adds a compact per-unit dimension line to the existing departed/Still on site count labels, size wording to Still on site 3D labels, and per-item dimensions in the map-area list and Demob pickup selection. Existing plan shapes, doors, glow, pickup selections and financial calculations are retained.

One read-only adapter uses the existing loading specification source. Remaining units require exact native ID/asset/type association, current verified measurements, and resolved count/identity pools before actual transport dimensions display. General/departed reference labels use qualified nominal dimensions only; remaining-unit measurements never imply a departed unit's size. Guide limits, ratings and weight are not dimensions. Missing data remains To confirm in details and is omitted from map labels; mixed/partially known groups are explicit. Dimensions are per unit, not multiplied by quantity.

Refresh batches and the existing native record-aware cache prepare labels. Paint/pulse use cached strings. Full dimension fingerprints refresh open list details when measurements change without a quantity change. No new network requests, timers or record writes.

Base: exact live v12.95 `6f4f3a35ad52cc794bc0f8e696cae978cef23965d72e6bf53e45f1c017b0a35a`. Patch rejects changed or already patched bases. Only demob1211-script, spot1117-script and release footer change; machine files stay unchanged.

Implementation and independent source/synthetic review complete; final browser/visual and publication checks still in progress. Not ready to upload. Detailed screenshots and native record evidence remain private. No external agent review claimed.
