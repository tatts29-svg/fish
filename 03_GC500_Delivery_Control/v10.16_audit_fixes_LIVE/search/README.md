Author: Andrew Fisher

Current numbered contents now appear in the existing global finder. Searching an
accessory opens its current reference, expands the contents section and highlights
the matching row. Moved or removed history is not indexed. Existing primary-unit
matches take precedence over duplicate contents records at the same reference.

The audit found 48 of 76 current numbered accessories missing from search. Their
saved locations were correct; the finder adapter only read the physical-unit model
and omitted the reference's active accessories. No native record, price, quantity,
ownership or map position is changed by this patch.

Integration: call `patch_search1016.apply(html)` from the release patch. This module
guards its finder/quantity dependencies, identifies one active contents row and
appends its runtime script. The root release owns the exact live-base guard and
version footer. Applying this module twice is refused.

Validation: `node test_search1016.cjs`; run `check_search1016.cjs` with `PAGE` set to
the candidate. The browser harness rejects every non-GET request. Detailed native
results and the inspected phone screenshot remain in the private audit directory.
The root integration record carries final combined candidate and publication checks.
