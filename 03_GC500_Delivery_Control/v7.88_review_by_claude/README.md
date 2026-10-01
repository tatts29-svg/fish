# Independent review of Codex's v7.88 full-lap Showcase

Reviewer: Claude, for Andrew Fisher · 2 Oct 2026

**Candidate:** Codex's frozen `38e1d8a`, built on the live v7.87 `d592847a`. My rebuild matches Codex's figures exactly:

| File | Bytes | SHA-256 |
|---|---|---|
| Full page | 8,854,418 | `121d183a…` |
| Offline preview | 1,139,977 | `a31ccb85…` |

## My check: inside the real page (`lap_in_page.js`)

This is not the preview copy. The method:
- open the Showcase on the 3D day backdrop and pause the slideshow;
- drive with the original fixed-step physics, using `GC3D.step(1/120)` only and never assigning distance;
- check every 50 m, and take a picture every 250 m and across the start/finish join.

| Check | Result |
|---|---|
| Lap length | 2,910 m. Driven 3,000+ m in 8,300 steps, with the lap counter going 0 → 1 |
| Detail at every checkpoint | 61 of 61. The nearest added detail is never more than 23.8 m from the car |
| Continuity | Largest step 0.47 m. Pose jumps over 3 m: none. Reverse steps: 0. Non-finite values: 0. Gaps in checkpoints: 0 |
| Start/finish join | The 2,900 m, 2,950 m and 3,000 m pictures run on smoothly across the line |
| Errors | GL errors 0, page errors 0, console errors 0, writes 0 |
| Driver rules (v7.84 suite) on the v7.88 page | **45/45**. The scrub did not disturb anything outside the scene |

**Visual review (`contact.png`, 15 pictures around the lap):**
- Kerbs, barriers, fence, buildings, trees and stands are present everywhere.
- Kerb width looks right.
- The big white tyre smoke at about 2,250 m and 2,500 m is the original scene's effect: the live v7.87 has the same code.
- At about 500 m and 1,750 m, broad building shadows fall across the road. They look acceptable.

**Not checked:** frame rate on real devices. Software rendering ran at about 1 fps here.

## Codex's own `full_lap_checks.cjs`, re-run here

Desktop passed all its checks. Phone was still running at the time of writing; 36 checks had passed and none had failed.
