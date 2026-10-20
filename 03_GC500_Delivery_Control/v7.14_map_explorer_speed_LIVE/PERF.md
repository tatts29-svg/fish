# GC500 Map explorer — speed and sharpness (draft on top of v6.99, stage 5)

Author: Andrew Fisher · Coates Industrial Solutions · GC500 2026 · 27 Sep 2026. Nothing here is live or deployed.

Andrew's brief, word for word: "this is where we need to speed up. Make smoother and fast. No load lag. When u zoom in.
No lag. No downtime. Easy to navigate quick and fast ... Nothing less than 10/10 how this looks. Smooth. No lagging. Its
lighting speed fast. The refresh rate is lightning fast. No blur.. perfection everywhere".

And later: "make it smoother. Zooming fast. No lag. Fast refresh rate. No lagging no load issue. Crisp 4k ultra. High
detail. Perfection in every pixel and zooming is wow with how close we can get".

BEFORE is the explorer as it was live on 27 Sep 2026 before v6.99: explorer.js with the merged barrier chips,
scene-worker.js and plan_items.json byte for byte the live files (explorer.js is still the live one today), index.html the
v6.96 page. AFTER is `explorer/` in this folder. v6.99 (the Map explorer: 3D mode and reference card, `explorer-merge.js`)
went live while this work was running; it changes index.html only (title, one script tag, the page list) and those same
edits are applied to AFTER's index.html, so AFTER drops in over v6.99. The timing runs below use each version without
explorer-merge.js (it does nothing until 3D is pressed); the merge itself is checked separately, see "The Map explorer
(v6.99) still works".

## How it was measured (and what that can and can't tell you)

- Headless Chromium with SwiftShader: a *software* graphics chip. It is many times slower than any real GPU, so the
  absolute frame times below are not what a laptop or phone shows; they are useful for comparing BEFORE with AFTER on
  the same harness. True GPU frame rate and a real phone could not be measured here.
- The test machine was shared with other work (several other headless browsers from other work; a one-minute load
  average of 7 to 25 on 4 cores at the start of the runs, logged with every run in `results/campaign3.log`), so single runs are noisy. BEFORE and AFTER runs were
  interleaved (B desk, A desk, B phone, A phone, three rounds) on the final build and the tables give medians.
- The phone is Chromium's Pixel 7 profile at 412 x 915 CSS px and DPR 2 (touch, phone user agent). It is not a phone: no
  real phone CPU, GPU, memory limit or mobile network was measured.
- Our own files are served with a simple network model: desktop 40 ms per request and 50 Mbit/s shared, phone 80 ms and
  20 Mbit/s. The map key, Google's session and Google's satellite tiles are live (real network through the proxy).
- A fresh browser every run: nothing cached, no Google session kept (a first visit).
- "Sharp" = every drawing tile at the exact level for the screen and every satellite tile in view has arrived, nothing
  moving. "Blank" = some part of the view has no picture at all (not even a coarser stand-in).
