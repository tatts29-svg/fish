# Continue the original GC500 #26 car

Andrew rejected the replacement car. This build now imports the car from his supplied live app: https://gc500-production.up.railway.app/v/Coates-GC500-2026. Preserve this exact body, wheels, wing and lettering.

Read README.md. `dist/assets/gc500/original-car.js` is the untouched extracted source (with a small module wrapper); `provenance.json` records its hash. `car-gc500.js` handles the Three.js adapter and removable sections. `car-fit.js` fits the existing mechanical illustration inside it. `car-app.js` connects the modes and drive state.

The latest correction retains the branding on the upper door/window during the cutaway and exposes the lower drivetrain. The original cog is at the front of the engine. Turning cutaway off restores every source triangle. Original car/Coates wording and 237 stable component references must remain.

Verified: original geometry and alpha pixels, 20 body/wheel groups, 237 interlocks, mechanical contact and 15.43 mm minimum sampled bonnet clearance. The CPU inspection render in `dist/assets/gc500/cutaway-preview.png` is generated from the real build geometry, with simpler lighting. It is not a browser screenshot.

Remaining: test browser rendering, camera interaction, audio, capture and device frame rate on WebGL hardware; the managed browser here disables WebGL. The V8 remains an illustrative overhead-cam rig, not verified racing-engine CAD. Further mechanical refinement and the cinematic finish from `reference/Coates_Cutaway_Target.jpg` remain quality targets. Do not call the current render photorealistic.

Do not change the Railway delivery application or its data. Andrew handles Railway uploads. Preserve `.openai/hosting.json` and the existing Site audience. Refresh the downloadable source package with `python3 tools/package-claude.py` after edits.

## 22–23 September 2026 — the cog at the front of the motor, and the systems that make it run

Andrew Fisher's direction this session: the cog at the front of the car and the motor, dead centre, and big; part of the engine, the thing that makes it run; not outside the bonnet when the car is complete (and whether it grows as it comes out); a great many moving parts, each moving the next; each part of the cog coming apart with a meaning in the Coates Way; a deep, roaring V8; and the cog not on a stand. Two guide frames are in `reference/` (the machine and the car).

**Two states for the cog, one honest drive.** `engine-kinematics.js` holds both poses and the path between them (`COG_CAR`, `cogPose`): fitted inside the nose with the complete body (0.44 m, 25 mm under the skin, nothing outside the bodywork) and deployed ahead of the nose in the cutaway, powertrain and cog views (1.10 m across its teeth, 53 mm off the floor). The move takes 1.6 s, comes straight out along the fitted axis until clear of the nose lip and only then rises and grows; the bonnet, nose and fender do not redraw until the cog is back inside. The drive is a double-Cardan telescoping shaft (`front-drive.js`, laid out from its two joints every frame) into a distribution case on the front of the block, where a 65-link duplex chain on two matched 30-tooth sprockets turns the crank nose — so cog and crankshaft still share one angle. The size change is an illustration device and is described as one.

**266 parts, all selectable, every link real** (`car-references.js`, `part-connections.js`): the eight-part front distribution drive; a throttle linkage whose cable, lever, link rod and return spring open eight butterflies from the throttle slider (`engine-accessories.js`); a serpentine belt off the crank nose turning water pump, alternator and idler at their true ratios, with a build-time check that every pulley touches the belt hull (the first layout had the crank pulley 16 mm inside it); a sectioned race sump with a gear oil pump driven by the distributor's vertical shaft off a skew gear on the right cam; the distributor with sectioned cap, rotor at cam speed and eight leads to eight plugs; a sectioned bellhousing showing the flywheel ring gear; and a starter whose pinion throws in and spins while the drive is starting (`engine-systems.js`). The original 237 references are untouched. Draw and triangle caps in `tests/car.test.mjs` were raised to 345 / 340 k with the reasoning beside them.

**Tests** (`tests/engine.test.mjs`) now sweep the engine's parts against the bonnet once and the cog's shown parts in all three states — fitted, mid-path, deployed — plus the shaft's clearance over the radiator by raycast and the joint angle. The machine's motor, base, gearbox and clutch are car-view hidden (`carHidesCogPart`) and the base is hidden in the cog view too (`standHidden`); both stay in the register and appear when selected.

