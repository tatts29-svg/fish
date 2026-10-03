# The Coates Way machine — v6.99 (staged draft, 27 Sep 2026)

Author: Andrew Fisher · Coates Industrial Solutions · GC500 2026

Staged only. Nothing has been deployed, uploaded, registered or committed. Built on v6.92 (`stage3/machine`, untouched). The
before-copy is `stage6/machine_before`; the fixed set is `stage6/machine`.

## What Andrew asked for (27 Sep 2026)

"The machine needs attention it still lags and clunky. U also have a wall in the middle of the car. Needs to function nice. No lag. And
full view always nothing blocking when u look in every angle."

## How it was measured

- Everything runs in headless Chromium with SwiftShader (software graphics, no GPU), on a 4-core container shared with other sessions
  (load average 7 to 34 during the runs). Frame rates here are a fraction of a real laptop's. They are only compared before against after,
  on the same harness, interleaved. The numbers that do not depend on the machine's speed (draw calls, triangles, shadow-map draws, heap
  growth, audio nodes, texture uploads, shader programs) carry the comparison.
- Harness: `stage6/harness/` (`sweep.js`, `profile.js`, `wallcheck.js`, `diag_alloc.js`, `shots.js`, `lib.js`). Raw results: `stage6/results/`.

## 1. The wall in the middle of the car (and Andrew's "plate that hangs out")

These are the same thing. There were two causes.

**Cause 1: the two carbon door cards were built across the car instead of along the doors** (`car-cockpit.js`).
- The cockpit's `box()` takes its sizes in the order along the car, height, across the car. The door cards were given `box(.018, .36, 1.26, …)`: each was 18 mm along the car and 1.26 m across it.
- Standing at ±0.655 m, the two cards made one black carbon slab straight through the car at hip height, 2.57 m wide (z −1.285 to +1.285 m) and 0.36 m tall.
- The body is only 2.14 m wide (±1.07 m), so the slab stuck out 0.215 m through each flank. It shows in the before shots as the black panel cutting the "26 Coates" livery behind the front wheel.
- **Fix:** `box(1.26, .36, .018, …)`. Each card is now 1.26 m along its door and 18 mm thick, inside the door, as a door card is.

**Cause 2: the light shafts over the cell stood through the car** (`pit-garage.js`).
- Eight additive light planes, 3.2 m wide, ran from 0.2 m to 10.6 m high. The planes at x = 2.5 m cut straight through the rear half of the car.
- They read as a pale sheet across the body: in the before sweep they lay over up to 100 % of the car's pixels.
- **Fix:** the shafts now stop at 2.0 m, above the roof (1.34 m). Each lamp's shaft is its own unit, which the clear view takes out of the way when it comes between the camera and the car from above.

| Measure (`harness/wallcheck.js`) | Before | After |
|---|---:|---:|
| Door card, along the car × across the car | 0.018 m × 1.26 m | 1.26 m × 0.018 m |
| The two cards together span, across the car | z -1.285 to +1.285 m (2.57 m) | z ±0.664 m (inside the doors) |
| The body's own width | z ±1.07 m | z ±1.07 m |
| Out through each flank | 0.215 m | none |
| Pixels where a door card is the nearest surface (640 × 400): first view / V8 view / from above | 2,032 / 2,990 / 1,824 | 241 / 2,655 / 0 |
| Same, orbit from the front / near side / rear / far side | 1,803 / 125 / 994 / 110 | 69 / 3 / 0 / 3 |
| Points of the hall's light shafts inside the car's box (sampled ≤ 10 cm apart) | 438 | 0 |

- The door-card pixels still counted after the fix are the card where it belongs. In the car view it shows inside the near door through the cutaway (the cutaway is on by default). In the V8 view the body panels are off and it is part of the cockpit on show.
- Before, the cards stood out of the flanks and showed from outside the body in every view.
- The rollers and the chocks and tie-downs (`dyno-rollers`, `car-fittings`) are inside the car's box in both builds: they are what the car sits on and is tied to.

Shots, same angles before and after (`stage6/shots/`):
- `before_wall_1_first_view.jpg` / `after_wall_1_first_view.jpg`: the livery cut by the slab, then whole.
- `before_wall_2_v8_view.jpg` / `after_wall_2_v8_view.jpg`.
- `before_wall_3_from_above.jpg` / `after_wall_3_from_above.jpg`.
- `before_orbit_high_az090.jpg` / `after_orbit_high_az090.jpg`: the bar across the cabin, then gone.


## 2. Full view from every angle

### What was in the way

The before sweep found these between the camera and the car:
- the dyno console and its stack light (68 % of the car hidden, from 8 m at 270°, 25° up);
- the hall's merged garage meshes: all of the car hidden from 18 m on the near side, where the camera stands beside the transporter. In v6.92 the whole hall was one mesh per material, so the sweep can only name it "garage";
- the telemetry station and its screens;
- the crew, and the forklift and its load;
- the dyno fan;
- the light shafts (a sheet over up to the whole car);
- the hall's other merged meshes, low round the nose and the far side (up to 31.6 % of the car, from 8 m at 280°, 5° up).

