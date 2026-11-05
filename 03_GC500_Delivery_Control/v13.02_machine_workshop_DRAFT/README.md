# Coates Way engine workshop

Author: Andrew Fisher · 5 Nov 2026

**Approved implementation — final integration checks in progress. Not yet published.**

Andrew approved all proposed machine improvements: “Lwts go.approved.to.all”. The existing Coates #26 car now has an engine workshop, finer materials and mechanical details, improved lighting and more detailed crew. The original Coates orange, car artwork and normal machine controls are retained.

Choose **Engine lift** to raise the original 101 engine components with the garage crane, move them to the cradle, inspect, pause or scrub the sequence and refit them. The driver moves clear of the car before the sequence; background crew hold their existing safe workshop positions. Hook ropes stay connected and engine slings keep their length. Secondary load motion stops when paused or when reduced motion is requested. Exit restores the original car assemblies and controls.

Choose **Bench** to inspect 16 components, turn the crank by hand, reveal the cutaway, trace the modelled oil galleries and coolant hoses, or diagnose two visible interrupted connections. A fault must be identified before its Repair action becomes available. The same original engine objects and kinematics are used; the cockpit, suspension, transmission and rear driveline stay on the car. The engine remains isolated from the driving controls while on the bench.

Graphics include bevelled lifting steel, weld seams, fasteners and washers, lifting hardware, service trays, clamps, separate cast/machined/brushed finishes, a quieter workshop floor and neutral fill/rim light. All eight existing crew figures gain articulated glove fingers, smoother palms, boot and seam detail, and a shared cloth/leather normal texture. Existing body routes, palm contacts and car branding stay intact.

The sequence begins with an engine prepared for removal. It is an interactive mechanical illustration, not factory CAD, a lifting calculation or manufacturer servicing guidance. It does not simulate every disconnection or certify lifting points. Coolant tracing shows the existing radiator hoses and pump unions; missing pipe runs and internal jackets are not invented, and no circulating loop is claimed for the removed engine. No real pressure, temperature or service specifications are fabricated.

## Source and release

- Shared branch: `ccr-061f77e8-ivjhrv`; isolated implementation: `codex/machine-engine-lift-1302`.
- Original source: `04b39247275b6b99475185560e43828f1c8fdcec`; approval claim: `0f72b49d`.
- Required unchanged dashboard v13.01: `2f6bc154b896a33252f21b1b438593b2d7453b79bb47ef3ff01abb0721624e7b`.
- Retained machine: `674404701b251917625f8589420d33896fbbf13d018da2a20591b3d31eb4e90a`, 236 files.
- Exact base `car-app.js`: `d2964c3138eb1b2429a542cfb598adb507ae345b6b92858c78231fdbe49ff3c8`.

This is a machine-only release. Five small modules are added; `car-app.js` and the machine entry HTML change. All 234 other files remain byte-for-byte, including map/explorer/3D dependencies. The machine entry versions its module URL to avoid an old cached app hiding the new controls. Dashboard, shared record and financial calculations are unchanged. Exact final release/read-back evidence belongs in `VALIDATION.md` and `evidence/` after completion.

## Reproduce

`prepare_preview.py <exact-base-folder> <private-prepared-folder>` retains its historical filename. It now builds the approved candidate. It requires the exact original module SHA and one occurrence of every integration point. Then use `release/build1302.py` to assemble and verify the complete retained 241-file tree; see `release/README.md` for the frozen-candidate checks and guarded publication commands.

Run the independent module checks with Node:

```sh
node tests/test_engine_lift.mjs
node tests/test_workshop_finish.mjs
node tests/test_crew_polish.mjs
node tests/test_workshop_learning.mjs
python3 -m unittest discover -s release -p test_release1302.py
```

Browser acceptance uses the full frozen candidate with `PREVIEW_ROOT`, `OUT`, `GC500_CACHE`, `GC500_TOOLCHAIN`, `NODE_PATH` and `CHROMIUM_PATH` set. Serialize Chromium sessions with `/tmp/gc500-browser.lock`. `tests/test_browser.cjs` exercises desktop and phone workshop controls and restoration; `tests/test_dashboard.cjs` checks the unchanged dashboard routes and embedded machine. All requests are read-only.

The added crew detail uses no extra draw calls; finish details use ten instanced draws and cull by distance/quality. Small lift details do not cast shadows. Existing adaptive resolution remains active. Browser phone emulation checks layout and functionality, not physical-phone frame rate or thermal behaviour. No instant-loading or hardware performance claim is made.
