## v6.63 — 26 Sep 2026 — race-day dressing, everywhere

- Andrew: "improve the detail everywhere — track, and buildings, and stands and crowds and barriers and signs."
- `G.dressCircuit` (`dress_v663.js`), built once with the stands and into the stands' own batches (no new draw call):
  - **Tyre walls** — stacks of four tyres with an orange-and-white Coates belt — across the outside of the eight sharpest corners, between the barrier line and its concrete face (574 stacks).
  - **Catch-fence banners** facing the track: COATES in white on orange, GC500 2026 in orange on white (80).
  - **Braking boards** 150 / 100 / 50 on the approach to those corners, facing the cars (18 placed where there is room).
  - **COATES GC500 2026** across both faces of the start gantry.
  - **Buildings**: rooftop plant (units and tanks) on the buildings beside the track, and Coates billboards on five roofs facing the circuit.
  - **Crowd**: three deep along the fence at every one of those corners and two deep down the grid straight (+984 people).
- Words are the ones Andrew gave for the VMS; everything is placed by rule and is nominal, like the stands — the scene's credit line already says the backdrop is decoration, not the record.
- Trackside orange is the barrier's own orange (the brighter value read yellow in this light).
- `test_v663.js` / `test_v663b.js`: counts above, no dressing error, no script errors; `shots/` has the gantry and a fence banner from the drone, and the tyre walls.
