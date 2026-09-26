## v6.52 — 26 Sep 2026 — spectators, and more of a race track

- Andrew: "Enhance it more if we can more detail. Push your limits. Add spectators." In the 3D scene (`gc3d_bundle.js`, the stands part), placed by rule from the key plan as the stands always were:
  - The crowd: a person a seat — a body and a head each, shirts in a spread of colours with a run of Coates orange, one in twelve with a flag up — 28 a tier, 6 tiers, in each of the 19 stands the fencing schedule names, plus spectators along the fence outside the barrier either side of every stand. About 7,750 figures, drawn like the trackside edges: solid by day, quiet under the lights at night.
  - A roof over each stand on four posts, a Coates orange band along the back wall, a flag at each end.
  - Marshal posts at the sharpest corners (a white hut with an orange top, a yellow flag, two marshals), where the barrier line has room.
  - A start gantry over the grid: two posts, a beam with an orange band, five lamps lit from the scene's own clock — one at a time while the car sits on the line, all out at the launch, green for three seconds as it goes.
  - The camera flashes in the crowd at night, which v5.40 broke by replacing the list of crowd points with a drawing batch, flash again from where the people now stand.
- The credit line still says the backdrop is decoration; nothing here is a record. `test_v652.js` / `test_v652d.js`: day and night mount with 19 stands drawn, 7,750 figures, the gantry and marshals present, no script errors; `shots/` has the gantry by day and by night, a corner, the night crowd from the drone and the wide view.
