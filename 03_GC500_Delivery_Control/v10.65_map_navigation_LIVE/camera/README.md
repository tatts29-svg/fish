# Manual zoom takes over a reference flight

Author: Andrew Fisher

A wheel, zoom button or double-tap during a reference flight started a second animation without cancelling the
flight. Both animation loops wrote the same camera position and zoom. This was reproduced on the actual v10.64
map: `gotoAnim887` and `zAnim` were simultaneously active immediately after the manual zoom.

`patch_camera1065.py` cancels the reference-flight animation before the existing `zoomBy` logic. It leaves an
existing wheel zoom goal intact so repeated wheel events still accumulate, and retains the selected reference.
The existing rotation cancellation already works and remains unchanged. The transformer refuses a repeated patch
or an explorer source lacking the v10.64 tile recovery fix.

```sh
python3 patch_camera1065.py /private/explorer.js /private/patched-explorer.js
```

`test_camera1065.cjs` opens the actual map through the shared read-only harness, reproduces the original competing
animations, then installs the exact transformed `zoomBy` in that browser frame for focused checks. Nine checks
pass: original reproduction, immediate takeover, accumulated wheel goal and final landing, selection retention,
rotation cancelling a reference flight, zoom cancelling rotation, reduced-motion takeover, and no page errors.
The browser made no record writes. This is focused function-level browser evidence; complete asset integration,
cache pins, mobile sweeps and live publication remain part of the parent release.

Set `PAGE` to the v10.64 page, `EXPLORER_SOURCE` to its verified explorer script, and optionally `REPORT` to a
private output path. Run through the shared browser lock:

```sh
flock /tmp/gc500-browser.lock node test_camera1065.cjs
```

The committed evidence contains only check names, animation flags and counts.
