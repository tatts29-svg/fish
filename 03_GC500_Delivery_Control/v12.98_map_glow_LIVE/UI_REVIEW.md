# Map visibility review

Author: Andrew Fisher

Focused browser checks passed on 5 Nov 2026 AEST against candidate SHA256
`ec4640ad3d8e8f99250247f40c98958d0b123b590e7c431973460f715f00d24d`.
The candidate stayed byte-for-byte unchanged during the run.

The native page was checked at 1440 × 1000 and 390 × 844 through the shared
read-only harness. Actual screenshots were inspected at both sizes. The bright
source outlines and location rings are clearly visible on Demob's close, wider
and whole-site pictures, all three Build panels, and the full Find pictures.
The drawing panel retains the sourced angle and multi-unit layout. Cards fit the
phone width, and the reference-layout and unassigned-position qualifications stay
visible. Existing pickup stamps and the current recorded/plan location caveat
were also inspected.

`tests/check_glow_ui.cjs` independently checks each ring's location against the
native aerial crop and the Build compositor's exact scale and crop. It verifies
the three Build offsets and the plan panel projection. A real unassigned position
has a ring and its qualification, with no invented outline.

The CSS pulse changes over time. Reduced motion keeps a static visible ring.
Hidden documents and offscreen content pause or detach their overlays; changing
tabs detaches Build previews. Returning to a Build preview reuses its picture and
projection, with one draw active at most and the existing cache bounds retained.
During settled 1.25-second animation samples, both tabs recorded zero canvas
draws, zero canvas encodes and zero additional image requests.

Both viewports finished with zero runtime errors, console errors, attempted
operational writes, queued writes or writes in flight. No UI defects remain from
this review. Broader regression sweeps and guarded publication are recorded
separately by the release owner.

Private screenshots and machine-readable results remain outside the repository
at `/workspace/gc500-map-glow-1298-private/ui-final/`.
