# v6.94: the map, wow (DRAFT, awaiting Andrew's yes)

Author: Andrew Fisher
Asked 27 Sep 2026: "I want this to be a wow wow factor, so whoever uses it is like, how is this even possible."

**Nothing here is live.** Built on v6.93 (the satellite map as the Map tab's map):
`v690 + patch_v693.py + patch_v694.py (wow694.js)`. Deploying also needs the machine set to carry `map/car26.glb` and
`map/lap.json` (both in `machine_map/`), which the page fetches from `/w/<token>/map/` only when the map opens.

## What it does (all on the real satellite photograph of Surfers)
- **The city in 3D:**
  - Mapbox Standard Satellite with real 3D buildings and shadows.
  - Lit for the hour on the Gold Coast (AEST): dawn, day, dusk or night. You can also choose the light.
- **The site in 3D:** tilt the map and every reference stands on the photo in its trade's colour, turned to face the road:
  - buildings as boxes (3 x 6 m)
  - toilets as cubicles (toilet blocks longer)
  - generators as sets
  - water barriers
  - light towers as 9 m masts with a lamp head
- **The circuit:**
  - The racing line glows in Coates orange.
  - The #26 laps it at modelled speeds (lap about 69 s), trailing light behind it.
  - The car is the Showcase's own car, with the livery baked in.
  - It is life size close in, and larger when zoomed out so you can still find it.
- **Ride along:**
  - Full screen, with the camera behind the #26 through the lap.
  - A speed and lap-time readout.
  - Any touch of the map takes the camera back.
- **Colour by trade or by where it is:** on site, in transit, not on site, or no delivery record.
- **Find:** type WC23 or GN04 and the camera sweeps there and the pin pulses.
- **Hover card (desktop):** the reference, its name, trade and status, with the master-plan close-up of the spot. One click
  still opens the drawer.
- **Zoomed out:** the site glows as a heat haze along the circuit.
- **First open:** a fly-in from high over the Gold Coast. It is skipped when motion is reduced, and shown once a session.
- **Fallback:** if the 3D style cannot load, the flat satellite style takes over with the same pins.

## Checks (test browser, software graphics; the live record and live map, read only)
- Desktop 1440x900 and phone 390x844: no page errors.
- The 3D site, racing line, car, trail and heat haze all load. The lap is 2,912 m.
- The car faces the way it drives (rear wing at the back, trail behind).
- Ride along runs (speed and lap time readout). Status colours work. Find flies to WC23.
- The hover card shows WC23 with its master picture.
- Not checked: a real GPU and phone for frame rate, and Safari. Standard Satellite and model layers need Mapbox GL JS 3 (the
  page already loads 3.30.0).

Positions are the master plan laid on the photograph by image registration (about 8 m), not a survey. The lap line and speeds
are modelled, not telemetry.
