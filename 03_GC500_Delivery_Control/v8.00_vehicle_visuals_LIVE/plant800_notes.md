# Selectable plant and trailers — visual refinement

Author: Andrew Fisher · 2 Oct 2026

Andrew: “I reckon the car.needs a huge upgrade as well as chosen vehicles they look very atari”; “Visually”.

This component covers the four existing Special Edition machines — forklift, boom lift, scissor lift and tractor — and the existing VMS and portaloo trailers. The race car and shared material shader are separate components of the same release. It does not add a vehicle, change the selector or touch operational records.

`patch_plant800.py` inserts `plant800_src.js` immediately before the existing `G.setVehicle` function, after the fleet model definitions. It refuses repeat application and a page lacking the six expected model constructors.

## What changes

- Flat wheel discs become shaped tyre shoulders and sidewalls, dished pressed rims, recessed ventilation pockets, rim lips and separate studs. Rough-terrain tread has tapered chevrons; the trailer tyres retain a road pattern.
- Large orange panels have planar faces and rounded pressed edges with analytic normals. Smaller solid panels gain restrained bevels. Thin markings and glass retain their surface geometry.
- Existing machines receive service-panel seams, grilles, mast/scissor pins, hydraulic fittings, steps and cab/basket detail. Grilles stay clear of the original Coates wordmarks.
- Both trailers gain running-gear depth, suspension strips and coupling detail. The VMS display and portaloo door/occupant remain separate animated parts.
- Identical material, colour and motion groups merge into fewer draw parts. Model construction remains cached; no new textures, passes or per-frame geometry are added. Float32-collapsed faces from the inherited operator/beacon primitives are removed during the one-time merge.

## What is preserved

The seven existing choices and labels, `G.PLANT` speed/grip/note values, wheel pivots, basket sway, trailer hitch and physics, portaloo door/arm animation, VMS face metadata, Coates decal positions and model envelopes remain intact. Existing semantic functions and selection markup are compared against the unpatched page in the independent tests. No source map, record, asset position or simulator tuning is changed.

## Verification

Independent CPU checks cover both quality levels of all six models, geometry validity and winding, primitive outward normals, exact material/motion grouping across the merge, preserved animation metadata, cache identity, quality budgets, protected selection/motion functions and patch guards. Results are in `evidence/plant800_checks.json`.

The geometry budget is 30,000 triangles per model; the current maximum is below 25,000. Models use 17–25 draw parts, down from 23–39. The added geometry is deliberate visual detail; these CPU counts are not a frame-rate claim.

Original and current desktop model captures were inspected. Private before/after CPU model renders were also inspected to check shapes and fittings; those renders are geometry diagnostics, not proof of the final shader appearance. Integrated moving desktop/phone checks and screenshots with the shared material changes remain required before release. This component is a draft, not independently published.
