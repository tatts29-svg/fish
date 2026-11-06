# Showcase scenery and fencing truck — LIVE

Author: Andrew Fisher

24 Oct 2026. Requested Showcase appearance update plus a selectable Advanced Fencing truck. This update preserves the existing circuit, registered crossings, source building shells, operational records, v11.75 graphics scheduling and daylight repair, and v11.78 Maps features.

Static barrier dressing, grandstand finishes and coastal tree silhouettes use the existing batches. A cached illustrative fencing carrier uses the existing vehicle renderer, with a white cab, flatbed, secured mesh load and independently animated wheels. It is not an asset record or a model-specific fleet specification. No original photographs are included. The vehicle controls also refresh when asynchronous 3D preparation finishes, including when Showcase was paused during loading.

Repeated low-cost frames exposed an existing sampled-framebuffer feedback error when no shadow map had been allocated. The shadow binding now clears the previous post-processing depth texture in that case; allocated shadow maps retain their existing path. The truck's CPU cache is released on Close alongside the existing model caches.

Base: v11.78 SHA-256 `abeb34d25f70379fb51c9c7b6f13c88c0438479301160991356fa4e4dee4173e`, source `3d9402115d4ab86d40965691164ab406dc8cfcef`, shared branch `ccr-061f77e8-ivjhrv`. Working branch `codex/gc500-scenery-24oct`.

Build with `bash toolchain/build.sh v11.79 v11.79_showcase_scenery_LIVE/patch_v1179.py`. Candidate SHA-256 `52fe0d1a8266bbd91c32bcce7e2f5e86ee05cfed869527ecf44484c3fe623b6d`, 21,808,475 bytes; all 174 inline scripts parse.

LIVE 24 Oct 2026 13:20 AEST. Guarded upload from READY commit `6255337f44cc3fda680547c87b850866a74731d2` completed; separate public GET matched every byte at 13:20:18 AEST. Actual public phone smoke check passed 9/9, including repeated GL frames, visible garage, correct truck/scenery and Close/cache cleanup; zero page errors or attempted writes. The public phone screenshot was inspected. CPU geometry/preservation 25/25; shadow-feedback regression; retained GPU/clock 7/7; native browser 28/28 each desktop and phone; retained Day/stability 15/15 each; both full sweeps 27 tabs, 19 directly shown, seven deep links and Back, zero errors or attempted writes. Private desktop/phone screenshots inspected. Guarded upload dry-run confirms edit access and unchanged live base. See `evidence/VERIFICATION.md`. No second-agent review or physical-device frame-rate measurement is claimed.

The earlier v11.77 draft was not uploaded; v11.79 starts from the subsequently published map-turns release.
