# Coates Way workshop inspection

Author: Andrew Fisher

**LIVE — v13.05-workshop-inspection, 6 Nov 2026 15:39:50 AEST.** Andrew approved the five proposed refinements with “Proceed with” in this chat. Codex implemented, tested and published the bounded machine release. Guarded publication, exact public read-back and a fresh live phone browser check pass.

The machine gains smooth, interruptible inspection camera moves; phone controls below or beside the visible model; deliberate taps on registered components; geometry-following highlights; and bounded inspection lighting with exact restoration on exit. The orange Coates identity and existing mechanic, lift, bench, lessons, tour and original car controls remain intact.

[Open the live machine](https://gc500-production.up.railway.app/w/Coates-GC500-2026/).

Published source: `8bb27046aa89ca585f7d7ef04db84e5d7e9fa042`. Tested implementation and acceptance evidence: `e8e22732d37f4f1ce37c74f173822c451c2388f1`. Shared branch: `ccr-061f77e8-ivjhrv`; isolated branch: `codex/workshop-inspection-1305`.

Active manifest: `b4cf3f0b2b768031f26d7463bdb8c7168506a1faee048f046407d8d1103b75b2` — 249 files, 170,014,185 bytes. Seven changed paths, 242 retained descriptors and eleven protected unlisted server blobs are preserved as expected. This supersedes machine v13.04 `f139782e513a360ab87e05b7899defb02348355a4e7e09e7ae06fdfcedba9aad`. Any next machine change must start from the complete new 249-file manifest; do not replay this release. Dashboard remains exact v13.01, `2f6bc154b896a33252f21b1b438593b2d7453b79bb47ef3ff01abb0721624e7b`. No record, map or finance changes.

Final candidate acceptance passes **127 desktop and 147 phone machine checks**, plus **99 desktop and 100 phone dashboard checks**, covering all 27 routes and seven deep links. All four receipts report zero runtime/console errors and zero attempted record writes. The existing publication validator accepted all four receipts and rehashed the complete 249-file candidate. See `evidence/acceptance-validation.json` and the four acceptance receipts.

Fresh actual-live phone verification passes **31/31 checks**, verifies all seven changed files from fresh public GETs and hashes all 77 loaded machine files, with no candidate substitutions, runtime/console errors or record writes. Native camera transitions, actual component taps, drag rejection, geometry highlights, lighting restoration, service, bench, cycle keyboard control, rotation and exit pass. Root inspected the live phone screenshots. See `evidence/live-browser.json`, `evidence/live-phone-cycle.png` and `evidence/live-phone-service.png`. The guard receipt, registration state and fresh public status are also in `evidence/`.

Focused evidence: camera 4,420 checks against the retained OrbitControls; selection and actual-model geometry 3,118; lighting 33; release guards 34. Independent source, release-guard, phone visual and offline publication-consistency reviews pass. Offline receipt review is distinct from root’s fresh live browser verification. Physical-device frame rate has not been measured. Superseded failed runs remain labelled and are not acceptance receipts.

Codex release work is complete with no remaining release blocker. Claude retains event Showcase/race narration and finance. The handover is posted in PR #1; no Claude receipt, agreement or review is claimed.

Implementation details: `CAMERA.md`, `UI.md`, `SELECTION.md`, `LIGHTING.md` and `REVIEW.md`. Exact hashes: `evidence/build.json` and `source-evidence.json`. Reproduction and the historical guarded publication procedure: `release/README.md`. Build evidence records its earlier pre-test state; final acceptance and live evidence are separate.
