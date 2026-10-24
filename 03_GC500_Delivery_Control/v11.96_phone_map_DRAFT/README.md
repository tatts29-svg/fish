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
The controls stay above the map, including in full screen; this corrects an old
map-card flex order that otherwise placed the restored buttons below the map.

Required: actual phone dimensions, touch scrolling, full-screen and Escape/route
exit, selector/route regression (v11.88), small-phone/landscape/desktop views,
record preservation, both navigation sweeps, guarded upload and live read-back.
Private screenshots and raw records are not committed.

Candidate: `f8a93ce25459abd4493e65a28d9e9170d031237302b35af2ea1cf419bca08b68`, 21,999,025 bytes; base is the v11.95 candidate `5868677a6bb4a59b4a9ffb6c8b2014a5be0b07661dfafeec74f8e149d1e3000b` on Claude’s v11.94. Native phone checks 17/17 and preservation 7/7 pass. At 390 × 844, the plan stage is 355 px (was 140) and 706 px in full screen; at 375 × 667 it is 186 px / 529 px. Portrait and full-screen screenshots inspected. Map-selector regression, full navigation checks and guarded publication remain pending.
