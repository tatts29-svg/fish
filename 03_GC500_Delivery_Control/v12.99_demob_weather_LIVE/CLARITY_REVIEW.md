# Demob card clarity review

Author: Andrew Fisher

Native before/after checks passed on 5 Nov 2026 AEST at 1440 × 1000 and
390 × 844. Final candidate SHA256:
`ae11b779720acbaf6b4e8d32061cc7da5c9218e9eaa017cceb0343defa73e8ee`.
The tested candidate stayed unchanged during the run.

The existing reference list now sits below its heading and uses the full card
width. On desktop, the 3 Nov list increased from 292 to 394 px and the 5 Nov
list from 173 to 394 px. Asset numbers wrap inside their rows and pickup times
remain aligned. The existing list height limit and scrolling remain intact.

The daily picked-up count stays in the progress panel. The second summary keeps
the last known pickup time and today's ready-for-collection figure. An empty
duplicate summary no longer produces a false “Nothing scheduled” message.

Equipment cards retain their components and appearance, with shorter cards
packed at their natural height. One sampled desktop card reduced from 1089.9 to
1045.5 px; longer neighbouring cards kept their required height. The pickup
lines, progress, staff and all sampled equipment-card text match the baseline
exactly, apart from the expressly removed duplicate day count.

Actual phone and desktop screenshots were inspected. The 3 Nov and 5 Nov cards
remain readable with weather, staff, safety reminder and footer intact. All
three equipment map panels retain their source outlines and location rings.
Both runs completed with zero runtime errors, console errors, attempted record
writes, queued writes or writes in flight.

The shared read-only harness runs `tests/check_demob_clarity_ui.cjs` with
`BASELINE=1` for the original page and without it for the candidate. Private
screenshots and numerical comparisons remain outside the repository under
`/workspace/gc500-demob-weather-1299-private/layout-before/` and `layout-final/`.
