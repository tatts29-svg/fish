# v11.22 — fresh water, counted on its own

Author: Andrew Fisher. Built on live v11.21 `245eecad…`. Status and hashes in STATUS.md.

Andrew, 22 Oct 2026: "I want a percentage of what was filled of water. … maybe like a water icon so we know what was done.
When they scan as i said i dont want it to be part of the completions done. But we also want to know how many of each were
filled … As we want to make sure they check the water too. This is using the same clean qr code." Then: "some toilets might
not need filling how you wanna gauge this or do we do check/ refilled to capture both".

## What was already there

Since v10.67 every FWF and accessible unit's **Clean & restock** code has carried a third job, **Refilled**, as an *extra*:
"Tap if refilled · not counted in %". The completion percentage never counted it. Nothing added it up either, and a unit that
needed no water looked the same as one nobody checked.

## What `patch_v1122.py` does

1. **Water checked**, a second extra beside Refilled on the same clean code, for every FWF and accessible unit on every night
   (the tracker definition: `SVC1067_DATA` on the page and the copy in the card bundle; both edited the same way). The crew tap
   it every time they look at the water; they tap Refilled too only when they filled it. A unit that was fine is checked, not
   missed.
2. **The tally.** A blue drop with the percentage, "Water checked · d of w units · refilled r (FWF a, accessible b)" and the
   words "tracked on its own · not in the completion %":
   - on the page's servicing panel (Event nights, edit link): under the whole-night meter, and a small one on each area's row;
     the area tables already show both jobs as "not in %" columns;
   - on the crew card template: under the progress bars (area and everything), a small one on each area's header, and the
     reference's own count on its code's card. The Water checked button carries its own hint.
3. The completion percentage, the counted jobs and the Refilled button are unchanged. Footer v11.21 → v11.22.

The crews see the card changes only when the tracker is published again from the page's own **Manage servicing tracker**
fold ("Create / update event tracker", which keeps the printed completion codes and the ticks already made). That is a
deliberate operator action on the edit link, separate from this page release.

## Checks

`tests/test_v1122.cjs` on a copy of the live v11.21 page with the patch applied (the live build is byte-identical): 12/12 —
the definition carries Water checked as an extra on the clean code in the FWF and accessible night plan; the panel, rendered
from the page's own module with made-up ticks (two cleans, two checks, one refill), shows "Water checked · 2 of 242 units ·
refilled 1 (FWF 1, accessible 0)" and a small line on all 15 areas; Water checked and Refilled are not counted jobs and appear
as "not in %" columns; the card template publishes with the tally and the hint and renders a water line under the Everything
bar and on every area header; record unchanged; 0 errors; 0 writes; the completion percentage and counted jobs are identical
to the v11.21 page on the same ticks. Toolchain PASS. Sweeps and the live run are in STATUS.md.
