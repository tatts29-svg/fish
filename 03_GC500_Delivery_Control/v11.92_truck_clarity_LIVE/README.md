# v11.92 — clearer fencing truck and two-wheel corners

Author: Andrew Fisher

Status: LIVE — 25 Oct 2026 00:38 AEST. Implemented, tested and published independently; no second-agent review claimed.

Andrew asked to improve the smudgy Showcase, especially the loaded fencing truck,
and to have it tip onto two wheels around corners. This is decorative animation;
the route, driving forces, operational record, photographs and other vehicle models are unchanged.

Base: verified public v11.91, SHA-256
`ffacee9978f388e43559a02bf62a9ad01d2de0c3bf3b3326eb5c5cd19b279e6b`,
from source `d5963b85e991b7371ebf2995e5371514fd15fac1` on
`ccr-061f77e8-ivjhrv`. This incorporates the Today fold and slim-header fix.

The loaded truck now has round fence tubing with radial normals, closer top-mesh
detail, smoother cab panels, window seals, a cabin interior, rim hardware and
tyre grooves. The three existing public company logos and the loaded-stock
arrangement remain intact. The cached model has 26,779 triangles at balanced and
35,515 at high detail, 30 merged parts and no new textures.

4K clarity retains its UHD render target and four-sample MSAA, but bypasses the
additional edge-softening pass. Other quality modes retain that pass, and explicit
device quality preferences are respected.

The truck banks progressively with the circuit's signed curvature and speed,
up to 27.5 degrees. Its transformed tyre profile determines ground clearance;
the outside pair stays grounded and the inside pair lifts. Tight contact shadows
follow the rendered wheels using the existing shadow batch. Straights, stopping,
calm driving, reduced motion and airborne motion settle the stunt. Other vehicles
use their original matrix and simulation. Camera framing includes the tilted load.

Validation uses the shared read-only harness. Geometry and topology, logo retention,
other-vehicle preservation, both corner directions, tyre contact, easing, stop and
reduced-motion behaviour, camera framing, native rendered frames, lifecycle and
record preservation are checked. Final full sweeps cover desktop and phone.
Raw pages and screenshots remain private; only sanitised check results are archived.
Software WebGL verifies rendering, not physical-device frame rate.

Build from the exact current live base with the shared toolchain:

```sh
bash toolchain/build.sh v11.92 v11.92_truck_clarity_LIVE/patch_v1192.py
```

Do not bypass the unchanged-live-base guard. If a newer release appears, update the
base and footer expectation, rebuild, and rerun the affected checks before upload.

Verified live page: `1ca10ac4c8498f4e07a47aa5de4d4f59ef9c17a218961340fe275480eb90e2a3` (21,955,920 bytes).

Checks: 185 inline scripts parse; model 33/33; stunt/contact 17/17; preservation 16/16; native browser 14/14; UHD 5/5. Both full sweeps pass 27 routes, 7 deep links and Back, with zero errors, console errors or attempted writes. Phone and desktop screenshots and the actual 3840 × 2160 PNG were inspected. The native phone frame has a 2160 × 3267 target, four-sample MSAA and a 2048 sun-shadow map. Bounded desktop/UHD captures disable the optional sun-shadow and reflection passes; contact shadows remain.

READY source: `0e9f9da52e775ae5644f95a6031e574e9fc70283`. The guarded upload passed on the unchanged v11.91 base. A separate public GET at 25 Oct 2026 00:40:28 AEST matched all 21,955,920 bytes and the SHA-256 above. Actual public-page phone checks passed 10/10, including the loaded truck frame, Options, the 4K selector target, Close, record preservation and zero errors/writes. The public phone screenshot was inspected. See `evidence/readback.json` and `evidence/public_phone.json`.
