# Coates Way workshop preview

Author: Andrew Fisher · 5 Nov 2026

**DRAFT — reviewable mechanical/visual concept; not READY TO UPLOAD and not live.**

Andrew asked to improve the machine's graphics and interaction, including a crane lifting the engine out. This first slice uses the existing Coates #26 car, original engine components, orange/dark appearance and workshop. It adds a controlled engine-removal preview: lift clear, traverse, lower onto an inspection cradle. The sequence can be played, paused, scrubbed, restarted and exited. The original machine remains the live experience.

The installed engine's 101 original component objects move together; the cockpit, suspension, gearbox, steering and rear driveline stay in place. The original garage crane drives the new hook/beam/slings. Original valve covers and airbox are visible on the removed engine. The bonnet rests on trestles. Existing object identity, part references, parent/sibling order, transforms and visibility are restored on exit. This does not replace the engine with a generated picture or a different model.

The scene starts with an engine prepared for removal. It is an illustrative display, not factory CAD, a lifting calculation or a servicing procedure. It does not animate the complete disconnection process, release the hook, certify lifting points or claim real vehicle dimensions. These limits are part of the draft, not hidden behind a claim of engineering accuracy.

## Source and ownership

- Starting shared source: `04b39247275b6b99475185560e43828f1c8fdcec`, branch `ccr-061f77e8-ivjhrv`.
- Claim: `48010dfb`, isolated branch `codex/machine-engine-lift-1302`.
- Read-back of v13.01 public page: `2f6bc154b896a33252f21b1b438593b2d7453b79bb47ef3ff01abb0721624e7b`, 17,066,969 bytes.
- Machine descriptor: `674404701b251917625f8589420d33896fbbf13d018da2a20591b3d31eb4e90a`, 236 files.
- Exact base `car-app.js`: `d2964c3138eb1b2429a542cfb598adb507ae345b6b92858c78231fdbe49ff3c8`.

No public page, machine manifest, record, financial figure or map changed. Showcase and race narration remain under their existing ownership. Source review, implementation and independent review are recorded on STATUS/PR #1; a posted handover does not establish receipt by another session.

## Reproduce locally

`prepare_preview.py <exact-base-folder> <private-build-folder>` requires the exact public `car-app.js`, `index.html` and `car.css`. It rejects a different app module and applies each integration replacement exactly once. The output has no publication manifest.

The geometry tests need Node and this repository's Git objects, with no network or browser:

```sh
node tests/test_engine_lift.mjs
```

The browser rig serves the candidate locally and fetches remaining public machine assets by GET only. It rejects writes. Set `PREVIEW_ROOT`, `OUT`, `GC500_CACHE`, `GC500_TOOLCHAIN`, `NODE_PATH` and `CHROMIUM_PATH` for the execution environment. Serialize browser sessions:

```sh
flock -x /tmp/gc500-browser.lock node tests/test_browser.cjs
MOB=1 flock -x /tmp/gc500-browser.lock node tests/test_browser.cjs
```

Geometry checks build the original fitted powertrain and sample 101 lift positions. They cover the correct component set, fixed car assemblies, finite transforms, constant sling length, sump-to-saddle contact, feet on the floor, play/pause/reset/refusal and exact restoration/re-entry. The crane in that harness is a transform fixture; browser checks use the full real garage crane. Browser checks cover the mode controls, phase movement, competing keyboard paths, panel fit and exit with no runtime errors. See `VALIDATION.md` for the final run and its limits.

## Next graphics and mechanical work

1. Finish the connected workshop action: verified connection-release visuals, crew interaction, visible hook release, reverse refit and collision checks. Keep one shared task state for controls, movement, sound and labels.
2. Refine the close-up rig: bevelled edges, distinct cast/machined metal, subtle roughness and contact shadows over the whole route. Use the existing Coates orange and original car/artwork.
3. Add a selectable running-engine cutaway on the stand. Expose the existing crank, pistons, valves and timing drive with slow motion and anchored labels.
4. Add selectable oil, coolant and power paths, visibly linked to their components. Any displayed values must be sourced or clearly labelled illustrative.
5. Add short fault-finding and reassembly challenges: find the disconnected component, inspect it, reconnect and observe the consequence. Reuse the existing part connections rather than invent another mechanics model.
6. Add a presentation tour with close-up shots and user-controlled pause/orbit. This is separate from the event Showcase narration.

Graphics work should prioritise clarity around the engine, lighting and grounded contact. The existing machine already has PBR paint/metal, carbon detail, reflections, ambient occlusion, adaptive resolution and 4K capture. Adding those again is not an improvement. The preview reuses existing engine meshes/materials and adds no physics engine or large texture download. Native phone frame rate, thermal behaviour and long-running playback remain to be measured before a release claim.
