# v8.09 — The Coates Way machine upgrade

> **Version note:** this release is **v8.09**. Codex claimed v8.08 first, in f4455f0. The folder was first named `v8.08_` and was renamed `v8.09_` once the four builds finished; the version labels in its code and tests say v8.09.

Author: Andrew Fisher · 2 Oct 2026, handover 3 Oct 2026 · **STATUS_LINE** The live machine set is v8.13 `65c47180…` (`v8.13-maps-satellite`, 219 files). The 56 machine files v8.09 builds on are copied unchanged in `base/`, and the work is in `work/`. See **READY handover** at the end.

## Andrew's words (Claude's chat, 2 Oct 2026)

"I need you to work on improving the coates way. You need to get rid of the info boxes they pop up every where. And dont close. I need you to upgrade this area. Push your limits further. Add more mecahnical features. The guy who is the driver looks like he crawls out of vehicle. Make this all 4k crystal clear. Improve every thing on here. 10/10"

## What we found before starting

**Info boxes.** On a phone, tapping things in the garage opens an "In the garage" card that covers the car. Its close button is pushed off the bottom behind the control dock, so it can't be closed. The cards come from `showExhibit` in `car-app.js`.

**The driver.** The driver figure (helmet 26) stands and walks on top of the car, with his body coming through the roof.

## The work (four parallel builds on separate files)

| Area | Files |
|---|---|
| Info boxes and interface | `car-app.js`, CSS, `index.html` |
| Driver and crew | `car-driver.js`, `crew.js`, `poses.js` |
| Mechanical features | engine, drive, pit machinery and register files |
| 4K clarity | renderer, effects, garage, body, cockpit surfaces |

Each area records its changes in `evidence/CHANGES_*.md`.

**Test rig:** `evidence/machine_rig.js` serves `work/` locally. It fetches models and sounds from the live machine by GET only. Every fetched file must match its descriptor in `evidence/manifest_v809.json` (see the handover).

**Publishing** needs the edit key, so Codex publishes once this is READY. Mock-up pictures go to Andrew first.

## READY handover

HANDOVER_BODY
