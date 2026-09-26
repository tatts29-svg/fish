## v6.01 — 26 Sep 2026 — T0024 is the Coates compound toilet; the Coates Way card keeps to the machine

- T0024 (Week 5, 15 Sep 2026, one FWF toilet, no asset number on the schedule) is Coates' own compound toilet, not charged
  to the customer (Andrew Fisher, 26 Sep 2026). The schedule row's location and note say so, the ops row is on site at
  the Coates compound with the basis in its note, and the 15 Sep cancellation note ("comes off for good, looks like a
  mis-delivery") is withdrawn. No FWF rate exists, so nothing is priced for it anywhere. `patch_v601.py` also carries the
  same change into `ops_layer.json` and `print_dataset.json` for the next build.
- The Plan-on-satellite and 3D-proof buttons leave the Coates Way machine card; they belong to the Map tab.

## v6.10 — 26 Sep 2026 — the day in the banner, and the look enhanced

- The banner, in Andrew's order: the car and the search bar on top; the three pods (clock, race day, record) under them;
  under those the day row — the orange date plate, the day, and the three tiles (due in, recorded on site, not recorded
  on site, each with its icon and sub-line, each a button to where it can be acted on) with an orange rim. The row reads
  the same record as the Today strip did (`todayFigures`) and refreshes at the end of every render pass. The Today strip
  leaves the Today page. On a phone the row takes its own line; nothing scrolls sideways at any width (390 to 1366 checked).
- The look, one CSS layer on top of the same design: depth (layered shadows under every card; chamfer-following shadows on
  the tiles and day cards), glass (the hero caption is a frosted plate over the picture; table heads frost as they stick),
  glow (the active tab, the orange buttons, the race-day rail, the alert figures, today's day card breathing), a 3D touch
  (tiles and day cards lift and tilt to the pointer; a gloss along the top of every face) and motion (a staggered rise as
  a page arrives; the hero picture drifts slowly on a laptop). Filters, blur and drift are off on a phone; every motion
  respects reduced-motion and the page's own motion switch.
- Checks: the QA sweep on view links, laptop and phone, found no script errors and no failed requests on any page; the
  throttled-phone timing is unchanged (first tap about 2.3 s at 4× CPU throttle).
