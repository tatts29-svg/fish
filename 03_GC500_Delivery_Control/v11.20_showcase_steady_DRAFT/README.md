# v11.20 — the Showcase opens at once and builds the 3D circuit within the device's means

Author: Andrew Fisher. Built on live v11.19 `a7460b9e…`. Status in STATUS.md.

Andrew, 22 Oct 2026: "can we look at the showcase. this still freezes up a lot".

## What was wrong (measured on the live v11.19 build, read-only probes)

The scenes are not the problem any more (v11.10): on the flat circuit the Showcase opens in one 1.6 s task at 4× CPU and
then costs 0.1–0.25 s a scene. The 3D circuit backdrop is the problem, and it is the never-chosen default on every device:

| 3D day backdrop | this machine, unthrottled | 4× CPU |
|---|---|---|
| `GC3D.mount()` run inside `showOpen()` before the dialog can paint (shaders, 174k-triangle car, buildings, kerbs, grandstands) | 3.2 s | 15.8 s |
| static detail, three more blocks after it (track detail, vegetation, architecture) | 1.5 + 1.2 + 0.5 s | 7.2 + 5.5 + 2.9 s |
| JS heap while it runs | 497 MB | 497 MB |
| the same Showcase on the flat circuit | 0.4 s open, 98 MB | 1.6 s open, 98 MB |

So a laptop froze for 3 s with the dialog not yet drawn, then stuttered three more times for 0.5–1.5 s; a phone, several
times slower, froze for 10–15 s and then ran a 500 MB tab. The frame loop itself is GPU work: in the headless harness that
is software rendering at 7–18 s a frame, which is the harness, not a device with a GPU.

## What `patch_v1120.py` does

`steady1120.js`, one module appended before the page's last `</body>`, and three exact text edits:

1. **The dialog paints first.** The first 3D mount of an opening is deferred 150 ms past `showOpen()`, so the countdown, the
   words and the flat circuit are on screen before the heavy build. `showOpen()` now returns in 1.6 s at 4× CPU (was 15.8 s);
   0.36 s on the phone emulation.
2. **A budget, read off the device.** The base mount is timed. Past 1.5 s, the grandstands are left out of that mount and the
   static detail stages are not attempted, through the scene's own limited-by-device path (`fullLapReport788` says
   `detail skipped: the base circuit took N s…`). The circuit, car, city and kerbs stay. Within budget nothing changes.
3. **A phone that never chose a backdrop opens on the flat circuit.** A phone that chose 3D keeps it; a laptop keeps the 3D
   circuit at night as before (the project manager's default of 26 Sep 2026). `showBackPref` carries the rule.
4. **The scene warm-up is paced**: one scene per 400 ms, first at 1.5 s (the v11.10 module ran one per 40 ms from 250 ms,
   which stacked 0.1–1 s holds behind the mount).
5. Footer v11.19 → v11.20.

## Measured on the v11.20 build (same probes)

| 3D day backdrop, 4× CPU | v11.19 | v11.20 |
|---|---|---|
| `showOpen()` before the dialog paints | 15.8 s | 1.6 s (0.26 s of it the backdrop) |
| geometry building on the main thread, total | 31 s in four blocks | one block after the dialog (12.7 s; less with the stands left out) |
| static detail installers run | 3 | 0 on this device |
| JS heap | 497 MB | 290 MB |
| long tasks over 1 s in the first minute, not counting software-GL frames | 7 | 2 |

The one block that remains is the base circuit; it is the cost of the 3D at all, and the Backdrop control's flat circuit is
a click away for anyone who would rather not pay it.

## Checks

`tests/test_v1120.cjs`: desktop (4× CPU) and phone — footer; module and pacing text; defaults (desktop 3D night, phone flat);
a chosen 3D kept; `showOpen()` under 2 s with the dialog shown and no scene mounted yet; the mount lands afterwards; budget
and detail/stands decisions reported; no static installer runs when over budget; warm fills ≥ 350 ms apart; the deck on
screen; close clears the deferred mount; record unchanged; 0 errors; 0 writes. Sweeps desktop + phone 25 tabs / 7 hashes /
Back. Toolchain PASS all checks. Results in STATUS.md and `evidence/`.
