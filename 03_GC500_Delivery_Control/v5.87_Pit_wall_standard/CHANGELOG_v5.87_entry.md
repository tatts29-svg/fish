## v5.87 — the pit-wall standard: the banner and Today (25 Sep 2026)

Asked for by Andrew Fisher on 25 Sep 2026: the top banner tidied up with every reading shown and nothing hidden, in the
race-car style the page already uses, and the cards, boxes and layout of Today lifted to the same quality, the lights
and the gauge included. Two mock-ups were approved on the day before anything was built (the banner, then the Today
page); this release is those mock-ups built into the real page and wired to the live clock, the live countdown and the
live record state.

### The banner
- The bar is a scene: the circuit at dusk behind it (one graded photograph, 2048 px wide for a 1440 px band), the #26
  on its own reflection in the lockup, and GC500 in chrome lettering with the year in lit orange.
- An instrument cluster on carbon carries three pods: the Gold Coast clock (with the date under it now), the countdown
  to race day on the programme rail (the #26 sits at today, the chequered flag at race day, a tick per programme
  week, the first and last dates at the ends), and the record's state as three pit-lane lamps and one word (LIVE,
  PENDING, CHECKING, OFFLINE or LOCAL). Nothing is hidden at any width: the phone bar shows the lockup and Tools on
  one row and the cluster beneath.
- A fifteen-LED shift light runs along the top of the cluster and is lit by the seconds of the minute, green to red.
  It is the one moving thing on the bar and it is time, never the record; the record's lamps are steady.
- After race day the countdown pod reads the race weekend while it runs, then days to the end of demob; after that it
  names the end date. All of it comes from DATA.race_days and DATA.weeks, worked out once a day.
- The tab row is glass over the scene; the selected tab's underline glows.

### Today
- The day strip's tiles are LED tiles (dark glass, bezelled, the race numerals, the caption above the figure).
- Three instruments come first, on dark carbon islands with screws at the corners: the lights, the dial, the programme.
  - The lights are a hooded three-lens signal head beside the counts; the lens lit is the state most of the job is in.
    The counts are the fact, the lamp is the picture of it. The done, levelled and steps rows are dark bezelled tiles.
  - The dial has a chrome bezel with 180 cut lines, a red zone over the last ten per cent of the arc, an edge ring and
    a glass highlight; the plan tiles beside it are dark glass with a coloured keyline (green when ahead, red when
    short, blue for the schedule) instead of pastel paper.
  - The programme island carries its rail and figures in white, the race numerals for the day and the countdown, and
    the next milestone as dark glass with an orange keyline. It runs the full width beneath the other two.
- The cards beneath are white with the orange top edge, the race numerals for their figures, and equal heights.
- The picture and the daily brief follow the cards. Nothing is removed; the order changed.

### Nothing else
- No figure is new: every number on the banner and on Today is the one that was already there.
- No record is touched; no server change. The two pictures ride inline in the page (about 500 KB), so the banner needs
  no media import.
- Print: the scene, the car and the cluster are off; the bar prints white as before.
- Reduced motion: the shift light has no transition.
- Set-aside pages (v5.86) and every earlier change are unchanged.

### Tests
- Rendered over https on the local stand-in with the live record and the live media (25 Sep 2026): 1920, 1440 and
  390 px, at two device pixels per CSS pixel. No console errors, no failed requests, no horizontal scroll at any width.
- The countdown read 28 days to Fri 23 Oct with the rail at 26.9 %, the clock and date painted, the record pod LIVE.
- The release gate and the test suite are PENDING: the handover tree is still four parts short (20 to 23), so the
  builder has been patched but not run end to end.
