# Showcase photo landmarks — v9.70

Author: Andrew Fisher

VERIFIED LIVE with v9.71 —9 Oct2026,19:28AEST. Final combined and actual-public checks passed. Root owns the combined release and publication. No operational records are changed.

The 114 unique originals in the reviewed photo index support five applied landmarks: PB1’s blue Queensland bridge (21074), PB2’s red GOLDCOAST. bridge (21110), OT4’s pale seamed advertising span (21134), PB3’s cream finals bridge (21154), and OT5’s black-centre/orange-end Boost span (21162/21018). The old generic orange Coates bridge is removed. These use recovered, reviewed master-plan crossing axes rather than choosing a visually convenient straight. The surrounding streetscape is not claimed to have been rebuilt from every photograph. Source and rendered coordinates are recorded separately: the schematic circuit and master plan have registration error, so illustrative spans extend along the same crossing line to keep posts outside the existing road boundaries. They are not surveyed dimensions or set-out positions.

The bridge has a cream two-panel wrap, finals/date wording, ring motifs, clad stairs and exposed silver framing. The advertising span has no pedestrian stairs or start lamps. The existing start-light gantry, route, car, physics, controls, camera preferences and operational data remain unchanged.

All geometry is emitted once into the existing decoration and metal batches. Text uses the existing sign atlas and its intact dot-font fallback. No new draw calls, textures or per-frame work are added. New static decoration currently adds 309 quads and 380 metal segments; 34 label placements become 68 triangles in the existing sign mesh. The existing atlas grows from 1024×256 (1,398,102 bytes with mipmaps) to 1024×1024 (5,592,406 bytes), an additional 4 MiB. Existing lettering keeps its resolution; texture count remains unchanged. The final five-landmark native candidate confirms this atlas size with 144 total scene labels and 20 strings.

Checks so far: 62 focused geometry/font/rebuild checks using the saved actual centreline; 15 strict patch/source-preservation checks; all 50 inline scripts parse. Actual day approaches to all five landmarks are captured privately and visually inspected. Full final combined desktop/phone, night, native-state and resource checks are owned by the root testing agents. No physical-device frame-rate claim is made from software-rendered browser tests.

Commands:

```sh
node test_landmarks970.cjs /workspace/private-showcase970-audit/scene969.json /path/to/live969.html
python test_patch970.py /path/to/live969.html
python patch_v970.py /path/to/live969.html /path/to/candidate970.html
```

Evidence includes exact original master/OSM hashes, original photo hashes and recovered-axis validation. The master-to-scene origin recovery is bounded and approximate; it is not the lost original registration matrix. Official sponsor artwork is not embedded or claimed.

Frozen source SHA-256: `8259154233f7985d3b9284c27d176161c7e2152cbba8e36de2f2441578ca8f6c`. Patch: `9f3d80d4a565f63cae905097820bc563d9a0bcfe3012c1938a048ce42681fae9`. Raw candidate: `9f5b33c39c17011a0cb8f9a81a34d5c30caf5c41032d32f85ef6f495616fd63b`.

Independent source reviewer reran all 62 focused assertions and 15 exact source-reversal checks, and inspected all five original master crossings. No source blocker remains. The final combined release’s phone/night, control/lifecycle and financial preservation checks remain required before publication.

Final combined candidate SHA-256: `f182b59f07ea6f2fbd0a2b09d2efc4e219ef44c9c16a0109304f0f6e89437c5a`;12,831,751bytes;51 scripts. Exact live base: `a271015a9cf6d099b1665d3bcef71bb6fe5b2671d7081739c91b0f04d52205b5`. Sanitised final verification is in the companion v9.71 evidence folder. Guarded upload verified exact public bytes; actual-public phone check passed12 checks without page/state substitution. Native record5168 unchanged.

Published source commit: `eddf7758`. Publication:9 Oct2026,19:28AEST. Public verification:12/12 actual-public phone checks, no script errors or operational writes; native version5168 unchanged. This release preserves the confirmed labour allowance and separate accommodation/meal expense classification.
