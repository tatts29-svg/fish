# Past Build day reference cards

Author: Andrew Fisher

DRAFT. Codex implementation and testing; no Claude review claimed.

Andrew requests a different appearance for past days, percentages on past cards, no percentage on Today, and continued access to reference records. Past cards are muted with a PAST DAY stamp, reference footer and recorded completion figure; an orange outline still identifies the selected historical date. Active/future cards retain their existing appearance.

Percentage basis: the shared progress881Model whole-job tracked category index as at each past date from 7 October, identical to Today’s seven-category calculation. It is not that day's task completion. Minimum readings retain ≥; unavailable readings show —. Past dates do not imply 100%. Today/future show no added percentage. Historical calculation caches are isolated from the current render cache.

Dated history supplies the reading without saving invented daily snapshots. Current schedule moves/cancellations and corrected history are reflected on redraw. Reference cards remain buttons; records, task controls and date links remain accessible. No overlays block interaction, no new timers/animation loops, and no native state writes. The existing visible clock tick triggers one Build redraw when the Brisbane date changes; hidden/print views stay paused.

Exact base: 19242957feb45f8abfe098ec096461f80d3ed7b57a887fb6086c666ca201c589. Final candidate verification/publication pending.

Historical weather request: current page discards forecast rows older than Today and has no historical weather source. A past-day forecast must not be relabelled actual. Fixed sourced historical weather remains pending; past records remain accessible and passage of time does not assert operational completion.

Historical progress is cached per shared-record revision and Brisbane day. Earlier reference dates show no added percentage; Andrew’s requested progress period starts 7 October.
