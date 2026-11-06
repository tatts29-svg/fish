## v6.67 (machine v5.84) — 26 Sep 2026 — fire, heat, the real sound, and a phone layout that shows the car

Andrew: "check for bugs, and revisit and improve everything in the machine. We need to up the ante. Push your limits."

**Bugs found and fixed**
- **The approved sound pack was never installed.** The 34 ElevenLabs clips Andrew approved on 23 Sep (V8 idle/cruise/roar loops, start, stop, blip, overrun, clutch, dog ring, belts, fans, dyno rollers, workshop tone…) had expired download links before they were ever fetched, so the machine was running on its synthesised stand-in. Fresh links were drawn from the same flow (no regeneration, no credits), all 34 downloaded and are now served at `assets/audio/` — the app's `SampleBank` loads them on Sound on as designed (34/34 load, tested). Copies are kept in `audio/` here so they cannot be lost again.
- **Phone: the drive dock covered the lower 40 % of the 3D view**, so the car sat small and part-hidden and the cockpit wheel was cut. The view now ends above the dock and the studio is taller to pay for it.
- **Phone: the rpm / cog-ratio readouts sat across the middle of the scene** (over the crane and the car). They now sit just above the dock.
- **Cockpit (all widths): the readouts sat over the driver's gloved hand.** They leave the cockpit view — the dash has its own instruments.

**New**
- **Exhaust flames** (`exhaust-fx.js`): lift off the throttle from high revs and both side exits bark — a burst of three to five pops, white-hot core, orange body, fading tail — with the overrun clip; hold it on the limiter and it crackles. Parented to the exhaust assemblies, so they follow the pipes when the powertrain is exploded; hidden in the cockpit view. An orange flash lights the floor (desktop; skipped on phones to spare the GPU).
- **Headers that heat up**: the four-into-one headers and side pipes glow dull red → orange as they're worked (heat builds with revs × throttle over seconds, bleeds away over ~20 s). Their own material copy; nothing else changes.

**Published** as machine set `v5.84-fire` (207 files: the live 172 kept exactly — the explorer's live `explorer.js` mirrored, the service's own `server/gc500-server.js` unchanged — plus the 34 clips, `exhaust-fx.js`, and the patched `car-app.js` and `car.css`). Live `/api/machine` reports v5.84-fire; each changed file answers 200.

**Not verified**: frame rate and sound on a real phone (everything here is a software renderer at ~1 fps); the machine's own node test suite (it runs for many minutes) was not re-run — the draw-call caps in `engine.test.mjs` will see six more sprites.
