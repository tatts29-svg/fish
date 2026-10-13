# FWF photos at the location

Author: Andrew Fisher

Ready for combined integration and browser verification by the release owner. This scoped task has not published or changed a native record.

The FWF description has one photo area for its full location quantity. Individual asset numbers, ownership, details and work remain in their existing cards. Existing FWF unit photographs appear once in the shared gallery with their original captions and associations. Pee Panels and other descriptions retain their existing controls. Photos without a confirmed FWF association remain under the existing location/unassigned area.

New FWF location photographs use `['location-item1010', reference, 'FWF']` as their explicit association in the existing photo document/outbox path. There is no new collection, data migration or whole-list rewrite. Adding a group photo uses its own available slot; it cannot replace an old per-unit photo merely because the slot number matches. Explicit Replace preserves the selected photo’s original unit association and caption. Existing Remove link and caption tools remain available.

Apply `patch_photos1010.apply(page)`. Its guarded replacements only add the FWF rendering path, remove repeated FWF unit photo controls, include aggregate photos in the assigned set, name the group clearly, and revalidate the photo scope after image processing. Original physical-unit models, other item models and photo persistence functions remain unchanged.

Checks passed:

- 31 quantity, association, preservation and guard controls.
- 9 native upload-path checks using in-memory substitutes; no upload or record write.
- 17 source/parse controls, including unchanged native data/models/caption tools and repeat rejection.

The prepared `tests/check_photos1010.cjs` uses the shared browser harness and blocks operational writes. It checks WC09, distinct Pee Panel controls, retained individual details, gallery open/close persistence, old/new FWF photographs and a captured upload intent. Run with `PAGE`, `EXPECTED_SHA`, optional `MOB=1`, and private `OUT`; `LIVE=1` verifies the published parent. Browser execution belongs to the release owner.
