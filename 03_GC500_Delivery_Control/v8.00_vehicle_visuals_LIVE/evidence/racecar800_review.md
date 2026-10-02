# Race-car visual mesh review

Author: Andrew Fisher

The v8.00 race-car module repairs inconsistent curved-panel normals and adds mechanical depth to the existing authored coupe. The shader and other selectable vehicles have separate owners. This is an original illustrative model, not a surveyed reconstruction or an imported vehicle asset.

The prior mesh already contained 82,722 triangles in Balanced and 174,446 in High. Independent face/normal comparison found 180 and 210 triangles respectively with opposed vertex normals. Choosing one orientation per parameter surface, repairing folded front bumper strips and making wheel-arch endpoints explicit removes those conflicts. Surface derivatives give the curved sheets coherent normals.

The geometry also now contains four recessed projector assemblies, four filled and segmented rear lenses, rounded tyre shoulders, rolled rim lips, ventilated disc edges, forty broad dished spoke volumes, hexagonal wheel hardware, chamfered wing endplates and closed wing edges with a narrow Gurney lip. The existing material names and vertex layout remain available to the shared material refinement.

| CPU geometry | Previous | Refined |
|---|---:|---:|
| Balanced triangles | 82,722 | 81,102 |
| Balanced retained mesh bytes | 2,967,384 | 2,939,688 |
| High triangles | 174,446 | 146,246 |
| High retained mesh bytes | 5,679,592 | 4,868,936 |
| Model parts before existing decals | 31 | 31 |
| Opposed normal/face triangles, Balanced | 180 | 0 |
| Opposed normal/face triangles, High | 210 | 0 |

The exact original model envelope, part names, wheel pivots, cache contract and complete livery mesh remain unchanged. The guarded replacement changes only the visual model module; it preserves everything before and after that module byte for byte. Vehicle selection, towing, suspension, steering, physics and particle generation are outside the patch. The existing geospatial adapter also consumes this model, although its separate material mapping remains a limitation of that renderer.

The focused CPU suite passes 32 checks, including independently welded closed spoke volumes, outward volume orientation, finite buffers, triangle/normal agreement, envelope and budget checks, exact livery placement, deterministic generation with random access prohibited and cache reuse. Six patch checks establish exact guarded replacement and rejection of altered, missing or duplicate source modules. These checks do not establish GPU performance or visual acceptance. Surface-normal generation is more expensive during the first cached build; it performs no per-frame mesh work.

Baseline desktop and phone `detail` and `frontdetail` stills in `/workspace/private-v800-before/` were visually inspected. They show outlined lamps, thin noisy spokes and abrupt roof/window shading. The desktop `wheel` still retains the front-detail framing because the public view selector does not accept that internal shot name; it is not evidence of a wheel close-up. Final approval requires matched captures of the combined geometry and materials, including movement and both display sizes.
