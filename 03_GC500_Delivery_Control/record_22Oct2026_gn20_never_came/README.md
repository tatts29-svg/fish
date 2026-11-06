# Record attempt, not applied: GN20 off the record (superseded by v11.18)

Author: Andrew Fisher. 22 Oct 2026, 12:20 AEST. **Nothing was written.**

Andrew: "never came to site 1276701"; "remove the 1276701 350A". The first thought was a record change through the
page's own controls: Complete off, the light to not on site, a note. `gn20.cjs` is the record runner with a
`complete_off` op added for it (`setDone(ref, false)`, as the drawer does); `gn20_spec.json` is the spec.

The dry run stopped at once: **"GN20 is not an asset on the page"** — GN20 had been deleted as a reference on 20 Oct, so
there was nothing on the record left to change. The set was still priced because the page's copy of the Baseplan export
had line 6 as Delivered and the register named 1276701 on GN20. That is page data, so the fix went as the data-only
release `../v11.18_1276701_never_came_LIVE/` (12:59 AEST). Kept here so the trail shows why the record was not the place.
