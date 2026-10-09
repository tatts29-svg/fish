Author: Andrew Fisher
GC500 v8.50 — P/O quantities matched to dockets
State: VERIFIED LIVE — 5 Oct 2026 at 10:11 AEST. Implementation 1c2fb973; final READY c6b7ab7a.

An expandable source comparison shows explicitly documented supplier quantities
alongside their matched docket components. Source differences stay separate.
Programme units can differ from supplier component-based units, so this view
does not add them to completion, remaining work or percentage calculations.

Every existing quantity, progress total, percentage, planning estimate and
financial input/output remains unchanged. The view does not infer payment status,
post another cost, duplicate docket activity or claim that a component is another
gate opening. Links open the original dockets, supplier summaries and programme
evidence. Current records and source-file identities must still match the review.

Base v8.49 SHA-256:
924955d5560006bcac1fd07765dffb51692154e04585dae1eefcc292ef602fb1

Build input is a reviewed private evidence manifest, kept outside Git:
  FENCE_PO850_INPUT=/private/path/evidence.json \
    toolchain/build.sh v8.50 v8.50_po_gate_progress_LIVE/patch_v850.py

Codex owns source review, implementation, independent checks and publication.
Claude remains intentionally paused. Detailed original findings, values, input
manifests and browser captures remain outside Git and public coordination.

Candidate SHA-256:
1b24ad4e267d23f4ae20b03968551d275afda0c29d527f63aee62388ed9ac222
Bytes: 10,932,100

Checks: standard build; 22 exact preservation; 27 model guards; 12 independent
patch checks; 66 laptop/phone browser checks; both 22-route/seven-link/Back
sweeps. Zero runtime errors or operational writes. See RELEASE_REVIEW.txt.

Published at 10:11 AEST on 5 Oct 2026. Actual-public laptop/phone 68/68 pass with
exact public bytes and zero HTML substitutions or operational writes. All 33
shared-record collections remain unchanged. Server health OK, no deployment.
Refresh an existing tab once to load the new page.
