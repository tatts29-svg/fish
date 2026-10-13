# Map status quantities

Author: Andrew Fisher

Scoped source is ready for integration. Publication and final phone/desktop browser verification belong to the release owner.

The existing Complete/Not complete boxes now show quantities from the same typed item scope used by the reference. Verified complete single-item scope can show `6/6`; incomplete scope shows `Qty 6` without inventing a completed count. Partial installation is explicitly labelled `installed`. Mixed references keep each description separate: WC09 has four FWF, six Pee Panels and two Toilet Blocks. Missing quantities remain explicit. No native status, financial calculation, location or record is changed.

Known quantities also sit in brackets next to the map reference, including unselected markers. Mixed types remain separate, such as `WC09 (4 + 6 + 2)`. Unknown quantities omit the bracket. Label width and tap rectangles follow the actual displayed text; exceptionally long mixed labels abbreviate whole terms and retain their full typed details. Map coordinates and the original marker hit logic stay unchanged.

Canvas labels show at most three quantity lines. References with more types have the full list in a folded Quantities section, which retains its open/closed state and focus through shared refresh. Quantity changes use the existing map refresh; no polling timer was added.

Integration:

- Apply `patch_quantity1010.apply(page)` to the parent after the v10.09 map status bridge is present. The quantity reader fails safely without changing the physical status.
- Run `patch_maps1010.py BASE_DIRECTORY CANDIDATE_DIRECTORY`. It checks exact input hashes, changes only the three files listed in `evidence/source-bound.json`, and updates both script cache queries.
- `publish_maps1010.py` adapts the existing guarded machine publisher. Default preparation is read only; the release owner separately controls publication.

Checks completed: 35 pure quantity controls and 22 exact-source controls. The browser checker is syntax-checked; no browser was launched by this scoped task. The initial checker was independently reviewed before bracketed-label scope was added.

Browser verification, run by the release owner:

```bash
PAGE=/path/to/combined.html MAP_CODE=/path/to/map-candidate EXPECTED_SHA=reviewed_parent_hash OUT=/private/output node quantity/tests/check_quantity1010.cjs
MOB=1 PAGE=/path/to/combined.html MAP_CODE=/path/to/map-candidate EXPECTED_SHA=reviewed_parent_hash OUT=/private/phone-output node quantity/tests/check_quantity1010.cjs
LIVE=1 EXPECTED_SHA=reviewed_parent_hash OUT=/private/public-output node quantity/tests/check_quantity1010.cjs
```

The checker keeps the shared harness's operational write blocker. It checks exact assets, WC09/WC50 quantities, quantity-only refresh, partial/mixed/unknown scope, compact long lists, disclosure persistence, unchanged camera/native record, browser errors and screenshots. Synthetic cases replace only the read-only bridge provider and restore it afterwards.
