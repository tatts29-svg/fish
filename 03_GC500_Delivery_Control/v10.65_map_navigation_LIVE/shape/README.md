# Selected shape ripple — candidate

Author: Andrew Fisher

The current page starts a selection's ripple clock while the camera is still moving. The animation remains hidden during movement, so its first visible ring can appear halfway through the cycle. With the exact current source and a controlled clock, selecting at 100 ms and first drawing at 900 ms produces phase 0.5.

`patch_ripple1065.patch(text)` makes a new selection's start time pending (`null`) and establishes it at the first animation frame allowed by the existing visibility, movement and reduced-motion checks. `null` is distinct from the valid timestamp zero. The first visible ring starts at phase zero; repainting the same selection and resuming an already-started ripple keep the existing phase. The Done animation timing is unchanged.

This is a pure page transform with three exact substitutions. It does not update the footer, machine script pins, hit testing, layering, shapes, statuses, quantities or rates. Missing, changed or duplicated anchors and repeated application are rejected.

Validation:

- Five Python transform tests check exact scope and failure on source drift or reapplication.
- Fifteen Node checks execute the actual extracted selection and animation source. They reproduce the old bug and cover camera movement, hidden maps, reduced motion / Motion Off, selection changes and clearing, timestamp zero, normal phases and Done timing.
- Browser validation belongs to the combined release; no browser or live writes were performed by this subtask.

Run:

```sh
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s 03_GC500_Delivery_Control/v10.65_map_navigation_LIVE/shape -p 'test_patch_ripple1065.py'
node 03_GC500_Delivery_Control/v10.65_map_navigation_LIVE/shape/test_ripple1065.cjs BASE_PAGE CANDIDATE_PAGE
```

The previously documented kept-circle / neighbouring-shape tap overlap and Done minimum-size / neighbouring-label overlap remain for a separate visually verified change. Reversing their current layering or hit priority without a clear interaction rule would risk selecting a shape hidden underneath a visible badge.