**Every machine part has a Coates Way link** (`cog-meanings.js`), drawn only from words on the plates or the five stated values, shown in the inspector and the register export, and labelled a teaching association. Callouts (`#part-label`) name a disconnected part where it sits on screen.

**Sound.** The synthesised V8 is deeper (`v8-audio.js`: 72 Hz peak, low shelf, a rasp that opens with throttle, an 850 rpm floor, mapped idle-to-redline from the inspection drive) and measured in `tests/audio.test.mjs` by band. Andrew approved a 34-clip ElevenLabs pack (`SOUND_PROMPTS.md`; flow *Coates Way V8 — sound effects*, 23 Sep 2026, two takes per clip, about 2,390 credits). `SampleBank` loads `dist/assets/audio/<id>.mp3` only after Sound on, plays each clip on its event, and falls back to the synthesis for anything missing. The clips are fetched onto a machine that can reach Google storage with `tools/fetch_sound_pack.py sound_manifest.json`; the sandbox that built this could not, so the takes were not auditioned here and take 1 is picked throughout.

**Look.** The quality ladder is real now: Laptop renders straight at pixel ratio 1; Balanced and High add GTAO and the reflective dyno deck (`car-scene.js`, a planar reflector under a semi-transparent worn-steel top); the rung is picked from the device on load and drops itself to Laptop under 24 fps. Camera tweens start on the frame clock and the resize observer only reframes on a real size change. Hardware frame rate is still unverified here — all renders in this session came from a software rasteriser at a few seconds per frame.

## 23 September 2026 — this folder is part of the GC500 build now

Andrew Fisher, 23 Sep 2026: it is all part of the GC500, not a separate build, and the whole thing is fully reachable
on the view page, even with everything uploaded to Railway.

- The source moved from the separate Coates Way pack into the GC500 tree as `print/machine/` (this folder). The
  nine check files under `tests/` run as the `verify-machine` step of `build_all.py`; the served files under
  `dist/` are packed by the `machine` step (`pipeline/build_machine.py`) into `print/out/machine/` with
  `machine-manifest.json`, imported on the GC500 admin page (*The Coates Way machine*) and served by the GC500
  service at `/w/<token>/` (server v5.77, `hosting/railway/server.js`). It opens inside the delivery page's
  Coates Way tab, on the view link.
- `tools/package-claude.py` still builds the downloadable source zip if anyone wants one, but nothing serves it:
  the *Claude pack* link left the footer, and `build_machine.py` never ships a zip.
- `hero/machine_hero.png` is the clean still the delivery page shows at the top of its Coates Way tab; recapture
  it when the look changes (the 3D studio with the interface hidden, 1600 px wide is plenty).
- `.openai/hosting.json` is kept for the record of where the standalone page once lived; nothing reads it.
- The earlier rule "this package is the car source, not the delivery application" is superseded: it is one
  build. Andrew still uploads to Railway himself; nothing here writes there.

## 23 September 2026, evening — the cockpit, and the cog off the engine

Andrew Fisher's concept: a physical 3D interior (carbon dash, roll cage, window net, wiring, proper depth); the cog
steering wheel fitted naturally inside the suede rim, with usable buttons; clear race instruments above the wheel; a
sequential gearstick beside the driver, as Gen3 shifts; interactive controls — the wheel steers, the switches operate
systems, a cog section shows its meaning; the cockpit in the garage pit; and the cog as the steering wheel, because it
operates everything — so the cog comes off the engine.

- The front chain drive (case, cover, sprockets, chain, tensioner, guide) is gone; `front-drive.js` is the steering
  shaft only (`ENG-FRONT-DRIVE-SHAFT`, a stable reference); 134 car references, 272 parts. `FRONT_DRIVE` keeps only
  the line the case's face stood on, for the accessory belt's plane.
- `COG_CAR` is one pose; `cogPose()` returns it; the wheel view is the cockpit (`COCKPIT_EYE`; `applyViewCamera`
  sets the lens and the orbit limits; `confineCamera` keeps the eye in the cabin). `__cw.deploy` is always 0.
- `car-cockpit.js` v3: `COCKPIT.glass(x,z)` is the measured windscreen; the deck keeps 30 mm under it (tested at
  every vertex). The API `buildCockpit()` returns: `setInstruments(state, now)` (redraws the display canvas, ≤11 Hz,
  only on change), `setWheelAngle`, `setSwitch`, `press`, `setGear`, `update(dt)`, `controls` (pickable meshes with
  `userData.control = {kind: switch|button|shift, id|dir}`), `driver` (one group, hidden in the cockpit view).
