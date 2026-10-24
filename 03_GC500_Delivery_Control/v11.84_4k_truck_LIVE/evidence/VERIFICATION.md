# Verification — v11.84

Author: Andrew Fisher

Candidate `6ec05a3a3516de14d9780d375899290be094e42f8b2f0ffee5b640d2b77aa012`, 21,865,452 bytes. Exact base v11.83 `5d9b7650b701440f4b7fa20eb99aa3274d476bb74c0951078ade8e9dbc192d87`.

The v11.82 upload was refused before a write when v11.83 landed. This v11.84 rebase preserves that broadcast release and advances the footer. `equivalence.json` proves that all HTML/scripts outside the DATA line and footer are byte-identical to tested v11.82 candidate `1eda8a422b7098189c404d2af71394ab013bb4d6d413ff58855ad828c02a77cc`. The only DATA changes are broadcast, media and hostedMedia; circuit/surrounds and all renderer inputs/geometry are unchanged.

Final v11.84 checks: shared build 177 scripts parse, model/camera/DATA preservation 33/33, GPU/clock regression 7/7, desktop and phone full sweeps each 27 routes / 19 direct panes / 7 deep links / Back, zero errors/console errors/attempted writes. Both full sweeps were rerun after the rebase.

Retained unchanged-renderer checks are explicitly inherited in `../inherited_v1182_evidence/`: desktop UHD 5/5 (actual framebuffer and target 3840×2160, 4× smoothing without glow, saved PNG exactly 3840×2160); phone 21/21 (2160×3267 aspect-preserving buffer, Options/Detail, preference migration, explicit Balanced, framing/driving/towing/Close); Day/stability 15/15. UHD and phone images visually inspected. Full-size image SHA-256 `db2acc69f6b46128564bfda466c10e5b8905ab6544e5c1155668292e9b25d860`. No image or original private reference is uploaded to this repository.

Implementation/testing ownership is recorded on STATUS.md. No second-agent review or physical-device FPS claim. 4K increases GPU work; the texture-size limit is honoured and explicit lower-quality choices remain available. No operational record changes. Guarded upload succeeded at 2026-10-24T04:59:02.177Z; separate public GET at 2026-10-24T04:59:40.556001Z matched all bytes. Actual public phone verification passed 8/8 with 2160-pixel-wide clarity and 4× smoothing and whole-truck framing; image inspected, zero errors/attempted writes. Sanitised receipt, read-back and live checks are archived beside this file. READY source 2c098c2f0996e709878e0c58413e8eef7b72aa85.

The final public-phone capture waits for the initial GPU frame before moving its diagnostic camera and asserts that the requested frame was submitted. An earlier diagnostic moved the camera during outstanding GPU work, so the safety guard correctly retained the earlier frame; that screenshot did not verify the requested camera. The corrected harness passes all eight checks without changing the deployed page.
