# v8.96 — Today scene: the weather on the plate, the gear behind the cards, the banner parked

Author: Andrew Fisher. Built 8 Oct 2026. **DRAFT — not live.** It finishes the Today-page update: the overall plate and
group scenes staged in `v8.81_progress_scene_DRAFT`, integrated with the Where we are card (v8.85) and the group cards.

Codex flagged the gap on PR #1 (comment 6044943529): Andrew asked whether we know about the Today-page update. The
handover (`handover_07Oct2026_claude/README.md`, item 1) carries his requirements: *"Preserve native review links, folds,
large percentage and five race LEDs. Equipment imagery stays a subtle background. The overall presentation is centred;
weather uses the selected day and animates across the plate. Unknown weather must stay unknown. Do not invent completion or
green milestones."* Codex adds that the old banner/MP4 is to be parked away from the main hero, as the staged source carried.

Presentation only. No record, figure, money, pin or navigation changes. DATA changes only by the eight picture entries in
the media table and the media manifest hash; `tests/test_identity896.py` proves everything else is byte for byte the base.

## What the Today page does now

- **Today opens on Where we are.** The plate with the five race lights and the whole-job figure is the first thing on the
  page. The race-day banner no longer sits above it.
- **The sky on the plate is the forecast for the day shown.** Sun, part cloud, cloud, mist or fog, rain, heavy rain, storms,
  sleet or snow — the same forecast the Timeline's day cards use, for the day picked on Today (the date control at the top
  of Today, or today when none is picked). Change the day and the sky changes. Under the figure, one line says what the
  forecast is, in the page's own words: *Patchy rain nearby · 19° / 17° · rain 42% · wind to 35 km/h · forecast, WeatherAPI*.
- **Unknown weather stays unknown.** A day with no forecast — a day that has passed, a day past the ten-day outlook, or
  the weather services not reached — shows no sky at all and says so plainly: *No forecast — the day has passed*. Nothing is
  guessed and nothing is drawn.
- **The sky never gets in the way of the figure.** Every layer is built dark, and the middle of the plate keeps its own
  dark behind the figure, its caption and its notes. Every word on the plate keeps at least 4.5:1 contrast over every kind
  of sky, measured pixel by pixel in the tests (worst case in the table below).
- **Each group card carries a faint picture of its gear** behind the instrument and the counts — the site office behind
  Buildings, the toilet block behind Toilets, the fence line behind Fencing, the generator, the light tower, the VMS trailer
  and the forklift behind the rest. The pictures are rendered illustrations, not photographs of this job, and the page says
  so in the plate's "How the whole-job figure is worked out" fold. Behind the Where we are plate sits a faint picture of the
  yard with everything in it, as the ground under the sky.
- **The cards are otherwise exactly as they were:** their folds, Review links, large percentage, five lights, Play control,
  keyboard focus and the chips on the plate that jump to them.
- **The banner and the clip are parked.** The race-day picture with the pit-lane board and the "Play with sound" clip sit in
  a fold at the foot of Today called **Event banner and clip**, in their own dark band, closed. Open it and the banner
  shows whole, centred and capped at 42% of the screen exactly as v8.84 had it; its own Hide the banner, Play with sound
  and weather-key controls are untouched. Nothing plays until Play is pressed. The fold stays as you left it through the
  record refreshes.
- **Motion that behaves.** The sky plays only while the plate is on screen; it pauses when the plate is scrolled off, when
  the page is hidden, while a Review dialog or the reference drawer is open, and when the card's own Pause is pressed.
  Pause and reduced motion settle every displayed number at once — the whole-job figure, the seven chips and the card
  readings. Motion off and reduced motion show a still frame; print shows a still frame. Nothing is left behind by a redraw
  or a change of tab: one sky, one weather line, one fold, one observer of each kind, no timers of its own.

## What came from the staged draft, and what changed

