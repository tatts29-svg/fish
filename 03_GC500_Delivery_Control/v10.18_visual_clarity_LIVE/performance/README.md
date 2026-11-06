# Embedded master-plan observer

Author: Andrew Fisher

The embedded Build master plan previously read three sets of layout bounds and serialised its camera on every animation frame, even when the camera was still. It now listens to the explorer's explicit camera-change event and coalesces notifications into one frame. A low-frequency lifecycle check detects a replaced iframe or removed host without repeatedly measuring or repainting an idle map.

Camera position, original projection, load markers and map controls are unchanged. Resize and visibility changes update the overlay. Covered presentation surfaces defer measurements until visible again. Every listener/timer is released with its map. The original observer remains compatible with older explorer assets during paired deployment.

`check_performance1018.cjs` checks the actual embedded explorer's idle measurements, event coalescing, animated camera/projection, refresh stability, resizing, covered/resumed state and cleanup. All operational requests are GET-only. Use `PAGE`, `MAP_CODE` and private `OUT`, under the shared browser lock.

The final timing audit also reproduced a circular dependency: supplier pricing asked the fencing branch reader to price dockets, which re-entered supplier pricing. A swallowed stack overflow hid the fault while causing roughly 1,800 repeated ledger calls. The existing readers now accept an optional source docket pricer; supplier allocation passes the original customer-charge pricer explicitly. Default supplier overlays, all grading, branch rules, missing-branch handling and rate/P/O invalidation remain unchanged. Independent actual-function regression checks cover these boundaries.

Unit identity projections were also recalculated thousands of times in one draw. `unit_projection1018.js` reuses the result only inside the existing `holdAssets` lifetime, keyed by the exact asset object and loading option. Every caller receives a fresh graph, preserving row/group aliases without leaking consumer mutations. A save or shared update invalidates that same held cache; outside a draw nothing is retained. Unknown future options bypass the optimisation. The final regression compares all reference projections with the uncached calculation, booking variants, mutation isolation, native Save/shared refresh and later draws.

The exact combined candidate passed all 12 embedded-map checks on native6078, with zero browser errors or operational writes. Financial parity and final route timings are recorded with the release evidence; timings are from the test browser, not a guarantee for every device or network.
