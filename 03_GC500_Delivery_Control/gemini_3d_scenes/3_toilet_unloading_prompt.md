Build ONE self-contained HTML file: an interactive 3D training game where the player forklifts portable toilets off a supplier's truck into neat rows at a meet point beside a beach-side street race circuit, the way a Coates crew does it.

## Build rules (read first)
- Write the whole file in one reply: no placeholders, "...", TODO or "rest of the code here". About 1,500 lines; simple shapes beat detail.
- Build in this order, each part working before the next: renderer, lights and ground; HUD, STOP and error bar; steps and tap-to-place; safety rules; vehicles and crew; end card; tour, sound and quality.
- Every button on screen works (leave a feature out, leave its button out). Before finishing, check every import, function call and button handler exists.

## Scene
- 07:40 at a meet point by a closed street circuit (concrete barriers with plain hoardings, yellow and white water-filled barriers, palms, beach). Low branches overhang part of the drop area. Keep scenery light.
- The toilet supplier's truck with 24 single portable toilets in two rows of 12, strapped, doors to the back of the truck. Each about 1.2 x 1.2 m and 2.3 m high with forklift slots in the base (truck type, strapping, size and slots all typical). This meet point takes 8: the HUD starts at "Left on truck: 24" and the job ends at 16, when the truck drives on to its next meet point.
- Ground marks for two rows of four, 1.5 m apart centre to centre (typical 300 mm gaps), a walkway and a running lane kept clear.
- A Coates-orange forklift with an amber beacon; operator, a separate spotter and one more crew member. Site board: "Max 2 trucks unloading · 4 people, 2 forklifts · at least 2 people per unload".

## Gameplay (the checklist ticks each step)
1. **Arrive**: the truck reaches the named meet point within site hours (07:00 to 17:00) and a Coates crew member walks out to meet it, because Coates places the units. Load card: "Unloaded by 09:00 · allow at least 30 min (about 5 min a unit)". Traffic control: "To confirm". The clock runs at 6 times real speed. Score safe, steady work, never speed; passing 09:00 shows an amber "Past the unloaded-by time" card (-5).
2. **Take 5**: tap the pulsing ring on each hazard (branches, people, uneven ground), tick PPE, Confirm.
3. **Set up**: exclusion zone, spotter in the Safe Zone, then tap the spotter and pick "Agree hand signals".
4. **Straps**: tap "Fall protection on" before anyone gets on the tray; every load has rated straps. Tap straps to release them (typical: one at a time, checking nothing has shifted); tapping another while one is releasing shows "One strap at a time" (-5).
5. **Pick and carry** (typical forklift practice; see Forklift). 6. **Place** on the next mark (see Placement). 7. **Repeat** until "Left on truck: 16".
8. **Check rows**: straight, doors right, running lane clear; misses glow amber with a reason.
9. **Truck away**: remaining load restrained and straps checked, deck clean of sand, mud and oil, nothing loose.
- Steps are one array of { id, label, isDone(), complete() } used by the checklist, self-check and Practice. Only the current step's things can be tapped; a later step's thing shows a card saying why (-5) and does nothing else.
- Score starts at 100: mistake -5, safety stop -15, never below 0. The end card lists each deduction and reason, then score, time and placement accuracy.
- Crew and safety: the player is the leading hand. Tap a crew member (they glow), then tap the ground to send them (1.4 m/s); their card has "Make spotter". A spotter counts only inside the green Safe Zone ring; a translucent red disc marks the exclusion zone around the forklift and its load. Making the forklift operator the spotter locks the forklift: "Confirm a separate external spotter during forklift operation." Anyone inside a red zone while something moves freezes everything, with a red card naming the problem, until the player presses STOP (tynes down, brake) and taps the person to walk them out. Walk-in: on the third trip, a member of the public (no hi-vis) walks towards the red zone.

## Forklift
- Arcade driving: 2.5 m/s empty, 1.5 m/s loaded, turning 50 degrees a second; tynes 0 to 3.5 m; tilt back 5 degrees. Simple box checks stop it driving through the truck, units or barriers.
- Pick: a unit attaches only when the forklift is within 15 degrees of square, its centre line within 0.15 m, the tynes at slot height within 0.05 m and in at least 1.0 m; otherwise "Tynes not fully in". Only a unit with nothing in the way on that side can be picked.
- Carry: over 3 m from the truck with the load over 0.3 m up shows "Travel low" (-5); moving loaded without tilt back, "Tilt back" (-5); the mast top above 3.2 m under the branches, "Branch strike" (-15) and the forklift stops.
- A carried unit keeps its direction relative to the forklift, so the player sets the door by how they approach and turn.

