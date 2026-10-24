# Showcase finishing pass — READY v11.86

Author: Andrew Fisher

The loaded truck was cut off in the detail camera, and exterior views could lose their margin as the viewport and lens shift changed. The truck now has suitable detail and low camera rigs, plus framing from the complete load envelope at the current aspect ratio and body attitude. The lens widens when needed and eases back in, preserving the camera positions already cleared against buildings. The driver view keeps its existing position. The truck’s contact shadow spans its full tray, and the existing camera menu uses vehicle-neutral labels.

The existing model, stock, branding, scenery, layout, simulation, record and 4K renderer are retained. No operational data or media changes. This is a bounded correction to the existing illustrated Showcase, not a new photographic reconstruction.

Base: exact live v11.85 `4da2a95c57d1027a58a039fb252536b23d1095233b79f596d8fafc2dd2e9f583` (21,875,851 bytes), recorded at `e27f420eb95e3aa64f61cf6972bfaf78aa9dba1e`. Build with `bash toolchain/build.sh v11.86 v11.86_showcase_finish_DRAFT/patch_v1186.py`. The v11.84 source folder is required by the guarded patch.

READY TO UPLOAD. Candidate `b8366b090459abf3e2e571ab995551b81355c4f2f23a294749eb9eab64588840`, 21,878,757 bytes; implementation source `ee18cbe80569ac9eca8786f80b27128da68c47cf`. Build 179 scripts; preservation 16/16; native camera/viewport/motion/rendering/lifecycle 14/14; desktop and phone sweeps each 27/19/7/Back, zero errors/writes. Final phone and desktop images inspected. See `evidence/VERIFICATION.md`. Guarded upload and public read-back pending. No second-agent review or physical-device frame-rate claim. Ownership is on STATUS.md.
