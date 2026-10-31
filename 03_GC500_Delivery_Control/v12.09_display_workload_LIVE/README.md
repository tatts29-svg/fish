# v12.09 · Native display workload — LIVE

Author: Andrew Fisher.

The Showcase's 4K clarity setting was allocating a UHD framebuffer even in a smaller window. It now matches native display pixels up to UHD, retaining four-sample smoothing, all geometry, textures, shaders and shadow detail. An actual UHD display still renders 3840 × 2160. Scene loading states its current construction phase.

Published 25 Oct 2026 08:33:53 AEST through the shared live-base guard. READY source `b7244a2457b67ac3aa71f8601362eefb39c679eb` on `ccr-061f77e8-ivjhrv`; exact live SHA-256 `87102c753244e9243788c02f9eeabb652847b955a6ed5c733b71df651e4b5751`, 15,251,664 bytes. Separate public GET at 08:34:13 AEST matched every byte and footer. Actual public UI passed 9/9; phone frame inspected. Implemented, tested and published independently by Codex; no other-agent review claimed.

Validation: shared toolchain PASS (194 scripts); display policy 13/13; exact scope/guards 5/5; native phone frame, preparation cancellation and controls 9/9; actual UHD frame/4× smoothing 5/5; desktop and phone sweeps 27 routes, 19 direct panes, 7 deep links and Back, with zero errors or attempted writes. Phone and UHD images were inspected. Record, map, models, business rules and media are unchanged.

The same test window used 1440 × 697 pixels instead of 3840 × 1858. This confirms lower graphics workload. The cloud GPU is software; the short playback samples do not establish a frame-rate improvement on Andrew's hardware or prove his freezing report is completely resolved. His device/browser and affected screen are still needed for any remaining reproduction. Raw evidence stays private.

Claude retains his Servicing night-selection fix and Samsung investigation. Codex resumes the map-search draft as v12.10 on the latest live version; v12.08 was never published.
