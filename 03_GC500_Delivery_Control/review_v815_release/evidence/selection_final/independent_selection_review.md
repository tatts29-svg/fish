# Independent selection lifecycle review

Author: Andrew Fisher · 3 Oct 2026 AEST.

**No publication blocker found in the bounded selection correction.** Reviewed implementation commit `8c821da`, the diff from `c1f6989`, the isolated correction patch, and the surrounding native navigation, header-selection and refresh paths. The corrected `docs815_src.js` hashes to `da33522f35097ce2987e26ede691cd9d99b6e606e6522af8a0e02bb9e07cf134` and occurs byte-for-byte in candidate `35ab136643f9b7b0fb5b4e237c501c58cb27bc31e4faaded75df013dad0f7770` (9,118,422 bytes).

The callback checks its intent object, current selected identity and active tab before acting. A later selection replaces the intent object, so an older callback cannot act even when selection returns to the same document identity. The callback resolves the current connected row instead of retaining the replaced node. Full and partial redraws preserve the marker and restore previously held row focus without another scroll. Focus movement to another control cancels a pending request, both before redraw and when the callback executes.

New queries, Clear, category choices, photo-reference choices and successful category deep links clear the selected identity and pending intent. An absent row or a tab change can retain an unfulfilled intent for a later redraw; it cannot act in another tab, and subsequent control movement, selection or clearing invalidates it. This matches the delayed-refresh use case without adding a retry loop.

Eight additional isolated CPU probes passed against the actual lifecycle functions: later selection cancellation; A→B→A callback identity; clearing before callback execution; leaving Documents followed by user focus movement; replacement of a detached row; disappearance and reappearance after focus movement; user focus movement after restoration was scheduled; and a contained browser-focus exception without a repeating timer. These are synthetic DOM/timer checks, separate from the recorded 70 CPU and 80 actual-browser checks; no browser was opened for this review.

The correction changes only transient selection fields, pending callback state, row accessibility attributes, focus and scrolling. It adds no service call or catalogue, file-metadata or operational-record mutation. Existing upload/removal handlers are unchanged. No cosmetic or unrelated changes are recommended.
