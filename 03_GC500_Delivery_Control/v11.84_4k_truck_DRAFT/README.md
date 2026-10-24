# Showcase 4K clarity and loaded Advanced truck — READY TO UPLOAD v11.84

Author: Andrew Fisher

This reissues the tested but never-uploaded v11.82 on the newer v11.83 broadcast release. The 4K renderer, loaded truck, branding, camera geometry and preference handling are unchanged; their feature-module names retain 1182. The page release becomes v11.84.

4K clarity fits the visible aspect ratio inside 3840 × 2160 (rotated for portrait), bounded by the GPU texture limit. It keeps resolution under load, uses supported 4× smoothing without glow, and applies the chosen quality after asynchronous scene preparation. Auto/unset preferences migrate once; existing explicit choices remain available. The longer illustrated tray has dense panel stacks, orange bases and restraints. Decorative stock is not an operational record.

Base: exact live v11.83 `5d9b7650b701440f4b7fa20eb99aa3274d476bb74c0951078ade8e9dbc192d87`, from Claude's source `d5378c8560cc241781a2bb26ba08cca85490dc5c`. Build: `bash toolchain/build.sh v11.84 v11.84_4k_truck_DRAFT/patch_v1184.py`. The v11.80 source folder is required by the guarded patch.

READY TO UPLOAD by Codex. Candidate `6ec05a3a3516de14d9780d375899290be094e42f8b2f0ffee5b640d2b77aa012`, 21,865,452 bytes. Final shared build, preservation/GPU checks and both full sweeps pass; exact source equivalence retains the already-passed UHD, phone and stability checks. See `evidence/VERIFICATION.md` for what ran on each candidate. No second-agent review or physical-device FPS claim. Publication and public read-back pending.
