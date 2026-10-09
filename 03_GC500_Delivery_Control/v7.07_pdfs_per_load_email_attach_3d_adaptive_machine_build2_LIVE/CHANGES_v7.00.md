# The Coates Way machine — v7.00, build 2 (staged draft, 27 Sep 2026)

Author: Andrew Fisher · Coates Industrial Solutions · GC500 2026

Staged only. Nothing has been deployed, uploaded, registered or committed.

- **Folder:** `/tmp/claude-0/stage6/machine_build2/`.
- **Base:** it is build 1 (`stage6/machine/`, v6.99, handed over for deploying) with the changes below. Build 1 is left exactly as tested.
- **Measurement:** everything was measured in headless Chromium with SwiftShader (software graphics, no GPU) on a shared, heavily loaded container. The same limits as in `CHANGES_v6.99.md` apply.

## What Andrew asked for (27 Sep, 23:30 AEST)

"Up the ante, 4K ultra perfection":
- the exploded interior in high detail (seat, console, and above all the steering wheel with its cog);
- more moving things, with every person doing a real job;
- 4K clarity: the true device pixel ratio when still (up to 3), good anti-aliasing, premium materials and lighting;
- reduced resolution only while moving, snapping back to sharp;
- smooth on a phone.

## Done

### 1. Sharp when still, light while moving (`car-app.js`)

**Standing still:**
- The picture is drawn at the screen's own pixel ratio, up to 3, on every rung. A 4K laptop or a phone gets every one of its pixels.
- Every small part is drawn. Build 1 skipped parts under a pixel at all times.

**While the camera moves** (a drag, a zoom, a glide, the damping after a flick, a view change):
- It draws at 1 (Laptop), 1.25 (Balanced) or 1.5 (High), and skips parts under a pixel.
- **0.18 s after the camera stops it snaps back to sharp.**
- In the cockpit, the seat's sway on the V8's rumble does not count as moving.

**Adaptive scaling:**
- Each state keeps its own adaptive scale, with the same step, floor and hysteresis as build 1.
- A phone or a weak laptop that cannot hold the full ratio even standing still settles lower, without touching the moving ratio.
- `?tune=stillDpr:x` caps the still ratio, and `?tune=dpr:x` fixes the ratio (for measuring).

**Measured** (check R1 and R2, 800 × 500 at device pixel ratio 2):

| | Standing still | Dragging the orbit | Stopped again |
|---|---:|---:|---:|
| Pixel ratio | **2** | **1** | **2** |
| Canvas (device pixels) | 1600 × 808 | 800 × 404 | 1600 × 808 |
| Small parts skipped | 0 | 132 | 0 |
| One render (main pass): draw calls | 984 | 815 | — |
| One render (main pass): triangles | 837,581 | 724,845 | — |

- **The cost of sharp when still:** it is 1.78 times the pixels of build 1's Laptop rung (ratio 1.5 → 2, on a ratio-2 screen) and every small part.
- Build 1's figures for the same kind of view were 807 calls and 706,843 triangles in the main pass.
- The shadow map is still drawn only when something moves.

### 2. Anti-aliasing and shadows on the upper rungs (`car-app.js`)

- **Anti-aliasing:** on Balanced and High, the picture goes through the ambient-occlusion stack (GTAO). Its render target had no multisampling, so those rungs lost the anti-aliasing the plain renderer has. It now has 4 samples (WebGL 2).
- **Shadows:** on Balanced and High, the key light's shadow map is 4,096 (it was 2,048 on every rung). It costs little now, because the map is drawn only when something moves. Laptop stays at 2,048.
- **Check R3:** Balanced has 4 samples and a 4,096 map; Laptop has no stack and a 2,048 map.
- **Materials:** the cockpit's were already physical (clear-coated carbon twill with anisotropy, suede with sheen, machined and anodised aluminium) and are unchanged. No other lighting or material changes were made.

### 3. Everyone working (`crew.js`)

Every person now has a job at every moment, with no idle standing and no random wandering:

| Person | Before (v6.99) | Now |
|---|---|---|
| **Safety control officer** | Walked a loop of points, looked at the car, gave a random thumbs-up. | **A safety check round, stop by stop:** each tie-down anchor (4) and each front-wheel chock (2), then the cell from his line. At each stop he walks to it, crouches beside it, looks it over, points to it and stands. While the V8 runs he holds the line by the rollers, as before. |
| **Wheel mechanic** | Stood at his post until a wheel service. | **The wheel guns:** a look over the gun in its holster with a hand on it. **Each front tyre's pressure:** down on one knee at the valve, a hand on it. Then back to his post. |
| **Pit technician** | Stood at his post until a wheel service. | **The wheel rack:** its grips checked, crouched at its store. **Each rear tyre's temperature:** crouched beside the wheel, a hand across the tread. Then back to his post. |
| **Engine technician** | Watched the telemetry screens while the V8 was stopped. | **The run's numbers noted:** a hand on the desk's keyboard, his eyes on the screens. **The oil and the coolant checked:** leaning into the engine bay, a hand in it. Then back to the desk. While the V8 runs he is at the nose, as before. |
| Telemetry operator, crew lead | Typing / the tablet (already working). | Unchanged. |

**Safety rules in the scripts:**
- Work at the car is done only with the V8 stopped and no wheel service or all-clear under way.
- A start, or the service needing them, has them up and away at once.
- While the crew lead waits to give the all-clear, the mechanic and the technician stand clear at their posts, so it is never held up.
- The gun stays in its holster and the rack in its store: nothing of the service's own state changes.

**Check J1** (90 simulated seconds, V8 stopped): the share of time each person is working (walking, bending, kneeling, a hand on the job, or a gesture).

