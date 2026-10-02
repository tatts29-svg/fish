# Vehicle visual review criteria

Author: Andrew Fisher · 2 October 2026

Scope: the seven existing Showcase choices, reviewed against the private desktop/phone captures in `private-v800-before-verified`. Those captures are **diagnostic only**: later poses advanced because `G.renderAt` unpaused the scene. Acceptance requires the new matched, held-pose captures. No private photographs or screenshots are included here.

| Choice | Visible baseline issue | Acceptance in matched captures |
| --- | --- | --- |
| Coates #26 (`car`) | Dense, flat-looking wheel centres; blue/black glass and lamps lack depth; broad smooth surfaces do not clearly separate materials. Wheel detail is obscured by smoke. | Curved body highlights remain coherent; tyre, rim and brake hardware separate; lamp housings read at useful scale; glazing shows the interior without hiding opaque parts. Smoke-clear wheel closeup and night brake pose are required. |
| Message Board (`car_vms`) | Existing detail framing loses most of the trailer; the front view crops the board top. | Full car, hitch, wheels, board and solar roof fit with margin; the LED message remains legible and in its original animated part; tyre and running-gear detail are visible. |
| Dunny Run (`car_loo`) | Flat trailer wheel and slab-like cabin; the detail view loses the trailer, although desktop front detail contains the full combination. | Full combination remains visible; cabin door and occupant animation retain their pivots; rounded wheel/axle/coupling details do not intersect the car or door. |
| Pallet Rocket (`forklift`) | Orange body is largely featureless; mast/ROPS merge into a black mass; rims read as flat discs. Some desktop framing clips the mast. | Full mast/forks/canopy fit; painted panel edges and mechanical fittings add useful depth; rubber and rims separate; forks, operator and steering remain aligned. |
| Boom Time (`boom`) | Large unbroken orange panels, flat rims and blocky tread dominate. | Paint highlights describe the panel shape; rim dish/tread/pivot detail is visible; service grilles do not cross Coates wordmarks; boom, basket and operators remain attached during motion. |
| Scissor Kick (`scissor`) | Tyres and rims merge into black discs; folded scissors have little visible mechanical depth; some desktop framing clips the upper platform. | Whole platform/guardrails fit; crossed members, pins and hydraulic fittings remain distinct without flicker; rims separate from tyres; the operator stays within the basket. |
| Paddock Basher (`tractor`) | Flat wheel discs, coarse tread and thin cab glazing; apparent ground gap in advancing poses is not a confirmed geometry defect. | Tyre curvature/rim recesses and cab interior are visible; glass occludes correctly; wheels contact the road in the matched held pose; rear linkage remains attached. |

Shared acceptance:

- Compare equal vehicle, actual simulation time, camera, lens, light, canvas size and quality. Assert paused state after every `G.renderAt` and again immediately before capture. Only logged smoke removal is permitted for inspection.
- Audit projected bounds of the complete animated model and trailer, not just the car body. Avoid cropping upper machines or important lamps/wheels; keep enough road visible to judge contact and shadow.
- Preserve the original seven choices, selection flow, speed/grip values, wheel/basket/door motion, VMS text, operational records and read-only state. Check both Balanced and High and WebGL context restoration.
- Require visible improvement on desktop and phone without missing faces, black paint bands, decal intersections, glass-order defects, detached hardware, persistent shimmer or new GL/console errors. CPU geometry validity alone is insufficient evidence of appearance or frame rate.

Source limits: the 39 private October 2 reference photographs and their index are primarily track, pit, bridge, fence and surrounding-building evidence. Originals `20667.jpg` and `20701.jpg` were visually inspected during this review; neither is a selected-machine closeup. Earlier v6.61 notes describe Andrew's September 26 plant photographs, but those original files have not been located or visually reviewed in this task. The refinements retain the existing rough-terrain forklift, articulating boom, rough-terrain scissor, tractor and two trailer families; small fittings are illustrative, not claims of an exact manufacturer's model or dimensions. No map or asset anchors are added.

Status: matched integrated captures and final visual verdict pending.
