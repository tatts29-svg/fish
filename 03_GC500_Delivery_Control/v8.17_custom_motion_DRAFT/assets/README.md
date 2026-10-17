# GC500 custom motion assets — preview

Author: Andrew Fisher

Three original vector animations use the current Map Explorer colours: orange `#FF6A13`, warm dark `#1A1614`, off-white `#F3EFE9` and completion green `#39E07A`. Each is 128 × 128, 30 fps and 1.2 seconds. The final state is held from 0.74 seconds. They are designed for 44 px presentation with a nearby text label.

| Asset | Meaning | Motion |
|---|---|---|
| `equipment-selected` | This portable building is selected | A 4 px settle and restrained orange underline |
| `equipment-complete` | The relevant completion update is acknowledged | The same building with a green tick badge |
| `photo-saved` | This photo and its reference association have both saved | Camera with the same green tick badge |

These are preview assets. They are not connected to live equipment or photo records. Completion and photo success must follow the actual service acknowledgement. Selection does not imply delivery or completion; a photograph queued locally does not imply a successful save.

Each asset has four forms:

- `*.project.json`: editable native Lottie Creator project, using named rectangle and ellipse layers. Import with the Creator's Import control. Background colour is retained for editing.
- `*.creator-export.json`: the unmodified output of the actual Creator exporter, including its opaque `Canvas background` layer.
- `*.json` without either suffix: transparent standard Lottie export. Exactly the final `Canvas background` layer has been removed; all other fields are retained.
- `*.svg`: the final state as a transparent static vector for reduced motion or fallback.

There are no linked images, fonts or external assets. Tick strokes are rotated rounded rectangles, so the Creator can edit every visible part. Linear keyframes keep timing equivalent between the Creator's SVG renderer and its standard Lottie export. The portable building is one equipment example; other equipment should receive its own accurate glyph before integration.

Use the transparent export with `loop: false`. Lottie stores the animation timeline, while looping is a player setting. The Creator initially enables looping; switch Loop off when reviewing a single play. Hold the last frame after playing. When reduced motion is requested, display the matching SVG immediately and do not autoplay. Give the existing nearby status text the semantic meaning; decorative motion should be hidden from assistive technology.

To regenerate, run from this directory:

```sh
node generate-assets.cjs /path/to/lottie-creator/app.js
```

The generator reads the Creator's actual pure export functions from that source file, runs them without a browser, writes the untouched export, then removes its single named background layer. `manifest.json` records the source SHA-256. This avoids maintaining a separate approximation of the exporter. Importing `*.project.json` is the preferred editing route; exporting an edited project again requires the same background removal for transparent use.

Every artifact carries the author attribution in its name, metadata or SVG description. Generation alone is not a browser visual check; the enclosing preview's evidence records the actual Creator import and player review.
