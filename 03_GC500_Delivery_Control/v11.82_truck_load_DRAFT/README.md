# Showcase 4K clarity and loaded Advanced truck — DRAFT

Author: Andrew Fisher

Andrew requested a loaded Advanced Temporary Fencing truck and then clearer, 4K Showcase rendering. The longer flat tray carries separate dense panel stacks and a central palletised orange-base bay, restraints, timber bearers, side rails and a rear reflective bar. Existing company branding remains. Decorative counts and dimensions are not operational records or a fleet specification. Original reference attachments are not included.

The Detail control adds **4K clarity**. It fits the visible aspect ratio inside 3840 × 2160 (2160 × 3840 in portrait), bounded by the GPU's actual texture limit. It keeps that resolution when reducing costly effects, retains supported 4× multisampling independently of glow, and disables soft glow and reflections. Old Auto/unset preferences migrate once; existing explicit quality choices remain and users can subsequently choose Auto or other levels. The existing deferred GPU cleanup and one-outstanding-frame guard remain. 4K clarity increases GPU work; no physical-device frame-rate claim is made.

Only the truck receives revised hero/grid, chase, quarter and onboard camera positions; other vehicle/towing camera results remain identical. Dense straight stock sections use flat faces rather than hidden rounded-box subdivision. Models contain 17,463 / 19,319 triangles, 28 parts and no new textures.

Build: `bash toolchain/build.sh v11.82 v11.82_truck_load_DRAFT/patch_v1182.py`.
Base: exact public v11.81 `6ca9da442988bbe4c9e86aa7d43200f9aa2517102bda1f59fa5a8b3a2c28a2e0`, preserving the intervening fencing/broadcast release. The v11.80 source folder is required by the guarded patch. Wrong-base and duplicate applications are refused.

Current state: all 176 scripts parse; CPU/model/camera/data preservation checks pass 33/33. Native desktop/phone, actual UHD frame, GPU/lifecycle regression and full-page sweeps remain in progress. Not ready to upload and not live. Codex owns this scope and publication; Claude retains fencing/broadcast ownership. No second-agent review is claimed.
