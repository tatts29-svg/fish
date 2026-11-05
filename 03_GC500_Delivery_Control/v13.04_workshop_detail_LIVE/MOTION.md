# Workshop movement refinement

Author: Andrew Fisher

The v13.03 ratchet wrist rotation switched on when contact crossed 0.99; its
socket jumped to the source connection at 0.999. Fine probes on the original
model measured a maximum 0.942 m socket jump and 0.145 rad wrist jump across these
thresholds. The revised mechanic blends wrist rotation and extension engagement
through the approach and withdrawal, still meeting the original source exactly
at full contact. The orange handle-end cap now follows the handle's orientation.
No original person, skeleton, tool-contact marker or engine component is replaced.

The tour previously mapped its 126-second shot scale directly to service progress,
bypassing the mechanic's walking limit. A full actual crew/service run measured
19.84 m/s during refit. The service now exposes its existing walking-rate constraint
and current action range. The director advances its single timeline within that
constraint, stopping at each task boundary before reading the next constraint.
Seeks retain their exact original model/camera positions; ordinary service playback
and support-before-unhook gates remain unchanged. The 126-second scale is nominal;
actual playback now takes additional time when the worker needs to walk.

Validation is in `tests/test_motion1304.mjs`: original contact/floor/clearance,
forward/reverse/arbitrary-scrub, walking-speed and exact-restoration checks, plus
fine threshold continuity and complete real-model tours at 100 ms and 16 ms
frame intervals. `tests/test_workshop_showcase.mjs` remains the original 416-check
director/ownership/camera regression. No browser or operational write is used by
these tests. Root owns combined browser verification and publication.

Final model result: 469 checks pass. All original 360 mechanic checks remain, plus
48 threshold crossings and complete tours at both frame steps. Native service
walking remains at most 1.1961 m/s. The tour is at most 1.2000 m/s in both complete
runs and refits fully, taking 267.000 s at 100 ms steps and 266.992 s at 16 ms steps.
The former 126-second shot scale remains the exact seek coordinate, while walking
now receives the time it needs. The hand and socket remain on their modelled
contacts; maximum full-contact palm error is 1.05 mm. Exact snapshots still match
when sought backwards or in arbitrary order. Original 416 director checks pass.
