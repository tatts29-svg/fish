# Coates Way inspection improvements

Author: Andrew Fisher

IN PROGRESS — v13.05. Andrew approved the five proposed improvements with “Proceed with” in the current chat. Implementation and independent source reviews are complete; final browser acceptance is running. This is not READY or live.

The original Coates machine now supports smooth, interruptible inspection camera moves; phone bench controls below or beside the model; deliberate taps on registered components; geometry-following highlights; and bounded inspection lighting that restores the original lighting on exit. Existing service, lift, bench, cycle, tour and rotation features are retained. No operational, map or finance changes.

Candidate: `v13.05-workshop-inspection`, manifest `b4cf3f0b2b768031f26d7463bdb8c7168506a1faee048f046407d8d1103b75b2` (249 files, seven changed paths, 242 retained). Base machine `f139782e513a360ab87e05b7899defb02348355a4e7e09e7ae06fdfcedba9aad`. Dashboard remains `2f6bc154b896a33252f21b1b438593b2d7453b79bb47ef3ff01abb0721624e7b`.

Starting source `79326817dbcb2b35c20d7d99980a6838013bbcb4`, shared branch `ccr-061f77e8-ivjhrv`, isolated `codex/workshop-inspection-1305`; claim `1c430b27286bd7a7fb3cda3ce3ea956b47667d03`. Codex owns implementation, tests and guarded publication. Claude retains event Showcase/race narration and finance; no Claude receipt or review claimed.

Completed checks: camera 4,420; selection and actual-model geometry 3,118; lighting 33; release guards 34. Independent reviews found and resolved polar-limit interruption, mobile keyboard containment, highlight GPU buffer retirement and a protected-blob size typo. Browser preview confirmed portrait/landscape visibility but was diagnostic on an earlier candidate. Candidate 3 passed 99 desktop dashboard checks but its phone run exposed a transient orientation collapse. Candidate 4 fixes tray geometry through immediate CSS orientation rules plus native resize framing; independent static review passes. Candidate 5 also fixes the six-pixel landscape header overflow found by the strict layout-width check; header-only checks pass across 801–932 px with all controls retained. Final candidate 5 machine phone/desktop and dashboard phone/desktop receipts are still required, followed by guarded registration and fresh live-phone verification. Physical-device frame rate has not been measured.

Implementation details: `CAMERA.md`, `UI.md`, `SELECTION.md`, `LIGHTING.md`. Exact candidate descriptors and source hashes: `evidence/`. Reproduction and publication requirements: `release/README.md`. Final receipts must bind this exact candidate; never reuse receipts from a superseded build.