- `car-app.js`: `cabin` is the cockpit's state (ign, fuel, fan, lights, pit, radio, page, gear, water, oil);
  `operate(control)` does what a hit does; `shiftTo`, `setSteer` (radians, +clockwise to the driver), `wheelAngle()`;
  the pointer: a drag that starts on a wheel part turns the wheel (controls disabled meanwhile), a click on a
  control operates it, a click on a plate opens the section's meaning (`cogSectionAt` in `cog-meanings.js`, the
  uv's angle and radius on the artwork — v runs DOWN the picture). `engine.setRack(t)` slides the rack and lays the
  tie rods; `engine.setFans(on)`; the front wheel groups are yawed in `updateTransforms`.
- Andrew's references (uploads, 23 Sep): `Camaro_V8_High_Resolution_Diagrams.zip` (15 atlas pages at 3840 px),
  `Camaro_V8_3D_Technical_Diagrams-3.pdf` (the 21-page Gen3 mechanical atlas: pushrod V8, rear transaxle sequential
  six-speed, the steering path, a 341-item register), `gemini_generated_video_5efd107d.mp4` (the cog as the wheel's
  hub, the dash reading "Every part matters"). Done from them: the display's third page (the eight targets, from
  content.js). Proposed, not started: an atlas generated from this build (explode + capture + the register); a rear
  transaxle with six gear pairs and a selector for the lever; the pushrod valvetrain only on Andrew's word.
- Software GL renders the cockpit at seconds a frame here (1.9 M triangles, 2.3 k draws at Laptop) — the quality
  ladder is what protects a real device; hardware frame rate is still unmeasured.

## 24 September 2026, early — the wheel comes apart in the cockpit, and the driver's hands

Andrew Fisher, with a photograph of the live (v5.78) cog exploded on the powertrain's axis: the cog taken apart like
that, in the steering wheel concept, and off the place it had on the screen; and with his concept cockpit and the suit
study: the driver, hands on the wheel and moving it, was his idea.

- `car-app.js`: in the cockpit view the drive's spread moves the COG PARTS only (`updateTransforms`: the car assets
  read `carSpread = view==='cog' ? 0 : drive.spread`), so *Take the wheel apart* (the `#explode` button's cockpit
  wording; E) lifts the rim, spokes and bolts off the column and then the plates in their order, toward the
  driver, while the car and the V8 stay whole; `rimDx` (the rim's travel along the column, metres) drives
  `cockpit.setWheelSpread(dx)` so the pods leave with the rim, and is passed to the driver. `fit('cog')` goes to
  `COCKPIT_WHEEL_EYE` (engine-kinematics.js) while `drive.spreadTarget>.01||drive.spread>.01`, else `COCKPIT_EYE`;
  `assemblyFit` keeps calling it through the transition, so the camera crosses the cabin as the wheel comes apart
  and returns on *Wheel back together* (R). `placeCog` moves the cog's key light down into the cabin from the
  passenger's side while apart (3 → 5.5, the fill 1.2 → 2). `confineCamera`'s cockpit box now spans z −.50…+.28.
  `setView` reassembles first when anything is apart and the view crosses into or out of the cockpit. `KNOB` is the
  gear knob's resting place; `shiftHand` (1 on a shift, decaying over 1.4 s; the hand is on the knob while > .4).
- `car-driver.js` v4: the arms are jointed (`segment()` groups at the shoulder and the elbow; the glove a group at
  the wrist). `driver.userData.setWheel(angle, {apart, shift, dx, dt, knob})` is called every frame by car-app
  with the rim's rotation (`-wheelAngle()`): the grip points (`grip0`, the rest grips relative to the wheel
  centre) are turned about +x by the angle and moved by `dx`; the elbow is solved from the two arm lengths
  toward a pole point down and out; `restK` blends the hands to the thighs while apart, `shiftK` the left hand to
  the knob. `setFirstPerson(on)` hides the helmet, visor, rim, vent, chin bar, neck, HANS and tethers.
  `userData.arms` exposes `{q, sh, upper, elbow, fore, hand, grip0, rest, pole}` for the tests. The livery is
  canvas-drawn: `suitTexture` (black, orange sides and yoke, Coates/THE COATES WAY/26 on the chest, Coates and
  26 on the back), `limbTexture` (sleeves and thighs), `helmetTexture` (carbon weave, orange crown, Coates over
  the visor and on the chin, 26 on the sides). `updateVisibility`: the driver is visible in every view;
  first person in the cockpit.
