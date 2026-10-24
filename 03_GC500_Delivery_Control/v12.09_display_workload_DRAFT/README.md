# v12.09 · Native display workload — READY TO UPLOAD

Author: Andrew Fisher.

Andrew reports lag/freezing and asks for tested fixes live. Codex owns this bounded scope; Claude retains Samsung. Source branch ccr-061f77e8-ivjhrv. Base is verified v12.07, hash in BASE_SHA256. v12.08 map search remains a separate NOT READY draft.

The current 4K clarity setting forces a UHD-sized canvas into every window, regardless of actual display pixels. This candidate uses native display resolution up to UHD, retaining four-sample smoothing, all geometry, textures, shaders, shadows and the full 3840 × 2160 framebuffer on an actual UHD display. It does not silently reduce resolution in response to frame rate. Scene preparation now states its actual construction phase.

Implementation and testing in progress. NOT READY / NOT LIVE. The cloud renderer is software; its timings cannot establish frame rate on Andrew's hardware.

Candidate build passes the shared toolchain (194 scripts), 13/13 display policy checks and 5/5 exact preservation/guard checks. In the same 1440 × 900 browser test, the scene framebuffer changed from 3840 × 1858 to 1440 × 697 while retaining 4× smoothing and 2048 shadow detail. The software GPU did not complete a frame during either short playback sample, so this is evidence of workload reduction, not a demonstrated frame-rate improvement or proof of the cause on Andrew's device. Native phone completion, true UHD and full navigation regressions are in progress.

Final validation: shared toolchain PASS; display rules 13/13; exact scope/guards 5/5; actual native phone frame and controls 9/9; genuine 3840 × 2160 scene/4× smoothing 5/5; desktop and phone sweeps 27 routes / 19 direct panes / 7 deep links / Back, zero errors or attempted writes. Phone and UHD frames inspected. Dry run passed. Candidate SHA-256 `87102c753244e9243788c02f9eeabb652847b955a6ed5c733b71df651e4b5751`, 15,251,664 bytes. Codex independently implemented/tested and owns guarded publication and public read-back; no second-agent review or hardware FPS guarantee. READY TO UPLOAD at 25 Oct 2026 08:33 AEST.
