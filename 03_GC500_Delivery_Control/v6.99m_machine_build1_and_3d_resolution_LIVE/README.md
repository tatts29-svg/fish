# Machine build 1 + 3D resolution fix (LIVE)

Author: Andrew Fisher

## Coates Way machine, build 1
- **The plate through the car is gone:** two carbon door cards had been built with width and depth swapped. They now
  sit inside the doors.
- **Light-shaft sheets** no longer stand through the body.
- **View:** the whole car is visible in 50 of 50 sample views (32 before).
- **Lag:** draw calls halved (idle 1,763 → 807), and shadows are drawn only when something moves.
- **Driver:** he gets out safely before the car comes apart and back in afterwards.
- **About cards:** they close on any tap, and on their own after a few seconds.
- **Tests:** test_v6_99 17/17 and test_v6_92 24/24. See `CHANGES_v6.99.md`.

## 3D (v7.14c)
The 3D view drew at the device pixel ratio squared (about 45× the screen's own pixels on a 2.6 fold). Each quality now
draws at its true target: Auto is 1.75–2×, Ultra is the device's own up to 3×, Light is 1×. On a 3× phone the canvas
went from 2340×5064 to 644×1267 on Auto.

**LIVE: 28 Sep 2026, 00:50 AEST.** Machine set 5a67cbfec12a (219 files). All files were verified byte for byte on the view link.