| Safety officer | Wheel mechanic | Pit technician | Telemetry operator | Engine technician | Crew lead |
|---:|---:|---:|---:|---:|---:|
| 96 % | 97 % | 91 % | 100 % | 98 % | 100 % |

- The safety officer visited all 7 of his stops.
- **Before the engine technician was given his work, he was at 0 %** (`qa_runs/test_v7_00_run1_engine_idle.txt`).

**Seeing the work at the car** (`view-fx.js`, `car-app.js`):
- A person kneeling at a tyre or crouched at an anchor is so close to the car that, under build 1's clear view, he was taken away from nearly every angle. The work would never have been seen.
- **A crew member down at the car doing a job** (crouched or kneeling) who comes between the camera and the car is now **faded to 30 % and stays drawn.** The job reads, and the car shows through him.
- Walking past, a person is still taken away completely.
- During a wheel service, and for the driver beside his car, people stay fully in view, as in build 1.
- **Check J2:** the mechanic kneeling at a front tyre in the camera's way holds at 30 %, not hidden.

**Check S1:** a full wheel service still runs from Ready to Ready with the new work in place: isolate, stands, wheel off, inspect, refit. It took 120.5 simulated seconds. The all-clear is given and the drive is unlocked.

### 4. The about card, tidier (`car.css`)

- It stands clear of the zoom buttons (72 px in from the right).
- It is never more than 46 % of the view high; a long card scrolls. On a phone it is at most a third of the screen.

## Not done: the exploded interior

Andrew asked for the seat, the console, and the wheel with its cog to be seen in high detail in the exploded view.

**What was tried:**
- A spread of the cockpit's own pieces out of the cage as it lifts: the dash forward, the seat up and back, the door cards outward. The pieces were grouped by where they sit, so labels stay with their panels.
- The shots (`shots/rejected/b2_exploded_interior_*.jpg`) showed it does not work as it stands. In the car's exploded view, the roof panel lifts straight up over the interior and hides it from above. The spread only moved pieces into that same crowded space.
- **It was taken out rather than shipped half-done.**

**What is in place for the interior:** standing still, every small part is now drawn at the full pixel ratio. That includes the cog's plates, the wheel's buttons and the switches.

**What doing it properly needs:** a new exploded layout for the cabin. The roof would go up and aside, the interior pieces would spread outward rather than up, and the steering wheel and its cog would be lifted clear on their own with the column. The cog is joined to the front drive's shaft (`layShaft`), so moving it means re-laying the shaft with it. This is a design job with several look-and-adjust rounds, each of which takes over 15 minutes to render here.

## Files (build 2 against build 1)

| File | Bytes | What |
|---|---:|---|
| `car-app.js` | 129,280 | The still and moving pixel ratio with its own adaptive scales; small parts skipped only while moving and never with the car apart; MSAA on the ambient-occlusion stack; the 4,096 shadow map on Balanced and High; harness getters (`motion`, `composerSamples`, `shadowMapSize`). |
| `crew.js` | 144,923 | The safety officer's check round; the mechanic's, the technician's and the engine technician's work between services. |
| `view-fx.js` | 10,897 | A unit in the way can be faded to a share (30 % for a person at work at the car) and stay drawn, instead of being taken away. |
| `car.css` | 24,943 | The about card clear of the zoom stack, and at most 46 % of the view high. |
| `_qa/test_v7_00.js` (new) | 10,003 | Checks R1–R3, J1, J2, S1, D1. |
| `_qa/test_v7_00_output.txt` (new) | | Its output. |

Everything else is exactly as in build 1.

## Tests

- **`_qa/test_v7_00.js`: 7 / 7 passed** (R1, R2, R3, J1, J2, S1, D1), no page or console errors (`machine_build2/_qa/test_v7_00_output.txt`).
- **`_qa/test_v6_99.js` on build 2 (regression): 17 / 17 passed** (`machine_build2/_qa/test_v6_99_output.txt`, also in `qa_runs/test_v6_99_on_build2.txt`). It covers the wall, the 16-view full view (still 100 % with the 30 % rule), the frame checks, zoom, the driver's exit and entry, and the cards.
- `_qa/test_v6_92.js` was not re-run on build 2. Build 2 does not touch what it checks (the hall, the cockpit, the sounds, the radio), and it passed 24 / 24 on build 1.

## Shots (`stage6/shots/`)

- `b2_crew_1_safety_checking_a_tie_down.jpg`, `b2_crew_2_mechanic_tyre_pressure.jpg`, `b2_crew_3_tech_tyre_temperature.jpg` and `b2_crew_4_engine_tech_in_the_bay.jpg`:
  - Each is taken from high and just outward of the person, at his job.
  - Where he comes in the way of the car, he shows at 30 % (see J2).
- `b2_phone_first_view.jpg` and `b2_phone_cockpit.jpg`: 390 × 844 at 3×, drawn at the full ratio standing still.

## Still imperfect

- **Nothing here was seen on a real GPU or phone.**
  - "Smooth on a phone" rests on the moving ratio (1 on the Laptop rung that phones get), the adaptive still ratio, and build 1's lighter frame. The phone's own frame rate was not measured.
  - At 3× standing still, a phone draws nine times the pixels of 1×, every frame, while the crew and machinery animate. If it cannot hold that, the still ratio steps down, in 15 % steps to 60 %.
- **Resizing the drawing buffer at every start and stop of a move costs a little on a real GPU.** It is one resize each way, not one per frame.
- **The exploded interior is not done** (see above).
- **Premium lighting:** no new lights or tone changes were made beyond the shadow map and the anti-aliasing.
- **"More moving things":** the new motion is the crew's work. No new machines were added; the hall already has 28 moving machinery parts.
