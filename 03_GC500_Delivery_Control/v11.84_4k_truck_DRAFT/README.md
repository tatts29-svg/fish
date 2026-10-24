# Showcase 4K clarity and loaded Advanced truck — DRAFT v11.84

Author: Andrew Fisher

This reissues the tested but never-uploaded v11.82 on the newer v11.83 broadcast release. The 4K renderer, loaded truck, branding, camera geometry and preference handling are unchanged; their feature-module names retain 1182. The page release becomes v11.84.

4K clarity fits the visible aspect ratio inside 3840 × 2160 (rotated for portrait), bounded by the GPU texture limit. It keeps resolution under load, uses supported 4× smoothing without glow, and applies the chosen quality after asynchronous scene preparation. Auto/unset preferences migrate once; existing explicit choices remain available. The longer illustrated tray has dense panel stacks, orange bases and restraints. Decorative stock is not an operational record.

Base: exact live v11.83 `5d9b7650b701440f4b7fa20eb99aa3274d476bb74c0951078ade8e9dbc192d87`, from Claude's source `d5378c8560cc241781a2bb26ba08cca85490dc5c`. Build: `bash toolchain/build.sh v11.84 v11.84_4k_truck_DRAFT/patch_v1184.py`. The v11.80 source folder is required by the guarded patch.

Codex owns the rebase, tests and next guarded publication. Source-equivalence, final-base preservation and full sweeps are in progress. Not ready and not live. Existing UHD/phone/GPU evidence is inherited only where exact source equivalence is proved; see evidence. No physical-device FPS or second-agent review claim. Private original attachments are not included.
