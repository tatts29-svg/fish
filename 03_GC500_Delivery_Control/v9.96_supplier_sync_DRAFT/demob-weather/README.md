Author: Andrew Fisher

DRAFT — Demob weather/day cards and explicit full-reference collection records. Not published.

Reuses the approved Build card geometry, full-card weather components, life saving rule outlines and daily staff reader. Demob keeps its warm accents and native dates, branch filters, truck groups and day controls. Existing summary and cards use one known-positive reference denominator, including out-of-window references. Unknown quantities are separately disclosed. Past dates are archived; dates passing never imply collection, and today's card has no historical percentage. Future forecasts outside coverage remain unavailable.

Collection uses the existing native delivery history, with an explicit actual date, named timestamp, exact current quantity scope and canonical physical identities. Native pump-out gates remain. A complete collection uses the native outgoing light and single save. The current release enables full-reference collection only. Partial evidence can be read and tested, but new partial collection is disabled until every stock view has verified propagation. No operational records are automatically changed by this patch.

Shared API: `DemobCollection996.read(key, day)` returns current-scope typed `required`, `collected`, `remaining`, `events`, `complete`, `unknown`, `issues` and `arrival`. `DemobProgress996.scope` and `.summary` share the positive-reference programme scope. Event metadata sits at `delivery.history[].collection996`; quantities carry canonical `unitIds`, displayed `numbers` and `physicalUnits` provenance. Generic amber alone is not collection evidence. Re-arrival begins a new cycle; a changed scope is flagged for review.

Integration entry point: `patch_demob996.py:patch(html)`, followed by the root-owned `stock996.py:patch(html)`. The supplier/native packing adapter must be integrated before final day-load count verification; cards read `trucks816` and do not pack a second set of loads.

Verification so far: 23 pure collection/model checks; desktop preview 22 and phone preview 23 controls/evidence checks. The phone run captures a full native toilet collection, proves Inventory and Today both show zero remaining on site, and preserves the P&L projection. All operational saves are captured locally in fixtures and original records restored; zero service writes. Approved desktop/phone card appearance inspected. Final integrated candidate and final hash checks remain with root. A duplicate Back from the existing navigation decorator was removed after phone visual review.

Independent read-only collection validation/history replay review completed; malformed fractional or over-numbered history is rejected. Final supplier/native physical-load packing integration is outside that scoped review.