- `car-cockpit.js`: `setWheelSpread(dx)`; the API returns it.
- Tests: `engine.test.mjs` (the gloves on the rim, the lengths, the turn, the rest, first person, the pods with
  the rim, the exhibit eye); `tests/test_machine_tab.py` (the driver in the seat, helmet off, gloves on the rim
  and turning under a real steer). Pictures: from the seat with the wheel turned; the wheel apart from the exhibit
  eye; the driver through the window. Software GL only; hardware frame rate unmeasured.



## 24 September 2026, later — v5.80: the cog to the smallest part, the column unit, the cockpit that works, the six-speed

- `parts.js`: after 'Quick-release hub' (index 137) the 38 parts of the hub — six lock balls, the collar and its
  spring, the clock-spring cassette and ribbon (`service-parts.js` 'spiral'), the angle-sensor disc and reader,
  the front bearing (inner and outer race, ten balls, retaining ring), four pillar-plate screws, eight scorecard
  rivets, the boss circlip — with `say(i, text)` descriptions. 176 mechanism parts; `parts-register.csv` is
  regenerated (176 + 29 wording references). `index.html` says V8 · 310 PARTS.
- `car-app.js`: the original mechanism is the **column assist unit** on the steering shaft under the dash
  (`columnPivot` at cog-local (0, 0, −COG_COUPLING_DEPTH), quaternion from −engine.frontDrive.shaftDir;
  `columnGroup` at z COG_COUPLING_DEPTH − COLUMN_DOWN_SHAFT); `steerDrive` proxies the angles from the wheel
  (`A[i] = angles[i] + ratios[i]·s`, `s = −wheelAngle() − drive.angle`); `carHidesCogPart()` is false. The
  frame loop drives `cockpit.update(dt, {rumble, rumbleHz})`, `setPedals`, `setGauge('rpm'|'water'|'oil')`.
  `COCKPIT_EYE` .34, 1.02, −.30 (first person only within .16 m of it); `COCKPIT_WHEEL_EYE` .42, 1.02, −.01.
- `car-cockpit.js`: pedals (`pedals.throttle|brake|clutch` with pivot and spring), the gauge pod, the ignition
  barrel and key (`setSwitch('IGN')` turns the key pivot to −1.35), `layShiftRod(target)`, the rumble on
  `engine.root`. `car-driver.js`: `setWheel` uses its own `tgt`/`knobP` vectors (the `tmpA` clash put the gloves
  at (−.68, −.71)).
- `car-powertrain.js`: `GB` — main shaft and lay shaft 90 mm apart, six gear pairs summing to 90 mm, three dogs
  and forks, the drum (`setGear(g)`: drum `g·2π/7`, fork k −20 mm for 2k+1, +20 mm for 2k+2), `gearRateOf(g)`,
  the case sectioned on the near-top quarter (thetaStart π/2, 1.5π long), fins below; `engine.animate` spins
  the input, lay, mains, output and dogs, the main shaft stops in neutral.
- `hero/machine_hero.png` re-shot 24 Sep (2000 × 1390): from over the driver's shoulder toward the passenger
  side, the driver's meshes hidden, the V8 starting in third, 56° lens — with the scratchpad harness `cog_shot.py`
  (env POST_JS / POST_FRAMES / POST_JS2). The previous still is the driver's eye with the forearms in frame.
- Tests: `tests/model.test.mjs` 176; `service.test.mjs` 30 balls, 7 plates, 7 springs; `engine.test.mjs` the
  pedals, gauges, key, rod, rumble and the six-speed; `../../tests/test_machine.mjs` 10 files pass (47 s).
