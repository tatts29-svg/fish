# Phone Map explorer

Author: Andrew Fisher

DRAFT. Claimed at 252bfa75967e65b2f3328bce9f6c9ecb97182863 after
the ownership handover in PR #1 comments 6385723149 and 6385815351.

The read-only phone reproduction at 390 × 844 gives the actual plan stage only
140 pixels of height. The existing header, area controls and description consume
the remaining space. The full-screen function exists but its button is absent.

Compact the header only on the Map tab, fold the existing area/key controls behind
Map tools on phones, and restore the existing Full screen / Exit full screen
button. All filters remain available. Keep the one-map selector, device preference,
reference/gate routes and the same embedded explorer. No record or map-data change.

Final build and tests must start from the current verified release after v11.95.
Required: actual phone dimensions, touch scrolling, full-screen and Escape/route
exit, selector/route regression (v11.88), small-phone/landscape/desktop views,
record preservation, both navigation sweeps, guarded upload and live read-back.
Private screenshots and raw records are not committed.
