# v7.53 — The circuit in Three.js (READY TO UPLOAD — built and tested, not live)

Author: Andrew Fisher · 1 Oct 2026

Andrew, on the Showcase's 3D backdrop: "Better camera work — follow-cam, low trackside shots, overhead circuit views,
controlled zooms. More convincing car motion — braking, cornering, acceleration, overtaking. Track perspective — depth,
kerbs, barriers, fencing, signage, Gold Coast identity. Car branding — the Coates livery, number, headlights, wheels,
orange-black. Motion blur and road effects. Cinematic lighting — sunset/night, track lighting. Race-control overlays.
Three.js implementation. I want 10/10." Then eight photographs of the real circuit as it stands today: the grey
concrete blocks with the hoardings on them, the debris fence panels on posts, the orange-and-black gantry across the
road, the white gantry with the coloured rings ("THE FINALS STARTS HERE · 23–25 OCT 2026"), the pink GOLD COAST.
footbridge, the marquees, the towers behind.

## What it does

The Showcase's three 3D backdrops ("The circuit in 3D — day", "— sunset" (new), "— night") are now drawn by a new
renderer built on Three.js r152 (loaded from jsDelivr the moment the Showcase opens; if it cannot load or WebGL is
missing, the old engine draws exactly as before). The record is untouched: the scene is decoration, and the strip's
figures are the scene's own.

**The circuit.** The centreline comes from iEDM's key plan ring (K220–K231), the road's width from the carriageway
measured off the 2022 aerial at 546 stations round the lap (median 18.6 m; 10.4 m through the tight stuff), sampled
by position round the lap — the ring itself is a 35 m schematic stroke, and a 4.9 m car on a 35 m road is a toy. Lap
2,957 m, 18 corners, anticlockwise as the race runs. Dark asphalt with the rubbered-in grain, white edge lines and
white dashed lane lines, red-and-white kerbs through every corner, grey concrete blocks both sides (the outside wall
carries Coates and event hoardings — COATES · INDUSTRIAL SOLUTIONS, GOLD COAST 500 · 23–25 OCTOBER 2026, GC500 · 2026 ·
SURFERS PARADISE STREET CIRCUIT, THE FINALS START HERE, HIRE · INSTALL · DEMOB, COATES · GC500 EVENT PARTNER; the
inside wall plain concrete), debris fencing on posts every 4 m with a top rail, six gantries on white truss towers
(START · FINISH; the orange-black COATES WORKS THE WHOLE EVENT; the white GOLD COAST 500 · THE FINALS START HERE with
the coloured rings; the pink GOLD COAST. bridge), street lights every 45 m, floodlight masts at eight corners,
grandstands with a crowd of people at the corners, marquees in the paddock, palms, the beach, the Broadwater, and
Surfers Paradise itself — every building from OpenStreetMap at its height, windows lit at night, two cranes on the
tallest. No other company's name appears anywhere: the words are Coates' and the event's.

**The car.** The Coates #26: a front-engined coupe (long bonnet, cabin set back, short high deck) in the orange and
black, "26" and COATES · INDUSTRIAL SOLUTIONS · GC500 2026 down each side, "26" on the roof reading from behind and
above, COATES on the bonnet reading from the front, the COATES tail panel and light bar, wing, mirrors, side skirts,
flared arches, orange-spoked wheels that steer and spin, headlights that light the road at night, brake lights that
flare under braking, a soft contact shadow. A white rival runs the same line 70 m ahead, and the pass happens on the
straight.

**The drive.** Grid, lights, launch with a burn-out; then the racing line — inside through the apex, outside on the
way in and out, smoothed so the car never jinks — with corner speeds from grip, braking from a look-ahead of the corner
to come, acceleration that tails off with speed, body roll and pitch, steering angle. Top speed 219 km/h, slowest
corner 51 km/h.

**The cameras.** A race director cuts between them; or pick one. Follow cam (behind and above, pulling back with
speed), onboard (helmet height, a little shake at pace), helicopter (orbiting at 40 m, easing its zoom), overhead
(the circuit from 420 m), trackside — two positions taken in turn: a low camera on the kerb inside the debris fence at
the apex, and a platform behind the fence on the outside of the corner above the fence line, both on a long lens while
the car is far and pulling wide as it arrives — car detail (low beside the car) and front detail. Cuts are hard, moves
inside a shot are eased.

**Looks.** Day (blue sky, sun high), sunset (low orange sun, long shadows, lamps and windows coming on, the floods at
half), night (stars, every window lit, floodlit corners, headlights on the road, tail lights red). Physically based
light units, ACES tone mapping, the sky as an environment on the paint.

**Effects.** Speed lines streaming past the follow, onboard and detail cameras above 45 % of top speed; tyre smoke
off the line and under heavy braking; the wheels turn.

**Race control.** A restrained strip over the plate: #26 COATES · Industrial Solutions, speed and gear, lap and lap
time with last lap, three sector marks, the flag (lights countdown before the start, green after), the camera in use,
and the days to race day (23–25 Oct). Its figures are the scene's own, never the record's.

**Quality.** Ultra / high / balanced ladders with shadow map sizes, pixel budgets, fence, palms and light counts; the
frame-rate guard steps down a rung when the frame rate holds under 26 fps (the harness sets `GC3D.noGuard` because
software GL runs at 1 fps).

## Build

`toolchain/build.sh v7.53 v7.52_the_pl_as_management_read_it_DRAFT/patch_v752.py
v7.53_the_circuit_in_three_js_DRAFT/patch_v753.py` — from the live v7.51; v7.53 is independent of v7.52 and can go
up with or without it (v7.52 is READY TO UPLOAD too). The patch refuses to run twice or on a page without the v7.48
text-it code and the GC3D engine. Build 8,553,843 bytes (with v7.52); `check_page.py` PASS.

## Checks (evidence/)

- `practice_tests.js` → `practice_results.json`: three.js loads, the scene builds (50 meshes; 18 corners; L 2,957 m;
  road half-width 5.2–13.4 m; corner speeds 51–219 km/h; 6 gantries; 8 flood masts; 66 street lights), 0 page errors,
  console only the r150+ UMD deprecation notice (three.js r152 is pinned; the notice is theirs). A 140 s run of the
  drive stepped at 30 Hz: lap 1 under way at 1,217 m, 67 km/h in 2nd through a corner. The stills are read straight
  off the WebGL canvas in the same turn as the draw (a page screenshot on software GL can show the frame the compositor
  last presented — `diag_dark.js`, `diag_dark2.js`, `diag_heli.js` were the chase of that; `diag_rail*.js` proved the
  fence rails are two rails converging in perspective, not a wire).
- Stills: `shot753_day_{chase,wide,heli,top,onboard,detail,frontdetail}.png`, `shot753_dusk_{chase,wide}.png`,
  `shot753_dark_{chase,heli,onboard}.png`, and `shot753_plate_with_hud.png` (the strip over a live frame).
- Sweeps on the final build: `sweep_desktop.txt`, `sweep_phone.txt` — 21 tabs, 0 errors, 0 console, desktop and phone.

## What stays

The old hand-WebGL engine stays in the page as the fallback; the V8 sound module reads the same fields it always did
(`S.clock`, `S.sim`, `S.pose`, `S.cam`, `S.tune`, `S.forceShot`, `S.shotI`, `S.camT`, `S.vAt`), so the sound and the
commentary are unchanged. No record write, no charge, no rate touched.
