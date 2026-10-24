# Showcase 4K clarity and loaded Advanced truck — LIVE v11.84

Author: Andrew Fisher

This reissues the tested but never-uploaded v11.82 on the newer v11.83 broadcast release. The 4K renderer, loaded truck, branding, camera geometry and preference handling are unchanged; their feature-module names retain 1182. The page release becomes v11.84.

4K clarity fits the visible aspect ratio inside 3840 × 2160 (rotated for portrait), bounded by the GPU texture limit. It keeps resolution under load, uses supported 4× smoothing without glow, and applies the chosen quality after asynchronous scene preparation. Auto/unset preferences migrate once; existing explicit choices remain available. The longer illustrated tray has dense panel stacks, orange bases and restraints. Decorative stock is not an operational record.

Base: exact live v11.83 `5d9b7650b701440f4b7fa20eb99aa3274d476bb74c0951078ade8e9dbc192d87`, from source `d5378c8560cc241781a2bb26ba08cca85490dc5c`. Build: `bash toolchain/build.sh v11.84 v11.84_4k_truck_LIVE/patch_v1184.py`. The v11.80 source folder is required by the guarded patch.

LIVE 24 Oct 2026 14:59 AEST. Guarded upload at 04:59:02.177 UTC; separate public GET at 14:59:40 AEST matched every byte. Public SHA-256 `6ec05a3a3516de14d9780d375899290be094e42f8b2f0ffee5b640d2b77aa012`, 21,865,452 bytes. READY source `2c098c2f0996e709878e0c58413e8eef7b72aa85`; implementation/rebase `b298fad5e1b5eee4b078f69e3553ff12d7d7c540`.

Final build/preservation/GPU checks and both full sweeps passed. Exact renderer equivalence retains the inspected UHD 3840×2160 / 4× smoothing, phone and stability checks; actual public phone verification then passed 8/8 with 4K clarity, whole-truck framing, loaded branding, Options access, clean Close, zero errors/writes and its image inspected. See `evidence/VERIFICATION.md` for what ran on each candidate. No second-agent code review or physical-device FPS claim. v11.82 was never uploaded. The separate v11.85 follow-on rebuilds on these exact live bytes; ownership is recorded on STATUS.md.