- Next: the cockpit makeover Andrew asked for on 23 Sep (materials — carbon, suede, the display glass — and
  the driver's arms at a real shape), with pictures for his approval before it is sealed. Shots to judge it by
  are the ones the harness makes at 1935 × 1210 with `ao:2,reflect:2`.

## 25 September 2026 — v5.82: the hero is a loop, the cockpit's radio, ignition and speedo, and nobody walks through a car

Andrew Fisher, 25 Sep 2026: the picture for the machine looked bad and had to be a looping 3D of the cog coming apart and
spinning round; in the cockpit the cog wheel was hard to see for the driver and the rest; the inside had to be more
interactive — a radio, an ignition switch, the speedo; more detail, no lag; the people and the machines to the smallest
detail, doing nothing unsafe and never walking through a car.

**The hero loop** (`mechanism.html?hero=1`, `app.js`): the cog exhibit itself, captured — the interface hidden, the frame
loop paused and `window.__mech` stepping the drive, orbiting the camera and rendering a frame at a time
(`scratchpad hero_capture.js` → 420 frames at 30 fps → ffmpeg). The script: the motor runs from the first frame, the
cog is released at 2.5 s, back together at 8.5 s, the motor again once it is assembled; the camera makes one full circle
a loop with a gentle rise and fall and pulls back with the spread, so the end meets the start. The delivery page's
Coates Way card plays it muted, inline, looping, resting off screen, with the first frame as its poster (GC500 v6.00).

**The cockpit** (`car-cockpit.js`, `car-app.js`): a fourth gauge in the pod — the speedo, 0–300 km/h, reading the road
speed at the revs the rpm gauge shows through the lever's gear and the final drive to the .33 m tyre (`PT.kmhDial`; the
display's km/h reads the same; the rollers still turn at the inspection speed itself). A crew radio head unit under the
switch panel: a channel window that wakes with the ignition (CREW · CH 1 · 26, TX in orange while open), a PTT key, a
volume knob, a speaker grille, the LED that shows the channel open — the same RADIO the panel button and the wheel pod
operate, and the whole unit is a hit target. The ignition key stands up at OFF with a head you can see (an orange tag
with the 26, a split ring), turns a quarter to ON, in a machined escutcheon, with the IGN lamp beside it that lights.
The cockpit is 267 draws (cap 270): the machined trim that never moves is one merged draw.

**The crew** (`crew.js`, `tests/crew.test.mjs`): the crew test now checks, every step of three service cycles, that no
person's centre is inside any footprint on the floor (618,596 checks; the seated operator at his desk excepted). It
caught two things, fixed: the engine technician's spot at the nose was 20 cm inside the footprint beside it (moved out);
and a route that begins or ends nearer a box than the fixed .6 r margin (the mechanic 17 cm from the gun stand) failed
every leg and fell back to a straight line — through the car. `route()` now asks the first and last legs only for the
clearance their end has; and a walk's rounded corners are eased off (.42 → .2 → square) until the walked line stays
outside every box (`walkTo({clearOf})`).

Tests: all eleven pass (`engine`: cockpit 267 draws / 54.4 k triangles; `crew`: PASS with the footprint check; `car`,
`service`, `garage`, `drive`, `gears`, `model`, `audio`, `artwork`, `gc500-source`). Hardware frame rate still unmeasured.

## 24 September 2026, afternoon — v5.81: the cockpit makeover, and a rear wheel that comes off properly

Andrew Fisher, 23 Sep, of the v5.80 still from the seat: the driver and dashboard looked poor, and the Coates Way
steering wheel had to look outstanding — the makeover approved; his concept: a physical 3D interior, the cog steering
wheel inside the suede rim with usable buttons, clear race instruments. His workshop brief, 24 Sep, set the wheel
service in steps (end the run, spin down, verify stopped, isolate the drive, service position and support, release the
fastening, wheel off, inspect, refit, confirm the fastening, back to ready), with blocked actions saying why, a spinning
wheel never removed, no drive with a wheel off, the hub, disc and stationary caliper exposed, and an attached wheel
moving with its hub. Approved in full, pushed as far as it would go. This sits on top of
the v5.81 powertrain slice (`car-app.js` `powertrain()`/`PT`), which it does not change.

**The skins** — `dist/cockpit-surfaces.js` (new; re-exported by `car-scene.js`): `carbonTwill(T)` — a 2×2 twill, 256 px,
16 tows, a colour map, a normal map from the same height field and an anisotropy map (warp and weft at right angles);
`TWILL.perMetre` (15.625) makes a tow 4 mm on UVs in metres. `metricUV(g)` (box projection), `scaleUV`, `uvMetres(g)`
(measures metres per UV unit), `suede`, `brushed` (a roughness map that sits between .72 and 1 — three MULTIPLIES
roughness by it; the first cut at .22–.44 turned "satin" into chrome), `webbing`, `canvasTexture`. `car-driver.js`
`loftGeometry(…,{metric:true})` gives a loft UVs in metres (the dash); the default is unchanged for the driver's lofts.

**The cockpit** — `dist/car-cockpit.js`: the dash, console, faceplate, pods, paddles and seat shells are
`MeshPhysicalMaterial` twill (clearcoat .5, clearcoatRoughness .3, roughness .4, anisotropy .22); the column shroud,
door cards, tunnel, gauge pod and mirror housing the same weave matte. **`CABIN_ENV = .4`**: every material in the
interior (the driver's too) takes 40 % of the environment's light, once — the scene's environment is the garage
captured with the car taken away, so without it every cabin surface reflected the hall's ceiling as if the car had no
roof (the first makeover still read as light-grey basket-weave). The switch panel is black anodised aluminium (brushed)
with a screen-printed label sheet (`drawPanelSheet`, a clear canvas, lit) and an engraved plate **'Engraved plate,
COATES #26'**; the display (`drawDisplay`, now drawn in a 1280 × 400 frame at the screen's own 3.2 : 1 — v5.80's canvas
was 2.67 : 1 and stretched) sits in an anodised frame **'Display bezel'** with **'Display bezel screws'**, a carbon
**'Display pod housing'** and a **'Display glass'** (physical, roughness .05, drawn with one/one-minus-alpha blending so
the screen dims 22 % and the garage's reflection is added whole — a plain transparent pane scales its reflection away);
`COCKPIT.print` holds the print resolutions in px a metre (panel 5,200, wheel labels 9,800, display 5,330, plate 5,500).
Machined aluminium (a turned `LatheGeometry` knob with four grooves, the pedals, the toggles, bezels, the hub ring);
**'Cage padding'** (door bars, the driver's roof rail and hoop leg, one draw); **'Window net'** (a canvas net, alpha-
tested, tilted with the door glass 20–40 mm inside it, framed by the nine 'Window net strap' objects); the harness in
webbing with **'Harness adjusters'** and a camlock 'Harness buckle'; the bottle with **'Fire bottle valve head'**,
**'Fire bottle gauge'**, **'Fire bottle label'**; a convex 'Mirror face'; **'Cabin fill light'** — a PointLight, 1.6,
warm, no shadow, over the tunnel on the passenger's side of the driver's head (ahead of it, it sat in the display
glass's mirror direction from the eye and put a white spot on the screen). Every name `tests/engine.test.mjs` lists
is kept.

**The wheel** — `parts.js` `WHEEL`: `rimR` 4.2 → **4.5**, `tube` .45 → **.40**, `grip` **.15** (new), `flat` −3.4 →
**−4.42**. The plates cannot change and their seven teeth reach 3.97 (measured); v5.80's rim edge was 3.75, under the
teeth, and its flat ran through the lowest tooth. Now the rim's inner edge is 4.10 — 4.7 mm clear all round — 350 mm tall,
360 mm across the grips. `service-parts.js` sweeps the rim section by section: moulded grips at nine and three
(`gripAt`, swelling back-outboard), four finger grooves behind each (`gripPhase`), analytic normals, an orange stitch
line round the inner edge, the orange marker band, alcantara (`MeshPhysicalMaterial` 0x0a0a0c, roughness .95, sheen
.6); the spoke plate is dark brushed alloy on a turned **machined boss** (`bossGeo`) the plates sit on; the
quick-release is machined aluminium. In the cockpit (`car-cockpit.js` §5) a carbon **'Wheel faceplate'** fills the ring
between the cog's valleys and the rim, and the four pods stand in four of the cog's seven valleys (RADIO ten o'clock,
PIT two, N seven, PAGE five — `COCKPIT.wheelButtons` now carries `angle`), each with a machined bezel (**'Wheel button
bezels'**, one draw) and a printed label. The display's layout keeps gear, revs, speed, water and oil above y 300 of
400: from the eye the rim's top crosses the lower middle of the screen (measured: 74 % of the screen is seen, all of its
upper half), and the pod cannot rise (5 mm under the glass) or come nearer (the faceplate turns 4 mm in front of it).

**The arms and the eye** — `car-driver.js`: forearm 45 → 35 mm (elbow → wrist), upper arm 52 → 46, elbow 47; the sleeve
is black with an orange band before the cuff and a 22 mm Coates (was a third of the sleeve high); gloves 7 mm further
out, on the fuller grip (still within the tests' .165 ± .012). `engine-kinematics.js`: **`COCKPIT_EYE` x .34 → .39,
fov 68 → 62**; `COCKPIT_WHEEL_EYE` fov 62. `tests/test_machine_tab.py`'s seat check (.3 < x < .6, fov > 60) holds
unchanged.

**The wheel service** — `car-motion.js` **`WheelService`** (node-testable) and **`WHEEL_SERVICE`** (timings and
distances); `car-app.js` `service` is the one instance, `serviceStep()` (dock **Service** button `#service`, key **W**),
`serviceRefuse(reason)`, `wheelGuard(i)` (the Disconnect button, the pull slider and ↑ on a wheel all ask the service),
`fitService()` (frames the corner in the car view), `updateServiceCallouts()` (`#service-callouts`: 'Hub · stays on',
'Brake disc · on the hub', 'Caliper · stationary'), `#service-phase` (the dock line, with the last refusal),
`window.__cw.service` = {phase, moving, wheel, startRefusal, line, step(), choose(id), wheelOff(id), reset(), state}.
Phases: ready → isolated (`drive.locked` — `drive.js`: `start()` refuses and a running drive stops) → supported (the
garage's `serviceKit`: 'Jack stand, front'/'Jack stand, rear' under the sill, saddles at the measured .146/.151, and
'Wheel stand'; the service side's extraction hose is unhooked) → wheelOff (the nut backs 35 mm off in three turns, the
wheel slides 0.35 m out along its axle in 1.2 s, then is laid on the stand) → inspect → refit (same path back, the nut
run on, a torque cue: `sfx('wheel-gun')` only if the pack has it — it does not, so the dock says "Nut torqued —
fastening confirmed") → ready. Refusals: "Wait for the wheels to stop" (V8 running or the drive still turning), "Service
mode required" (a wheel off before Service), "Refit wheel before starting", "Service mode — refit the wheel and press
Ready before starting", "Support the car first — stands under the sill (Service)", "Wait — the wheel is still moving",
"Finish the wheel service first — Ready (W), or Reset" (explode mid-service, outside the cockpit). Reset cancels and
puts every rotor and nut home. A view change mid-sequence is allowed and the sequence continues.
`car-gc500.js`: each wheel has a **'Wheel hub'** group beside 'Wheel rotor'; the original's brake-disc surface is
parented to it at build time (its vertices are where they were — `gc500-source.test.mjs` unchanged, 2.47e-7 m); each
rear wheel gains 'Wheel hub, near|far rear' (machined bell, flange, five pegs, spigot), 'Wheel nut' (12-point) and
'Brake caliper, near|far rear' (an arc housing that encloses the original 12-triangle block, all 36 of its vertices
inside). `advanceWheel` turns the hub, and the rotor and the nut with it only while they are on.

**Not as written, and why.** The brief's "then 0.2 m down onto a wheel stand" cannot be done with the wheel upright: on
the dyno the tyre's lowest point is already at floor level, so the wheel is laid flat on a low stand (its centre 0.2 m
down), 0.44 m further out, clear of the rollers and the pit's edge (`WHEEL_SERVICE.standOut` .79). The torque cue is
silent (no clip). Hardware frame rate is still unmeasured — every still and browser run here is software GL.

**Numbers** (node tests): cockpit 236 draws / 41,022 triangles before → 255 / 51,428 after (new cap in
`engine.test.mjs`: < 270 / < 60 k); car + V8 (car.test, unfitted) 338 / 287,434 → 344 / 292,130 (cap 345 / 340 k);
cog model 440,543 → 447,447 triangles, 258 material groups (caps 480 k / 290); garage 65 → 71 meshes (cap 72).

**Tests**: `car.test.mjs` runs the service three times on a fresh body with the real `Drive` (refusals and reasons, the
rotor 0.815 m out, the caliper, its housing, the disc and the hub still to 0, the rotor home to 1e-16, one rotor per
wheel, Reset mid-removal); `engine.test.mjs` measures the twill (3.93 mm a tow on the dash; the console, the gauge pod
and a seat shell within ±0.5 mm), the sightline against the measured rim top, the forearm taper, the new names, the
cabin light and the glass, and the cockpit cap; `tests/test_machine_tab.py` gains a five-check service block in the
car view (three cycles on CAR-BODY-WHEEL-REAR-L). Stills (1935 × 1210, `ao:2,reflect:2,dpr:1.25`): the seat (hero),
first person with the hands, the wheel apart — `hero/machine_hero.png` and `/mnt/user-data/outputs/GC500_v581_*.png`.
Rollback: `cp -r <scratchpad>/dist580_backup/* print/machine/dist/` restores v5.80 (before the powertrain slice too);
`docs/COATES_WAY_v581_machine_notes.md` has the detail.

## 24 September 2026, evening — v5.81: the crew and the forklift

Andrew Fisher: animated crews, full steam ahead; the crew and forklift sections of his workshop brief (set out at the
head of `dist/crew.js`); and everything into 5.81. The files say v5.81 (they said
v5.82 while they were built).

**Where things are.** `dist/crew.js` — `crewAtlas` (one 2048 × 1536 canvas and its roughness/metalness twin — every
person and prop shares one material; `ATLAS`/`SWATCH` are its layout), `buildFigure` (one skinned mesh a person, on the
driver's lofts/capsules/canvases; 19 bones), `Clip` (the keyframe player), `Path`/`route`/`segmentClear` (walks round
the hall's boxes), `solveTwo` (two-bone IK), `Crewman` (the rig and the walk: the stance foot pinned where it lands, the
next landing placed where the body will be — the test's stance drift is 2e-15 m), the props (`buildGun`, `buildRack`,
`buildTablet`, `buildStation`, `buildForklift`), `Forklift` (`forkProgram`, `update(dt, paused)` — the crossing pauses
while the service is in wheelOff, inspect or refit, or a close-up is on), `ROLES` (six; seed, height, build, helmet,
walk speed), `CREW_EXHIBITS` (cards in the garage's own words — `pit-garage.js` exhibits and the Life Saving Rules —
never retyped), `drawScreens` (the operator's checklist and cell-from-above screens, the lead's tablet), `Script` (a
generator a person: `yield sec(n)`, walks, gestures), `buildCrew({service, wheels})` → `{root, men, props, forklift,
carrier, update, reset, flags, S, crewClear, scripts, screen, info, exhibits}`; `info()` gives phase, hold, flags, where
the gun and the rack are, whether the crew are clear, the forklift's state and every person's position and post.
`AISLE` (the far aisle, its two bays and the parks) lives in `crew.js`, as does the crew's rack (`buildRack`); `dist/pit-garage.js`
has `GUN_STAND` (where the gun stand is, with its second holster for the mechanic's gun).
`dist/car-motion.js` `WheelService` — `carrier` (asked before stands / nut / rack / refit / unlock; `hold` names what it
waits for; `SERVICE_WAITS` in `car-app.js` gives the words). `dist/car-app.js` — `crew=buildCrew(…)` in the studio,
`crewState()`, `advance(sec, step, until)` (the harness's fast-forward), `window.__cw.crew`.

**How to check it.** `node tests/crew.test.mjs` (63 assertions, ~340 s: the driver unchanged to the sum 1209.100938; the
walk through the bones; the looks' spread; three service cycles on both rear wheels; the forklift's slip, height, bays;
Reset mid-carry; the cards' words). `python3 tests/test_machine_tab.py` (the service with the crew in the page,
`window.__cw.advance` stepping the crew forward at 1/30 s because software GL draws seconds a frame). The scratchpad
harness `crew_shot.py` and `dryrun.py` (in `…/scratchpad/crew/`) took the stills and the dry run (`dry.log`: three
cycles, "Wait for the wheels to stop", "Service mode required", the forklift moved 0.92 m in the car view with its wheels
spun 3.0–4.2 rad, errors none, 308 s).

**Gotchas.** A software renderer draws a frame in seconds; never wait on the clock for the crew — use `__cw.advance`
with an `until`. The mechanic's gun is the SECOND gun: the garage's own stays in its holster. `CABIN_ENV` shading does
not apply to the crew (they stand in the hall, lit by it). The forklift's crossing pauses while the service phase is
wheelOff, inspect or refit, or a close-up is on; it does not pause for a cockpit view. The dock between 801 and 1023 px wraps to two rows (`car.css`,
measured at 820/900/970) — the row would not wrap with the Service step in it.

