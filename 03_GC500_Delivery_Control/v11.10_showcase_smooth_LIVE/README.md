# v11.10 — the Showcase plays smoothly

Author: Andrew Fisher. Built on live v11.09 `4741d5cd…`. Carried live inside the v11.11 build (one page, two patches:
`patch_v1110.py` then `patch_v1111.py`) — **LIVE 22 Oct 2026 07:51 AEST**, sha256 `9aee0e49…`; status in STATUS.md
under v11.11.

Andrew, 22 Oct 2026: "ensure the showcase has no lag. No freezing. No rendering issues or bugs" — the team watches it
on the race days.

## What was wrong (measured on the live v11.09 page)

Unthrottled, the countdown, lead, crew and fencing scenes each took 9–10 s to render, every time they came round; the
other 21 scenes 75–190 ms. `showRender()` itself measured 9.7 s. The cause: `showScene()` starts with
`completionAsOf()` and `lightTally(allAssets())` for every key, and the four original scenes are rendered outside
`holdAssets()`, so the asset list is rebuilt dozens of times per scene. The same reads cost 90–180 ms inside a hold, and
all 25 scenes together cost under one second inside one hold.

## What changed (`patch_v1110.py`)

One `<script>` module appended after every other Showcase module, so it wraps what the page has by then:

1. Every scene is rendered inside one `holdAssets()` and its HTML is memoised per scene, day and record epoch
   (`REC_EPOCH1066`, which `sharedCache975` bumps on every record change). A scene change is a cache read.
2. When the Showcase opens, the scenes are warmed in the background, one per 40 ms, so the first pass through the deck
   is as smooth as the second; a record change re-warms lazily on the next read.
3. Nothing about what a scene says changes: same functions, same record, same words. Only when they are computed.
4. Footer v11.09 → v11.10.

`window.ShowcaseSmooth1110 = {size, warm, cached}` is there for probes.

## Measured on the build (read-only probes, flat circuit backdrop)

| | v11.09 live | v11.10 build |
|---|---|---|
| countdown scene, first render | 9.7 s | 229 ms (then 0 ms from the memo) |
| `showRender()` any scene | up to 9.7 s | 2–254 ms |
| warm of all 25 scenes, CPU ×4 | — | 11.2–11.9 s total in 25 steps, longest step 0.9 s |
| 90 s playback, CPU ×4, scenes advanced | — | 7 (the 14 s hold per scene, as designed) |
| long tasks in that 90 s | — | 61–63, total 15–16 s, longest 1.4–1.6 s |

The 3D backdrops (`circuit3d`, day/night/LED) run WebGL; in the headless harness that is software rendering and every
frame costs seconds, which is a test artefact, not a page defect — the flat `circuit` backdrop was used for the timing
above. One playback probe (`perf_showcase.cjs`, which installs its own frame-gap loop before the page loads)
reported 10–20 s long tasks on v11.09 and v11.10 alike, with or without polling; three attribution probes on the same
build and CPU ×4 (timers wrapped after load, the same with 1 s polling, and timers wrapped before the page loads) all
show the deck advancing on time (7 scenes in 90 s, 9 in 120 s), the warm loop as the only Showcase cost, the sync pull
at 7 ms, and no task over 1.7 s. The figure is that probe's, not the page's. Checks and sweeps are below and in STATUS.

## Checks

Toolchain PASS all checks (the module is appended at the page's last `</body>`; the page has three). Function-level
check on the build: `ShowcaseSmooth1110` present, scene timings as above, 0 page errors. Sweeps desktop + phone
25/7/Back 0 errors and the broadcast test 33/33, run on the combined v11.11 build (see
`../v11.11_race_day_broadcast_LIVE/README.md`).
