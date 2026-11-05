# Workshop inspection and control polish

Author: Andrew Fisher

The phone's changing service-action labels previously squeezed the scrub track
down to its minimum. Compact, fixed-width actions now leave a usable track while
their accessible names and tooltips retain the complete action. The existing
dark/orange panel, arrangement and all controls are preserved. The slider has a
44 px target height; progress and lesson angles expose their meaning to assistive
technology, including the current service stage or four-stroke phase.

Inspect now frames the actual complete engine bounds instead of using a fixed
distant offset. Orientation changes retain that inspection. Component inspection
no longer has a 1.4 m camera-distance floor: the selected geometry and available
screen area determine the view, and the original zoom limits restore on exit.
Small isolated components therefore occupy a useful area without changing their
geometry or claiming extra source detail.

The original-engine projection test covers all sixteen bench components at 320
and 390 px phone widths, landscape and desktop: 1,706 checks pass. At 390 px the
original intake valve's calculated view fills about 72% of the available width
and 75% of the available height. This is geometry/projection evidence; final
rendered framing and interaction must also pass the actual candidate browser run.

Run `WORKSHOP_SOURCE=/private/verified-machine node tests/test_controls1304.mjs`.
The root browser harness can call `tests/controls1304_checks.cjs` with
`{page,check,mobile}` to verify actual engine fitting, orientation persistence,
stable action widths, phone track width, original-valve close-up and range labels.
It opens no extra browser and performs no network or operational writes.

Rendered review also exposed the existing isolation markers covering small parts
at the improved close-up scale. `workshop-lessons.js` now sizes those two markers
from the actual selected component, caps their radius at 5 mm, and stops the
tether outside the displayed component's measured bounds with clearance. The
reference still starts at the true fitted location. Depth testing prevents
markers or the tether drawing over a component when orbiting. The existing
colour, opacity and fitted-location outline are preserved; no original geometry
or material is changed. The dedicated original-model regression checks all
sixteen components at eight rotations, including the sump and small valve.

Production files changed: `workshop-ui.js` and `workshop-lessons.js`. Imports of the
changed mechanic, service, lesson and workshop-tour modules use `v=13.04`;
the unchanged lift import remains on its existing version. The lesson's existing
four-stroke, isolation and restoration state transitions are unchanged.
