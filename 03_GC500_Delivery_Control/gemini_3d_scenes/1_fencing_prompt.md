Build ONE self-contained HTML file: an interactive 3D training game where the player puts up temporary mesh fencing beside a beach-side street race circuit, the way the fencing crew does it on our job (the fence is hired in, and Coates checks and signs off the work).

## Build rules (read first)
- Write the whole file in one reply: no placeholders, "...", TODO or "rest of the code here". About 1,500 lines; simple shapes beat detail.
- Build in this order, each part working before the next: renderer, lights and ground; HUD, STOP and error bar; steps and tap-to-place; safety rules; vehicles and crew; end card; tour, sound and quality.
- Every button on screen works (leave a feature out, leave its button out). Before finishing, check every import, function call and button handler exists.

## Scene
- 07:10 by a closed beach-side street circuit: concrete barriers with plain hoardings, red-and-white kerbs, palms, beach, a flat blue sea. Keep scenery light.
- A plain flat-deck truck (typical) with packs of mesh panels, feet (blocks), clamps, stays and black shade cloth (scrim). A forklift with an amber beacon on 1.8 m tynes (no extensions). Operator, spotter, two installers, and a supervisor at the sign-off board.
- Chalk line, left to right: panels 1 to 8, a gate bay, panels 9 to 16; 17 bays of 2.5 m (42.5 m), panels 1.8 m high. Joints are the 16 points between bays, numbered from the left; the two outer ends are open ends. The gate is one leaf on two hinge clamps from panel 8, latching to panel 9 (no clamp on the latch joint). Bays 12 to 14 sit on an amber strip drawn tilted 3 degrees; parts there still snap to the line.
- Panels: a rounded tube frame plus one mesh plane sharing one CanvasTexture grid (alphaTest 0.5, DoubleSide, no shadow); never wires or cylinders.
- Parts follow our planning guide (label it "Planning guide: an allowance, not the installer's method"): a foot at every joint and open end (none at the gate's free end); one clamp per fixed joint; two hinge clamps; a stay, with its own foot, at joints 1, 3, 5, 7, 10, 12, 14 and 16 (every second fixed joint), at joints 8 and 9 beside the gate, and two at each open end. Keep layout and rules in one array and compute every "needed" count from it (32 feet, 16 clamps, 14 stays); show them on Help. The end card also shows, for comparison, a real signed 40 m braced-and-scrimmed run of 16 panels: 32 feet, 29 clamps, 8 stays.

## Gameplay (the checklist ticks each step)
1. **Take 5**: tap the pulsing ring on each hazard (traffic, slope, wind, people), tick PPE, Confirm.
2. **Unload**: once a spotter who isn't the operator stands in the Safe Zone, tap the panel pack and hold GO. The forklift drives a fixed path at walking pace, tynes low, to the run start; letting go stops it.
3 to 6. **Feet, Panels, Clamps, Stays**: pick a type in the tray, then tap a glowing slot (slots show only for the current step). After three correct, "Place the rest" finishes that type. Tapping a misplaced part removes it.
7. **Shade cloth**: the same metres as the panels (40 m, not the gate), fixed to the panels (typical: zip ties). Brace first: scrim catches wind.
8. **Gate**: hang it on its two hinge clamps, then tap it to swing open 90 degrees and shut over 1.5 s.
9. **Walk the line**: an installer walks the run in 10 s; misses glow amber ("Joint 7 not clamped"). Tapping the amber strip offers "Flag to supervisor" (ticks) or "Looks fine" (-5: "Don't guess on a slope: flag it"). The board then reads "Braced & scrimmed: 40 m".
- Steps unlock in order, except Shade cloth unlocks once every clamp is on, stays or not. A bay is braced if either end has a stay. 5 s after cloth goes on an unbraced bay, a gust tips it to 80 degrees about its feet in 1 s: "Bay 13 had no stay: brace before cloth" (-15). The player adds the stay, then taps the bay to stand it up.
- Steps are one array of { id, label, isDone(), complete() } used by the checklist, self-check and Practice. Only the current step's things can be tapped; a later step's thing shows a card saying why (-5) and does nothing else.
- Score starts at 100: mistake -5, safety stop -15, never below 0. The end card lists each deduction and reason, then score, time and parts used versus needed.
- Crew and safety: the player is the leading hand. Tap a crew member (they glow), then tap the ground to send them (1.4 m/s); their card has "Make spotter". A spotter counts only inside the green Safe Zone ring; a translucent red disc marks the exclusion zone around the forklift. Making the forklift operator the spotter locks the forklift: "Confirm a separate external spotter during forklift operation." Anyone inside a red zone while something moves freezes everything, with a red card naming the problem, until the player presses STOP (tynes down, brake) and taps the person to walk them out. Walk-in: 4 s after GO is first held, a member of the public (no hi-vis) walks towards the red zone.

## Controls
- Laptop: drag to orbit, scroll to zoom, click to pick and place; hold G for GO; Space STOP; F free look; 0 reframe; Esc closes cards.
- Phone (pointer: coarse): drag, pinch, tap. One bottom strip, max(20% of the view, 150 px) high, inside the safe-area insets: GO left, STOP centre (88 px round, #ff3b2f, always on top), the parts tray (Feet, Panels, Clamps, Stays, Cloth, Gate) right. Restart, Free look, Tour, Sound, Quality and Help sit behind a 48 px Menu button top right. Top left shows only the current step (tap for the checklist); score and time in one small line top centre. Nothing wider than the screen.
- Input: a pointerup is a tap only if it moved under 8 px within 350 ms; taps pick and place, everything else goes to OrbitControls. No click events on the canvas; raycast one group of tappable things. touch-action and user-select none (with -webkit- versions and -webkit-touch-callout) on canvas and controls. Hold buttons: pointerdown with setPointerCapture starts; pointerup, pointercancel and lostpointercapture stop; stopPropagation. preventDefault on Space, arrows, [ and ]; held keys in a Set cleared on blur.
- OrbitControls: damping, distance 4 to 90, maxPolarAngle 1.45, no pan on phones, off during the tour or a card. The camera follows the forklift, pack or current part by adding its movement to camera.position and controls.target; Free look stops following; Reframe glides back in 0.8 s. A skippable 10 s tour opens the game.

## Look and feel
- Rounded shapes (RoundedBoxGeometry, 12- to 16-sided cylinders) with shared MeshStandardMaterials. Colours are the Coates brand: orange #F26222 and charcoal #1D1D1B. For orange paint on 3D objects start at color.setRGB(0.62, 0.115, 0.020, THREE.LinearSRGBColorSpace) (about #CE5F27), because #F26222 itself washes out towards yellow under the sun and tone mapping; tune it until it reads as #F26222 on screen.
- Lights to start from: hemisphere 0.6; sun 0xfff0e1 at 2.6, 25 degrees up, the only shadow caster, shadow camera ±35 m on the work; fill 0xc6deff 0.6; rim 0xffa36e 0.8; RoomEnvironment via PMREMGenerator at 0.5. Transparent canvas over a CSS sky gradient #62a5ce, #bcdde9, #e9eeea; Fog(0xe9eeea, 65, 680). Ground markings 2 cm up with polygonOffset.
- People: capsules and boxes in hi-vis, hard hat, glasses, gloves, boots and long sleeves; limbs swing in step with walking speed; no skeletons, IK or models; build one, clone it.
- UI: panels charcoal #1D1D1B, 5 px Coates orange #F26222 top border, text #f7f8f8, status #ff3b2f / #ffb300 / #2ee56f, Arial, 44 px targets, plain words. CanvasTextures use SRGBColorSpace.
- "Coates" appears in plain text only on the sign-off board; the truck, forklift and fencing crew carry no company name. No logos and no other company, series or sponsor names. Corner note: "Illustrative training scene · not a procedure · nothing here sends or changes anything."

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
- Self-check lines: no spotter in the Safe Zone, no forklift movement; a walk-in during movement freezes the job; every step can be completed; the needed counts match the layout; cloth on an unbraced bay brings a gust that tips it.
- Done when: every self-check line passes; no red error bar in Chrome or Safari, laptop or phone; taps alone finish the job; Test walk-in freezes everything until STOP and the person is cleared; on a phone, portrait or landscape, no sideways scroll and STOP always visible.