The sample never took the camera above 7.3 m, but v6.92 let it climb to 11.7 m. That is up among the portal beams (11.15 m), the high-bay lamps (10.8 m), the extraction rails (9.85 m), the crane's runway (about 9 m) and the banners (8.2 m), all of which then stand between the lens and the car. These heights come from the source.

The old fade (v5.85) fired four rays at the middle of the car five times a second, so it missed whatever stood in front of the nose, the tail or the roof. It left what it hit as a 13 % ghost.

### What it does now

- **The clear view** (`view-fx.js` `buildClearView`, wired in `car-app.js`):
  - The hall is now built in named units: each machine, the transporter, the mezzanine, the console, the desk, each rack, each banner, each lamp's shaft, each person, the forklift and the telemetry station (`pit-garage.js`, `pit-machinery.js`).
  - Every frame, each unit's box, grown by 0.32 m, is tested against the lines from the camera to 326 points over the whole car's box (its nose, tail, roof and sides, not just its middle). Any unit those lines pass through fades out in 0.12 s. It is then taken off the camera's layer, so it is not drawn, casts no shadow and cannot be picked.
  - It comes back in 0.25 s once it is clear.
  - The building's shell, the floor, the roller door, the wall fans and beacons, and everything the car stands on are never taken away, so the garage still reads as a shut, working hall.
  - A crew member working at the car during a wheel service stays in view, and so does the driver next to his car.
- **The camera stays under the roof steel:** at most 8 m up (was 11.7 m), with the target at most 6 m up. From 8 m it still looks down on the whole car.
- **The cockpit is unchanged:** exactly the driver's eyes. The clear view is off there, so nothing is taken out of what the driver sees (checks V3 and V4: 0 units hidden, eye distance 0.000 m).

### The sweep, before and after

- 50 views, run by the same harness (`harness/sweep.js`) on both builds: a 30° ring at 5°, 25° and 55° up, 8 m out, plus the 14 views that were worst before (8 m low round the far side and the nose, and 18 m at the four sides and two quarters).
- Each view is drawn three times at 320 × 200: the car alone; everything with the car in white; and the same with the see-through sheets.
- The rollers the rear wheels sit in, the chocks and tie-downs and the painted floor shadow touch the car. They are not taken away, so they are shown separately.
- The coordinator asked for this sample instead of the full 216-view grid, because the machine was overloaded.

| | Before | After |
|---|---:|---:|
| Views measured | 50 | 50 |
| Views with 100 % of the car clear (not counting what it rests on) | 32 | 50 |
| Mean share of the car clear (not counting what it rests on) | 90.38 % | 100.00 % |
| Worst view (not counting what it rests on) | 0.00 % | 100.00 % |
| Views with 100 % clear, counting rollers and chocks too | 5 | 7 |
| Mean / worst, counting rollers and chocks too | 90.03 % / 0.00 % | 99.61 % / 96.87 % |
| Views where a see-through sheet (light shaft, ghost) lies over the car | 49 | 0 |
| Largest share of the car under a see-through sheet | 100.0 % | 0.0 % |

Per view (clear share, not counting what the car rests on; blockers listed; the share under a see-through sheet):