| Staged in v8.81 (`scene881_staged.js/.css`) | v8.96 |
|---|---|
| A new full-width centred hero with its own lights, percentage, group strip and basis | **Not used.** v8.85's Where we are card is the hero; the scene is added behind its plate. Nothing of v8.85 is redrawn: its lights, count-up, Pause, observer, chips and basis fold stay as built |
| Weather from `wxfDay`, validated against `WX_WMO` and the WeatherAPI codes the page knows | **Kept**, same validation; the words and icon are the page's own day line (`wxDayHtml`), the reason for no forecast is the page's own (`wxNoneWhy`) |
| Weather art: sun glint, clouds, mist, rain streaks, bolt, snow | **Rebuilt on the same ideas**, as compositor-only layers (transform and opacity, no `top`/`left` animation), built dark to a luminance budget so text contrast holds anywhere; rain and sleet loop on whole tile rows so they never jump |
| A 30-second weather poll | **Replaced**: the sky repaints when a forecast lands, through the page's own `wxfPaint`; no timers |
| Atlas as one 2.7 MB PNG behind the hero and the cards (`background-size: 400% 200%`) | **Eight WebP pictures** (155,648 bytes in all) served through the page's media system; one `::before` behind each card's summary, one layer behind the plate |
| Card restyling (header removed, title moved into the fold toggle) | **Not used** — the cards keep their native header, controls and layout |
| `details.scene881-showcase` "Event showcase" fold appended to the pane | **Kept as a fold at the foot of Today**, named *Event banner and clip* (the page already uses "showcase" for the Start showcase mode), inside the banner's own dark band so v8.84's band and sizing hold when open |
| Pause button and `animateNumbers` of its own | **Not used** — v8.85's Pause and count-up are the one control; the sky follows them |

## The pictures: how they are delivered, and what they cost

**Chosen: the page's media system** (the brief's first preference). `make_atlas896.py` cuts the staged atlas along its grid
lines into eight WebP pictures at the cell's own size (about 433 × 433 px, quality 58, 13.8–23.1 KB each, 155,648 bytes in
all), each named by its SHA-256 like every other hosted picture. The patch registers them in `DATA.media` and works the
media manifest out again in the service's canonical form (as v8.89 and v8.93 do), writing `media_manifest_v896.json`
beside the page. The page resolves them to `/m/<link>/<sha>.webp` at load, so they are fetched only when Today draws, in
parallel, cached by the browser, and they add nothing to the 11 MB page itself (the script and style are 24 KB; the eight
media entries 1.4 KB).

Why not the inline sprite: it would have put another 150 KB of base64 into every load of the page, for every tab, and it
cannot be cached separately. The cost of the media route is one extra step at publication (below), which v8.89 and v8.93
already need.

**Speed, measured like for like** (headless Chromium, laptop 1440 × 900, the chain without v8.96 against this build, same
machine, medians): RESULTS_TIMING

## How it combines with the other releases

- **v8.85 Where we are.** Untouched. v8.96 wraps `renderToday_held` after v8.85 (and v8.94), so it finds the finished card
  and adds its layers behind the plate; the sky reads the card's own Pause (`#w885-motion[data-state]`), and the chips,
  count-up, observer and basis fold are v8.85's. The one extra sentence in the basis fold (about the rendered pictures and
  the forecast) is appended once, flagged, after v8.94's.
- **v8.94 Lighting basis.** v8.96 does not depend on its internals and works with or without it: it reads the model's
  `reached`, `allGreen` and `ready` as given, keeps every note v8.94 adds (its chip tag, whole-job caption, basis sentence
  and card notes were all present and single after five redraws in the tests), and its own sentence goes after v8.94's.
  The reworked v8.94 (lighting scope projection) landed while this was being built; the final runs are on it.
