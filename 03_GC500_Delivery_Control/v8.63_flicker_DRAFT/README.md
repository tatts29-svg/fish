# v8.63: pages open and refresh without flicker (DRAFT, READY to upload after v8.62)

Author: Andrew Fisher.

Andrew (Claude chat, 6 Oct 2026): "Can u audit gc500 for bugs pages are flickering when you open pages.. noticable on today page too. Address . Fix. And then go live".

## What was wrong (measured on live v8.61 `a02c7b5e`, desktop 1440×900 and phone 390×844)

| # | Fault | Where it shows | Root cause |
|---|-------|----------------|------------|
| F1 | **White flash when a tab opens.** The old page stays, then the content area goes blank white for about 0.1–0.7 s, then the blocks fade in one after another. | Every tab: Today, Timeline, Equipment, Demob, Documents, Coates Way | The arrival used two fades starting from invisible: `paneIn` on the pane from opacity 0.001, and `v610rise` on every block from opacity 0, staggered up to 0.35 s with `both` fill. |
| F2 | **The page blanks again whenever the record refreshes.** Today goes completely white for about 0.7 s and fades back in while you are just looking at it. | Any open tab when the record changes (the page checks every 4 s, and redraws when anyone edits) | `go()` puts `arrive` on the pane and nothing removed it. A redraw replaces the pane's blocks, the new blocks match `.pane.on.arrive > *`, and the full fade-in plays again. |
| F3 | **The Today banner goes grey ("Loading picture…" on a phone), then black, then the photograph**, on every redraw. | Today, desktop and phone | Each redraw builds a new banner `<img>` (`decoding="async"`), which is blank until the browser decodes it again. |

Evidence: the screencasts `evidence/cmp_desk_render.jpg`, `evidence/cmp_phone_render.jpg` and `evidence/cmp_docs.jpg` show before and after, with frame times. The probe scripts (`probe.js`, `cast.js`, `idle.js`) are in `evidence/`.

## The fix (additive; no other behaviour changes)

- `flicker863.css` redefines `paneIn` and `v610rise` as a short upward settle, **with no opacity**, so nothing on the page is ever drawn invisible. The timings, the stagger, reduced motion and Motion: Off are unchanged.
- `flicker863.js`:
  1. Watches the pane class changes. When a pane arrives, `arrive` comes off after 1 s, once the arrival has played. If the pane's blocks are replaced in a later turn (a refresh), it comes off at once, so the arrival never replays.
  2. Wraps `wireBoard()`. When the new Today banner asks for the same picture as the one already decoded, the decoded `<img>` is put back in its place, with the new element's attributes copied over. `wireBoard` keeps its own handlers; the `still` it reads is never used for listeners.
- `patch_v863.py` adds both before the closing `</script></body>` and bumps the footer version. It is bound to an exact base: `a02c7b5e` (v8.61, test base) is listed. For v8.62, build with `V863_BASE=<v8.62 live sha256> V863_PREV=v8.62`.

Not changed: what each page shows, the record, counts, the count-up figures (whole numbers count up on a real tab change, as approved in v5.92), messages and the v8.62 code.

Known and not fixed here: opening Today still takes about 0.4–0.9 s of work in headless Chromium before it paints. The old page stays on screen until the new one is ready, so this reads as a short pause, not a flicker. Speeding up Today's draw is separate work.

## Checks

- `test_flicker863.cjs` (24 checks): six tabs open without anything drawn below 90 % opacity; the arrival is still marked and cleared after it plays; a Today refresh never fades and keeps the decoded banner picture; a refresh during an arrival stops it; Motion: Off runs no arrival animations; no page errors; no writes.
  - v8.63 on v8.61 base: desktop 24/24, phone 24/24.
  - v8.63 stacked on a local v8.62 build: desktop 24/24, phone 24/24. That build was made from Codex's `patch_v862.py` at `cd63c2d` with placeholder `example.invalid` email defaults, because the private defaults file is not in the repo. It is not a publishable candidate.
  - Same test on live v8.61: 9/24, with the 15 failures being exactly F1–F3. So the test catches the fault.
- Regression sweep (`toolchain/harness/sweep.js`): 21 tabs, 15 shown (the same 15 as live), 7 links, Back. Desktop and phone: 0 page errors, 0 console errors, 0 attempted writes, on both the v8.61 and the stacked v8.62 builds.
- `toolchain/check_page.py`: PASS. Secrets scan: 0.

## Candidate

- Test candidate on live v8.61 `a02c7b5eff2c525c69f8890dafc3f9da747da1f443e4f38a8f38360a2ed9cae7`: `d0c382a0cad62af1b1e5978f983acb9d71b58d2586d08aae65a5607ffd477c54`, 11,002,088 bytes.
- **Do not upload over v8.62.** v8.62 (Codex) goes first. Then whoever uploads runs `V863_BASE=<live sha> V863_PREV=v8.62 toolchain/build.sh v8.63 v8.63_flicker_DRAFT/patch_v863.py`, runs `test_flicker863.cjs` desktop and phone plus both sweeps, and uploads with `toolchain/upload_page.py`.
- Upload order is v8.62, then v8.63. Uploading the test candidate first would change the base that Codex's v8.62 patch asserts. Only do that if Codex withdraws v8.62.
