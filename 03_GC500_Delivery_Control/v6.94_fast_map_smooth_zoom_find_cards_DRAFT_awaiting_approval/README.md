# v6.94 — the fast map: smooth zoom, find with ease, cards (DRAFT, awaiting Andrew's yes)

Author: Andrew Fisher · 27 Sep 2026

**Nothing here is live.**

- **Build:** v6.90 + `patch_v693.py` + `patch_v694.py` (with `wow694.js`), then `patch_v696.py`, which makes Maps open on Satellite · 3D and leaves this map on the Satellite · pins button.
- **Deploying:** the machine set must also carry `map/lap.json` (in `machine_map/`). The page fetches it from `/w/<token>/map/` when the map is first idle.

## What Andrew asked

- "wow wow factor" (first pass: 3D city, lapping car, day/night).
- Then: "why do we have the car. Looks silly".
- Then the brief this version answers: **"When i say wow wow. Its using it feel. Smooth. Easy. No lag.. its the zooming.
  Its finding things with ease. Its fast. No lagg. No freeze."**

The 3D city, the buildings, the lighting presets, the fly-in and the 3D site models are all gone. They cost frames and told
nobody anything about the job. What is left is built to be quick.

## What it does

- **Zoom and pan:**
  - no cooperative-gesture lock and no label fade;
  - one world copy;
  - pixel ratio capped at 2;
  - no antialiasing on touch screens;
  - map clutter (POIs, transit, airport, house numbers) switched off.
- **Find:** one box over the map.
  - Type `GN0` and suggestions drop straight away: exact reference, then prefix, then name, then trade, up to 8.
  - Use the arrow keys or a tap, then Enter.
  - The map glides there (a short ease if it's close, a flight if it's far, a jump if the device asks for reduced motion) and the pin pulses for 4 s.
  - The card opens with the master-plan close-up, trade and status, plus an Open button.
- **Hover card (desktop):** the same card on hover. A click still opens the drawer.
- **Colour:** by trade (default) or "Where it is": on site, in transit, not on site, or no delivery record.
- **Circuit outline:** in Coates orange, under the pins.
- **Warm start:** the map key, the map library and the circuit outline load during idle time after the page opens, so the first press on the map doesn't wait for them.

## Measured (test browser, software graphics, no GPU; `mapperf2.js`)

| | v6.93 | v6.94 fast |
|---|---|---|
| Reopen the map (canvas shown) | 74 ms | 85 ms |
| Script time leaving / coming back | 276 / 72 ms | 142 / 42 ms |
| Zoom burst (24 wheel notches): freezes over 50 ms | run 1: 4 (max 68 ms) · run 2: 0 · run 3: 1 (59 ms) | run 1: 1 (564 ms) · run 2: 0 · run 3: 0 |
| Find GN04: type, Enter, arrive | no find box | 1.57 s including the glide |

One run had a single 564 ms stall that didn't come back in the two reruns (both 0). The first open time is mostly
tile download through the test harness, so it isn't a fair device number. A phone with a GPU will be quicker than this
test browser on every line. Numbers on Andrew's own phone are still to be taken.

## Files

- `wow694.js`, `patch_v694.py`: the fast map.
- `machine_map/lap.json`: the circuit outline.
- `mapperf2.js`: the stopwatch.
- `fast694.js`: the screenshots.
- `lh2.js`, `curlf.js`: the test harness (live record, GET only).
- `screens/`: find suggestions and the card.
