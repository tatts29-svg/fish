# Handover Claude → Codex — 18 Oct 2026

Author: Andrew Fisher · written by Claude, 18 Oct 2026 ~07:00 AEST

Andrew, 18 Oct 2026: "We have codex back can you give him a hand over. We need to work on bugs and errors and smoothness.
Maps is currently alsos very slow and lagging we cant have this. Things need to render fast. Things need to load fast. Not
glitching. No pages stucks. No scrolling issues or blocks. We need this perfection 10/10 ... As your getting low on credits
he has his back. Your still ok to finish what you are doing."

Read `AGENTS.md` and the top of `STATUS.md` first. This note is what changed since your last session and how we split the
work so we never patch the same code at once.

## Live now

- **Page v10.60.2**, uploaded 18 Oct 06:32 AEST, sha256 `8222e47b800cc141…`, 18,301,333 bytes. Record version 9704.
  Server **v5.87** (`/health` build v5.87).
- Releases since you were last on (newest first; each has a folder with README, patch and tests):
  - v10.60.2 `v10.60.2_print_gate_name_DRAFT/`: the no-twin-steer print check said nothing when the name had no surname;
    Andrew was stuck printing the VMS run. It now says what is missing and fills "Andrew" in as "Andrew Fisher".
  - v10.60.1 `v10.60_map_shapes_DRAFT/patch_v1060p1.py`: a near-miss tap beside a small drawn unit on the Map explorer
    opened a hidden unit from another category; fixed.
  - v10.60 `v10.60_map_shapes_DRAFT/`: Map explorer draws every reference as its traced shape with its door, the tick
    and the reference inside, glow and pulse; plus WC17 joined delivery day 7.
  - v10.59 `v10.59_late_desc_arrived_DRAFT/`: late loads named by reference, arrivals on the day they came.
- Files, not page releases: `toilets_register_17Oct2026/` (Excel of every toilet unit), FWF labels fixed for WC31's
  accessible 1317645 (`labels_17Oct2026_fwf/`).
- Andrew's standing word (18 Oct 06:30): "permission to upload everythi g" — finished, tested pieces go up. Still claim the
  version on STATUS.md, build on the live page (`toolchain/build.sh`), and let `upload_page.py`'s base guard stop you if
  the live page moved under you.

## Who does what (so we never edit the same code)

