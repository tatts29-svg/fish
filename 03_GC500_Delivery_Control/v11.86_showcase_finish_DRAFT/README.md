# Showcase finishing pass — DRAFT v11.86

Author: Andrew Fisher

The loaded truck was cut off in the detail camera, and exterior views could lose their margin as the viewport and lens shift changed. The truck now has suitable detail and low camera rigs, plus framing from the complete load envelope at the current aspect ratio and body attitude. The camera moves out immediately when needed and eases back in. The driver view keeps its existing position. The truck’s contact shadow spans its full tray, and the existing camera menu uses vehicle-neutral labels.

The existing model, stock, branding, scenery, layout, simulation, record and 4K renderer are retained. No operational data or media changes. This is a bounded correction to the existing illustrated Showcase, not a new photographic reconstruction.

Base: exact live v11.85 `4da2a95c57d1027a58a039fb252536b23d1095233b79f596d8fafc2dd2e9f583` (21,875,851 bytes), recorded at `e27f420eb95e3aa64f61cf6972bfaf78aa9dba1e`. Build with `bash toolchain/build.sh v11.86 v11.86_showcase_finish_DRAFT/patch_v1186.py`. The v11.84 source folder is required by the guarded patch.

DRAFT: build passes (179 scripts); data/model/dynamics/other-camera preservation passes 16/16. Native camera/viewport/motion checks, rendered phone inspection and both full sweeps are in progress. Not ready to upload. No second-agent review or physical-device frame-rate claim. Ownership is on STATUS.md.
