Build ONE self-contained HTML file: an interactive 3D training game where the player unloads a 6 m transportable building, levels it on sloping ground and fits its steps, the way a Coates crew does it.

## Build rules (read first)
- Write the whole file in one reply: no placeholders, "...", TODO or "rest of the code here". About 1,500 lines; simple shapes beat detail.
- Build in this order, each part working before the next: renderer, lights and ground; HUD, STOP and error bar; steps and tap-to-place; safety rules; vehicles and crew; end card; tour, sound and quality.
- Every button on screen works (leave a feature out, leave its button out). Before finishing, check every import, function call and button handler exists.

## Scene
- 06:50 in a grassed park beside a beach-side street circuit (concrete barriers with plain hoardings, palms, beach). Keep scenery light. The ground falls 1 in 50 along the building (120 mm over 6 m).
- A holding strip, a park gate, cones, a walkway and a pad with four lay-down marks, one under each skid corner. Two approach lanes: A, the set route, puts the truck's driver side towards the walkway; B puts its passenger side there.
- A tilt-tray truck with a 6.0 x 3.0 m building on skids, about 2.7 m high (typical): one outward door on a long side, its centre about 1.4 m from the nearer end, 0.78 m swing. Stair, landing and handrail on the tray.
- Supervisor, spotter, two installers, an escort. Jacks (typical: four), timber blocks (typical: 100 mm, 22 kg), plastic packers (typical: 5, 10 and 20 mm).

## Gameplay (the checklist ticks each step)
1. **Arrive** (plays itself in 8 s, clock 06:50 to 06:58): the truck waits its turn in the holding strip (out of order = you wait), then at the park gate until the escort leads it in, beacons on, 10 km/h. Tick "Traffic control: Arranged" and "Route walked, looked up for branches and wires". Work unlocks at 07:00; then the clock runs at real speed.
2. **Take 5**: tap the pulsing ring on each hazard (soft ground, branches, pinch points, people), tick PPE (Cut-5 gloves), Confirm.
3. **Door side**: the load card, random each restart, reads "Door to driver side", "Door to passenger side" or "Door side not set": the side the door is on while loaded, ticked with the driver at the yard. The building comes off keeping its sides. The player picks Go (lane A) or Stop and confirm. Driver side: Go. Passenger side: Stop, and the supervisor re-plans to lane B. Not set: Stop, and the supervisor confirms with the yard. Never guess from the map. A wrong Go leaves the door facing away, red at the walk-round (-15); Restart is the only fix. A needless Stop costs 5.
4. **Zone**: cones round the drop and a spotter in the Safe Zone before Unload unlocks.
5. **Unload**: the arrows nudge the truck 0.1 m to line the skids up with the marks. Hold Unload: the tray tilts, the building winches back, the rear skids touch down, the truck creeps forward and the building settles (typical tilt-tray method; our buildings also come off by crane). Letting go pauses it.
6. **Jack**: locked until the player taps the supervisor and picks "Check jacks". The crew watch the jack pressure.
7. **Blocks and packers** under the skids, to the lay-down plan. Blocks are over 20 kg: "Two-person lift?" Yes sends both installers (3 s); "Carry alone" places it but costs 5.
8. **Level**: every readout green, then "Lower onto packers" (±5 mm is typical; the supervisor sets the real tolerance).
9. **Steps**: tap the door to fit the stair, then the landing, then the handrail.
10. **Handover walk-round**: tap to check the stairs to AS 1657 (treads and handrails), fire extinguisher, cleaning, power-on by a licensed electrician (test & tag, RCD) and a photo. "Hand over" stays grey until the steps are on: no steps, no handover.
- Steps are one array of { id, label, isDone(), complete() } used by the checklist, self-check and Practice. Only the current step's things can be tapped; a later step's thing shows a card saying why (-5) and does nothing else.
- Score starts at 100: mistake -5, safety stop -15, never below 0. The end card lists each deduction and reason, then score, time and the final level readings, with "Positioned and levelled" and "Steps installed" ticked.
- Crew and safety: the player is the leading hand. Tap a crew member (they glow), then tap the ground to send them (1.4 m/s); their card has "Make spotter". A spotter counts only inside the green Safe Zone ring; a translucent red disc marks the exclusion zone around the truck and building while they move. Anyone inside a red zone while something moves freezes everything, with a red card naming the problem, until the player presses STOP and taps the person to walk them out. The same freeze applies to anyone under a building on jacks without an approved support, any hand or foot between skid and ground, and a packer placed while a jack moves (hands stay out of pinch points). 6 s after the first jack raise, an installer starts to reach under the building.

