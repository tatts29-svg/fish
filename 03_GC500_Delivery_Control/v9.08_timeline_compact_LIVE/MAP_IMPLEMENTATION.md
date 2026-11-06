# Daily delivery map

Author: Andrew Fisher.

The map sits immediately above the native daily Due in load list. It uses the existing D001-26003-03 master-plan image issued 2 Oct 2026. The native full `dpLoads(day)` result supplies both identity and number before search filters apply. The map reconciles those numbers with `ldGroups` and keeps the filtered card ID separately; it does not repair or rewrite native order records.

- A shared truck retains its load number at each confirmed destination. Different loads at one exact location, or locations whose screen hit targets overlap, open a chooser anchored at an existing point; their underlying coordinates are never displaced.
- Master-plan unit points use `MASTER_LOC.pt`, including paper insets. Genuine ground coordinates use `frameOf` and the calibrated **D001** `sheetPointOf` transform. Report fallbacks, unverified/approximate/area-only locations, stale moved positions and off-sheet positions remain in the map's unplaced-reference list.
- A reference is finished only at native `timeline841State(...).stage === 5`. The load tick requires every reference in the full load to be finished, including references hidden by search. On-site green alone does not qualify.
- Selecting a pin opens the matching native load without toggling it closed. View load scrolls only on that explicit action. Selecting a native load highlights its map pin. Zoom and selection survive redraws; day changes reset the map. The native full-map link remains available.
- The first visible map frames the confirmed drops with useful surrounding context (up to 3× for a tight group). Fit drops repeats that explicit action; Full plan restores the overview. Sync preserves the chosen framing. Manual zoom is bounded from full-plan fit to 6×; the enlarged map uses ordinary local scrolling. There are no wheel handlers, new map providers, new media, geolocation requests or operational writes. Native print layouts are unchanged.

Integration: append `drops908.css` in the head and `drops908.js` after native definitions. The script wraps `ldList` and `ldWire`; it does not replace `dayBlock`, the Timeline header or the other v9.08 presentation source. The public `Drops908` object exposes pure projection/location functions and a read-only report for tests.

Validation: `node tests/test_drops908.cjs` runs pure identity, completion and position checks. With absolute `PAGE` and private `EVIDENCE_DIR`, the same test uses the shared browser harness with **all non-GET requests blocked**, checks the native live-record model and writes 1440px/390px screenshots. Run under the shared `/tmp/gc500-browser.lock`. Detailed screenshots and live data evidence stay outside Git.

Status: frozen for integration. Focused checks pass, and phone/desktop previews have been reviewed. The integrated candidate still requires final release checks and publication. Detailed identifiers, screenshots and evidence remain in the private handover.
