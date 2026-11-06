# Workshop service review

Author: Andrew Fisher · 5 Nov 2026

Candidate: `380d057f6eee18c948c29741a0ab5d431801ff7f796fef9b5c158170214c5c98`.

Independent source and geometry review checked original engine identity, support
before rig release, returned sling connections, hose/clamp movement, fixed port
orientation and restoration. It identified and resolved the returned-hook gap,
upward slack, fixed clamps left at moved hose ends and rotating fixed ports. The
reviewer reran the 6,556 service checks against the final lift and service hashes.

The mechanic review sampled actual original skeletons, socket/hand contact,
foot clearance, routed walking, moving-load clearance and reverse/arbitrary
scrubbing. Final checks include bounded walking speed and matrix comparisons at
phase boundaries. The last boundary finding was corrected by retaining the prior
stance when beginning a walk and blending existing inverse-kinematics weights.
Original fields, bone poses and contact shadows restore on exit.

The lesson review checked all four stroke phases against original piston/valve
motion, all sixteen component inspections, original-resource ownership, cyclic
metadata, rig-clear gating and exact restoration. Visual review identified an
obstructed teaching view. The cycle-only cutaway now exposes the near cylinder,
valves and rod; line-of-sight checks and rendered phone/desktop views verify it.

Integration review found and resolved manual-lesson takeover during the tour,
refit direction after leaving the tour, portrait component framing and delayed
orientation projection. The camera refreshes for the current viewport before a
rendered workshop frame; it does not repeatedly refit an unchanged viewport.

Release review independently verified all 245 candidate files, all eight changed
prepared/source outputs, versioned import edges and the 237 retained descriptors.
It also identified an early acceptance-receipt write. The corrected machine
harness awaits browser and server closure, then rejects late errors or writes
before saving a pass. Mocked clean, late-error, late-write and close-rejection
cases verify that behaviour. Earlier receipts are not used for publication.

Final browser and publication evidence is recorded separately. Browser viewport
emulation verifies layout and behaviour, not physical-device frame rate or thermals.

Final acceptance is complete on the exact candidate: machine 84 desktop / 86 phone;
dashboard 97 each. All have zero runtime/console errors and zero record writes.
The corrected first phone mechanic capture also shows the complete scene.
