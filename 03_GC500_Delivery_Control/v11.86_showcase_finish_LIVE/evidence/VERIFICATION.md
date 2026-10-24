# Verification — v11.86

Author: Andrew Fisher

Live release `b8366b090459abf3e2e571ab995551b81355c4f2f23a294749eb9eab64588840`, 21,878,757 bytes. Base: live v11.85 `4da2a95c57d1027a58a039fb252536b23d1095233b79f596d8fafc2dd2e9f583`. Implementation source `ee18cbe80569ac9eca8786f80b27128da68c47cf`.

The live v11.84 review showed the loaded truck cut off by the detail rig. The revised detail/low rigs and lens fit preserve the full load envelope, aspect ratio, lens shift and body attitude. A preliminary camera-distance correction failed the scenery check at eight viewport/position combinations; it was replaced with lens fitting that leaves the existing building-cleared camera position unchanged. The final candidate passes both framing and scenery checks.

Final checks: shared build 179 scripts; preservation 16/16; native 14/14 including 550 camera/viewport/location combinations and 1,800 moving simulation steps. Phone rear/front detail, desktop detail and native 4K-clarity phone images inspected. The latter retains a 2160-pixel-wide buffer and four-sample smoothing. Driver viewpoint, towing, controls and Close pass; zero page errors or attempted writes. Both full sweeps pass 27 routes / 19 direct panes / 7 deep links / Back, zero errors or writes.

The tests use Chromium software WebGL and emulated viewports, with sun-map shadows/reflections disabled for bounded visual captures; the truck's contact shadow remains active. This establishes rendering and framing, not physical-device frame rate. The 4K renderer, geometry, scenery, operational DATA/media and v11.85 feet presentation are preserved. No second-agent review. Guarded upload completed at 24 Oct 2026 05:57:17.189 UTC (15:57 AEST). A separate public GET at 05:59:26.456902 UTC matched all 21,878,757 bytes and the full release hash. Public phone checks passed 9/9: current release, camera selector, complete load framing, 2160-pixel-wide native 4K clarity with 4x smoothing, branding/load, Options, Close, unchanged shared record, zero errors/writes. The public phone screenshot was inspected. READY source: `d3bb0396464c508f953fa3146b5896a38f258a16`. Implemented, tested and published by Codex; no second-agent review.