- Scripts: `bench.js` (the stopwatch), `probe.js` (per-frame record; wraps BEFORE's own functions, AFTER has it built
  in), `features.js` and `embedded.js` (every feature), `shots.js` (screenshots), `deep.js` (zoom past the pyramid),
  `fcost*.js` and `trace.js` (frame-cost experiments and the trace that found the bottleneck), `partial.js` (half-done
  deploys), `campaign.sh` + `summ.js` (the runs and the medians). Harness: `lh2.js` + `curlf.js` (GET only; the only
  non-GET let through is Google's createSession).

## Results

Round 3, run after the container restart on the final build (`results/campaign3.log`, `results/<ver>_<dev>_r<n>.json`,
`results/summary.md` from `node summ.js`). Every number is a median of three runs; each run is a fresh browser (nothing
cached). BEFORE never reached a fully sharp first view inside the 120 s the stopwatch waits, on either device, in any run.

How to read them:
- The frame times are from a software graphics chip on a busy machine. They compare BEFORE with AFTER; they are not what a
  laptop or phone with a real graphics chip shows (see "What is still imperfect").
- "Sharp again after the last input" starts when the last notch or finger movement was accepted. On BEFORE the gestures
  themselves took far longer to carry out, because the page could not take the input while it was busy (row "time the
  page took to take the whole burst of input", recorded from run 2 on). BEFORE's phone pinch-in reads well on "sharp again"
  only because the pinches took five and a half minutes to get through, and the tiles arrived in the meantime; in one run
  of three it was never sharp.
- The phone pan's "sharp again" in AFTER (690 ms) is the momentum glide after the finger lifts, which counts as movement;
  the view was sharp all the way through (0 ms not sharp in all three runs). The glide is the same code in both.
- "Not yet sharp" in AFTER is the coarser stand-in showing while the exact tiles arrive; in BEFORE it is mostly blank.

### At a glance — medians of 3 / 3 desktop and 3 / 3 phone runs (BEFORE / AFTER)

| Measure | Desktop BEFORE | Desktop AFTER | Phone BEFORE | Phone AFTER |
|---|---|---|---|---|
| First picture on screen | 5.2 s | 1.2 s | 9.4 s | 1.3 s |
| First sharp view (every drawing and photo tile in; never = not within 120 s) | never | 3.5 s | never | 2.4 s |
| Downloaded before the first picture | 15.77 MB | 1.24 MB | 15.77 MB | 1.01 MB |
| Main thread blocked while loading (long tasks, time over 50 ms) | 6.1 s | 69 ms | 6.0 s | 24 ms |
| Long tasks while loading | 22 | 1 | 11 | 1 |
| Zoom in: time the page took to take the whole burst of input (runs 2 and 3) | 38 s | 9.2 s | 331 s | 31 s |
| Zoom out: the same | 16 s | 12 s | 122 s | 13 s |
| Zoom in burst: frame time p50 | 233 ms | 167 ms | 383 ms | 17 ms |
| Zoom in burst: frame time p95 | 2.2 s | 600 ms | 3.3 s | 350 ms |
| Zoom in burst: longest frame | 3.5 s | 833 ms | 48 s | 833 ms |
| Zoom in: time part of the view was blank | 21 s | 0 ms | 68 s | 0 ms |
| Zoom in: sharp again after the last input | 5.5 s | 751 ms | 154 ms (1 of 3 runs never) | 164 ms |
| Zoom out burst: frame time p95 | 1.5 s | 600 ms | 3.3 s | 417 ms |
| Zoom out: time part of the view was blank | 21 s | 0 ms | 121 s | 0 ms |
| Zoom out: sharp again after the last input | 2.9 s | 596 ms | never | 282 ms |
| Long tasks during the zoom in, pan and zoom out | 5 | 4 | 23 | 0 |
| Main thread blocked during them | 698 ms | 218 ms | 11 s | 0 ms |

Desktop zoom = a 12-notch mouse-wheel burst (23x); phone zoom = three pinches (to 34,300%). "Blank" = some part of the view had no picture at all, not even a coarser stand-in.

### Desktop 1440 x 900, DPR 1 — medians of 3 BEFORE and 3 AFTER runs (network model 40,50 ms / Mbit/s)

| Measure | BEFORE | AFTER |
|---|---|---|
| First picture on screen (loader gone) | 5.2 s | 1.2 s |
| Search and Find chips usable | 4.7 s | 413 ms |
| First sharp view (all drawing and photo tiles in) | never | 3.5 s |
| Downloaded before the first picture | 15.77 MB | 1.24 MB |
| Downloaded before the first sharp view | never | 3.27 MB |
| Long tasks while loading: count / main thread blocked | 22 / 6.1 s | 1 / 69 ms |
| Longest single task while loading | 1.6 s | 119 ms |
| Wheel zoom in (12 notches, 23x): frame time p50 / p95 | 233 ms / 2.2 s | 167 ms / 600 ms |
| Wheel zoom in (12 notches, 23x): longest frame | 3.5 s | 833 ms |
| Wheel zoom in (12 notches, 23x): long tasks / main thread blocked | 2 / 132 ms | 2 / 78 ms |
| Wheel zoom in (12 notches, 23x): time part of the view was blank | 21 s | 0 ms |
| Wheel zoom in (12 notches, 23x): time the view was not yet sharp | 22 s | 2.2 s |
| Wheel zoom in (12 notches, 23x): sharp again after the last input | 5.5 s | 751 ms |
| Pan (drag 480 px): frame time p50 / p95 | 33 ms / 867 ms | 50 ms / 233 ms |
| Pan (drag 480 px): longest frame | 2.1 s | 683 ms |
| Pan (drag 480 px): long tasks / main thread blocked | 1 / 1 ms | 1 / 0 ms |
| Pan (drag 480 px): time part of the view was blank | 2.1 s | 0 ms |
| Pan (drag 480 px): time the view was not yet sharp | 2.1 s | 0 ms |
| Pan (drag 480 px): sharp again after the last input | 623 ms | 142 ms |
| Wheel zoom out (12 notches): frame time p50 / p95 | 383 ms / 1.5 s | 183 ms / 600 ms |
| Wheel zoom out (12 notches): longest frame | 1.9 s | 967 ms |
| Wheel zoom out (12 notches): long tasks / main thread blocked | 2 / 127 ms | 0 / 0 ms |
| Wheel zoom out (12 notches): time part of the view was blank | 21 s | 0 ms |
| Wheel zoom out (12 notches): time the view was not yet sharp | 23 s | 5.0 s |
| Wheel zoom out (12 notches): sharp again after the last input | 2.9 s | 596 ms |
| Switch to Plan: sharp after the tap | 610 ms | 96 ms |
| Switch to Plan: blank time | 0 ms | 0 ms |
| Switch to Satellite: sharp after the tap | 478 ms | 58 ms |
| Switch to Satellite: blank time | 0 ms | 0 ms |
| Switch to Sat + plan: sharp after the tap | 49 ms | 52 ms |
| Switch to Sat + plan: blank time | 0 ms | 0 ms |

### Phone 412 x 915, DPR 2, touch — medians of 3 BEFORE and 3 AFTER runs (network model 80,20 ms / Mbit/s)

| Measure | BEFORE | AFTER |
|---|---|---|
| First picture on screen (loader gone) | 9.4 s | 1.3 s |
| Search and Find chips usable | 9.4 s | 566 ms |
| First sharp view (all drawing and photo tiles in) | never | 2.4 s |
| Downloaded before the first picture | 15.77 MB | 1.01 MB |
| Downloaded before the first sharp view | never | 1.78 MB |
| Long tasks while loading: count / main thread blocked | 11 / 6.0 s | 1 / 24 ms |
| Longest single task while loading | 2.6 s | 74 ms |
| Pinch in (3 pinches, to 34,300%): frame time p50 / p95 | 383 ms / 3.3 s | 17 ms / 350 ms |
| Pinch in (3 pinches, to 34,300%): longest frame | 48 s | 833 ms |
| Pinch in (3 pinches, to 34,300%): long tasks / main thread blocked | 11 / 5.1 s | 0 / 0 ms |
| Pinch in (3 pinches, to 34,300%): time part of the view was blank | 68 s | 0 ms |
| Pinch in (3 pinches, to 34,300%): time the view was not yet sharp | 174 s | 10 s |
| Pinch in (3 pinches, to 34,300%): sharp again after the last input | 154 ms (1 of 3 runs never) | 164 ms |
| One-finger pan (300 px): frame time p50 / p95 | 317 ms / 950 ms | 17 ms / 50 ms |
| One-finger pan (300 px): longest frame | 1.5 s | 67 ms |
| One-finger pan (300 px): long tasks / main thread blocked | 0 / 0 ms | 0 / 0 ms |
| One-finger pan (300 px): time part of the view was blank | 0 ms | 0 ms |
| One-finger pan (300 px): time the view was not yet sharp | 430 ms | 0 ms |
| One-finger pan (300 px): sharp again after the last input | 343 ms | 690 ms |
| Pinch out (3 pinches): frame time p50 / p95 | 383 ms / 3.3 s | 17 ms / 417 ms |
| Pinch out (3 pinches): longest frame | 41 s | 750 ms |
| Pinch out (3 pinches): long tasks / main thread blocked | 12 / 3.3 s | 0 / 0 ms |
| Pinch out (3 pinches): time part of the view was blank | 121 s | 0 ms |
| Pinch out (3 pinches): time the view was not yet sharp | 163 s | 8.2 s |
| Pinch out (3 pinches): sharp again after the last input | never | 282 ms |
| Switch to Plan: sharp after the tap | 9.0 s | 91 ms |
| Switch to Plan: blank time | 8.6 s | 0 ms |
| Switch to Satellite: sharp after the tap | 55 s | 53 ms |
| Switch to Satellite: blank time | 0 ms | 0 ms |
| Switch to Sat + plan: sharp after the tap | 53 ms | 49 ms |
| Switch to Sat + plan: blank time | 0 ms | 0 ms |

### Memory (the whole test browser, peak during a run)

| | Desktop BEFORE | Desktop AFTER | Phone BEFORE | Phone AFTER |
|---|---|---|---|---|
| Peak resident memory, median (three runs) | 3.11 GB | 2.02 GB | 4.95 GB | 1.83 GB |

Summed over the harness's own processes (Node plus Chromium's browser, graphics and page processes) every 2 s by
`guard.sh`; memory shared between processes is counted more than once, so read it as a comparison only. BEFORE's phone
runs went as high as 5.55 GB; two BEFORE phone runs before the restart ended with the browser gone, which is why the guard
was added (it would have stopped a run at 6 GB; none reached it).

## The phone at CPU 4x, 390 px (Andrew on site, 28 Sep)

The brief from the lead on 27 Sep: faultless on a mid-range Android phone; measure with the CPU throttled 4x at 390 px
wide, covering zoom, pan, first load, the three 2D modes, Find and a tab switch; then Andrew's bar: rotation, a 60 s soak,
crisp at rest at every zoom, the deepest zoom. `phone4x.js` and `phonechecks.js`: 390 x 844 CSS px at DPR 2.77 (a
1080 px wide screen), touch, Chromium's CPU throttled 4x, our files over 80 ms / 20 Mbit/s, Google's tiles live, a fresh
browser per run; BEFORE is live v6.99 exactly (explorer.js, index.html and explorer-merge.js as served today), AFTER is
`release/` over it. The tab switch is simulated (headless Chromium does not hide a page when another tab comes to the
front): the page is told it is hidden, frozen for 8 s where Chromium allows it, then shown again.

What this harness can and cannot show. Input here waits for the software graphics chip to produce frames, and the
machine was running at a load average of 23 to 37 from other work, so at the phone's own resolution neither version could
take three pinches or a twist inside the caps (the pinches were abandoned after 3.5 minutes, both versions). It measures
load, the switches, Find and the tab switch faithfully; for gestures it measures the main thread (long tasks, blocking),
blank time and time to sharp, not how smooth a real phone's GPU is. The second table repeats the runs at DPR 1 for both,
so neither is held up by pixel work.

### Phone, CPU 4x, 390 x 844 at DPR 2.77, both with explorer-merge.js — BEFORE runs r1 / AFTER runs r1

| Measure | BEFORE (live v6.99) | AFTER |
|---|---|---|
| First picture on screen | 13 s | 2.9 s |
| Search and Find usable | 13 s | 1.2 s |
| First sharp view (drawing and every photo tile in) | never | 11 s |
| Downloaded before the first sharp view | 17.12 MB | 5.06 MB |
| Main thread blocked while loading | 17 s | 1.1 s |
| Longest frame while loading | 65 s | 2.2 s |
| Pinch in (3 pinches): time the page took to take the input | >90 s | >90 s |
| Pinch in (3 pinches): frame time p50 / p95 | – | – |
| Pinch in (3 pinches): longest frame | – | – |
| Pinch in (3 pinches): main thread blocked | – | – |
| Pinch in (3 pinches): time part of the view was blank | – | – |
| Pinch in (3 pinches): sharp again after the input | never | never |
| One-finger pan: time the page took to take the input | – | – |
| One-finger pan: frame time p50 / p95 | – | – |
| One-finger pan: longest frame | – | – |
| One-finger pan: main thread blocked | – | – |
| One-finger pan: time part of the view was blank | – | – |
| One-finger pan: sharp again after the input | – | – |
| Pinch out (3 pinches): time the page took to take the input | – | – |
| Pinch out (3 pinches): frame time p50 / p95 | – | – |
| Pinch out (3 pinches): longest frame | – | – |
| Pinch out (3 pinches): main thread blocked | – | – |
| Pinch out (3 pinches): time part of the view was blank | – | – |
| Pinch out (3 pinches): sharp again after the input | – | – |
| Tap Plan: frame time p50 / p95 | – | – |
| Tap Plan: longest frame | – | – |
| Tap Plan: main thread blocked | – | – |
| Tap Plan: time part of the view was blank | – | – |
| Tap Plan: sharp again after the input | – | – |
| Tap Satellite: frame time p50 / p95 | – | – |
| Tap Satellite: longest frame | – | – |
| Tap Satellite: main thread blocked | – | – |
| Tap Satellite: time part of the view was blank | – | – |
| Tap Satellite: sharp again after the input | – | – |
| Tap Sat + plan: frame time p50 / p95 | – | – |
| Tap Sat + plan: longest frame | – | – |
| Tap Sat + plan: main thread blocked | – | – |
| Tap Sat + plan: time part of the view was blank | – | – |
| Tap Sat + plan: sharp again after the input | – | – |
| Find chip (Generators): frame time p50 / p95 | – | – |
| Find chip (Generators): longest frame | – | – |
| Find chip (Generators): main thread blocked | – | – |
| Find chip (Generators): time part of the view was blank | – | – |
| Find chip (Generators): sharp again after the input | – | – |
| Find a reference (GN04): frame time p50 / p95 | – | – |
| Find a reference (GN04): longest frame | – | – |
| Find a reference (GN04): main thread blocked | – | – |
| Find a reference (GN04): time part of the view was blank | – | – |
| Find a reference (GN04): sharp again after the input | – | – |
| Back from another tab (8 s away): frame time p50 / p95 | – | – |
| Back from another tab (8 s away): longest frame | – | – |
| Back from another tab (8 s away): main thread blocked | – | – |
| Back from another tab (8 s away): time part of the view was blank | – | – |
| Back from another tab (8 s away): sharp again after the input | – | – |

Machine load average (1, 5, 15 min) at the start of each run: BEFORE 35.69 34.84 33.60; AFTER 23.26 29.64 32.01.

Runs that stopped early: before r1: Error: input still queued 3.5 min after pinchIn; after r1: Error: input still queued 3.5 min after pinchIn

### Phone, CPU 4x, 390 x 844 at DPR 1, both with explorer-merge.js — BEFORE runs d1r1 / AFTER runs d1r1

| Measure | BEFORE (live v6.99) | AFTER |
|---|---|---|
| First picture on screen | 17 s | 4.5 s |
| Search and Find usable | 17 s | 918 ms |
| First sharp view (drawing and every photo tile in) | never | 4.8 s |
| Downloaded before the first sharp view | 16.83 MB | 1.46 MB |
| Main thread blocked while loading | 21 s | 1.0 s |
| Longest frame while loading | 101 s | 3.1 s |
| Pinch in (3 pinches): time the page took to take the input | >90 s | >90 s |
| Pinch in (3 pinches): frame time p50 / p95 | – | – |
| Pinch in (3 pinches): longest frame | – | – |
| Pinch in (3 pinches): main thread blocked | – | – |
| Pinch in (3 pinches): time part of the view was blank | – | – |
| Pinch in (3 pinches): sharp again after the input | never | never |
| One-finger pan: time the page took to take the input | – | 9.6 s |
| One-finger pan: frame time p50 / p95 | – | 17 ms · 800 ms |
| One-finger pan: longest frame | – | 1.2 s |
| One-finger pan: main thread blocked | – | 517 ms |
| One-finger pan: time part of the view was blank | – | 0 ms |
| One-finger pan: sharp again after the input | – | 121 ms |
| Pinch out (3 pinches): time the page took to take the input | – | 68 s |
| Pinch out (3 pinches): frame time p50 / p95 | – | 50 ms · 2.4 s |
| Pinch out (3 pinches): longest frame | – | 4.0 s |
| Pinch out (3 pinches): main thread blocked | – | 883 ms |
| Pinch out (3 pinches): time part of the view was blank | – | 0 ms |
| Pinch out (3 pinches): sharp again after the input | – | 2.3 s |
| Tap Plan: frame time p50 / p95 | – | 17 ms · 67 ms |
| Tap Plan: longest frame | – | 67 ms |
| Tap Plan: main thread blocked | – | 17 ms |
| Tap Plan: time part of the view was blank | – | 0 ms |
| Tap Plan: sharp again after the input | – | 0 ms |
| Tap Satellite: frame time p50 / p95 | – | 17 ms · 50 ms |
| Tap Satellite: longest frame | – | 50 ms |
| Tap Satellite: main thread blocked | – | 0 ms |
| Tap Satellite: time part of the view was blank | – | 0 ms |
| Tap Satellite: sharp again after the input | – | 0 ms |
| Tap Sat + plan: frame time p50 / p95 | – | 17 ms · 100 ms |
| Tap Sat + plan: longest frame | – | 100 ms |
| Tap Sat + plan: main thread blocked | – | 0 ms |
| Tap Sat + plan: time part of the view was blank | – | 0 ms |
| Tap Sat + plan: sharp again after the input | – | 0 ms |
| Find chip (Generators): frame time p50 / p95 | – | 833 ms · 833 ms |
| Find chip (Generators): longest frame | – | 833 ms |
| Find chip (Generators): main thread blocked | – | 227 ms |
| Find chip (Generators): time part of the view was blank | – | 0 ms |
| Find chip (Generators): sharp again after the input | – | 0 ms |
| Find a reference (GN04): frame time p50 / p95 | – | 17 ms · 4.5 s |
| Find a reference (GN04): longest frame | – | 4.5 s |
| Find a reference (GN04): main thread blocked | – | 513 ms |
| Find a reference (GN04): time part of the view was blank | – | 0 ms |
| Find a reference (GN04): sharp again after the input | – | 4.6 s |
| Back from another tab (8 s away): frame time p50 / p95 | – | 133 ms · 233 ms |
| Back from another tab (8 s away): longest frame | – | 233 ms |
| Back from another tab (8 s away): main thread blocked | – | 18 ms |
| Back from another tab (8 s away): time part of the view was blank | – | 0 ms |
| Back from another tab (8 s away): sharp again after the input | – | 430 ms |

Machine load average (1, 5, 15 min) at the start of each run: BEFORE 29.36 32.55 32.20; AFTER 36.06 35.00 32.34.

Runs that stopped early: before d1r1: Error: input still queued 3.5 min after pinchIn

One AFTER run at DPR 2 without the throttle (bench.js, after the fix; `results/after_phone_r1.json`): first picture
3.4 s, first sharp view 7.4 s, three pinches taken in 210 s and sharp 0.8 s after, pan sharp 0.1 s after, mode switches
sharp in 55-98 ms. The pinch-out left part of the view blank for 19.8 s (5 frames): the first blank seen from AFTER, not
explained yet (BEFORE: 68 s blank on the pinch in and 121 s on the pinch out at the same settings, round 3). The round-3
phone table above was measured before the fix, with AFTER drawing at DPR 1, and should be read with that in mind.

### Rotation, crisp at rest, deepest zoom, soak (AFTER final build, CPU 4x, 390 x 844 at DPR 2.77; `results/pc_after.json`)

Rotation: the 2D map turns by a two-finger twist, the compass (tap a letter or drag the ring), As drawn, and N/E/S/W and
the rotate keys. On this harness: a compass tap to north was taken in 2.3 s and was sharp at once (0 ms after); As drawn
in 6.3 s, sharp at once; no blank in either. The two-finger twists (60 degrees and back) were not taken inside the 90 s cap,
the same limit that stops the pinches here (see below).

Crisp at rest, every zoom (the camera put straight there, no glide, so nothing was fetched ahead; "draw" is how much the
drawing's pixels are enlarged on screen, under 1 means finer than the screen needs; "photo" the same for the photograph):

| Mode | Turned | Zoom | Canvas | Draw | Photo | Sharp after |
|---|---|---|---|---|---|---|
| Sat + plan | 0° | 100% | 1080x2188 | 0.99 | 0.62x | 16.2 s |
| Sat + plan | 0° | 200% | 1080x2188 | 0.99 | 0.62x | 10.7 s |
| Sat + plan | 0° | 800% | 1080x2188 | 0.99 | 0.62x | 10.0 s |
| Sat + plan | 0° | 3,200% | 1080x2188 | 0.84 | 0.62x | 10.4 s |
| Sat + plan | 0° | 12,800% | 1080x2188 | 0.84 | 2.5x (past Google's detail) | 2.7 s |
| Sat + plan | 0° | 32,000% | 1080x2188 | 1.05 | 6.24x (past Google's detail) | 7.5 s |
| Sat + plan | 0° | 64,000% | 1080x2188 | 1.05 | 12.49x (past Google's detail) | 2.4 s |
| Sat + plan | 30° | 100% | 1080x2188 | 0.99 | 0.62x | 12.9 s |
| Sat + plan | 30° | 200% | 1080x2188 | 0.99 | 0.62x | 14.7 s |
| Sat + plan | 30° | 800% | 1080x2188 | 0.99 | 0.62x | 15.1 s |
| Sat + plan | 30° | 3,200% | 1080x2188 | 0.84 | 0.62x | 28.5 s |
| Sat + plan | 30° | 12,800% | 1080x2188 | 0.84 | 2.5x (past Google's detail) | 12.0 s |
| Sat + plan | 30° | 32,000% | 1080x2188 | 1.05 | 6.24x (past Google's detail) | 15.0 s |
| Sat + plan | 30° | 64,000% | 1080x2188 | 1.05 | 12.49x (past Google's detail) | 17.6 s |
| Plan | 0° | 100% | 1080x2188 | 0.99 | – | 7.9 s |
| Plan | 0° | 200% | 1080x2188 | 0.99 | – | 4.2 s |
| Plan | 0° | 800% | 1080x2188 | 0.99 | – | 4.6 s |
| Plan | 0° | 3,200% | 1080x2188 | 0.84 | – | 5.5 s |
| Plan | 0° | 12,800% | 1080x2188 | 0.84 | – | 8.2 s |
| Plan | 0° | 32,000% | 1080x2188 | 1.05 | – | 7.5 s |
| Plan | 0° | 64,000% | 1080x2188 | 1.05 | – | 10.1 s |
| Plan | 30° | 100% | 1080x2188 | 0.99 | – | 2.9 s |
| Plan | 30° | 200% | 1080x2188 | 0.99 | – | 8.3 s |
| Plan | 30° | 800% | 1080x2188 | 0.99 | – | 4.7 s |
| Plan | 30° | 3,200% | 1080x2188 | 0.84 | – | 10.9 s |
| Plan | 30° | 12,800% | 1080x2188 | 0.84 | – | 16.0 s |
| Plan | 30° | 32,000% | 1080x2188 | 1.05 | – | 13.6 s |
| Plan | 30° | 64,000% | 1080x2188 | 1.05 | – | 14.7 s |

At rest the canvas is always every device pixel of the screen, the drawing is never enlarged more than 1.05x at any zoom
(from the whole site to 64,000%), and past the pre-rendered pyramid it is drawn from the vectors at a level at or above
the screen's need. The photograph is finer than needed up to Google's zoom 21; closer than about 12,800% it is enlarged
(2.5x to 12.5x at 64,000%) because Google has no more detail there, and the status pill says so. Turned 30 degrees, the
tiles are the same; the picture is resampled once by the turn, as any rotated map is.

Soak (60 s of pinch in, pan, twist, pinch out, over and over): on this harness the first pinch was not taken inside 45 s,
so the soak measured the map holding one long gesture rather than many. What it can say: JS heap 3.2 MB at the start,
3.3 MB at the end (after garbage collection); the whole test browser's memory 1907 MB at the start and 1893-2009 MB through the
run; the caches stayed at their caps (90 photo tiles, 110 drawing tiles, 2 mosaics). No leak seen. No blank frames: 0 ms.

## What was slow, and why (found by trace and by measuring each layer)

1. **The first view needed the whole 13.3 MB scene and an SVG of the whole drawing.** The pre-rendered pyramid started at
   L -0.75, but the first view needs L -1.1 (desktop) or -1.6 (phone), so every overview tile fell through to the SVG
   path: download 13.3 MB, unpack 254,316 records in the worker, build a 19 MB SVG for one tile, then rasterise it.
   The trace showed the renderer's graphics thread stalled 14–30 s at a time on those SVGs; Google's tiles and even the
   map key sat waiting behind them. In BEFORE the first view was never sharp inside two minutes on this harness.
2. **Everything was asked for one after another**: the 2.4 MB preview picture (only used for the minimap), then two JSON
   files, then the scene, then the manifest, then the register, then the map key, then Google's session, then tiles.
3. **Nothing stood in while zooming**: the stand-in was only another cached level within 2.5 octaves; the satellite only
   a cached parent. Zooming in far or out showed black (BEFORE: 6–8 s blank in a 12-notch wheel zoom).
4. **Per-frame graphics cost** (software GPU, measured by switching layers off one at a time): the empty full-screen
   rings canvas (~45 ms a frame), clip masks for the plan's frame and each missing tile (~35–60 ms), and 64 separate
   aerial patches in Original plan (~45 ms). The main thread itself was light (~9 ms a frame).
5. **Softness**: the satellite zoom was rounded (up to 1.41x stretched, soft on a phone), drawing levels were rounded
   (up to 9% stretched), the phone canvas was capped at DPR 2 (a Pixel 7 is 2.625, an iPhone 3), and adjacent drawing
   tiles left a faint hairline where they met (visible on solid fills at 9,000%).

## What changed (AFTER)

Opening
- The pyramid now reaches down to L -3 (new `assets/vt/Llow.bin`), so every overview is a few small pre-rendered tiles.
  The scene is not needed to open. `assets/vt/manifest.json` carries a small "boot" block (the drawing's metadata,
  record count and the aerial-underlay ids) so the page needs neither the scene nor classification.json to start.
- Search and the Find chips use `source-labels.json` (identical to the scene's own labels, checked) plus the register and
  the plan snapshot / the dashboard's `gc500PlanItems()` as before. They are usable in about a quarter of a second.
- `index.html` asks for the manifest, the georeferencing, the labels, the overview picture and the map key in its
  `<head>`, before the body and the viewer script have arrived. The first view's tiles go out as soon as the manifest is
  in (not a frame later), and the satellite's the moment the key and session are known.
- Google's session is kept in the browser until a day before it expires (only a fingerprint of the key is stored with
  it, never the key). A return visit skips createSession. A stale session is replaced once before falling back to Mapbox.
- The 2.4 MB preview is no longer loaded; a 175 KB overview (`assets/sheet-overview.webp`) serves the minimap and stands
  in under Original plan while its aerial arrives.
- The loader fades out as soon as the drawing is whole; the photograph fills in under it.
- After the first sharp view, when the hand has been still for a moment: Original plan's aerial is prepared in a worker,
  then the scene is fetched for zoom past the pyramid (desktop; a phone with 4 GB or more too; not on data saver or a
  slow link).

Never blank
- The lowest level loaded (the whole sheet in 2–6 tiles) is never evicted: it is the stand-in of last resort.
- A missing drawing tile shows the finest coarser level that covers it; at rest, finer cached tiles too.
- A missing satellite tile shows its nearest cached parent (up to six zooms up) and any cached children.
- The satellite two zooms coarser is fetched over the view and half a view round it (a few tiles): a pan, zoom in or
  zoom out always has a photograph under it at once.
- The photograph now extends about 1.8 km round the plan (was 600 m), so a phone's full view has no black bands.

Fast to sharp
- A glide's destination (wheel, +/−, keyboard, double-click, double-tap) is worked out and fetched the moment it starts,
  drawing and photograph, ahead of everything else. A glide finishes in real time even when frames are slow (it was
  capped at 50 ms a frame, so a slow device zoomed in slow motion).
- At rest: the ring of drawing tiles just outside the view and one octave closer for the middle of the view (our own
  server only), so pans and pinches open onto tiles already here. Nothing off-screen stays queued; downloads for views
  already left are stopped.
- A drawing tile that fails is retried after 1, 2, 4 … 30 s. A missing level file (a half-finished deploy) drops those
  levels and the next are used (tested: old manifest, and manifest without Llow.bin).

Smooth
- No clip masks for the plan: tiles are cropped by their source rectangle instead.
- The rings canvas is taken out of the page when it has nothing on it.
- The pick's pulse is a CSS animation on the compositor (it was a 60 fps full-canvas redraw for 20 s).
- Original plan's 64 aerial patches are composited once, in a worker, in software, at full, half and quarter size: one
  draw a frame instead of 64, and no work on the page's thread or the graphics thread.
- While the hand moves, the drawing and satellite levels hold within a band, so nothing is rebuilt at every step.
- DOM writes only when a value changes (status line, zoom box, minimap, overzoom pill).
- Every image decodes off the main thread (createImageBitmap); SVG tiles past the pyramid are rasterised once into a
  bitmap.

Sharp
- Drawing level: the first one at or above the screen's density, so tiles are drawn the same size or smaller, never
  stretched more than 5%. Past the pyramid, whole octaves from the vectors.
- Satellite zoom: at most 1.23x stretched (was 1.41x).
- Canvas at the true devicePixelRatio (up to 3), at exactly its device-pixel size (devicePixelContentBoxSize, used only
  when it agrees with CSS size x devicePixelRatio; see "A bug found on the phone" below).
- At rest the drawing is laid on one seamless picture, like the photograph, so no hairlines where tiles meet.

After the first campaign (`patch_round2.py`)
- Past the pyramid the drawing is built from the vectors at half octaves (L 3.5, 4, 4.5 ...), not whole octaves: at most
  1.4x the tiles the screen needs, not 2x, so a pan or pinch close in renders about half as many tiles. Round 1's phone
  pinch to 34,300% was never sharp inside a minute; in this build it is (table below).
- Once the scene is in, the ring of tiles round the view is prepared past the pyramid too; three vector tiles are built at
  once on a desktop (was two; a phone stays at one).
- Original plan's aerial is prepared in the worker as soon as the first view is sharp (it was after 1.5 s of stillness),
  and its full-size picture comes back in 1024 px pieces, so a close view sends one or two to the graphics chip, not the
  whole decoded picture (about 56 MB in memory).

For the v6.99 Map explorer
- While the 3D model covers the map (explorer-merge.js puts `in3d` on the body), the hidden map draws nothing, fetches
  nothing and starts no background work (the 13.3 MB scene, the aerial): every frame and byte goes to the 3D model.
  The first view is still drawn so `GC500Explorer.ready` settles; leaving 3D repaints at once, wherever a pick has moved
  the map to, with the usual stand-ins under it while it sharpens. Checked (`pause3d.js`): over 8 s in 3D with two picks,
  the hidden map drew 0 frames and asked for 0 tiles (without the change: 4 frames and 10 tiles).

Kept (checked in `features.js`, `embedded.js`, desktop and phone)
- Plan / Sat + plan / Satellite, by button, by 1–3 and by #original / #hybrid / #satellite; compass N/E/S/W and As
  drawn; search; the Find chips with the dashboard's numbers (v6.96) and the merged barrier chip ("12 locations · 20
  runs"); the own-window snapshot; ?find=; opacity and brightness; inset and legend toggles; box zoom; fit; zoom box;
  full screen button; PNG export (3840 px, complete); keyboard; minimap; legend; alignment panel; imagery-failure banner
  with Retry and "Show the plan only"; the phone menu.
- New for the dashboard: `window.GC500Explorer.ready` (a Promise; settles with `{mode, firstViewMs, items}` when the plan
  is on screen and search and chips work) and `window.GC500Explorer.find(code)` (selects and flies to a reference as
  ?find= does; resolves true or false). A pick made by a person in the explorer (a Find list row, a search result, a
  ring) calls `window.parent.gc500ExplorerPicked(code)` inside a try/catch; the API's own find does not.

## A bug found on the phone, fixed

The crisp-at-rest check on the phone profile found AFTER's canvas at 390 x 790 when the screen needs 1080 x 2188: one
canvas pixel per CSS pixel, so the whole map was drawn at a third of the phone's detail and stretched by the browser.
The same on a desktop at DPR 2 (1140 x 846 where 2280 x 1692 was needed). The cause was the round-1 change that sizes the
canvas from `devicePixelContentBoxSize`: in this browser (an emulated device) it reports CSS pixels, and the page trusted
it. Whether a given real phone reports it correctly or not, the page must not depend on it, so now the box is used only when
it agrees with CSS size x devicePixelRatio to within 2 px, and otherwise the size is CSS size x devicePixelRatio (up to 3,
and at most 9 million pixels on a phone, 16 million on a desktop). Checked after the fix: 1080 x 2188 at DPR 2.77, 2280 x
1692 at DPR 2, unchanged at DPR 1. BEFORE draws a phone at DPR 2 at most, so AFTER is now sharper than BEFORE on any
screen over DPR 2, and does more pixel work to get there.

With the fix, a 2.77 phone draws 2.4 million pixels a frame against BEFORE's 1.2 million, and on the test phone
the three pinches were no longer taken inside 3.5 minutes (before the fix: 58 s). So, as a safety net for a mid-range
phone's graphics chip, a phone over DPR 2 now draws the frames *while a finger or a glide is moving* at DPR 2 (what the live
page always used there; checked: 780 x 1580 during a pinch) and the full ratio again 160 ms after the hand stops (1080 x
2188 at rest). The resting view, the one you look at, is always every pixel of the screen. Desktops, and phones at DPR 2 or
under, are always at the full ratio.

Every AFTER phone measurement made before the fix drew at DPR 1. The round-3 phone table in "Results" is one of them
and flatters AFTER (it drew half BEFORE's pixels there); its JSON files are in `results/invalid_dpr1/`. The phone tables
under "The phone at CPU 4x" were measured after the fix. The desktop tables (DPR 1) are not affected.

## The v6.99 reference card, fixed (explorer-merge.js)

On a phone, v6.99's reference card opened over the bottom of the map and stayed there: it covered As drawn, the status
pill and the imagery credit until its × was pressed (checked on live v6.99 and on AFTER: `cardcover.js`); a touch on the
card also started a pan of the map under it, and a wheel over it zoomed the map. Changed in a copy of stage7's file
(`explorer/explorer-merge.js`, 41 diff lines, nothing else in it touched):
- The card's bottom edge goes just above the highest of the map's own bottom controls under it (compass and As drawn,
  status pill, imagery credit, minimap, the banners), measured when it opens and on resize. On a phone it is a compact
  bottom sheet (the master-plan picture as a 76 px thumbnail beside the text, at most 38% of the height, scrolls inside).
- It closes when the map is touched, pinched, scrolled or zoomed anywhere outside it, and on Escape; × still closes it.
- A touch, tap, double-tap or wheel inside it stays in it: it no longer pans or zooms the map, and Open still works.
- Desktop: it overlapped the minimap and the status pill there too, so the same placement applies (it now sits above the
  minimap); otherwise as before.
Checked (`cardtest.js`, phone 390 px and desktop 1440 px): no overlap with the mode buttons, As drawn, the compass, the
credit, the status pill, the minimap or the zoom buttons; tap inside keeps it and the map does not move; wheel over it
keeps it and the map does not zoom (desktop); tap on the map closes it; a pinch closes it (phone); a wheel on the map
closes it (desktop); Escape and × close it; a new pick reopens it; no page errors. Screenshots `shots/card_390.jpg`
(before the fix) and `shots/card_fixed_phone.jpg`, `shots/card_fixed_desk.jpg`.

## The release

`release/` holds every changed file at its machine-set path, with `release/MANIFEST.txt` (bytes, md5, new or changed,
and the live file it replaces). Seven files: explorer/explorer.js, explorer/index.html, explorer/scene-worker.js,
explorer/explorer-merge.js, explorer/assets/vt/manifest.json (changed) and explorer/assets/vt/Llow.bin,
explorer/assets/sheet-overview.webp (new). poc3d/ is not touched. The new manifest's entries for the 17 live levels were
checked against today's live manifest: identical, so the live level files stay valid.

## New and changed files

All under the service's `explorer/` folder. Sizes in bytes; "live" is what the live service answers today (GET).

| File | AFTER | Live today | Change |
|---|---|---|---|
| `explorer.js` | 122,423 | 87,050 | changed (everything above) |
| `index.html` | 23,721 | 21,583 | changed: the early requests in `<head>`, loader text; carries v6.99's own edits (title, the `explorer-merge.js` tag, the page list) |
| `scene-worker.js` | 7,210 | 4,206 | changed: Original plan's aerial composited in the worker; the full size in 1024 px pieces |
| `assets/vt/manifest.json` | 112,010 | 109,537 | changed: the live manifest plus levels L -1 to -3 and the boot block |
| `assets/vt/Llow.bin` | 2,752,294 | – | **new**: pyramid levels L -1 to -3, lossless WebP tiles packed in one file, read by Range |
| `assets/sheet-overview.webp` | 178,670 | – | **new**: the whole sheet at 1192 x 842, the minimap and the stand-in under Original plan |
| `assets/plan_items.json` | 42,109 | 42,109 | unchanged (listed because the page reads it) |
| `explorer-merge.js` | 14,161 | 11,673 | changed: the reference card fix (below) |

Net growth of the machine set: 2,976,440 bytes (2.98 MB, 2.84 MiB): from 161.3 MB to about 164.3 MB of the 192 MB cap.
AFTER no longer asks for `assets/original-preview.webp` (2,447,122 bytes). Nothing else found asks for it either (the
v6.96 dashboard, v6.99's 3D page and explorer-merge.js were searched), so removing it would bring the net growth down to
about 0.53 MB; that was not checked against every page in the set, so leave it unless someone does.

Every new asset is made by `build_assets.py` from files already on the live service (the L0 level and
original-preview.webp), so it matches drawing D001 rev 03 exactly; the manifest's boot block carries the drawing's sha256,
and the page warns if the scene and the tiles ever come from different revisions.

## What is still imperfect, and why

- **Pinch and twist on a phone could not be timed here at the phone's own resolution**, in either version: on a software
  graphics chip at a load average of 23 to 37, three pinches were not taken inside 3.5 minutes. The one run that got
  through (DPR 2, no throttle) took 210 s and showed 19.8 s of blank on the pinch out, the first blank from AFTER, not yet
  explained. Test pinch, twist and pinch-out on Andrew's phone before he relies on it.
- **Memory is tight on this machine.** Other work shares a 14.3 GB limit; the kernel killed the largest Chromium several
  times today (two of my runs among them), and runs were then made one at a time.
- **The lowest pyramid levels (whole site to about 50%) are a little paler than the vector-rendered level above them**:
  green outlines along the beach and round Macintosh Island are thinner zoomed right out (they were made by downsampling
  L0, not by the vector renderer). A re-render with the viewer's own renderer (`render_low.js`) was started and stopped on
  the lead's instruction; `lowrender/` holds L -0.75 to -2 from it, unused.
- **Real frame rate is unknown.** Every frame time here is from SwiftShader, a software graphics chip, on a shared
  4-core machine. AFTER's zoom bursts ran at a median 17 ms a frame on the phone profile but 167 ms on the desktop one,
  with p95 350–600 ms; on this harness even AFTER takes the input slowly (the 12-notch wheel burst took 8–10 s to get
  through, ideal about 0.8 s; the three pinches 11–51 s, ideal about 2 s), because input waits on the software graphics
  process. A real graphics chip is many times faster, but how smooth it is on Andrew's laptop, a 4K screen or a real
  phone could not be measured here. That is the one test still worth doing by hand: open it on the phone and the laptop
  and zoom hard.
- **Sharp arrives just after the hand stops, not during.** Nothing goes blank any more (0 ms blank in every AFTER run),
  but while zooming the picture is the nearest coarser level, which is softer, and the exact tiles land 0.1–0.8 s after
  the last input here. Pre-fetching the glide's destination makes this as short as the network allows; it cannot be zero.
- **The closest zoom is built on demand.** Past the pre-rendered pyramid (over about 9.5 device pixels per sheet point)
  the drawing is drawn from its 254,316 vector records in a worker, so the first visit to a new close spot takes a moment
  longer than the pyramid. On a desktop the 13.3 MB scene loads quietly after the first view; a phone reporting under
  4 GB of memory, or on data saver or a 2G link, only fetches it when someone first zooms that far, and waits for it then.
- **The photograph has a limit.** Google's aerial goes to zoom 21; closer than that the photograph is enlarged and the
  status pill says so ("photograph enlarged beyond its detail"). The drawing stays crisp at any zoom; the photograph
  cannot be made sharper than Google's source.
- **Leaving 3D could not be timed.** With the v6.99 3D model open, the harness's clicks took 18–19 s to register in both
  versions, because the 3D page holds the shared page thread on a software graphics chip, so the time back to a sharp 2D
  view is not reported. The map under 3D now does no work at all (checked); whether the 3D model itself should pause when
  hidden is a question for explorer-merge.js.
- **Harness limits.** Our own files were served with a modelled network (40 ms and 50 Mbit/s desktop, 80 ms and
  20 Mbit/s phone), not the real service; Google's tiles and the map key were live. First visits only: a return visit
  (browser cache, kept Google session) will be faster than the tables and was not timed. stage7's `lh3.js` ignores Range
  requests for local files, so the v6.99 integration run used the live pyramid levels rather than `Llow.bin` (the page
  handles that; the real service answers Range, checked with a GET on `assets/vt/L0.bin`).
- Momentum after a pan still slows per frame with a 40 ms cap (the zoom glide was moved to wall time, the pan glide was
  not), so on a very slow device a flick coasts in slow motion. Not visible at normal frame rates.

## For the dashboard

Nothing has to change in the dashboard. What it can use:
- `window.GC500Explorer.ready`: a Promise that settles with `{mode, firstViewMs, items}` once the plan is on screen and
  search and the Find chips work. The dashboard's frame can wait on it instead of polling `window.__ready`.
- `window.GC500Explorer.find(code)`: selects and flies to a reference as `?find=` does; resolves true or false.
- `parent.gc500ExplorerPicked(code)`: called when a person picks a reference in the explorer (a Find list row, a search
  result, a ring), inside a try/catch, and only if the dashboard defines it. The API's own `find`, `?find=` and a pick made
  on the 3D model do not call it, so there is no echo. explorer-merge.js's card "Open" button calls it as before.
- The v6.96 host data (`parent.gc500PlanItems()`, else the page's own `assets/plan_items.json` snapshot in its own window),
  `?find=`, `?embed=1`, `#original` / `#hybrid` / `#satellite` and v6.99's `#3d` / `?mode=3d` work as before.

## The Map explorer (v6.99) still works

explorer-merge.js reaches into explorer.js by name. Every name it uses is still a top-level declaration in the AFTER
explorer.js, reassignable from another script where it needs to be (`selectCode`, `showCategory` are plain function
declarations; `ITEMS`, `CATS_NOW`, `GEO`, `mode` are `let`; `norm`, `setMode` functions), `window.__ready` is still set
(now as soon as search works, a little before the first view), and every element id and the `.modes` group are still in
index.html. What changed that it can see:
- `selectCode(code, place, byUser)` has a third argument (a person's own pick). The merge's wrapper passes all arguments
  through, so nothing changes for it.
- `window.GC500Explorer` now also has `ready` and `find`; the merge adds `mode3d` and `is3d` to the same object as before.
- The map pauses while `body.in3d` is set (above). That is the merge's own class; if it is ever renamed, explorer.js's
  `under3d()` must be renamed with it (the map would then simply keep drawing underneath, as before).

The check: the final folder copied with explorer-merge.js beside it (`integ/explorer/`), run through a copy of stage7's
`merge699.js` and `lh3.js` (only the screenshot folder changed, so nothing is written into stage7), POC3D_DIR the stage7
3D page (byte for byte the live one). Result, desktop and phone: modes Plan / Sat + plan / Satellite / 3D; the 2D card
for GN04 ("GN04 Generator × Generators · S15"); 3D ready with 366 pins; its views and Auto / Ultra (4K) / Light; the
Lighting towers chip drives it; a pick on the model (WC23) shows its card; Sat + plan leaves 3D; no page errors
(`integ/desk.log`, `integ/phone.log`, `integ/shots/`). One harness difference: lh3.js answers local files whole and
ignores Range, so under it the new low levels in `Llow.bin` are refused and the page falls back to the live levels (the
half-deployed case, which is handled); the live service already answers Range for the packed level files.