- **v8.92 A+ pass.** No overlap in anchors; the two combine cleanly. v8.92's `main{overflow-anchor:none}`, its 44 px
  summary hit areas on touch screens (they apply to the new fold's heading too) and its once-per-frame Today motion check
  all stand; v8.96's animations follow v8.92's rule (transforms and opacity only). Built both with and without v8.92 and
  tested on both (table below).
- **v8.93, v8.95 and v8.91.** v8.96 runs last in the chain and accepts whichever footer it finds (` · v8.89` to ` · v8.95`).
  A trial build with v8.93, v8.94, v8.91 and v8.92 before it applies cleanly (v8.95 needs its private workbook, so it could
  not be trialled here). Because v8.96 works the manifest out from the final media table, **its manifest covers v8.93's
  pictures too and supersedes v8.93's manifest** when both are in the chain.

## Build and publish

```
toolchain/build.sh v8.96 v8.84_today_wide_layout_DRAFT/patch_v884.py v8.85_where_we_are_DRAFT/patch_v885.py \
  v8.86_event_portables_days_DRAFT/patch_v886.py v8.87_map_explorer_DRAFT/patch_v887.py v8.88_costs_transport_DRAFT/patch_v888.py \
  v8.89_master_map_DRAFT/patch_v889.py [v8.93] [v8.95] v8.94_lighting_basis_DRAFT/patch_v894.py [v8.91] [v8.92] v8.96_today_scene_DRAFT/patch_v896.py
```

The patch asserts the Where we are card and every page function it wraps or reads are present (each wrapped function is
declared exactly once), takes the single footer marker (v8.89 to v8.95) to ` · v8.96`, registers the eight pictures and the
new manifest, puts its style before `</head>` and its script before the last `</body>`.

**Media first, then the page.** The service refuses a page whose manifest it does not hold:

```
python3 v8.96_today_scene_DRAFT/upload_media896.py build/GC500_v8.96/media_manifest_v896.json v8.96_today_scene_DRAFT/assets [<v8.93 pictures>] --dry-run
python3 v8.96_today_scene_DRAFT/upload_media896.py build/GC500_v8.96/media_manifest_v896.json v8.96_today_scene_DRAFT/assets [<v8.93 pictures>]
python3 toolchain/upload_page.py build/GC500_v8.96/GC500_Delivery_Control_hosted.html
```

Give the uploader every folder holding pictures not yet on the service (this release's `assets/`, and v8.93's or v8.89's
pictures if theirs have not gone up); it sends only what the service lacks, checks each file against its SHA-256 name, and
registers the manifest last.

RESULTS_BUILDS

## Checks

`tests/test_scene896.cjs` (34 checks) at 2560, 1600 and 1440 px and on the phone: the release is in; the lights, title,
figure, caption and weather line are centred on the plate (and the plate on the card when it stands alone); the sky is the
forecast kind for the day shown and its words are the page's own; changing the day through the page's date control changes
the sky; a day with no forecast stays unknown with no sky; lamps lit equal the model's `reached` and none is green unless
`allGreen`; Pause and reduced motion settle the figure, the chips and the card readings and stop the sky; offscreen, a
hidden page, a Review dialog and the drawer pause it and it plays again after; five redraws and tab changes leave one sky,
one weather line, one fold, the same sky animations, one observer of each kind and no timers; every card keeps its picture,
folds, links, Play control and keyboard focus and the chips still jump; the banner is in a closed fold at the foot with the
clip paused, opens whole and centred, and the fold is remembered through a redraw; every word on the plate keeps 4.5:1 over
all eight skies at three moments each, and on the cards over their pictures; print holds a still frame; no overflow, no
errors, no writes.

`tests/timing896.cjs` measures the base and this build the same way (above). `tests/test_identity896.py` proves the page
differs from the base only in the footer, the eight media entries, the manifest hash and the v8.96 style and script.

RESULTS_TABLE

## For Andrew to decide

1. **Where the plate sits on a wide screen.** The plate keeps v8.85's place — beside the programme panel on laptops and wide
   screens, full width on a phone — with the sky across it. The staged draft had a full-width centred hero with the programme
   below it. If you would rather see the plate centred across the whole card with the programme underneath, say so: it is a
   layout change to v8.85's card, and the Where we are tests would need their column check changed.
2. **The banner fold starts closed.** Say if you want it open by default, or remembered on the browser like Hide the banner.
   Its name is *Event banner and clip* (the page already uses "showcase" for the Start showcase mode).
3. **The pictures are rendered illustrations** of Coates gear (the staged atlas), not photographs of this job. The basis fold
   says so. Say if you would rather have them off, or real photographs when there are some.
4. **The banner's own weather line** (the current reading from weatherapi.com, in its caption) stays as it was. The plate
   shows the forecast for the day shown — a different fact — so both are kept. Say if one should go.

RESULTS_SURPRISES