**Claude is finishing (do not patch these areas until they are live, or agree on PR #1 first):**

1. **v10.61 page speed** — load, Today, the Build tab, flicker, idle work. The diagnosis is in
   `speed_findings.md` (35 findings so far: cost, root cause traced to code, fix, measured gain). Measured on live
   v10.60.1, phone 390×844 at CPU ×4: load event 57 s with four ~10 s freezes; Build tab (`go('timeline')`) frozen
   11–12 s; layout jumps CLS 0.27. Prototype gains: page shown 24 s → 13 s, settled 40 s → 19 s, Build 12.4 s → 0.36 s
   longest frozen screen, desktop Build 2.4 s → 0.8 s. Code v10.61 touches: the load/render path (`route`, the reveal and
   registry renders, `syncRedraw`), milestones `unseenNow`, `Persistence1010.capture`, names1044 `cleanEl`, nights1040
   date labels, `model925`, `EventConfig1013.current`, `unitEvidence`, `histOf`, work986's cache key, units925,
   staff910 `roster`, weather1002 `reveal`, the header car picture / `navScrollSave`, selection-save1012's observer,
   header geometry, the twin-steer banner placement, font swap, the first tab highlight, the "saved copy" flash.
2. **Servicing tracker** (Andrew's crews tick night jobs from laminated QR sheets; track only, never the record or
   charges): server **v5.89** (`server_v5.89_servicing_tracker_DRAFT/`), crew card page and print pack
   (`servicing_tracker_DRAFT/`), main-page progress panel **v10.63** (mock-up first). Server deploy in a quiet window,
   Andrew told first.

**Codex, please take:**

1. **Map explorer speed and lag — top of Andrew's list.** He says the maps are "very slow and lagging". Measure first
   (phone CPU ×4 and desktop): explorer frame load to first usable map, tile loading and sharpening, pan / pinch / wheel
   zoom / rotate frame times, chip changes, the Done chip, Satellite + plan, 3D, and the v10.60 shape layer's share of
   each frame (`GC500Shape1060.state`; its own test `v10.60_map_shapes_DRAFT/tests/test_v1060.cjs`, 62 checks). Your
   earlier `test_map_performance.cjs` (commit `0a1b93c6`) is a good start. The explorer files are pinned by
   `EXPLORER_BUILD` in the v10.60 patch: if you change any explorer script, bump that pin or the shape layer stands down
   (by design).
2. **Bugs, errors, stuck pages, scrolling** on every tab other than the v10.61 areas above: trapped dialogs (like the
   print check was), drawers that will not close, deep links, back/forward, pages that lock scrolling, console errors,
   anything that "feels like it will break". Phone and desktop. `toolchain/harness/sweep.js` is the baseline (24 tabs,
   7 links, must stay 0 errors).
3. **Independent review of v10.61** when Claude marks it READY (Andrew wants it right, not just fast).
4. Unclaimed, yours if you want them: v10.62 Event Portables servicing cost on our on-site count (714 services, 18 tank
   pump-outs, 51 block cleans at their rates = $42,234 against their quote $46,545; AGENTS.md "Toilet servicing goes by
   our on-site count"); the fencing audit; the buildings register (mock-up first); the departure-rule build (leave
   pick-up before 07:00, Kingston by 05:00).

## "10/10" — what to measure against

Proposed targets (phone = 390×844, dpr 2, CPU ×4; same build, medians of 3):
- page usable (first screen drawn and tappable) under 8 s on phone, 2 s on desktop; no long task over 250 ms after it;
- a tab or day change shows something within 100 ms and finishes within 500 ms on phone;
- layout shift (CLS) under 0.02 on load and on every tab change;
- map pan, zoom and rotate: frame p95 under 20 ms on desktop and 33 ms on phone; no frame over 100 ms while moving;
- idle: main thread under 2% busy over 60 s on Today, Build and Map;
- 0 page errors, 0 console errors, sweeps clean, every figure unchanged (parity of each tab's text before and after).

## Tools added this weekend

- `toolchain/harness/open_page.js` now takes `init` (a script run before the page's own) and `cpu` (CPU slow-down).
- `toolchain/harness/perf_probe.cjs`: load long tasks and layout shifts, a tab switch (`TAB=`, default the Build tab
  `timeline`), 15 s idle on it, DOM size. `PAGE=… MOB=1 CPU=4 node toolchain/harness/perf_probe.cjs`.
- The harness disk cache `/tmp/gc500-fetch-cache` can go stale: delete it before a run.

## Known small issues (not started)

- Map: a kept circle's badge over shaped neighbours at overview zoom takes their taps (T0258/T0266 over P52/P55; PG01
  over WC16); a Done-chip unit enlarged to its 12 px minimum can sit under a neighbour's reference on the phone; the
  first ripple after a pick can start mid-way.
- Tests with stale expectations: v10.53 `test_twinsteer1053.cjs` footer regex `/v10\.5[3-9]$/` (fails on any v10.60
  footer); v10.57 `test_part1.cjs` expects 44 references in the Demob orders fold (now 45 with WC17 on day 7).

## Rules that bit us this weekend

- The edit key never goes in a file, a commit, a log, a screenshot or a message. Tests are GET-only (the harness aborts
  writes). Record changes only through page functions, with a backup first.
- "If I have unticked it don't go ticking it again." The site record is truth over paperwork.
- A dialog must always say what it still needs; never leave a greyed button with no reason (v10.60.2).
- Codex sync: the hourly sync task is still switched off; Andrew will say if he wants it back.
