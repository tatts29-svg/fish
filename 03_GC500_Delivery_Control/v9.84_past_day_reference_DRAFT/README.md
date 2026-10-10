# Build race cards

Author: Andrew Fisher

READY TO UPLOAD — final source 0f67516b. All agreed checks pass; guarded publication and actual-public checks are next.

The Build day strip now uses the approved upright racing cards: up to three 400px cards on desktop, one responsive card on phone, full-card sourced weather, a large transparent closed-day stamp with pulsing glow, week, named staff, daily load completion and an official Life Saving Rule reminder. Existing date selection, work records and navigation remain in place. More info contains source and calculation detail.

Andrew approved this design in chat with “Lets do it”. This supersedes the earlier preview-only pause and abandoned horizontal layout. Implementation and independent scoped checks are by Codex agents; no Claude review claimed.

Whole-build progress uses the native seven-category index as at each past date from 7 October. It is separate from load completion. Bounds retain ≥; unavailable readings remain explicit. Today and future dates show no historical percentage. Closed means the calendar day ended, not that every planned item arrived. Dated history is replayed with cache isolation, and shared-record changes invalidate card readings.

Daily loads use native booking/load groups and quantity reconciliation. Ref-only groups, old completion timestamps and missing evidence cannot produce a completed truck ratio. Future reference groups are labelled planned groups with unverified trucks. Staff come from StaffNames910; none are inferred from neighbouring dates. Week labels preserve the programme’s countdown to event week. The official safety rule is a deterministic calendar reminder, not a historical briefing claim; full wording is in More info.

Historical weather: 33 dates, 7 September–9 October, from Bureau of Meteorology Gold Coast Seaway station 040764. Immutable source snapshots and observation periods are in history984.json. Partial measurements stay unknown. Gusts, sampled wind and rainfall periods stay distinct; unknown sky conditions use neutral wind motion, never invented sun/rain. Forecast artwork continues from the native fresh weather sources. Dates beyond the reviewed archive show history unavailable after passing until verified observations are added.

Motion uses CSS transforms/opacity, reused weather SVG templates, one shared stamp image and a visibility observer. Offscreen, hidden, paused, print and reduced-motion states stop motion. No new continuous JavaScript loop, operational write or shared-data schema is introduced.

Sources: card984-main.js, card984-data.js, card984.css, history984.js/json and assets/day-completed-stamp.png. patch_v984.py accepts only the exact v9.83 live hash below. Obsolete past984 source and tests were removed; Git retains their history.

Exact base: 19242957feb45f8abfe098ec096461f80d3ed7b57a887fb6086c666ca201c589.
Final candidate: 5f5ac67334f382985d57e136277a6321bf47565ac1033e35cf203c631ae1e45c (14,591,720 bytes; 69 scripts).
Checks completed: 11 progress-model, 30 day-data and 9 historical-weather checks; all 33 weather rows independently reconciled to BOM HTML/CSV. Desktop 60 / phone 59 focused checks, eight weather fixtures, motion preferences, visibility, midnight rollover, keyboard and day navigation pass. Final desktop/phone sweeps each cover 22 routes, seven deep links and Back. Native record 5201, all 15 financial models and 12 operational projections are exactly unchanged against v9.83 on the same frozen record. No page errors or operational writes. Desktop and phone screenshots inspected. Bright forecast readability, inherited top-strip height, footer glyph, motion gates and duplicate weather-source line were corrected before final verification. Public-safe summaries are in evidence; private native snapshots/screenshots remain outside Git.