| Distance | Elevation | Azimuth | Before: clear (ex. rests on) | Before: in the way | Before: sheet over car | After: clear (ex. rests on) | After: in the way | After: sheet |
|---:|---:|---:|---:|---|---:|---:|---|---:|
| 8 m | 5° | 0° | 100.00 % | — | 96.7 % | 100.00 % | — | 0.0 % |
| 8 m | 5° | 30° | 100.00 % | — | 8.0 % | 100.00 % | — | 0.0 % |
| 8 m | 5° | 60° | 100.00 % | — | 1.1 % | 100.00 % | — | 0.0 % |
| 8 m | 5° | 90° | 100.00 % | — | 1.4 % | 100.00 % | — | 0.0 % |
| 8 m | 5° | 120° | 100.00 % | — | 6.3 % | 100.00 % | — | 0.0 % |
| 8 m | 5° | 150° | 100.00 % | — | 58.6 % | 100.00 % | — | 0.0 % |
| 8 m | 5° | 180° | 100.00 % | — | 22.5 % | 100.00 % | — | 0.0 % |
| 8 m | 5° | 210° | 100.00 % | — | 16.8 % | 100.00 % | — | 0.0 % |
| 8 m | 5° | 240° | 99.31 % | garage [overlay] 0.5%, garage 0.2% | 5.9 % | 100.00 % | — | 0.0 % |
| 8 m | 5° | 270° | 69.92 % | garage [overlay] 19.7%, garage 8.9%, Crew figure, engine technician 1.4% | 12.6 % | 100.00 % | — | 0.0 % |
| 8 m | 5° | 300° | 50.36 % | Telemetry screens 48.1%, garage [overlay] 1.3%, garage 0.3% | 27.1 % | 100.00 % | — | 0.0 % |
| 8 m | 5° | 330° | 93.22 % | Crew figure, crew lead 6.8% | 6.5 % | 100.00 % | — | 0.0 % |
| 8 m | 25° | 0° | 100.00 % | — | 100.0 % | 100.00 % | — | 0.0 % |
| 8 m | 25° | 30° | 100.00 % | — | 43.4 % | 100.00 % | — | 0.0 % |
| 8 m | 25° | 60° | 100.00 % | — | 6.6 % | 100.00 % | — | 0.0 % |
| 8 m | 25° | 90° | 100.00 % | — | 9.9 % | 100.00 % | — | 0.0 % |
| 8 m | 25° | 120° | 100.00 % | — | 23.3 % | 100.00 % | — | 0.0 % |
| 8 m | 25° | 150° | 100.00 % | — | 63.0 % | 100.00 % | — | 0.0 % |
| 8 m | 25° | 180° | 100.00 % | — | 87.8 % | 100.00 % | — | 0.0 % |
| 8 m | 25° | 210° | 100.00 % | — | 60.5 % | 100.00 % | — | 0.0 % |
| 8 m | 25° | 240° | 99.41 % | garage [overlay] 0.6% | 22.4 % | 100.00 % | — | 0.0 % |
| 8 m | 25° | 270° | 32.17 % | dyno-console 64.7%, stack-light 2.0%, garage 1.1% | 12.2 % | 100.00 % | — | 0.0 % |
| 8 m | 25° | 300° | 98.75 % | garage [overlay] 1.2% | 3.8 % | 100.00 % | — | 0.0 % |
| 8 m | 25° | 330° | 100.00 % | — | 36.1 % | 100.00 % | — | 0.0 % |
| 8 m | 55° | 0° | 100.00 % | — | 100.0 % | 100.00 % | — | 0.0 % |
| 8 m | 55° | 30° | 100.00 % | — | 35.6 % | 100.00 % | — | 0.0 % |
| 8 m | 55° | 60° | 100.00 % | — | 12.6 % | 100.00 % | — | 0.0 % |
| 8 m | 55° | 90° | 100.00 % | — | 18.2 % | 100.00 % | — | 0.0 % |
| 8 m | 55° | 120° | 100.00 % | — | 30.9 % | 100.00 % | — | 0.0 % |
| 8 m | 55° | 150° | 100.00 % | — | 82.3 % | 100.00 % | — | 0.0 % |
| 8 m | 55° | 180° | 100.00 % | — | 100.0 % | 100.00 % | — | 0.0 % |
| 8 m | 55° | 210° | 100.00 % | — | 80.4 % | 100.00 % | — | 0.0 % |
| 8 m | 55° | 240° | 100.00 % | — | 30.7 % | 100.00 % | — | 0.0 % |
| 8 m | 55° | 270° | 100.00 % | — | 18.0 % | 100.00 % | — | 0.0 % |
| 8 m | 55° | 300° | 100.00 % | — | 11.2 % | 100.00 % | — | 0.0 % |
| 8 m | 55° | 330° | 100.00 % | — | 31.6 % | 100.00 % | — | 0.0 % |
| 8 m | 5° | 10° | 79.17 % | garage 20.8% | 41.7 % | 100.00 % | — | 0.0 % |
| 8 m | 5° | 160° | 97.63 % | Crew figure, pit technician 2.4% | 21.9 % | 100.00 % | — | 0.0 % |
| 8 m | 5° | 250° | 86.54 % | garage [overlay] 9.0%, garage 4.5% | 2.1 % | 100.00 % | — | 0.0 % |
| 8 m | 5° | 260° | 71.62 % | garage [overlay] 19.5%, garage 8.9% | 1.1 % | 100.00 % | — | 0.0 % |
| 8 m | 5° | 280° | 68.09 % | garage [overlay] 20.9%, garage 10.7%, Telemetry station 0.4% | 16.3 % | 100.00 % | — | 0.0 % |
| 8 m | 5° | 290° | 61.13 % | Telemetry screens 16.8%, garage [overlay] 10.8%, garage 6.4%, Crew figure, telemetry operator 4.9% | 28.8 % | 100.00 % | — | 0.0 % |
| 8 m | 5° | 310° | 77.12 % | Telemetry station 18.8%, Crew figure, crew lead 2.5%, Crew figure, engine technician 0.9%, Crew lead tablet 0.7% | 12.6 % | 100.00 % | — | 0.0 % |
| 8 m | 5° | 350° | 74.43 % | garage 21.8%, Crew figure, safety control officer 3.7% | 41.3 % | 100.00 % | — | 0.0 % |
| 18 m | 5° | 0° | 95.62 % | garage 4.4% | 80.5 % | 100.00 % | — | 0.0 % |
| 18 m | 5° | 90° | 0.00 % | garage 100.0% | 0.0 % | 100.00 % | — | 0.0 % |
| 18 m | 5° | 180° | 100.00 % | — | 25.5 % | 100.00 % | — | 0.0 % |
| 18 m | 5° | 270° | 64.40 % | garage [overlay] 15.9%, Forklift body 6.3%, Forklift mast channels 4.3%, garage 3.6%, Crew figure, engine technician 3.3 | 10.3 % | 100.00 % | — | 0.0 % |
| 18 m | 25° | 45° | 100.00 % | — | 20.8 % | 100.00 % | — | 0.0 % |
| 18 m | 25° | 225° | 100.00 % | — | 36.7 % | 100.00 % | — | 0.0 % |

