# Coates Way workshop inspection

Author: Andrew Fisher

**READY TO UPLOAD — v13.05-workshop-inspection.** Andrew approved the five proposed refinements with “Proceed with” in the current chat. Codex implemented, tested and independently reviewed this bounded machine release; Codex is its sole publisher. Publication and fresh live verification are next.

The machine gains smooth, interruptible inspection camera moves; phone controls below or beside the visible model; deliberate taps on registered components; geometry-following highlights; and bounded inspection lighting with exact restoration on exit. The orange Coates identity and existing mechanic, lift, bench, lessons, tour and original car controls remain intact.

Candidate manifest: `b4cf3f0b2b768031f26d7463bdb8c7168506a1faee048f046407d8d1103b75b2` — 249 files, 170,014,185 bytes, seven changed paths and 242 retained. Machine base: `f139782e513a360ab87e05b7899defb02348355a4e7e09e7ae06fdfcedba9aad`. Dashboard remains exact v13.01, `2f6bc154b896a33252f21b1b438593b2d7453b79bb47ef3ff01abb0721624e7b`. No record, map or finance changes.

Final candidate acceptance passes **127 desktop and 147 phone machine checks**, plus **99 desktop and 100 phone dashboard checks**, covering all 27 routes and seven deep links. All four receipts report zero runtime/console errors and zero attempted record writes. The existing publication validator accepts all four receipts and the complete 249-file candidate. See `evidence/acceptance-validation.json`, the four check receipts and the final visual review/screenshots.

Focused evidence: camera 4,420 checks against the retained OrbitControls; selection and actual-model geometry 3,118; lighting 33; release guards 34. Independent source, release-guard and phone visual reviews pass. The final orientation test checks actual document width, model visibility and usable controls. Physical-device frame rate has not been measured. Superseded failed runs remain clearly labelled in the evidence directory and are not acceptance receipts.

Shared branch: `ccr-061f77e8-ivjhrv`; isolated branch: `codex/workshop-inspection-1305`. Starting source `79326817dbcb2b35c20d7d99980a6838013bbcb4`, claim `1c430b27286bd7a7fb3cda3ce3ea956b47667d03`, implementation/test source before acceptance evidence `893e3ed06fd48d68295d90e788ea06e22a6114b0`. The READY board entry names the final committed acceptance source. Claude retains event Showcase/race narration and finance; no Claude receipt or review is claimed.

Implementation details: `CAMERA.md`, `UI.md`, `SELECTION.md`, `LIGHTING.md` and `REVIEW.md`. Exact hashes: `evidence/build.json` and `source-evidence.json`. Reproduction and guarded publication: `release/README.md`. The build JSON records its pre-test state; completed acceptance is recorded separately in the final receipts.
