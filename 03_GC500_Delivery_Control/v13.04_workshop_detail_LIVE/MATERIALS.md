# Workshop surface definition

Author: Andrew Fisher

The existing powertrain receives deterministic cast, machined, brushed and rubber
micro-surface maps. All four maps are shared 128 × 128 RGBA data textures: 262,144
bytes before mipmaps, no downloaded assets. Linear filtering, mipmaps and capped
anisotropy suppress distant shimmer. Paint, livery, mapped artwork and the cockpit
remain the original material objects. Piston rings have a distinct dark-steel
finish; the original piston geometry and motion are unchanged.

The existing added flange heads now have six flat faces and chamfered edges.
Their washers are flat with bevelled edges. The washers seat against the actual
source sump/head planes and the heads sit on the washers without gaps or overlap.
Four screw heads sit on the existing hose-clamp housings and use the same four-
instance order consumed by the v13.03 service controller. No new fictitious
connections, manufacturer markings or specifications are introduced.

Fine-detail groups use a 10% visibility hysteresis band so a slow orbit around a
threshold does not alternate their visibility. Peak detail: 11 instanced draws,
95 instances and 16,416 triangles (v13.02 had 10 draws). Wide views cull this detail.

`tests/test_finish1304.mjs` builds the original source powertrain/car, checks
material separation, exact original geometry and protected material identity,
texture filtering/budgets, washer/head contact with drawn planes, outward head
normals, LOD hysteresis, lift attachment, and v13.03 service clamp movement/refit.
Disposal restores original materials and disposes each owned resource once.
All source/model checks pass. Root performs rendered phone/desktop comparison
and final release validation; this note alone does not establish visual acceptance
or physical-device performance.