The shots at the same eight bearings, before and after, are `before_orbit_az000…315.jpg` / `after_orbit_az000…315.jpg`, plus `*_orbit_low_az150_crew.jpg` and `*_orbit_high_az090.jpg`.

## 3. Lag and clunkiness

### What was costing the frame (v6.92, profiled)

- **The shadow map was drawn again every frame,** whether anything had moved or not. In the first view that pass was 807 of the frame's 1,763 draw calls and 756,671 of its 1,594,170 triangles (`harness/shadowpass.js`). 249 of its 815 casters were bolts, nuts and pins under 2 cm radius, worth a few texels of the map each.
- **The whole scene's matrices were recomposed every frame, twice:** a forced whole-scene update, then the renderer's own. That covered all 342 objects of the hall, although only the dyno fan, the service kit and the machinery move.
- **The old fade raycast the hall and the skinned crew triangle by triangle five times a second.** The CPU profile of the orbit shows `getVertexPosition` and `intersectTriangle`, and the before orbit had a 17-second task under this load.
- **Three screens were redrawn and re-uploaded on a timer** whether they had changed or were in view: the console six times a second (1024 × 576), the hall board three times a second and the crew's screens four times a second.
- **Other per-frame waste:**
  - 30-odd new Web Audio automation events every frame;
  - the dock's text rewritten six times a second, relaying the page out each time;
  - the cockpit display building its key string before its own throttle.
- **The picture was 1.5× the pixels on the Laptop rung** with only a one-off drop to 1×. The orbit's damping was per frame, so it felt twice as sticky at 30 fps as at 60.
- **The shaders were compiled one by one inside the first frame.** Any first fade needed a new see-through shader mid-orbit, which is a visible hitch on Windows.

### What changed

