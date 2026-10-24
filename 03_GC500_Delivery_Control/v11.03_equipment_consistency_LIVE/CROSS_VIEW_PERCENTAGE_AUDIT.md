# Cross-view percentage checks

Author: Andrew Fisher

The v11.03 milestone change uses the same selected-day qualified completion scope as Today. Previously, an incomplete value near 100% could round up to 100%, and an unavailable value became 0%. Screen and A4 summaries now preserve unknown values, lower bounds and provisional scope. Quantity and remaining-work text also preserve unknown values. Reference histories remain reference histories; physical board identifiers do not become invented delivery references.

The review covered the active Build index, historical day cards, milestone summaries, Showcase actuals and Map completion dependencies. Equipment, Today, Servicing and shared-save checks have separate focused coverage. The Build index intentionally weights its named categories equally; historical day cards show closed-day progress. Servicing-night, installed-equipment, planned-scope and delivery-timing percentages retain their different denominators.

Verification used isolated source functions and synthetic records:

- 70 milestone helper checks cover incomplete rounding boundaries, unknown versus zero, stale/unready state, qualified scope, provisional/lower-bound readings, completion eligibility, safe quantity text and input immutability.
- Build deferred-result checks discard work after record changes, navigation or DOM replacement and wait for a ready record.
- Showcase refresh checks verify coalesced cache/render updates, selected-day readings, preserved scroll and no redraw for unchanged or closed scenes.

No operational records, financial sources, completion histories or map coordinates are modified by this audit. Final assembled-candidate checks and live read-back belong to the release validation; these source checks alone do not establish a live release or certify all map geometry.
