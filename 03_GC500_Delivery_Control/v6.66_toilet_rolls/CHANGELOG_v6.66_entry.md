## v6.66 — 26 Sep 2026 — the rolls go too

- Andrew: "with the toilet one, can we see toilet rolls coming out when the door's open."
- `rolls_v666.js`: each time the Dunny Run door swings open at a main corner, three toilet rolls tumble out of the doorway a quarter-second apart. They carry the trailer's speed, drop to the road, bounce, and roll to a stop behind it. Each unreels a streamer of paper along the path it took. Real bodies: gravity, a soft bounce, rolling friction, spin matched to the ground, tumbling in the air; gone after seven seconds, cleared if the scene's clock goes back (replay, new slide). Drawn after the trailer with the car shader; no new draw state.
- `test_v666.js`: rolls spawn, fly, land (all three on the ground, paper 236 triangles), no script errors.