| Change | Where |
|---|---|
| **The shadow map is drawn only when something that casts moves.** The main pass alone, standing in the first view, is now 807 calls and 706,843 triangles (it was 956 and 837,499). A step change (view, part, cutaway, power path, service phase, the driver leaving his seat, something taken out of the way) redraws it at once. Smooth motion (steering, spread, pull, the turning driveline, the running V8, the door) redraws it at most 15 times a second. The signature is numbers in two fixed arrays, with no strings built per frame. | `car-app.js` `shadowStep` |
| **The crew no longer draw into the shadow map.** They keep their own drawn contact shadows, which is all they ever had outside the few metres the map covers. This means a person breathing or pacing beside the car no longer redraws it. | `car-app.js` |
| **Parts under 2 cm radius do not cast** (249 of the 815 casters; with the crew's 16, 550 are left). Each shadow pass, measured (`harness/shadowpass.js`, first view): 807 draw calls and 756,671 triangles before, **555 and 555,233 after**. The small parts still receive shadows. | `car-app.js` |
| **Parts smaller than a pixel on screen are not drawn.** In the car and V8 views, a car mesh whose on-screen radius is under 0.9 device pixels is skipped, and comes back over 1.1. The picked part is always drawn, and the cockpit draws everything. In the first view, 174 meshes (120,000 triangles) are under a pixel. | `car-app.js` `detailStep` |
| **The hall's matrices are worked out once.** 195 of its 342 objects are frozen, the scene root no longer forces a whole-scene update each frame, and only what moved is recomposed. | `pit-garage.js`, `car-app.js` |
| **The hall is merged per unit and material instead of one mesh per material,** so the camera's frustum can skip what is behind it and the clear view can take a unit away. | `pit-garage.js`, `pit-machinery.js` |
| **The clear view tests boxes, not triangles,** with no allocation in its loop. The see-through materials are made once and their shaders compiled at load. Check P4: 8 units faded mid-orbit and not one new shader program was built. | `view-fx.js` |
| **The screens are redrawn only when what they show changes and they are in view** (console, hall board, crew screens), and the cockpit display checks its throttle first. | `pit-garage.js`, `pit-machinery.js`, `crew.js`, `car-cockpit.js` |
| **The sound's targets are sent 20 times a second, not every frame** (each is a glide the audio thread runs itself). Audio nodes created with the V8 running fell from 1 to 0.2 a second. | `car-app.js` |
| **The dock's words are written only when they change.** | `car-app.js` |
| **Adaptive resolution:** if frames run long for 1.5 s the picture drops 15 % a step, to 60 % of the rung's ratio and never under 0.75. It steps back up after 5 s on time. Hysteresis stops it see-sawing: a step up that has to be undone within 3 s doubles the wait before the next, up to 60 s. | `car-app.js` `adapt` |
| **Orbit damping is per second, not per frame,** so it glides the same at 30 fps and 60 fps. | `car-app.js` |
| **+ and − glide over 0.18 s instead of jumping.** The glide is timed from the press, so the very next frame moves (check Z1). | `car-app.js` `zoom` |
| **The hall and the crew are built while the car's model downloads,** instead of after it arrives. The shaders are compiled before the first frame (`compileAsync`). | `car-app.js` |

### Measured before and after

**Desktop, 640 × 400, interleaved runs of `harness/profile.js`.**
- Before: runs 1 and 2 at load 7 to 25. After: runs 2 and 3 on the final code at load 25 to 34.
- Draw calls and triangles are per rendered frame, shadow pass included.
- The frame times and load times in this table swing with the machine's load, so the paired race below is the fair comparison for those.

| Metric | Before (median) | After (median) | Before runs | After runs |
|---|---:|---:|---|---|
| Load: to load event (ms) | 3,348 | 24,809.5 | 2,591, 4,105 | 17,907, 31,712 |
| Load: to interactive (ms) | 42,686.5 | 108,867 | 33,114, 52,259 | 76,686, 141,048 |
| Load: to first view settled (ms) | 43,162.5 | 197,481.5 | 33,548, 52,777 | 178,627, 216,336 |
| Load: longest task (ms) | 21,907.5 | 93,778 | 18,245, 25,570 | 101,537, 86,019 |
| Load: long tasks (count) | 5 | 3.5 | 5, 5 | 3, 4 |
| Load: long tasks total (ms) | 37,876 | 179,121 | 29,504, 46,248 | 168,316, 189,926 |
| Shader programs after load | 87 | 86 | 87, 87 | 86, 86 |
| idle_car_view: frames/s | 0.2 | 0 | 0.2, 0.1 | 0, 0 |
| idle_car_view: long tasks | 4.5 | 1.5 | 4, 5 | 2, 1 |
| idle_car_view: draw calls median | 1,763 | 807 | 1,763, 1,763 | 807, 807 |
| idle_car_view: triangles median | 1,594,170 | 706,843 | 1,594,170, 1,594,170 | 706,843, 706,843 |
| idle_car_view: shadow-map renders/s | 0.2 | 0 | 0.2, 0.1 | 0, 0 |
| idle_car_view: heap growth (KB/s) | 59 | 38.5 | 47, 71 | 56, 21 |
| idle_car_view: audio nodes created/s | 0 | 0 | 0, 0 | 0, 0 |
| idle_car_view: texture uploads/s | 0.2 | 0 | 0.2, 0.1 | 0, 0 |
| v8_running_sound_on: frames/s | 0.2 | 0.1 | 0.2, 0.1 | 0.1, 0.1 |
| v8_running_sound_on: long tasks | 4.5 | 2 | 5, 4 | 2, 2 |
| v8_running_sound_on: draw calls median | 1,763 | 1,362 | 1,763, 1,763 | 1,362, 1,362 |
| v8_running_sound_on: triangles median | 1,594,170 | 1,262,076 | 1,594,170, 1,594,170 | 1,262,076, 1,262,076 |
| v8_running_sound_on: shadow-map renders/s | 0.2 | 0.1 | 0.2, 0.1 | 0.1, 0.1 |
| v8_running_sound_on: heap growth (KB/s) | 44.5 | 42 | 44, 45 | 46, 38 |
| v8_running_sound_on: audio nodes created/s | 1 | 0.2 | 1, 1 | 0.2, 0.2 |
| v8_running_sound_on: texture uploads/s | 0.3 | 0.2 | 0.4, 0.3 | 0.2, 0.2 |
| orbit_drag: frames/s | 0.1 | 0.1 | 0.1, 0.1 | 0.1, 0.1 |
| orbit_drag: long tasks | 57.5 | 20.5 | 57, 58 | 27, 14 |
| orbit_drag: draw calls median | 1,767 | 1,361 | 1,767, 1,767 | 1,356, 1,366 |
| orbit_drag: triangles median | 1,594,330 | 1,261,768 | 1,594,330, 1,594,330 | 1,261,300, 1,262,236 |
| orbit_drag: shadow-map renders/s | 0.1 | 0.1 | 0.1, 0.1 | 0.1, 0.1 |
| orbit_drag: heap growth (KB/s) | 37.5 | 25.5 | 40, 35 | 24, 27 |
| orbit_drag: audio nodes created/s | 0 | 0.1 | 0, 0 | 0.1, 0.1 |
| orbit_drag: texture uploads/s | 0.2 | 0.2 | 0.2, 0.2 | 0.2, 0.2 |
| cockpit_running: frames/s | 0.1 | 0 | 0.1, 0.1 | 0, 0 |
| cockpit_running: long tasks | 2 | 1.5 | 2, 2 | 2, 1 |
| cockpit_running: draw calls median | 1,680 | 1,448.5 | 1,679, 1,681 | 1,448, 1,449 |
| cockpit_running: triangles median | 1,656,891 | 1,452,415 | 1,651,817, 1,661,965 | 1,452,375, 1,452,455 |
| cockpit_running: shadow-map renders/s | 0.1 | 0 | 0.1, 0.1 | 0, 0 |
| cockpit_running: heap growth (KB/s) | 43.5 | 10.5 | 51, 36 | 19, 2 |
| cockpit_running: audio nodes created/s | 0 | 0 | 0, 0 | 0, 0 |
| cockpit_running: texture uploads/s | 0.1 | 0 | 0.1, 0.1 | 0, 0 |

**The paired race: the fair load and main-thread comparison.**
- Both builds are opened at the same moment, so the machine's load weighs on both alike.
- "Main-thread time per render" is the time inside `renderer.render`: the processor's side of a frame (culling, sorting, uniforms, draw-call submission). This is the part a real GPU does not take away.
- The frame rate here is set by SwiftShader, the software renderer, for both builds alike, so it cannot show the difference a graphics card would.

| Paired race (`harness/race.js`), both builds opened at once, 640 × 400, 60 s windows | Round 1 (load avg 17.8) | Round 2 (load avg 20.4) |
|---|---|---|
| Page load event, before → after | 9.7 s → 13.4 s | 4.8 s → 11.1 s |
| **Interactive** (car built, controls on), before → after | **110.9 s → 55.6 s** | **82.3 s → 42.1 s** |
| First view settled, before → after | 111.2 s → 104.0 s | 82.8 s → 84.2 s |
| **Main-thread time per render, idle** (median), before → after | **28.8 → 14.7 ms** | **38.4 → 18.9 ms** |
| **Main-thread time per render, V8 running** (median), before → after | **38 → 26.8 ms** | **32.3 → 24.1 ms** |
| Frames drawn in 60 s idle / V8 running, before → after | 7 / 6 → 7 / 6 | 5 / 7 → 5 / 6 |

Round 3 (load average 21.3; 30 s windows; long tasks recorded from the start of the page):

| Round 3 | Before | After |
|---|---:|---:|
| Interactive | 109.7 s | 50.7 s |
| First view settled | 110.6 s | 103.7 s |
| Long tasks while loading: count / total / longest | 5 / 100.6 s / 56.8 s | 5 / 96.6 s / 52.8 s |
| Main-thread time per render, idle / V8 running | 27.4 / 41.8 ms | 20.8 / 28.0 ms |
| Frames drawn in 30 s, idle / V8 running | 2 / 2 | 5 / 4 |

- The page's load event now comes later, because the hall and the crew are built inside it while the model downloads.
- The car is ready to use about twice as soon.

**Phone profile:**

| Phone, 390 × 844 at 3× (`profile.js … mobile`), one run each | Before | After |
|---|---:|---:|
| Interactive | 96.8 s | 42.0 s |
| Draw calls: idle / V8 running / orbit / cockpit | 1,757 / 1,757 / 1,751 / 1,571 | 774 / 1,329 / 1,306 / 1,326 |
| Triangles, idle | 1,593,106 | 691,975 |
| Shadow-map draws a second, idle (frames a second) | 0.1 (0.1) | 0 (0.2) |
| Long tasks during the orbit: count / total | 27 / 101.3 s | 29 / 49.9 s |

### How it should feel

- **Buttons:** a press closes any card and acts at once.
- **The steering wheel:** it turns under the finger in the same frame (unchanged).
- **Orbit:** it has no hitch from the old raycasts or from a first fade, and the same glide at any frame rate.
- **Zoom:** it moves on the next frame.

These are true in the code and in the checks. The feel itself has not been judged on a real GPU (see section 6).

## 4. Andrew's additions for build 1 (27 Sep, 21:00 AEST)

### Item 1: "The plate going through the middle of the car needs removing. It hangs out."

This is the same thing as the wall. It is the two door cards, fixed in section 1.

### Item 2: the driver gets out before the car comes apart, and back in after (`car-app.js`)

In the car and V8 views, **Explode** no longer takes the car apart around a man in his seat.

**Getting out:**
1. His door (`CAR-BODY-DOOR-L`, the far side) swings open on its front hinge over 0.6 s. The door card inside it, which is built as part of the cockpit, is hidden while the door is open.
2. The seated driver is swapped for a walking figure crouched where he sat. The figure is built by `crew.js` with the crew's own rig, gait and postures, in the Coates suit.
3. He ducks out through the doorway to the sill, stands up, and the door shuts behind him.
4. He walks the crew's own aisle round the cell, routed clear of the car, the tie-down anchors and the console (`crew.js` `route` with its obstacle boxes), to a safe spot behind the painted line at (3.0, −3.95). There he turns to face the car.
5. **The car only starts to come apart once he is past 2.2 m from its centre line.** The probe found the spread still 0 while he was at the sill, and it started as he passed (2.06, −3.19).

**Getting back in:**
1. When the car is fully back together, he walks back to the sill.
2. The door opens as he comes within 1.4 m.
3. He ducks in and becomes the seated driver again, and the door shuts.

**Other cases:**
- Explode pressed again while he is on his way out sends him back in.
- Going to the cockpit, or Reset, puts him straight back in his seat with the door shut. In the cockpit the camera is his eyes.
- The cockpit's own Explode (taking the wheel apart) is unchanged: he stays in the seat, and so does the camera.
- He is never taken out of view by the clear view while he is next to his car. He casts no shadow-map shadow, as with the crew.

**Checks:** X1, X2 and X3 in `_qa/test_v6_99.js`.

**Shots:** `after_driver_1_door_open.jpg` … `after_driver_10_seated_door_shut.jpg`.

### Item 5: the about cards close on any tap and never hang about (`car-app.js`, `car.css`)

- Any press anywhere closes an open card: on the card itself, on the car, on the floor, or the start of an orbit or a drag. A tap on something else with a card opens that one.
- A card also closes by itself once it has been up long enough to read: 4 s plus a quarter of a second a word, 14 s at most. It used to stay until Close or Escape.
- The card is smaller (at most 340 px wide) and see-through, and says "or tap anywhere" beside Close. On a phone it is held to a third of the screen.
- The information sheet (`#info`: Learn, Original cog, Controls ?) closes on a tap anywhere as well.

**Check:** C1 in `_qa/test_v6_99.js`.

**Shots:** `after_card_1_open.jpg` and `after_card_2_closed.jpg`.

## 5. Files

Everything is in `stage6/machine/`. These are **the files to add to (replace in) the machine set.** Nothing in `explorer/` or `poc3d/` is touched.

| File | Before → after (bytes) | What |
|---|---:|---|
| `car-app.js` | 106,549 → 125,772 | Clear view wiring, camera ceiling, shadow step, small-part skipping, adaptive resolution with hysteresis, damping per second, zoom glide, hall built during the download, shader warm-up, UI text only on change, sound targets 20 times a second, the driver's exit and entry, the cards closing on any tap, harness getters. |
| `car-cockpit.js` | 88,297 → 88,795 | **The wall:** door cards along the doors. Display key built after its throttle. |
| `car.css` | 24,200 → 24,683 | The about card: smaller, see-through, "or tap anywhere", a third of a phone screen. |
| `crew.js` | 138,344 → 138,525 | Crew screens redrawn only when they change. |
| `pit-garage.js` | 92,296 → 96,519 | The hall merged per unit and material, with units named for the clear view (`FIXED_UNITS`). Light shafts stop at 2 m. Static matrices frozen. Console redrawn only on change and in view. |
| `pit-machinery.js` | 35,739 → 37,380 | Machines merged per unit, units named. Hall board redrawn only in view. |
| `view-fx.js` | 5,471 → 10,672 | `buildClearView` and `collectUnits` replace the old raycast fade. Allocation-free box tests, see-through shaders compiled at load, a version for the shadow step. |
| `_qa/test_v6_99.js` (new) | → 20,594 | The v6.99 checks (wall, view, frame, zoom, driver, cards). |
| `_qa/test_v6_99_output.txt` (new) | | Its output. |

Unchanged: every other file, including `index.html`, `v8-audio.js`, `car-driver.js`, `engine-kinematics.js`, the assets and the vendor folder.

The harness and raw results are in `stage6/harness/` and `stage6/results/`; they are not part of the machine set.

## 6. Tests

**`_qa/test_v6_92.js` (the v6.92 test, unchanged), run on both builds.**
- It was run through `harness/slow_timeouts.js`, which raises Playwright's 30 s action timeout to 10 minutes for each browser context. Nothing it checks is changed.
- On this loaded machine a "stable" click can take longer than 30 s: the first before run failed that way (`qa_runs/qa_before.txt`).

| | Before | After |
|---|---|---|
| Result | **24 / 24 passed** (`qa_runs/test_v6_92_before.txt`) | **24 / 24 passed** (`qa_runs/test_v6_92_after.txt`) |

These cover the hall, the machinery, the cockpit as the driver's eyes, the head limits, the 26 cockpit sounds, the wheel's systems, START, the ignition self-test, Coates FM and its duck, and RADIO again.

**`_qa/test_v6_99.js` (new), on the fixed set: 17 / 17 passed, no page or console errors** (`_qa/test_v6_99_output.txt`)

| Check | What | Result |
|---|---|---|
| W1 | the door cards run along the doors (1.26 m along x, 18 mm across) and stay inside the body | PASS |
| W2 | no part of the car pokes out through its own sides | PASS |
| W3 | nothing of the hall stands inside the car, other than what it rests on or is tied to (the light shafts stop above the roof) | PASS |
| V1 | 16 orbit views (8 bearings, low and high): every pixel of the car unobstructed (what it rests on excepted) | PASS |
| V2 | the camera stays under the roof steel, the crane and the banners (at most 8 m up) | PASS |
| V3 | the cockpit is the driver's eyes and nothing is taken away from what he sees | PASS |
| P1 | standing still (six frames, the crew breathing beside the car), the shadow map is drawn at most once | PASS |
| P2 | the hall's fixed matrices are worked out once (only the machinery, the service kit and the dyno fan update) | PASS |
| P3 | with the V8 running the shadows still follow it (redrawn, never more than once a frame nor 15 times a second) | PASS |
| P4 | things taken out of the way fade with shaders compiled at load (no new shader program while orbiting) | PASS |
| Z1 | the + button moves the camera on the next frame and lands at 0.82 of the distance | PASS |
| V4 | back in the cockpit after orbiting: still the driver's eyes, nothing of the hall hidden | PASS |
| X1 | Explode in the car view: the driver opens his door, gets out and walks clear before anything comes apart; the car then comes apart | PASS |
| X2 | Reassemble: the car goes back together, then he walks back, gets in and his door shuts | PASS |
| X3 | into the cockpit while he is getting out: he is straight back in his seat and the camera is his eyes | PASS |
| C1 | an about card closes on a tap on the card, on a tap anywhere else, and by itself within 14 s | PASS |
| D1 | no page errors, no console errors | PASS |

- C1's card, from the run: it opened on the tie-downs, closed on a tap on itself and on the floor, and closed by itself after 14.1 s (the 14 s cap, polled every 0.25 s).
- P4: 8 units faded as the camera went round; the shader programs stayed at 89.

Earlier runs of the new test failed three times, each on the test itself, not the app. Each was fixed in the test:
- W3 compared bounding boxes, and the merged shell's box always meets the car's.
- C1 waited a frame after a click, and on this machine a frame can outlast the card's own timer.
- C1 only tried the crew, and the only person on screen was, correctly, hidden by the clear view.

The earlier outputs are kept in `qa_runs/`.

## 7. What is still imperfect

- **Not tested on a real GPU, phone, Safari or Firefox.**
  - Everything ran in headless Chromium with SwiftShader, at 0.1 to 0.2 frames a second, on a container shared with other sessions at load 7 to 34.
  - Frame rate cannot be judged here. The software renderer is the ceiling: rounds 1 and 2 drew the same number of frames for both builds, round 3 drew 5 and 4 for the after build against 2 and 2, and a handful of frames is too few to call.
  - The gains that do carry to real hardware are the ones measured without the clock: half the draw calls and 56 % fewer triangles standing in the car view, half the main-thread time per render, and ready in about half the time.
  - Nobody has yet orbited it on a laptop and said it feels smooth.
- **The car itself is still 880-odd draw calls:** 540 for the V8's assemblies, 259 for the cog and 80 for the body. They are kept as separate meshes because every part can be picked, pulled and exploded on its own. Merging static sub-assemblies of the V8 is the next big saving, and it needs care with the part picking.
- **The rollers and the wheel chocks still cover a sliver of the tyres from low angles** (worst 3.1 %, from 18 m at the nose, 5° up). They are what the car sits in and are never taken away. Counting them, the mean clear share is 99.6 %; not counting them, it is 100 % in all 50 views.
- **The sweep is the 50-view sample the coordinator asked for,** not the full 216-view grid. Two earlier full sweeps were stopped part-way (their logs are in `results/`).
- **Things taken away pop rather than dissolve.** They fade in 0.12 s and come back in 0.25 s. A unit near the edge of the view can come and go as the camera crosses the line. A person or a machine can vanish while it is plainly beside the car rather than in front of it, because the test uses boxes grown by 0.32 m.
- **Small parts under a pixel are skipped;** a speck can appear as you zoom in. The hysteresis (0.9 / 1.1 px) stops it flickering.
- **The crew's shadows are now their drawn contact shadows only.** Beside the car they no longer throw the key light's soft shadow.
- **The driver's exit:**
  - His legs pass through the sill as he ducks out and in: there is no climbing animation over it.
  - The walking figure is the crew's rig in the Coates suit and crew helmet, not the seated driver's 26 helmet.
  - The car waits about 4 to 5 s for him before it starts to come apart. This is deliberate, but it is a wait.
- **The about card's timer is by word count, not by reading.** A slow reader has to tap it open again.
- **The old tests:** `_qa/test_v6_92.js` results are in section 6. `_qa/test_machine_v586.js` and the repository's `tests/*.mjs` were not run (as for v6.92). `tests/engine.test.mjs` may still look for the retired exhibit eye.
- **Load event:** it now comes 3.7 to 6.3 s later in the paired race, because the hall is built inside it. The car is ready sooner.
- **Long tasks while loading, settled by a third paired round** (`results/race_3.json`, load average 21.3, long tasks recorded from the start):
  - The unpaired profile runs had shown far more (168 to 190 s against 29 to 46 s), but those after runs were at load 25 to 34 against 7 to 25.
  - At equal load, the two builds spent about the same time in long tasks while loading: before 5 tasks, 100.6 s in all, the longest 56.8 s; after 5 tasks, 96.6 s, the longest 52.8 s.
  - The see-through shaders compiled at load, and the hall built during the download, add no main-thread time that shows here.
  - On this software renderer, any load is one long task after another; on a real GPU the shader compiles run in parallel.



