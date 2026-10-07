# Crew planning beside unloading

Author: Andrew Fisher. DRAFT — not live.

One row is one person, with any compatible combination of Escort, Spotter, Forklift operator and Installer. Names are optional; numbered daily crew slots allow the same unnamed person to be assigned consistently. Day availability is entered explicitly, with no roster or wage assumptions. Planning is per reference and day; start/finish and location determine overlaps. Shared people require a confirmed sequence; incomplete times/locations remain unconfirmed. Forklift operation with external spotting is flagged for separate coverage.

Uses the existing independently stamped `loads` documents for daily availability and per-reference plans. Native merge/export/sync preserves them. No live operational records are entered by publication. Run-sheet date context and driver/demob checklist reports use the same saved plan. No financial or Today layout changes.

Transport follow-up: the previous full load-restraint review is source analysis, not a truck/route clearance. Actual supplied model, loaded vehicle dimensions, mass/axle limits and applicable current access conditions must be verified before automatic oversize or highway permissions can be claimed. This patch does not invent transport data or declare a load compliant.

Desktop isolated crew checks pass; final phone, native sheet and regression checks in progress. Build from current live v8.81. Separate lighting and overall hero drafts remain unreleased.
