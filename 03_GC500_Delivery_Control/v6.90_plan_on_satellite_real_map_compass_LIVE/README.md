# v6.90: Plan on satellite as a real map, with an N/E/S/W compass (DRAFT, awaiting Andrew's yes)

Author: Andrew Fisher
Asked 27 Sep 2026: "Rotating of map can we fix and not rotate the map itself … look at different angles, ensure we
have north east south west. It's still very clunky and laggy … smooth fast no blurry" — "Sorry, under Plan on satellite".

**Live since 27 Sep 2026, 12:43 AEST** (see RELEASE.md).
manifest and add this `explorer/` folder over the live files (explorer.js, index.html, README.md).

## What changes

| | Now (live) | New |
|---|---|---|
| Turning the view | The drawing sheet spins as a tilted rectangle, with black around it. The legend and title strip swing into view. | The satellite photo is the map and fills the frame at any angle; the frame never moves. The plan sits on top of it. |
| The Surfers inset | Stays in its box at the lower right of the sheet, over the wrong ground | Drawn at its true place north of Surfers Paradise, continuing the main plan. Search, rings and `?find=` go there too. |
| Photograph | Mapbox satellite; soft and blurred up close | Google's 2026 Vexcel aerial, to zoom 21 (see `screens/imagery_mapbox_vs_google.png`). Google's logo and credit are shown, and Mapbox takes over if Google fails. |
| Feel | Zoom jumps in steps and a drag stops dead | Zoom glides about the pointer, and a flick coasts to a stop, like Google Maps |
| Tile joins | Dark hairlines where satellite tiles met, when turned | One seamless photograph |
| Compass | A small rose, plus ⟲ ⟳ buttons | A dial showing N, E, S and W where they really are, with a "Facing …" label. Press a letter to face that way (a 0.4 s glide). Drag the ring to turn freely. |
| Lag | Every frame drew the satellite with the most expensive smoothing | Fast smoothing while moving, full quality 160 ms after you stop. The test browser's drawing work for a wheel burst fell from about 7.0 s to 0.23 s. |
| Blur while moving | The canvas dropped to 1 pixel per point during gestures | Keeps full sharpness while moving |
| Satellite downloads | Only inside the sheet | The view, out to about 600 m round the plan |

Original plan (the printed sheet) is unchanged.

## Checks (test browser, live files served in place, GET only)
- 46 of 46 existing acceptance checks pass (imagery-failure tests now fail Google and Mapbox together): load, modes, deep links, `?find=`, no black areas, phone layout, imagery
  failures and retry, loading failures.
- 13 of 13 new checks pass, including Google imagery with its credit, the zoom glide landing exactly, and a flick coasting:
  - P68 (printed in the inset) lands at its true place.
  - N, E, S and W each face correctly.
  - A quarter-turn drag of the ring turns 90°.
  - As drawn returns to the sheet's orientation.
  - Facing north, the whole view is photograph.
  - Original plan still turns as a sheet.
  - No page errors.
- Frame gaps in the test browser (software graphics, no GPU, so pessimistic), desktop:
  - wheel zoom: median 300 → 100 ms;
  - drag: median 167 → 67 ms;
  - turn: median 150 → 83 ms.
- A real GPU is far faster than these numbers.
- The only long stalls in the test browser happen while it first downloads pictures. The live version stalls the same way.

## Master drawing map work (parked, not live)
The Map tab's own master-drawing map was reworked first, before Andrew said he meant Plan on satellite. It includes:
- a compass;
- sharp tiles;
- 3.5x less main-thread work while zooming.

It is kept in `../map_engine_master_drawing_PARKED/` for a later decision.
