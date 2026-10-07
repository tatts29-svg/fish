# v8.96 — Today scene

Author: Andrew Fisher. Built 8 Oct 2026. **DRAFT — not live.**

Completes the approved Today scene staged in `v8.81_progress_scene_DRAFT`, using the native v8.85 Where we are card.
The overall plate spans the full card at every screen width, with a large centred percentage, five native race LEDs and
weather across the whole plate. The existing programme follows underneath. This full-width arrangement is part of the
approved scope; it is not an outstanding layout decision.

Presentation only. No operational record, quantity, money or navigation changes. The only DATA changes are eight hosted
picture entries and the media manifest hash. `tests/test_identity896.py` verifies that everything else matches the base.

## Behaviour

- Today opens on **Where we are**. Its native lights, whole-job model, group chips, Pause control and basis fold remain.
  The figure scales to 176 px on large screens and stays inside the phone plate. The programme retains its controls and
  natural height below the plate.
- The weather comes from the selected Today's day and the page's existing forecast loaders. Its words, source and reason
  for an unavailable forecast are the page's own. Missing, mismatched and unsupported forecast rows stay unknown. No
  forecast is inferred from a past reading or from a default weather icon.
- Dark weather layers cover the plate behind the figure. Sun, partial cloud, cloud, fog, rain, heavy rain, storm and sleet
  animate through transforms and opacity only. The central dark layer protects text contrast.
  Rain overscan follows the sky's height horizontally and its width vertically. The two sheets cover all four corners
  throughout their 240 px travel, including the tall phone plate, with less layer area than the former 40% side padding.
- Each group card has a faint illustration of its equipment behind the instrument and counts. The large native group
  name remains above its percentage. While a group is open, only the duplicate outer fold label is visually clipped;
  it remains in the fold's accessible name. Close group shares the native scope/Play row, leaving no empty label row.
  A scope line is also hidden only when it repeats the large heading exactly after case/spacing normalisation. Distinct
  descriptions remain; the original text and native print layout are preserved. Closing the group makes its fold label
  visible again. Native LEDs, Review
  links, fold controls, Play controls, focus targets and group-chip navigation remain.
- The old race-day banner and MP4 sit in **Event banner and clip**, a closed fold at the foot of Today. Opening it keeps
  the native banner whole, centred and capped at 42% of the viewport height. The native Play with sound control remains;
  no clip autoplays. The fold remembers its open state through redraws in the current page session.
- Weather pauses when its plate is offscreen, the page is hidden, a native dialog or reference drawer opens, the showcase
  or machine surface opens, an inserted modal is shown, or the hero's Pause control is pressed. Closing the obstruction
  resumes it. Motion off, reduced motion and print keep a still frame. Redraws leave one sky, weather line and banner fold.
- The basis fold identifies the equipment pictures as rendered illustrations, not photographs of this job. The plate's
  selected-day forecast and the banner's existing current-weather caption retain their separate meanings.

## Integration

The release adds style and script after the existing chain. It wraps `renderToday_held` after v8.85 and v8.94 to decorate
those finished components, and wraps `wxfPaint` so forecast updates refresh the sky without polling. It has one intersection
observer, one filtered mutation observer and no timers of its own. The mutation observer schedules a frame only for modal
lifecycle or motion-preference changes; changing readings does not trigger a scene update.

v8.94's lighting model, notes, completion rules and source basis remain. v8.92's motion and scrolling improvements remain.
The scene does not redraw the programme or group instruments. Its full-width CSS deliberately supersedes v8.85's former
side-by-side placement, while preserving that card's structure and controls.

Eight WebP pictures replace the staged 2.7 MB inline atlas. They total **155,648 bytes** (about 433 × 433 px per picture,
quality 58) and use the page's cacheable hosted-media route. `make_atlas896.py` regenerates them from the staged source.
`atlas896.json` records each exact file, size and SHA-256. They are fetched when Today draws and add only their media
entries to the HTML. The added stylesheet and script are approximately 28 KB together.

The patch validates all source anchors and each asset hash before applying. It accepts a single footer from v8.89–v8.95,
refuses a second application, and writes `media_manifest_v896.json` beside the result. That manifest covers the final
media table, including v8.93's pictures, and supersedes the earlier manifests in the same chain.

## Build and publication

Apply after the agreed base chain. The current integrated order is 884, 885, 886, 887, 888, 889, 893, 894, 891, 892, 895,
then 896. The current v8.91 patch must precede v8.95 because its footer guard does not accept v8.95.

```sh
python3 v8.96_today_scene_DRAFT/patch_v896.py <candidate.html>
python3 v8.96_today_scene_DRAFT/tests/test_identity896.py <same-chain-without-896.html> <candidate.html>
python3 toolchain/check_page.py <candidate.html> --base <same-chain-without-896.html>
```