## Placement
- No snapping. Within 100 mm and 5 degrees of the mark earns full marks; within 300 mm and 15 degrees, half; worse shows "Re-place". Doors face the walkway within 20 degrees (the supervisor's call on the day; our drawings don't fix the door side).
- A hard set-down (full-speed lowering in the last 0.2 m) or a tip (turning at over half speed with the load above 1 m) plays a 1.5 s keyframed gag: the door swings open and a toilet roll bounces out and unrolls a 2 m white strip (-10).

## Controls
- Laptop: drag to orbit, scroll to zoom, click to pick and place; W/S or up/down drive; A/D or left/right turn; [ ] tynes down/up; T toggles tilt back; Space STOP; F free look; 0 reframe; Esc closes cards.
- Phone (pointer: coarse): drag, pinch, tap. One bottom strip, max(20% of the view, 150 px) high, inside the safe-area insets: the drive pad left, STOP centre (88 px round, #ff3b2f, always on top), Tynes up, Tynes down and Tilt right. Restart, Free look, Tour, Sound, Quality and Help sit behind a 48 px Menu button top right. Top left shows only the current step (tap for the checklist); score and time in one small line top centre. Nothing wider than the screen.
- Input: a pointerup is a tap only if it moved under 8 px within 350 ms; taps pick and place, everything else goes to OrbitControls. No click events on the canvas; raycast one group of tappable things. touch-action and user-select none (with -webkit- versions and -webkit-touch-callout) on canvas and controls. Hold buttons: pointerdown with setPointerCapture starts; pointerup, pointercancel and lostpointercapture stop; stopPropagation. preventDefault on Space, arrows, [ and ]; held keys in a Set cleared on blur.
- OrbitControls: damping, distance 4 to 90, maxPolarAngle 1.45, no pan on phones, off during the tour or a card. The camera follows the forklift or load by adding its movement to camera.position and controls.target; Free look stops following; Reframe glides back in 0.8 s. A skippable 10 s tour opens the game.

## Look and feel
- Rounded shapes (RoundedBoxGeometry, 12- to 16-sided cylinders) with shared MeshStandardMaterials. Colours are the Coates brand: orange #F26222 and charcoal #1D1D1B. For orange paint on 3D objects start at color.setRGB(0.62, 0.115, 0.020, THREE.LinearSRGBColorSpace) (about #CE5F27), because #F26222 itself washes out towards yellow under the sun and tone mapping; tune it until it reads as #F26222 on screen.
- Lights to start from: hemisphere 0.6; sun 0xfff0e1 at 2.6, 25 degrees up, the only shadow caster, shadow camera ±35 m on the work; fill 0xc6deff 0.6; rim 0xffa36e 0.8; RoomEnvironment via PMREMGenerator at 0.5. Transparent canvas over a CSS sky gradient #62a5ce, #bcdde9, #e9eeea; Fog(0xe9eeea, 65, 680). Ground markings 2 cm up with polygonOffset.
- People: capsules and boxes in hi-vis, hard hat, glasses, gloves, boots and long sleeves; limbs swing in step with walking speed; no skeletons, IK or models; build one, clone it.
- UI: panels charcoal #1D1D1B, 5 px Coates orange #F26222 top border, text #f7f8f8, status #ff3b2f / #ffb300 / #2ee56f, Arial, 44 px targets, plain words. CanvasTextures use SRGBColorSpace.
- "Coates" appears in plain text only on the forklift, the crew's vests and the site board; the supplier's truck carries no company name. No logos and no other company, series or sponsor names. Corner note: "Illustrative training scene · not a procedure · nothing here sends or changes anything."

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
- Help shows live FPS, draw calls, triangles, geometries and textures (renderer.info). Buttons: "Test walk-in" fires the safety event now; "Practice: finish this step" (flagged on the end card); "Run self-check" resets, drives the steps in code, lists PASS/FAIL, then restarts 10 times, a frame each, and compares geometries and textures.
- Self-check lines: making the operator the spotter locks the forklift; a walk-in during movement freezes the job; the mast up under the branches warns; placing 8 units takes Left on truck from 24 to 16.
- Done when: every self-check line passes; no red error bar in Chrome or Safari, laptop or phone; taps alone finish the job; Test walk-in freezes everything until STOP and the person is cleared; on a phone, portrait or landscape, no sideways scroll and STOP always visible.