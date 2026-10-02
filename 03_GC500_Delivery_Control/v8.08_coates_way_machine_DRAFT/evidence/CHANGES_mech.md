# v8.08 Coates Way machine: the mechanical features

Author: Andrew Fisher · draft, 2 Oct 2026 · scope: mechanical features (one of four parallel jobs on `work/`)

Andrew's brief (chat, 2 Oct 2026, about the Coates Way machine): "Push your limits further. Add more mecahnical features. ...
Make this all 4k crystal clear. Improve every thing on here. 10/10".

## What was added

Sixteen new parts. Each one is driven by the drive that was already there: the crank angle, the gear lever, the steering, the
brake and the starter. Nothing has its own motor or clock. All sixteen are in the parts register. The count now reads
**326 / 326 parts fitted** (310 + 16).

| part (register ref) | what it is | what drives it |
|---|---|---|
| Twin-plate clutch & release bearing (`ENG-CLUTCH`) | cover, diaphragm fingers, pressure plate, two friction discs, release bearing, seen through the bellhousing's open quarter | The cover turns with the crank. The discs turn the gearbox input. While the V8 is starting (`drive.starting`, the same flag the cockpit's clutch pedal uses) the bearing slides in, the plate lifts and the discs and gear train stand still. When the engine catches, the plates take up over two thirds of a radian of crank travel (a little slip; measured in crank travel, so it does not depend on the frame rate). **The gearbox input is now read off the clutch disc instead of the crank.** |
| Timing belt tensioner & idler (`ENG-TIMING-TENSIONER`) | sprung arm, smooth idler on the back of the slack span | It sits on the outer tangent of the crank/right-cam span, worked out from the same pitch circles as the belt. It turns at −crankR/r × crank: belt speed, the opposite way to the sprockets. |
| Oil galleries & pressure feed (`ENG-OIL-GALLERIES`) | drillings from the pump outlet to the main gallery, five main-bearing feeds, two cam risers, with amber oil pulses moving through them | The pulses move by the pump's angle (half the crank) × a fixed displacement, because it is a gear pump. They creep at idle, run with the revs and stop dead with the engine. They are drawn as one instanced mesh, updated only when the pump moves. |
| Final-drive pinion, 10 teeth (`ENG-DIFF-PINION`) | bevel pinion on the end of the prop shaft | Gearbox main shaft angle |
| Crown wheel (39 teeth) & carrier (`ENG-DIFF-CROWN-WHEEL`) | crown wheel, carrier, cross pin, bolts | Pinion × 10/39 (= the existing `FINAL_DRIVE` 3.9) |
| Differential spider gears & cross pin (`ENG-DIFF-SPIDER-GEARS`) | two 10-tooth spiders on the carrier's pin | They ride the carrier. They turn on their pin by (side-gear difference) × 16/10. |
| Left / right differential side gear, 16 teeth (`ENG-DIFF-SIDE-GEAR-L/R`) | splined to the half shafts, which now turn separately | Carrier ± δ. δ builds up as the carrier's turn × half-track × tan(steer angle) / wheelbase, using the car's own `CAR_AXLES` and the 18° `STEER_ROAD`. Straight ahead δ is 0; at full right lock the left wheel runs 1.105 : 0.895 against the right. |
| Twin brake master cylinders & balance bar (`ENG-BRAKE-MASTER`) | two sectioned bores, reservoirs, pistons, push rods, orange balance bar, on the engine side of the firewall | Brake pedal: the push rods go in 0.028 rig units at full pedal |
| Brake lines, front and rear circuits (`ENG-BRAKE-LINES`) | hard lines along the chassis, plus flexible front hoses laid out every frame to the steered caliper | The lines glow (emissive) with brake pressure. The hoses follow the upright's yaw. |
| Brake pads & caliper pistons ×4 (`ENG-BRAKE-PADS-FL/FR/RL/RR`) | two pads and pistons per corner, sitting on the body's own discs (±0.076 m, Ø 0.402 m) | 3 mm clear with the brake off, clamped from 6 % pedal. The fronts turn with the upright. The **rear discs heat and glow** on the wheel's own hub: heat = pedal × rear share × the angle the hub has really turned (this includes the dyno spin), cooling with an 11 s time constant. The fronts sit in the chocks and never heat. |
| Left / right front upright & steering arm (`ENG-STEERING-KNUCKLE-L/R`) | upright round the kingpin, trailing steering arm, stub axle | Rack → tie rod → arm → upright. The arm length is 0.074 / sin 18°, so the rack's 55 mm gives exactly the wheels' 18°. The tie rod's outer joint is now the arm's tip instead of a guessed point. |

Also changed in files I own:
- **Rack direction corrected.** With a rack behind the axle and trailing arms, a right turn moves the rack to the left (+z). Before this it went the other way.
- **Differential case** is sectioned (front-top quarter open, near end open, nose open on its near half), with its fins on the closed lower half only. The two half shafts each have their own rotor.
- **Register wording updated** where it had gone stale: the gearbox (it said "fixed 2.6:1 ... does not yet expose selectable gear pairs"), the differential ("internal gears are not yet exposed"), the suspension ("not yet simulated"), the prop shaft, the oil pump, the ring gear, the timing belt, the tie rods and the wheels.
- Each new part's register entry gives its reference, its exact name, where it is fitted ("Fitted: ..."), what it does, its connected parts (buttons) and a cog link. The link uses a word exactly as it appears on the plates and shows as "Cog link: ...", titled "Suggested teaching association". It is a teaching association, not an official mapping.

## Files

New: `work/mech-register.js`, `work/mech-driveline.js`, `work/mech-brakes.js`, `work/mech-oil.js`,
`evidence/mech_tests.js`, this file.
Edited: `work/car-powertrain.js`, `work/timing-drive.js`, `work/part-connections.js`.
No other file was touched.

## Edits needed in files I do not own

1. **`car-references.js`** (optional, for tidiness): `mech-register.js` adds the 16 new references to `CAR_REFERENCES` when the module loads. It never overwrites an existing reference. Whoever owns `car-references.js` can copy the 16 `id: ref` pairs from `MECH_PARTS` into that file. Nothing else needs to change.
2. **`car-app.js`** (recommended, one call per frame): pass the brake the drive actually feels, so the **handbrake** clamps the pads too. Today `mech-brakes.js` falls back to reading the `#brake` slider. Next to `engine.setStarter(drive.starting,lastDt);` in `updateTransforms()`, add:
   ```js
   if(engine.setBrake)engine.setBrake(effBrake());
   ```
   With that in place the slider fallback switches itself off.
3. **`car-app.js`** (optional): the rear wheels both turn by `PT.wheelDelta + dynoSpin`. On the rollers that is right, because both rollers turn together. If you ever want the wheels themselves to show the differential, `engine.driveline.split` gives the outside-minus-inside share for the current steer.

## Tests

`evidence/mech_tests.js` runs through the rig, on desktop (1440 × 900) and phone (390 × 844, dpr 2):
RESULTS_PLACEHOLDER