## Levelling
- A rigid building with four corner heights in mm above a datum (FL, FR, RL, RR); draw its pitch over 6.0 m and roll over 3.0 m from them.
- Readouts: each long side shows front minus rear corner, each end left minus right. Green within ±5 mm, amber within ±15, red beyond.
- Tap a jack; each [ or ] press, or 0.25 s of hold, moves that corner 5 mm (0 to 300 mm). Twist = |(FL + RR) - (FR + RL)|; over 50 mm (typical), show "Twist: bring the low corners up" and stop the highest corner rising.
- Each mark shows the gap under the skid in mm; stack blocks and packers there. "Lower onto packers" sets each corner to its ground height plus its stack. Level ticks when all four readouts are within ±5 mm.

## Controls
- Laptop: drag to orbit, scroll to zoom, click to pick and place; the arrows nudge the truck; hold U to unload; tap a jack, then [ ] moves it down or up; Space STOP; F free look; 0 reframe; Esc closes cards.
- Phone (pointer: coarse): drag, pinch, tap. One bottom strip, max(20% of the view, 150 px) high, inside the safe-area insets: the nudge pad left, STOP centre (88 px round, #ff3b2f, always on top), Unload, Jack down and Jack up right. Restart, Free look, Tour, Sound, Quality and Help sit behind a 48 px Menu button top right. Top left shows only the current step (tap for the checklist); score and time in one small line top centre. Nothing wider than the screen.
- Input: a pointerup is a tap only if it moved under 8 px within 350 ms; taps pick and place, everything else goes to OrbitControls. No click events on the canvas; raycast one group of tappable things. touch-action and user-select none (with -webkit- versions and -webkit-touch-callout) on canvas and controls. Hold buttons: pointerdown with setPointerCapture starts; pointerup, pointercancel and lostpointercapture stop; stopPropagation. preventDefault on Space, arrows, [ and ]; held keys in a Set cleared on blur.
- OrbitControls: damping, distance 4 to 90, maxPolarAngle 1.45, no pan on phones, off during the tour or a card. The camera follows the truck, building or selected jack by adding its movement to camera.position and controls.target; Free look stops following; Reframe glides back in 0.8 s. A skippable 10 s tour opens the game.

## Look and feel
- Rounded shapes (RoundedBoxGeometry, 12- to 16-sided cylinders) with shared MeshStandardMaterials. Colours are the Coates brand: orange #F26222 and charcoal #1D1D1B. For orange paint on 3D objects start at color.setRGB(0.62, 0.115, 0.020, THREE.LinearSRGBColorSpace) (about #CE5F27), because #F26222 itself washes out towards yellow under the sun and tone mapping; tune it until it reads as #F26222 on screen.
- Lights to start from: hemisphere 0.6; sun 0xfff0e1 at 2.6, 25 degrees up, the only shadow caster, shadow camera ±35 m on the work; fill 0xc6deff 0.6; rim 0xffa36e 0.8; RoomEnvironment via PMREMGenerator at 0.5. Transparent canvas over a CSS sky gradient #62a5ce, #bcdde9, #e9eeea; Fog(0xe9eeea, 65, 680). Ground markings 2 cm up with polygonOffset.
- People: capsules and boxes in hi-vis, hard hat, glasses, gloves, boots and long sleeves; limbs swing in step with walking speed; no skeletons, IK or models; build one, clone it.
- UI: panels charcoal #1D1D1B, 5 px Coates orange #F26222 top border, text #f7f8f8, status #ff3b2f / #ffb300 / #2ee56f, Arial, 44 px targets, plain words. CanvasTextures use SRGBColorSpace.
- "Coates" appears in plain text only on the building, the crew's vests and the site board; the truck carries no company name. No logos and no other company, series or sponsor names. Corner note: "Illustrative training scene · not a procedure · nothing here sends or changes anything."

## Technical
- One file, no build step, no API keys. The only network requests are three.js r170 from jsDelivr, exactly like this, with no other scripts, CDNs or versions:
<script type="importmap">
{ "imports": {
  "three": "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js",
  "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/"
} }
</script>
<script type="module">
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
// all game code goes in this one module
</script>
- r170 API: one WebGLRenderer({ antialias: true, alpha: true }), never recreated; outputColorSpace = THREE.SRGBColorSpace; ACESFilmicToneMapping, exposure 1.02; PCFSoftShadowMap. No outputEncoding, sRGBEncoding or THREE.Geometry.
- Don't use: loaders, FontLoader or TextGeometry, Water, Sky or Reflector, HDR files, EffectComposer or post-processing, physics engines, MeshPhysicalMaterial, PointLight or SpotLight, web fonts, image or audio files, alert, confirm or prompt. Falls, gusts and tips are keyframed; beacons are pulsing emissive; repeats use InstancedMesh.
- Page: viewport meta with viewport-fit=cover; html, body { margin:0; height:100%; overflow:hidden; overscroll-behavior:none }; canvas { display:block; position:fixed; inset:0 }.
- Before the importmap, a plain (non-module) script shows a red error bar with a Copy button for any error or unhandledrejection, and after 40 s, unless the module has set window.__drawn = true, "The 3D didn't start. It needs Chrome, or Safari on iOS 16.4 or newer." with Try again.
- On webglcontextlost: preventDefault, show "Graphics paused", offer Reload after 4 s; never make a second renderer. Use setAnimationLoop; stop it and all holds while hidden; clamp delta to 0.05 s.
- Build every mesh, material, texture and listener once. Restart only resets positions, visibility, steps, score, timers and crew; changed text redraws its own canvas.
- Quality has three levels and opens on Balanced. Low: pixel ratio 1, no shadows, 30 fps cap. Balanced: at most 1.5x and 1.8 MP, 1024 shadows. High: at most 2x, 2048 (phones: as Balanced). Phones about 1.3 MP, 0.5 MP while moving. Guard: after a 6 s warm-up, 3 one-second samples under 24 fps in a row drop a level, then wait 6 s; never raise or stop the 3D.
- Reduced motion: no tour, Reframe jumps. Sound is off until tapped; create the AudioContext in that tap. Keep Quality and Sound in localStorage inside try/catch.

## Help, checks and done
- Help shows live FPS, draw calls, triangles, geometries and textures (renderer.info). Buttons: "Test someone under the building" fires the safety event now; "Practice: finish this step" (flagged on the end card); "Run self-check" resets, drives the steps in code, lists PASS/FAIL, then restarts 10 times, a frame each, and compares geometries and textures.
- Self-check lines: no Unload without cones and a spotter in the Safe Zone; jacks stay locked until the supervisor checks them; twist over 50 mm warns; a packer placed while a jack moves freezes the job; someone under the building freezes the job; a wrong door decision is caught; packing to within ±5 mm completes Level.
- Done when: every self-check line passes; no red error bar in Chrome or Safari, laptop or phone; taps alone finish the job; Test someone under the building freezes everything until STOP and the person is cleared; on a phone, portrait or landscape, no sideways scroll and STOP always visible.