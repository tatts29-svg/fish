**VERIFIED LIVE — 9 Oct 2026 05:51 AEST, combined v9.34.** Author: Andrew Fisher. The full served page matches SHA256 `b881e8890e8a590fea79ac63657fd43254c5ccdd11735d7f70a1b4874773c33c` (12,295,093 bytes). All 22 tab routes, eight direct links and Back passed on phone and desktop. Final public 390px/1440px checks passed for the supplier route, product information, two VMS units and per-item photo targets; operational record remains 4633. Detailed component evidence below includes the earlier scope candidates. Final combined evidence: `../v9.34_navigation_LIVE/evidence/combined_release.json`.

# Destination shapes — v9.30

Author: Andrew Fisher.

Andrew's WC09 screenshot showed the large orange load label covering the actual destination. This changes that existing marker presentation: the sourced master-plan outline carries the selection colour, while a small load number and reference sit alongside it with a leader to the unchanged anchor. Each truck remains separate, including two loads at WC09. Tanks retain their grey under-block layer. Unknown or moved locations cannot inherit an old footprint.

The load controls keep a transparent 44 px minimum target, keyboard focus and native selection behaviour. More than two references at one drop use two names plus a count in the small caption; all references remain in the accessible name, title and adjacent load list. No geometry, positions, unit allocation, native order, operational records, financial code, machine or media changes.

The patch accepts the verified v9.28 or the separate v9.29 arrival-order release and advances the footer to v9.30. It refuses a repeat or older base. The ordinary Map explorer is unchanged; the reported orange plate was in Arrange loads.

## Checks complete

- 18 pure checks, including separate shared-location loads, exact anchors, 14 adjacent phone labels, collision repacking, 24-reference caption and no operational-state access.
- Actual WC09 selection/click/keyboard/16,000% zoom on desktop and phone, with screenshots inspected. No page overflow, runtime errors or record changes.
- Busiest native day: 29 load rows retained, 19 confirmed-position markers, no overlapping marker controls on desktop or phone; unknown locations remain explicit in the list.
- At a 3432 px map viewport, 19 labels and 42 outline/door obstacles averaged 0.776 ms for planning over 50 iterations on the test machine. Source geometry bounds are reused; the marker path makes no forced DOM geometry reads. This is not a physical-device frame-rate claim.
- Local phone rendering of a 24-reference caption: 30.375 px content height inside the 44 px control, all references retained in accessible text/title.
- 37 inline scripts parse; secret check passes. Exact reverse source comparison proves only the scoped presentation changed. Strict browser harness refused one Google map-session POST per view; no service writes were allowed.

Candidate: `618e21a53ac67a305506fc2fedfe7ff949898ea0f8d147e87ec7e882c0e4b9eb`, 12,270,006 bytes, on v9.28 base `592e73b38e8c5fb1d5bf98d00915c49550ab860b322f82fb957a99acc0369093`.

Component READY for parent integration. Publication and final combined navigation checks are owned by the parent release. Private screenshots are in `/workspace/private-markers930/`; portable numeric evidence is in `evidence/`.
