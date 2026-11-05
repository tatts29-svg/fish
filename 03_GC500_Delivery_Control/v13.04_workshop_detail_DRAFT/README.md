# Coates Way workshop detail

Author: Andrew Fisher

ACCEPTANCE COMPLETE — v13.04. The existing Coates Way machine/workshop now has
clearer surface finishes, seated mechanical hardware, continuous tool engagement,
closer component inspection and steadier phone controls. The orange Coates identity
and existing features remain. Andrew requested sharper, cleaner detail and movement
throughout this area. The machine remains an interactive mechanical illustration,
not manufacturer service specifications.

- Four shared surface maps distinguish cast, machined, brushed and rubber finishes.
  Seated washers, chamfered bolt heads, piston rings and moving clamp screws add
  detail without changing original geometry or part ownership.
- Socket/wrist contact is continuous; tour walking follows the service movement
  limit. Engine and individual-part inspection use actual bounds; small valves
  can be inspected closely without oversized annotation dots hiding them.
- Phone actions keep stable widths and accessible labels, with 44 px targets.
  Camera orientation, original zoom limits and normal car view restore correctly.
- Shadows follow the current pose and flush after movement stops. Conservative
  stationary-frame reuse respects real input, movement, camera and quality changes.
  Software-browser measurements establish correctness, not physical-device speed.

Starting source: `18b80f4dad5b2f3e2c48e5b92c340e261f7b389d`.
Shared branch: `ccr-061f77e8-ivjhrv`; isolated `codex/machine-detail-1304`.
Release base: v13.03 machine
`380d057f6eee18c948c29741a0ab5d431801ff7f796fef9b5c158170214c5c98` (245 files).
Final candidate: `v13.04-workshop-detail`, manifest
`f139782e513a360ab87e05b7899defb02348355a4e7e09e7ae06fdfcedba9aad`,
246 files, 169,977,351 bytes; nine changed paths, 237 exact retained files.
Dashboard remains v13.01
`2f6bc154b896a33252f21b1b438593b2d7453b79bb47ef3ff01abb0721624e7b`.
No records, maps or finance changes. Event Showcase/race narration and finance
remain separately owned on the shared board.

Final acceptance: machine desktop 99 checks; phone 106 checks including orientation
and 320 px controls; dashboard desktop and phone 97 checks each, 27 routes, seven
links and Back. All four receipts bind the exact candidate and all nine changed
file hashes, with zero runtime/console errors and zero attempted record writes.
Native idle, trusted pointer wake, exact crank/rotation, later draws/current shadows
and exit are checked before deterministic pose review. Phone and desktop captures
were visually reviewed. Physical-phone sharpness and frame rate were not measured.

Source/model checks: service 6,560; lessons 3,976; showcase 416; controls 1,706;
annotations 2,340; motion 469; render policy 112; finish ownership/budget checks;
28 fake-network release-guard tests. Independent source and visual reviews found
no unresolved blocker. A camera-rounding defect found during acceptance was fixed.
The separate failed mixed manual/native test fixture is retained as diagnostic-only
history; it is not a release receipt. See `evidence/REVIEW.md`.

Guarded publication and fresh public read-back are next. Not yet a live claim.
