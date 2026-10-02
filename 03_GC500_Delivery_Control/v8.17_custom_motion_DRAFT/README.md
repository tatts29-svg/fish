# GC500 custom motion preview

Author: Andrew Fisher

State: **PARKED — VISUAL DIRECTION REJECTED, 3 Oct 2026. Do not integrate or publish.**

Andrew: “the whole look. don't worry about this at the moment”. Animation work is paused until he reopens it. Files below are historical preview evidence only; they never went live.

Andrew opened his Lottie Creator and asked whether original animations could help throughout GC500. This package proves three editable examples in the existing Map Explorer colours:

- A selected portable building with a brief orange highlight.
- The same building with a delivery-confirmation badge. Installation stages remain separate.
- A photo-saved badge, proposed only after both the individual photograph and its reference association are durable.

Open `GC500-motion-preview.html` in a browser. It is self-contained and has a Replay motion button, still view and downloads for each original Creator project and standard Lottie file. In the existing Lottie Creator, choose **Import** and select a `*.project.json` file to edit its named layers and keyframes. The current project should be exported first if it needs preserving: Import replaces the editor document.

The user's open editor and its local storage were not touched. The native projects were checked in an isolated browser using a local copy of the actual Creator source, then compared with its actual exporter. No native WebMCP connection to the user's open tab is claimed.

## Checks

The included browser evidence covers 1280 px desktop and 390 px phone views, one-play stopping, replay, still view, system reduced motion, offscreen stopping, all three project downloads, 44 px example containment and exact Creator import/export layers. Captured preview page/console errors: zero. Preview HTTP requests: zero. Static inspection independently verified native and standard Lottie round trips and transparency-only removal. Root inspected the final desktop and phone captures.

`check_fallback.cjs` also checks a simulated player failure and the visibility-change handler. These are local component checks, not the full GC500 standing suites or physical-phone performance measurements. Current production integration is out of scope.

## Integration direction

Use this as a shared visual reference for map pins, relevant drawer sections and acknowledgement feedback. `PLACEMENTS.md` names the real source hooks and their limits. Keep simple map pulses and drawer disclosures in SVG/CSS. Do not introduce one Lottie player per map marker. The preview's 168 kB light SVG runtime is a demonstration dependency, not a proposed mandatory GC500 download.

All three transparent animation files total 46,584 bytes before compression. Each runs once for 1.2 seconds, with a held final state. Reduced motion uses the finished icon. No external images, fonts, tracking or record writes are used. Do not delay actions or navigation to play an animation; never infer completion from a photo.

The eight-family equipment set and real-page marker mock-up remain the next integration work. This three-example study does not claim the entire icon set or live map redesign is done. Showcase vehicles, track and cameras are unaffected.

## Reproduce

Run `node assets/generate-assets.cjs /path/to/creator/app.js`, then `python3 build_preview.py`. The source hash is recorded in `assets/manifest.json`. See `assets/README.md` for the export pipeline. Runtime: lottie-web 5.13.0 light SVG build, with its MIT licence in `vendor/LOTTIE_LICENSE.md`.

Run `NODE_PATH=/path/to/toolchain/node_modules node check_preview.cjs` with Chromium and the isolated Creator copy available at the path shown in the script. The test browser fulfils local files at a test URL and aborts other requests; it never fetches or writes the live GC500 service. Screenshots stay in `/workspace/gc500-motion-preview/`. A separate MP4 is a deterministic frame capture of the same preview, not a real-device frame-rate recording.
