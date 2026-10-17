# The Coates Way machine — v6.92 (staged draft, 27 Sep 2026)

Author: Andrew Fisher · Coates Industrial Solutions · GC500 2026

Staged only. Nothing has been deployed, posted or committed.

## What Andrew asked for (27 Sep 2026)

1. "Pit needs to be bigger. More detail. More mechanical things operating. Almost like its 360 view everywhere so you can't look outside the pit."
2. "In the cockpit the view should be from the driver's. Exactly the driver's eyes, whatever the driver sees you should see." And: "So the cockpit should only ever be from the driver's view."
3. "Let's have more clicks and clangs operating systems inside the cockpit that work. Remember. The showcase piece of the whole machine is that steering wheel, it operates everything."

## Base

Before any change, every `.js`, `.html` and `.css` file in the staged set (59 files) was fetched from the live copy and compared by sha256. **All 59 matched byte for byte.** Two audio clips were spot-checked and also matched. The work is built on that staged set.

## A. The garage: bigger, shut, and at work

- **Size.** The hall is now **54 × 42 × 12 m**. It was 36 × 28 × 9 m. The car, the dyno cell, the crew's aisles and the forklift's bays have not moved. The walls moved out around them.
- **Shut.**
  - The roller door is down. It has ribbed slats, a hazard-striped bottom rail and PIT 26 stencilled across it, and it sits in its guides with its motor beside it.
  - The pit wall, the fence, the gantry, the grandstand and the pit-lane lines have been removed.
  - Every wall now goes 0.4 m below the floor. Without this, a ray grazing the floor at the far end of the hall could slip under the wall; the 360 check found 2 such pixels before this fix.
  - The background and the fog are a dark interior colour (#14181b).
  - The camera and its target are held inside the four walls, the floor and the roof, whatever the orbit, pan or zoom does. The zoom-out limit is now 20 m (it was 16 m).
- **Machinery that works every frame** (new file `pit-machinery.js`):
  - The **overhead gantry crane**. The bridge travels 5 to 21 m down the hall, behind the car. The trolley crosses the bridge. The hook block raises and lowers the spare V8, and the hoist drum turns as the rope pays out and in.
  - A **two-post lift** in a second bay. It raises a gearbox on its cradle, holds it, lowers it and waits.
  - An **air compressor**. It runs up to 8.5 bar and unloads, then cuts back in at 6.5 bar. Its flywheel, piston rods and gauge needle all follow it.
  - A **parts washer** whose lid lifts and closes.
  - A **pedestal drill**. The spindle runs, the quill feeds down and back, and the feed handle turns with it.
  - A **tyre changer**. Its turntable and wheel turn, and the mount head comes down onto the bead.
  - A **wheel balancer**. The hood comes down, the wheel spins up and brakes, then the hood lifts.
  - A **vertical tyre carousel** carrying 10 tyres round its loop, with its sprockets turning.
  - **12 extraction fans**, 8 in the walls and 4 in the roof. They spin faster while the V8 runs.
  - **6 amber beacons**, turning. One rides on the crane.
  - **3 hose reels** that pay out and wind in.
  - A **HALL SYSTEMS board** on the far wall. Three times a second it redraws the machines' own positions, pressures and speeds.
- **More detail.**
  - Pallet racking with Coates crates on both sides of the door.
  - A side door, yellow bollards, the compressed-air line with its drops, and cable trays under the roof.
  - The Coates tower and generator have moved out from under the mezzanine to the near back corner. The mezzanine keeps its corner against the far wall.
  - The walls carry a little light of their own, so the far end of the bigger hall never goes black.
- **Signs.** They use only words the page already uses: COATES, INDUSTRIAL SOLUTIONS, GC500 2026, SURFERS PARADISE, PIT 26, and the machines' plain names.
- **Clear of the car.** No machinery stands between the car view's camera or the V8 view's camera and the car. The test casts 273 rays per view and none of them is blocked. Anything that does come in the way while orbiting still fades (`view-fx.js`, unchanged).
- **How it is built.** Every part is generated from primitives (nothing is downloaded). Parts are merged by material within whatever moves together, repeated parts are instanced, and nothing casts a shadow.

## B. The cockpit is the driver's eyes

- **The eye point.** The driver's helmet is now on a head that turns on his neck. The eye point is inside it, placed exactly on the established sightline (`COCKPIT_EYE`, 0.39 / 1.02 / −0.30). In the cockpit, the camera is put at that eye every frame and turned with the head.
- **Looking round only.** The orbit, pan and zoom are switched off in the cockpit.
  - A drag looks round, within a belted driver's reach: ±100° yaw, −50° to +30° pitch.
  - The scroll wheel, pinch, + / − and the keyboard do not move the camera.
  - ⌖ or 0 looks straight ahead again.
  - Dragging the wheel still steers, and touching a control still operates it.
- **The exhibit eye across the cabin is retired.**
  - Taking the wheel apart keeps the camera at the driver's eyes.
  - The stack now comes apart along the column toward his chest, at half the exhibit's distances, so every layer stays in front of him.
  - The gaze drops onto the stack as it comes apart and comes back up when it goes back together.
- **The head moves with the car.** It leans and looks a little into the steering, and it rides the V8's rumble. The view does both.
- **First person, always, in the cockpit.** The helmet, visor and HANS come off the camera's head. The driver's own arms, hands and legs stay in view.
- **Cabin fill light.** Lowered by 9 cm. It had burnt a white spot into the roof lining, which can now be seen by looking up.

## C. Clicks, clangs and systems that work; the wheel operates everything

### Sounds

- Every sound is **synthesised locally with Web Audio** (the `Foley` class in `v8-audio.js`). There are no downloads and no paid services.
- They go through the master gain, so Sound off silences them and the master level sets them.
- There are 27 distinct sounds, made from four building blocks:
  - **clicks**: band-passed noise bursts;
  - **thunks**: falling sines;
  - **rings**: inharmonic partials, each decaying at its own rate;
  - **whines and hums**: filtered oscillators under an envelope.
- A **relay** is two clicks 11 ms apart.

### Every control makes the sound of the part it is, then the sound of what it works

- **Toggles:** a spring clack, and the lever snaps over on a sprung joint with overshoot.
- **Ignition key:** detent ticks.
- **Fire system (new):** the ARM switch sits under a red flip cover on a new systems panel on the dash face. The cover lifts, the toggle clacks, and a relay and arming tone follow.
- **Wheel and panel buttons:** a tactile press-and-release click, the button travels, and the cap flashes.
- **Radio volume knob (new rotary):** a detent tick for each of 8 steps, and the knob turns.
- **Paddles (now working):** the right paddle is the next gear up, the left the one below. They flick on their hinges.
- **Gear lever:** a knock, then the clang and the dog ring going in.
- **Handbrake (now working):** a ratchet when pulled on, and the release button plus a clunk when let down. It holds the rear wheels.

### System sounds

- **Ignition:** the relay clunk, the fuel pump priming for 1.5 s, and the dash self-test — every needle to the stop and back, every shift light, every lamp.
- **Starter:** the solenoid clunks 140 ms before the existing starter clips.
- **Fans:** a relay and the fans spooling up.
- **Lights:** a relay and a lamp tink.
- **Pit limiter:** a beep. The lamp and the button light.

### Running systems

- The fuel pump hums while the ignition and the pump are on.
- The radiator fans have their own thermostat relay: on at 86 °C, off at 81 °C. On a long run it ticks in and out, and the fans whirr while they run.
- The warning lamps behave as a real car's do. OIL and BATT are lit with the ignition on and the V8 stopped.
- The V8 is now heard from the driver's seat, a little under the hall's level. Before, it was muted in the cockpit.

### The wheel operates everything

- **START** is in the empty valley at twelve o'clock.
- **IGN and FUEL** sit either side of the twelve o'clock marker.
- **FAN and LIGHTS** are at the upper corners of the rim; **HB and FIRE** are at the lower corners.
- **PIT, RADIO, PAGE and N** stay where they were.
- The **paddles** shift up and down.
- Every button lights while its system is on, and flashes and travels when pressed.
- The valleys at nine and three o'clock are left empty, because the gloves cover them from the eye.

### Coates FM

- RADIO, on the wheel or the panel, plays `assets/audio/coates-fm.mp3`. The clip is fetched only after Sound on.
- It plays with a click-on and a burst of static, then through a radio band: high-pass 250 Hz, low-pass 5 kHz, and light saturation.
- Everything through the air (the V8 and its loops) is **ducked −10 dB** while it plays.
- RADIO again gives a click-off, and the V8 comes back up. The radio also closes by itself when the track ends.
- If the file is missing, it plays a short static burst instead and no error is raised. This was tested with the clip routed to a 404.
- RADIO with Sound off turns the sound on.

## Files changed

| File | Why |
|---|---|
| `pit-garage.js` | The hall is 54 × 42 × 12 m and shut (roller door down, walls sunk below the floor, outside removed). The crane's moving parts, the reel drums and the tower and generator have moved. The walls have a light floor. The machinery is wired in and ticked with the dyno. |
| `car-app.js` | The camera and target are confined to the hall. The cockpit camera is the driver's eyes, with look-around, head limits, no orbit or zoom, and the exhibit eye retired. The stack spreads at half distance in the cockpit, with a gaze drop. Adds: mechanical and system sounds for every control; handbrake, fire system, volume and thermostat fan systems; lit wheel buttons and warning lamps; the radio wiring; the starter solenoid; and harness hooks (`audio`, `eye()`, `seat`, `seatLookAt`, `seatHome`, `confine`, `machinery`, `controlSpecs`). The tour and help text are updated. |
| `car-cockpit.js` | Adds: START in the wheel's twelve o'clock valley; six rim buttons with labels; shift paddles; a working handbrake; the radio volume knob; the systems panel (fire ARM under a flip cover, six warning lamps); sprung joints for every switch; per-cap presses with flash; lit caps; the self-test (display page, needles, lamps); and the new display states. The cabin fill light is lowered. |
| `car-driver.js` | The helmet is on a head group turning on the neck, with an `eye` point. `setHead()` gives the lean with steering and the ride on the rumble. |
| `engine-kinematics.js` | Adds `DRIVER_HEAD` (head, eye and neck), `LOOK_LIMITS` and `COCKPIT_SPREAD`. `COCKPIT_WHEEL_EYE` is kept but marked retired. |
| `v8-audio.js` | Adds: the `Foley` synth (27 sounds) and ambient loops (fuel pump, fans); the duck bus; the Coates FM radio chain with its fallback; and the V8 heard in the cockpit. |

## New files

- `pit-machinery.js`: the hall's machinery, the HALL SYSTEMS board and the building detail.
- `assets/audio/coates-fm.mp3`: 1,518,803 bytes, sha256 `aae3c41e…e6f8`, supplied by the parent session.
- `_qa/test_v6_92.js` and `_qa/test_v6_92_output.txt`: the checks and their output.
- `CHANGES_v6.92.md`: this file.

## Evidence

**Test: `_qa/test_v6_92.js`, 24 / 24 checks passed**, with no page or console errors. It serves the set with `_qa/serve.js` and runs in headless Chromium with SwiftShader.

| Check | Result |
|---|---|
| Hall size | 54 × 42 × 12 m |
| Garage meshes outside the walls | none |
| 360 ring (102 views, 2.55 M pixels) | 0 background pixels |
| Machinery movers changing between frames | 27 of 28 (the balancer wheel was in its rest phase) |
| Machinery between the car or V8 view camera and the car | 0 of 273 rays each |
| Cockpit camera to eye point | 0.000 m, wheel together and apart |
| Camera movement after a drag, scroll, zoom buttons and − | 0.000 m (the drag turned the head 28°) |
| Head limits | ±100° yaw, −50° / +30° pitch |
| Eye movement with steering | 17.8 mm |
| Cockpit controls with a synthesised sound that played | 26 of 26 |
| Wheel coverage | every system on the wheel, and both shifts |
| START | solenoid before the pinion |
| Ignition | self-test runs and IGN lights |
| Coates FM | fetched 0 times before Sound on, 1 time after |
| V8 duck while the radio plays | −10.0 dB |
| RADIO again | stops, and the duck returns to 0 dB |

**Draw calls and triangles, car view, Laptop rung (`renderer.info`, one render):**

| | Before | After | Change |
|---|---:|---:|---:|
| Draw calls | 1,699 | 1,754 | +55 |
| Triangles | 1,551,524 | 1,592,950 | +41,426 (+2.7 %) |

- **360 ring, same procedure on both sets (102 views):**

  | | Background pixels | Worst frame |
  |---|---:|---:|
  | Before | 122,054 | 28,380 |
  | After | 0 | 0 |

**Screenshots** are in `/tmp/claude-0/stage3/shots/` (PNG, 1280 × 800):

- Before and after pairs:
  - car view;
  - zoom-out from the front, side, rear and far side;
  - cockpit;
  - wheel apart;
  - 360 ring contact sheet.
- Before only: the open door, looking out to the pit wall.
- After only:
  - cockpit looking left, right, up and down;
  - wheel buttons lit;
  - the fire and systems panel;
  - machinery mid-motion: the compressor and lift pair, and the tyre carousel, changer and balancer pair.

## Not done / limits

- **Rendering not tested on real hardware.** Everything was tested in Chromium with SwiftShader only (about 1 fps). It was not tested on a real GPU, a phone, Safari or Firefox. The +55 draw calls should not trouble the Laptop rung, but its frame rate was not measured on real hardware.
- **Sound not heard.** The sounds were verified as requested and scheduled without error. Nobody has listened to them, so the mix levels are by design, not by ear.
- **Older tests not re-run.** `_qa/test_machine_v586.js` was not re-run: it needs the old live copy at other ports. Its opening-shot concern (people in the way) is unchanged, because the crew and the default camera did not move. The repository's node tests (`tests/*.mjs`) are not in the staged set and were not run. `tests/engine.test.mjs` may look for the retired exhibit eye or the four-button wheel layout.
- **Hidden controls still respond.** Raycasts for cockpit controls ignore the driver's gloves, as before, so a control hidden behind a hand can still be clicked.
