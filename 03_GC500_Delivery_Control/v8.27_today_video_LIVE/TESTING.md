# Reproducing the v8.27 checks

Author: Andrew Fisher

These tests contain synthetic fixtures and generic selectors only. They do not embed an operational snapshot, contact list, financial record, credential or private attachment. Supply the authorised private base/candidate HTML and keep all output reports and screenshots private: runtime browser evidence can contain operational information.

## CPU checks

Set `BASE` to the exact v8.26 private HTML and `PAGE` to the exact v8.27 private HTML identified by `SOURCE_MANIFEST.json`. Give `REPORT` a private output filename, separately for each command.

```sh
node tests/test_controller.cjs
python3 tests/test_build_boundaries.py
```

The controller test checks 53 cases: explicit Play under normal and reduced motion, cancellation, failure/timeout, stale generation handling, Retry source selection, and lifecycle disposal. The 14 build checks enforce the exact base and helper bytes, refuse stale/repeated application, protect existing output on failure, and prove that all bytes outside the one controller, two CSS declarations and two version labels are unchanged.

Both portable CPU tests were executed successfully against the final standard build.

## Read-only browser checks

Use the repository toolchain's Playwright dependencies and installed Chromium. Set `GC500_TOOLCHAIN` if the normal sibling `toolchain` directory is not available. Set `CHROMIUM_PATH`, `OUT` to a private directory and, optionally, `REPORT` to a private report filename. The local candidate tests require `PAGE`; the original/candidate reproduction also requires `BASE`. The harness serves the selected HTML locally in the existing application context, reads native shared state, and blocks operational writes. Each browser test closes its contexts.

Run each separately under the shared browser lock:

```sh
flock -n /tmp/gc500-browser.lock node tests/test_native_media.cjs
flock -n /tmp/gc500-browser.lock node tests/test_retry_recovery.cjs
flock -n /tmp/gc500-browser.lock node tests/test_media_lifecycle.cjs
```

The native-media test exercises actual time advancement, normal/Tools Off/OS-reduced Play, Stop, Today exit/return, WebM-to-MP4 fallback, phone width and all-source failure. The recovery test first makes both sources unavailable, restores network delivery and verifies that explicit Retry makes a fresh request and plays; it also covers loading timeout followed by recovery. The lifecycle test uses real media, with a simulated document-hidden event, redraw, folding and repeated Stop/Play. These test bodies are portable versions of the final privately executed 18/18, 6/6 and 11/11 checks; path resolution and dynamically discovered source URLs replace private workspace paths. All portable JavaScript sources passed syntax checks.

The actual-public smoke must be run only after the expected version is published. It does not substitute local HTML:

```sh
flock -n /tmp/gc500-browser.lock node tests/test_public_smoke.cjs
```

It asserts the served release label, real playback on desktop and phone emulation, Stop, Today return without autoplay and explicit Play with OS reduced motion. The portable smoke source passed 15/15 against the actual public v8.27 page without a local HTML override, with no page errors or operational writes. Chromium emulation is not a physical-device Safari test, and the automated evidence does not claim audible sound from a physical speaker.

## Existing Today and navigation coverage

The final standard build additionally passed Today desktop 23/23 and phone 18/18, selected-card motion 16/16 on each viewport, and both 22-tab, seven-link and Back navigation sweeps. This is a bounded affected-area gate; it is not a claim to have repeated every unchanged v8.26 suite. The byte-preservation proof supports reuse of those existing wider results.

Two setup corrections were needed in the private phone copy of the historical selected-card test. First, the test sends a real Tab event before scrolling/focusing the lights control: native progress landing intentionally continues correcting scroll until a keyboard, wheel or touch event, so programmatic focus alone was not realistic. The test then verifies focus and intersection before retaining the original Enter and Space assertions. Second, it brings the delivery gauge into view and waits for a nonempty computed transform before capturing geometry; the original offscreen phone capture could return an empty unpainted transform. Angle, text and transform equality assertions remain intact. No product source changed, and no original assertions were removed. The originals, intermediate failures and final private results are retained.

Historical selected-card test SHA256: `ca14b2fdc48ce72dc2feea89aa03660aebcfab553d9ff036de3591d8d87421ae`.
Private corrected test SHA256: `9ec1eb723a6dace5e5c55c396963e2b4fd003b8dae160b4f2d689fd41d6a4d5d`.
