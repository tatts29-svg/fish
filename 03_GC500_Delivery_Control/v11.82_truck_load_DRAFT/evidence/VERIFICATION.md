# Verification — v11.82

Author: Andrew Fisher

Candidate SHA-256 `1eda8a422b7098189c404d2af71394ab013bb4d6d413ff58855ad828c02a77cc`, 21,864,699 bytes. Built on exact v11.81.1 `1c355e7d80e4703e01c4daa942d4298dfa451780b63db9c9e08dae60f6c816df`.

- Shared build: 177 inline scripts parse; key/name checks pass. Wrong-base and duplicate patch attempts refused.
- Model/camera/data preservation: 33/33. Models 17,463 / 19,319 triangles, 28 parts, zero new textures. Other vehicles, towing camera outputs, Maps and embedded DATA preserved.
- Existing GPU/clock regression: 7/7; exact original GPU guard retained, deferred cleanup and quality changes tested.
- Final-candidate desktop UHD: 5/5. Actual framebuffer and render target both 3840 × 2160, 4× multisampling with glow off, loaded truck in the actual quarter shot, GL error 0. Saved PNG verified exactly 3840 × 2160 and visually inspected. Image SHA-256 `db2acc69f6b46128564bfda466c10e5b8905ab6544e5c1155668292e9b25d860`.
- Final-candidate phone viewport: 21/21. Clarity buffer 2160 × 3267 with 4× multisampling; preference migration, load framing, Options/Detail, explicit Balanced selection, other camera renders, driving, towing and Close. Phone image inspected.
- Existing Day/stability behaviour: 15/15 with explicit Balanced, including colour conversion without glow, Night/flat choices, reopening, navigation and clean Close.
- Both full sweeps: 27 routes, 19 direct panes, 7 deep links and Back; zero page/console errors or attempted record writes. All browser jobs ran serially through the read-only harness.

Desktop camera checks also passed before the final v11.81.1 rebase. `rebase.json` verifies that this rebase introduced exactly the intervening fencing-only changes; the Showcase renderer stayed identical. Final UHD, phone, CPU preservation and both full sweeps use the final candidate.

Codex implemented and tested this release. No second-agent review or physical-device frame-rate measurement is claimed. The 4K setting retains resolution, bounded by the GPU texture limit, and therefore costs more GPU work than Balanced; original explicit quality choices remain available. Original reference attachments and operational records are not included. Guarded publication and public read-back remain pending.
