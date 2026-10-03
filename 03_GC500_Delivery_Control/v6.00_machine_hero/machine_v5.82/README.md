# The Coates Way — original GC500 #26 V8

The car now uses the exact geometry and lettering extracted from Andrew’s supplied GC500 live application on 22 September 2026. The earlier generic shell has been replaced. The original black body, orange bonnet and roof, wing, wheels, yellow numbers, Coates lettering and Fisher window name are retained.

## 23 September 2026 — the cog is the steering wheel, in a cockpit you sit in

The cog is off the engine and on the column, as the #26's steering wheel (Andrew Fisher: the cog becomes the
steering wheel, because it operates everything, so the cog comes off the engine). The third view is the
cockpit: the camera in the driver's seat, the car and the pit garage around it; a drag on the wheel steers through
the shaft, the rack and the tie rods; the panel's switches, the wheel's buttons and the sequential lever work; the
display reads the machine's own state; a touch on a section of the cog opens its meaning. 272 parts (138 in the
mechanism, 134 car references). 24 Sep: *Take the wheel apart* lifts the rim and then the plates off the column
in their order — the cog as the exhibit showed it on its axis, now on the column — with the camera stepping
across the cabin to look; the driver's hands are on the rim and turn with it, go to the lever for a gear change,
and rest with the wheel apart; in the seat the driver is you (helmet off the camera, arms in view), in the
study's black-and-orange Coates suit. `CLAUDE_HANDOVER.md` has the detail; the counts below this heading are from
the earlier corrections and are kept as the record of them. Later on 24 Sep (v5.80): 310 parts — the quick-release, clock spring, angle sensor and front bearing as 38 parts that come off in order; the original mechanism on the column under the dash, turned by the wheel; pedals, gauges, the key, the shift rod and the V8's rumble in the cockpit; a six-speed sequential box you can see into.

**24 Sep 2026, afternoon (v5.81) — the cockpit makeover and the wheel service.** Andrew Fisher approved the makeover
(the Coates Way steering wheel had to look outstanding) and set a workshop brief for taking a wheel
off. *The look:* the dash, console, pods and seat shells are a generated 2×2 carbon twill, 4 mm a tow on the car (UVs in
metres; `cockpit-surfaces.js`, re-exported by `car-scene.js`), clear-coated, with the cabin's reflections shaded to 40 %
because the environment is the garage captured with the car removed; the switch panel is brushed black anodised
aluminium with a printed label sheet and an engraved COATES #26 plate; the display sits behind a bezel and a dark,
anti-glare glass and is laid out so everything the driver reads clears the rim; the knob, pedals, toggles and
quick-release are machined aluminium; the cage is padded by the driver, the door has a woven window net, the harness has
webbing, adjusters and a camlock, the fire bottle its head and gauge, and a warm fill light hangs in the cabin. *The
wheel:* the rim was enlarged so the cog's teeth sit inside it (4.7 mm clear), in alcantara with moulded grips and finger
grooves, an inner-edge stitch and the marker; the four buttons sit on a carbon faceplate in the cog's valleys, with
machined bezels and printed labels; a turned boss carries the plates. *The arms and eye:* tapered forearms (45 → 35 mm)
with a banded sleeve; the eye 5 cm back and a 62° lens. *The wheel service* (`car-motion.js` `WheelService`; the dock's
Service button or W): isolate (the drive locked out) → supported on two jack stands → the nut off and the rear wheel
out along its axle and onto its stand, leaving the hub, the brake disc (now on a hub group, not the wheel) and the
stationary caliper on the car → inspect (callouts name them) → refit and torque → ready; every refused step says why
("Wait for the wheels to stop", "Service mode required", "Refit wheel before starting"). The wheel is laid flat on its
stand rather than lowered upright, because on the dyno an upright tyre is already at floor level. Tests: `car.test.mjs`
three service cycles (the caliper, disc and hub still to 0 m, the rotor home to 1e-16); `engine.test.mjs` the twill
measured at 4 mm, the display's sightline over the measured rim, the forearm taper and a cockpit budget (267 draws with the v5.82 radio, speedo and key,
51.4 k triangles; cap 270 / 60 k); `tests/test_machine_tab.py` the service in the browser, three cycles. Details:
`CLAUDE_HANDOVER.md` and `docs/COATES_WAY_v581_machine_notes.md`. Hardware frame rate is still unmeasured.

