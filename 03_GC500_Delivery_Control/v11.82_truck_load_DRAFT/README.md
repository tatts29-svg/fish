# Showcase 4K clarity and loaded Advanced truck — SUPERSEDED, NEVER UPLOADED

Author: Andrew Fisher

Andrew requested a loaded Advanced Temporary Fencing truck and then clearer, 4K Showcase rendering. The longer flat tray carries separate dense panel stacks and a central palletised orange-base bay, restraints, timber bearers, side rails and a rear reflective bar. Existing company branding remains. Decorative counts and dimensions are not operational records or a fleet specification. Original reference attachments are not included.

The Detail control adds **4K clarity**. It fits the visible aspect ratio inside 3840 × 2160 (2160 × 3840 in portrait), bounded by the GPU's actual texture limit. It keeps that resolution when reducing costly effects, retains supported 4× multisampling independently of glow, and disables soft glow and reflections. Old Auto/unset preferences migrate once; existing explicit quality choices remain and users can subsequently choose Auto or other levels. The existing deferred GPU cleanup and one-outstanding-frame guard remain. 4K clarity increases GPU work; no physical-device frame-rate claim is made.

Only the truck receives revised hero/grid, chase, quarter and onboard camera positions; other vehicle/towing camera results remain identical. Dense straight stock sections use flat faces rather than hidden rounded-box subdivision. Models contain 17,463 / 19,319 triangles, 28 parts and no new textures.

Build: `bash toolchain/build.sh v11.82 v11.82_truck_load_DRAFT/patch_v1182.py`.
Base: exact public v11.81.1 `1c355e7d80e4703e01c4daa942d4298dfa451780b63db9c9e08dae60f6c816df`, preserving the intervening fencing/broadcast release. The v11.80 source folder is required by the guarded patch. Wrong-base and duplicate applications are refused.

Current state: SUPERSEDED, NEVER UPLOADED. The unchanged-base guard refused publication after v11.83 changed the live page. Continue in v11.84_4k_truck_DRAFT on that release. Do not upload this draft. Its retained renderer/model checks are historical evidence for the source-equivalent v11.84 rebase.
