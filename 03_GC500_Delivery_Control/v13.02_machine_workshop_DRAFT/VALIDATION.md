# Workshop preview validation

Author: Andrew Fisher · 5 Nov 2026

**DRAFT — REVIEWABLE. Not a release candidate.**

- The exact current machine app module is guarded before patching. JavaScript syntax and Python compilation checks pass.
- The original fitted Three.js powertrain is exercised over 101 sampled lift positions. Its 101 original engine objects retain identity. Fixed car assemblies stay fixed; sling lengths, sump support, floor contact and finite transforms pass. Play/pause, scrubbing, reset, invalid entry, exit and repeat entry pass. Original parents, sibling order, positions, orientations, scale and visibility restore exactly. The crane in this test is a transform fixture.
- Browser checks use the full original garage/crane and read-only asset requests: **24/24 desktop and 24/24 phone**, zero runtime/console errors. They verify entry/exit, the component set, engine locking, stage movement, paused state, clamping, competing keyboard controls, close inspection/overview, restored controls and no horizontal page overflow.
- Final screenshots were inspected. The overview shows the hook, engine, car and receiving cradle above the controls; the close-up shows the original engine detail. An independent source/visual review concluded **DRAFT — REVIEWABLE**, with no remaining visual blocker to showing the preview.
- Public read-back at the end remained v13.01 page `2f6bc154b896a33252f21b1b438593b2d7453b79bb47ef3ff01abb0721624e7b` and machine `674404701b251917625f8589420d33896fbbf13d018da2a20591b3d31eb4e90a`. No publication or operational write was performed.

The browser uses software WebGL. Its phone viewport proves responsive layout and controls; it does **not** establish frame rate, thermal behaviour or loading speed on Andrew's phone. Full native-device performance, complete disconnection/refit choreography, all-path collision and long-running interaction checks remain before a live implementation. The prepared illustrative lift does not certify the model's lifting attachments or replace a maintenance procedure.

Evidence is in `evidence/`. Candidate source hashes identify the exact reviewed code. No new page or machine release hash exists because nothing was published.