**24 Sep 2026, later (v5.81) — the crew.** Andrew Fisher: animated crews, full steam ahead. Six
people and a Coates forklift in the hall (`crew.js`, `pit-garage.js`), generated on the driver's own lofts and canvases —
no downloaded figure, nobody's name — each one skinned draw on a 19-bone skeleton, the whole crew in 18 draws: the
telemetry operator (seated, helmeted on purpose, whose screens show the machine's own state and the service's checklist
and say SERVICE COMPLETE), the wheel mechanic (who starts only once the car is on its stands; gun from the stand, nut
off, the wheel to the rack and back, torqued, gun home), the pit technician (the jack stands and the rack), the engine
technician (at the nose while the V8 runs), the crew lead (tablet; holds the crew at isolation, points out the hub,
and gives the all-clear the drive waits for — only once the others are clear) and the forklift operator (a tyre cage
between two marked bays along the far aisle, forks low, wheels turning by their own ground travel, held still while a
wheel comes off). The wheel service asks the crew before each step it cannot take alone and says on the dock line who
it is waiting for. The walk cannot slide (the stance foot is pinned; speed = stride × cadence, 1.25 m × 0.96 Hz); no
two helmets turn on the same beat. `tests/crew.test.mjs` (63 assertions, three service cycles with the crew as carrier,
the forklift's slip under 0.8 %) and the tab test in the browser. Written as v5.82 while it was built; in v5.81 on his
word. Details: `docs/COATES_WAY_v581_machine_notes.md`.

## Current correction

- `dist/assets/gc500/original-car.js` contains the original model and livery code; `provenance.json` records its source URL and hash. No delivery records or other application data are copied.
- `car-gc500.js` adapts the original 180,206 triangles, including decals, into 20 removable body/wheel assemblies. Only orientation, uniform unit conversion and panel ownership change. The full original car is restored by switching off cutaway.
- The cutaway removes the bonnet, near front fender and nose. A section through the lower near door reveals the driveline while retaining Coates, 26 and Fisher. Cooling assemblies and valve covers are concealed for inspection and remain selectable.
- `car-fit.js` fits the illustrative V8, larger original cog and drivetrain beneath the original bonnet, aligns the running gear with the original wheelbase and retains the original cockpit and cage.
- All 237 component entries, original 128-part mechanism, exact wording, interlocks, teardown, sound and export controls remain. Some entries are subassemblies.

## Validation

`tests/gc500-source.test.mjs` verifies the source hash, all 43 original mesh/decal groups, original livery alpha pixels and transformed vertex positions, including the reparented cockpit. Maximum measured vertex discrepancy: 0.0000002472 m from float conversion. Paint boundaries are copied from the live source shader.

`tests/car.test.mjs` passes all 237 restart interlocks and 109 selectable car/engine entries, wheel/caliper separation and held poses. Complete car/engine geometry before installation trimming: 261,398 triangles and 241 draws. The original mechanism adds 383,143 triangles. These are geometry counts, not measured frame rates.

`tests/engine.test.mjs` checks references, cam contact, rod positions and every sampled closed-bonnet column, including the larger cog. Minimum bonnet clearance: 15.43 mm across 83,501 sampled columns. Maximum cam/follower contact discrepancy: 0.0062 mm. These are geometric illustration checks; comprehensive internal collision checking has not been performed.

CPU renders made directly from the actual meshes verify the complete car and cutaway composition. The cutaway render is also the browser fallback image. It is not a WebGL screenshot: its simplified lighting and sampled paint differ from the browser renderer. The managed browser has WebGL disabled; browser shader output, 3D interaction, audio, capture and hardware frame rate still require a capable device. No photorealistic-finish claim is made.

## Run and hand over

Production is `dist/`. In an ordinary terminal use `npm ci`, then `npm run dev`. In the managed environment use the Sites supervised preview. Use HTTP, not direct file loading. `mechanism.html` preserves the original cog experience.

`tools/package-claude.py` builds `dist/Coates_Way_GC500_V8_Claude_Pack.zip`, available in the footer. It includes source and references without Git history, dependencies or credentials. `tools/render-car.mjs` and `tools/raster-car.cpp` are optional CPU inspection utilities; their large binary intermediates stay outside the repository.

The sourced GC500 car itself is original parametric geometry, not manufacturer CAD. Its illustrative overhead-cam mechanical installation is not a verified specification of a racing Camaro engine. Gearbox/differential internals and suspension dynamics remain future work. The generated cinematic reference is a visual target, not a screenshot of the build.

Keep the exact cog artwork hash `601b19f8be7bd63c70a0442e0570f294fa7db110676bfaddc52ed2d724ff63ed`, source car identity, stable references and current Site audience. Andrew handles any Railway upload; the live delivery application was only read.

---

# Retained original mechanism — reference documentation

A browser-based 3D interpretation of the supplied Coates Way presentation, with 128 individually selectable and removable physical components. The four information rings attach to four visible dog couplings around a common drive. A motor assembly contains its shaft, coupling, bearing, rotor, copper windings, fan, guards, covers, fasteners, key and mounting base.

## Run

Use `npm ci`, then `npm run dev`. Production is the static `dist/` directory, served over HTTP. Three.js r170 and OrbitControls are vendored with their licence. The import map and Vite alias both resolve to that local Three.js copy. There are no paid model services or external runtime model downloads.

## Explore

- Start/stop the motor and adjust its speed. The motor and sun run at four times the output speed; four planets spin and orbit; stationary housings stay fixed.
- Orbit, zoom, choose front/motor views, select any component, and focus or isolate it.
- Choose Gearbox for a close view of the working 4:1 reduction, with its cover and clutch hidden for visibility. Input and output RPM are displayed.
- Staged teardown withdraws covers and couplings first, then the carrier, gearset and information rings. Seven separate clutch plates spread during teardown; each plate, pressure bolt and return spring can also be removed independently.
- Pull a selected part, turn it independently, or separate the full assembly. Parts wait for the motor to stop before withdrawing. Any missing component prevents restart.
- Reassemble: detached parts align to the drive before seating. A detached ring holds its angle when the remaining connected drive is turned manually.
- See inside the motor, follow the moving drive with an orange highlight, or use slow motion at 15% speed.
- Follow the guided tour or enable synthesized motor sound.
- Export the current view to a 3840 × 2160 PNG using the same tone mapping as the live canvas. This is an export resolution, not a real-time performance promise.
- Read the original business content and eight KPI targets.

Laptop mode is the default: drawing pixel ratio capped at 1, 1024px shadows and a 30 fps cap. Balanced and High allow a 60 fps cap with pixel ratios up to 1.4 and 2; High uses 2048px shadows. Actual frame rate and drawing dimensions are shown in the footer. Caps are not performance guarantees. The four faces share the original 1179 × 1179 PNG from the supplied presentation, embedded without changing a byte. This preserves its lettering, wordmark and colours. It is not native 4K artwork; a 4K capture cannot add source detail.

Keyboard, mouse and touch controls are described in the app. Startup and sound require user actions. Camera transitions respect reduced-motion preferences. If WebGL is unavailable, the original reference artwork and readable business content remain available.

## Implementation

`dist/drive.js` is a deterministic 120 Hz state simulation. `dist/parts.js` defines all 128 components and their CW references and their assembly positions. `dist/model.js` loads the locally packaged uncompressed GLB, preserves part pivots, combines each part’s primitives, and loads an original HDR studio environment. The original diagram’s outline defines the seven teeth and its printed face is split across four independently moving plates. Face materials bypass lighting, fog and tone mapping to preserve source colours; the edges and motor retain physical materials. The assembled model has 171 mesh objects, 206 material draw calls and 383,143 rendered triangles including instanced details. The original GLB is supplemented by the procedural gearbox in `dist/mechanics.js` and independently removable service hardware in `dist/service-parts.js`. `dist/poses.js` resolves host anchors, orbit angles, extraction motion and smooth reattachment. Brushed-metal and enamel bump textures are generated deterministically. `dist/app.js` owns scene lighting, camera, interaction, sound and capture.

This is an interactive operating-model illustration, not an engineering or collision simulation. Mechanical details and speeds are demonstrative. The generated concept image is an artistic target; it is not a screenshot of this live browser renderer.

## Verification

Run `node tests/drive.test.mjs`, `node tests/model.test.mjs`, `node tests/artwork.test.mjs` `node tests/gears.test.mjs` and `node tests/service.test.mjs`.

Drive tests cover all 128 restart interlocks, stopping before physical withdrawal, held detached angles, independent rotation, stationary housings, coupled manual rotation, reassembly alignment, bounded catch-up and matching results at 30/60/120 display frames per second.

Asset tests validate every mesh attribute and index, local bounds, component positions, material groups, texture count and HDR decoding. Artwork tests compare the embedded PNG byte-for-byte with the original, verify its recorded SHA-256 and check the UV coordinates of every printed-face vertex. JavaScript syntax checks pass.

The managed preview browser reports WebGL as disabled. The UI loads, all 128 components populate the selector, and the original KPI content remains readable in fallback mode. Actual GPU rendering, pointer picking against rendered geometry, audio and the 4K capture still require verification on a WebGL-capable device. Surface Pro frame rate and photorealistic fidelity are not certified.

## Source fidelity

The four rings, four POAF pillars, seven traits and eight KPI targets follow the supplied June 2026 presentation. Fleet time utilisation is 65%, employee engagement is 65+, and redline is <15%. Targets are reference benchmarks, not live performance data.

## Exact source artwork correction

The previous reconstructed artwork was replaced because it reversed inner labels, rotated outer text incorrectly, changed the wordmark and tinted the colours. `tools/extract-cog-outline.py` traces the unmodified PNG into geometry metadata. `tools/restore-original-cog.mjs` replaces the four plates in an original GLB, embeds that same PNG and keeps the motor components. The provenance record includes the source hash and measured palette. No generated lettering is used in the current model.

## Advanced planetary mechanism

The fixed annulus has 72 teeth, the input sun has 24, and each of four planets has 24. Their module is shared. The sun and motor turn at 4× the carrier/cog angle. Planets orbit at carrier speed and spin at −2× carrier speed, with tooth phase offsets. The 4:1 reduction follows `1 + ring/sun`; both sun/planet and ring/planet relative-speed constraints are checked. Profile generation uses sampled 20° involute flanks with illustrative clearance.

The gearbox, bearing cartridges, carrier pins, cover, clutch and extended mounting base are rendered geometry. The original seven-tooth Coates graphic is preserved and is not used as a meshing involute gear. Gear tooth-clearance tests sample 30,576 points through a motion cycle; they are not a manufacturing, strength, lubrication, load or full collision certification. The teardown remains a guided visual sequence.

Technical references: [KHK Gear Systems](https://khkgears.net/new/gear_knowledge/gear_technical_reference/gear_systems.html), [KHK Gear Types and Characteristics](https://khkgears.net/new/gear_knowledge/abcs_of_gears-b/gear_types_and_characteristics.html), and [KHK Internal Gears](https://khkgears.net/pdf/internal-tech.pdf).

## 128-part service edition

The count is 128 actual physical entries, each with visible mesh geometry, a unique CW reference, individual selection, a pull state and a restart interlock. Wording hotspots are **not** included in that count. There are four Coates cog plates, nine output-drive components, 23 motor components, 71 planetary-gearbox components, 20 clutch components and one mounting base. Some retained components are subassemblies; this is not a claim that every triangle-level detail or every ball in the four planet bearings has become a separate service part.

The formerly grouped motor cover fasteners are now 16 individual threaded bolts. The new service breakdown includes 12 annulus bolts, 12 inspection-cover bolts, six sun screws, four carrier pins and four pin bolts, six input-bearing bolts, fourteen input-bearing balls, two races, two retaining rings, seven clutch plates, six clutch pressure bolts and six helical return springs. Geometry is shared between repeated parts without sharing their movement or removal state.

The searchable register covers every part and 29 verbatim wording references located on the four original Coates plates. CW references are internal identifiers for this experience, not official Coates procurement SKUs. `dist/parts-register.csv` contains both kinds of record, explicitly distinguished. The UI supports assembly filtering, reference search, click-to-inspect, return-to-host navigation, a connection counter and a next-loose-part action. Selecting small hardware from the register isolates it for close inspection, with camera tracking while it is withdrawn.

Mounted service parts follow their host. An individually withdrawn pin keeps its mounting angle when the connected carrier is manually turned; a loose screw stays put when its former cover is withdrawn. Installed screws accompany a removed cover when that cover is turned by hand. Reattachment blends back onto a returning host rather than jumping at the final frame. Fasteners release before the three bolted covers start moving in global teardown.

The input bearing uses an illustrative no-slip radial contact model: inner race contact radius .34 at 4× output speed, outer race contact radius .46 fixed, balls radius .06 at centre radius .4. Ball orbit speed is 1.7× output and absolute ball spin is −34/3× output. Tests verify equal tangential velocity at both contacts. This simplified contact relation does not model bearing dynamics, loads, friction, lubrication or tolerances.

Service tests raycast actual geometry for every one of the 128 references and verify independent removal, host motion, held detached geometry, smooth reassembly and distinct clutch plate positions. The geometry remains below 400,000 rendered triangles and 240 material draws. The managed browser confirms register search, exact wording lookup, component selection and the WebGL-unavailable fallback; it cannot certify live GPU rendering or laptop frame rate.
