# v10.73: milestone headlines count boards, not bookings (LIVE 19 Oct 2026 03:17 AEST)

Author: Andrew Fisher · built and uploaded by Claude.

Andrew, 18 Oct: "Fix.this .saying only.4.onsite on main page". The VMS milestone card read "4 of 4 complete": its headline
counted references (T0001, T0103, T0128, T0158), while its percentage already counted boards. Now both count the area's units.

- **What changed:** the milestone card headline and the milestone list line show `units.done of units.total <unit>` (for
  example "16 of 20 boards complete"). An area with no unit count keeps the old reference count. Footer v10.72 → v10.73.
  Nothing else: no record, rate, tick or count logic changes.
- **Patch:** `patch_v1073.py`, built with `bash toolchain/build.sh v10.73 v10.73_milestone_units_LIVE/patch_v1073.py` on
  live v10.72 `ad9d7c0c…`.
- **Page:** `31f1a9f5ea7d46057ad84e5b210d8a76102192386f7e52a5496ab572f46e6922`, 18,507,633 bytes. Uploaded with
  `toolchain/upload_page.py` (base guard passed); the view link serves it byte for byte.
- **Tests:** `test_v1073.cjs` checks every milestone headline against its own facts, VMS at "16 of 20 boards complete", the
  footer and page errors. It passed on desktop and phone on the build, and on the live page (`evidence/test_*_16of20.json`,
  `evidence/test_live_desktop.json`). Both 24-tab sweeps found 0 errors (`evidence/sweep_*.json`). The first tests, at
  "16 of 16", ran before T0158 went back to 9 (`evidence/test_desktop.json`, `test_phone.json`).