The release coordinator builds from the current live page using the shared toolchain and performs final combined checks.
This folder does not itself claim paired page/explorer publication readiness.

**Media first, then the page.** Supply every folder containing media missing from the service; the uploader sends only
missing files, checks their SHA-256 names and registers the manifest last:

```sh
python3 v8.96_today_scene_DRAFT/upload_media896.py <media_manifest_v896.json> v8.96_today_scene_DRAFT/assets <other-picture-folders> --dry-run
python3 v8.96_today_scene_DRAFT/upload_media896.py <media_manifest_v896.json> v8.96_today_scene_DRAFT/assets <other-picture-folders>
python3 toolchain/upload_page.py <candidate.html>
```

## Verification

`tests/test_scene896.cjs` now has 40 checks. It verifies the full-width geometry at every viewport, rain-sheet corner coverage
throughout the animation, the model's exact lamp
state, a real native date-control change, unknown-weather cases, actual animation-clock pause/resume, all modal lifecycles,
reduced motion and Motion off, redraw cleanup, group-name placement, native folds/links/focus, keyboard banner activation,
non-autoplay media, text contrast over all eight skies, print, overflow, runtime errors and attempted writes.

The initial live forecast is checked against the page's own forecast. Subsequent weather and motion tests use explicit
in-memory forecast fixtures so unavailable public services cannot silently skip the day-change check or break a valid
unknown-weather state. Fixture screenshots demonstrate the visual states; they are not a weather report.

The shared read-only browser harness blocks operational writes. Tests serve the eight new pictures from this folder until
publication. Run one browser at a time using the shared browser lock:

```sh
PAGE=<candidate.html> W=2560 node v8.96_today_scene_DRAFT/tests/test_scene896.cjs
PAGE=<candidate.html> W=1600 node v8.96_today_scene_DRAFT/tests/test_scene896.cjs
PAGE=<candidate.html> W=1440 node v8.96_today_scene_DRAFT/tests/test_scene896.cjs
PAGE=<candidate.html> MOB=1 node v8.96_today_scene_DRAFT/tests/test_scene896.cjs
PAGE=<candidate.html> node v8.96_today_scene_DRAFT/tests/test_scope896.cjs
PAGE=<base.html> LABEL=base node v8.96_today_scene_DRAFT/tests/timing896.cjs
PAGE=<candidate.html> LABEL=v896 node v8.96_today_scene_DRAFT/tests/timing896.cjs
```

The timing test compares the same chain with and without v8.96, measures seven warm Today openings and frame time, and
reports redraw observers/timers. Its local-media routes use fresh URLs so a pre-publication 404 cannot masquerade as a
successfully loaded picture.

The overscan revision was built against base `858042cf…`, producing private candidate
`60440319a7fad7b933301b3b89b51a6f75c6ff11eef2176d443b12ca543f9234` (11,394,470 bytes).
Identity and inline-script/secret checks pass. Phone and 2560 px checks pass **40/40 each**, with no runtime errors, overflow
or attempted writes. The phone and wide screenshots were inspected; the lowest measured plate contrast is **7.33:1** on
phone and **7.86:1** at 2560 px, above 4.5:1.
The final exact-name cleanup passed all **13/13** focused checks at phone, 1440, 1600 and 2560 widths before the rain-only
revision. The previous scene suite passed **39/39** at those four widths. The overscan revision's phone and 2560 px runs
also verify the new inverse-transform rain coverage check at five phases of both sheets.

One serial paired headless-Chromium timing run on the same base chain measured seven warm Today openings:

| Measurement, 1440 × 900 | Base | Scene with smaller rain layers |
|---|---:|---:|
| Median warm Today opening | 363 ms | 366 ms |
| Frame interval, median, rain | 16.7 ms | 16.7 ms |
| Frame interval, 95th percentile, rain | 16.8 ms | 33.4 ms |
| Frame interval, 95th percentile, forced storm | — | 33.4 ms |
| Longest sampled storm frame | — | 50.1 ms |

The weather still has a measurable compositing cost in this browser; the overscan change does **not** establish frame-time
parity with the static base. In-memory layer-promotion probes did not improve the 95th percentile, so those hints were not
added. These are bounded local measurements, not a claim about every device. Both timing runs had zero runtime errors or
attempted writes. Five redraws made the same numbers of observers and timers as the base; the scene still has one persistent
intersection observer, one mutation observer and no timers of its own. All eight scene pictures loaded, totalling 155,648
bytes. Final integration, paired page/explorer checks and publication remain with the release coordinator; this source
remains **DRAFT — not live**.
