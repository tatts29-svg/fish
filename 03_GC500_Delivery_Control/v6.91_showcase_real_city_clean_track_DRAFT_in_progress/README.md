# v6.91 (in progress): Showcase on the real Surfers Paradise, clean track (DRAFT, nothing live)

Author: Andrew Fisher
Asked 27 Sep 2026: "up the graphics ... real life would be perfection" and "we need to remove cars".

- The city is Google Photorealistic 3D Tiles (same key and service as the 3D proof). The #26 is the show scene's own car
  (`car26.glb`, built by `build/build_car_glb.py` from `GC3D.raceCarModel`), painted by the scene's livery rules.
- The lap (`lap.json`, `build/build_track.py`) is the scene's centreline through the circuit registration, pulled onto
  OpenStreetMap road centre lines (median 0.8 m, max 8.9 m). Lap is 2,918 m; modelled lap time about 69 s.
  Speeds are modelled, not telemetry.
- Parked cars removed: the road is cut out of the photo model along the circuit and replaced with our own race surface
  (asphalt, rubbered line, edge lines, kerbs on corners, start line), concrete barriers (Coates orange top, COATES and
  GC500 lettering) and catch fencing. Road height is read at run time from the footpaths either side; nothing from Google
  is stored.
- Cameras: Chase, Blimp, Helicopter, Trackside TV, Free look. Sun at Morning, Race time or Golden hour.

Still in test. Not deployed.
