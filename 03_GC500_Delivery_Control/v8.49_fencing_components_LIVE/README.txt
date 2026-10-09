Author: Andrew Fisher
GC500 v8.49 — fencing components and separate planning estimates
State: VERIFIED LIVE, 5 Oct 2026 at 09:49 AEST.

Recorded component quantities are now visible beside the existing fencing work
readings, with expandable links to their original dockets and supplier summaries.
Collections remain separate activity. Gross quantities on the dockets do not
claim to be unique stock on site or proof of completed installation. Missing
counts remain unrecorded, and source discrepancies are listed separately.

The optional planning guide uses panel counts, width, fixed runs, gate leaves and
openings to estimate feet, clamps and bracing. It shows separate spare allowances
and distinguishes uncertain run geometry. It does not save or post quantities.
Existing totals, completion percentages, Revenue and Direct costs are unchanged.
No estimate is added to the source records or used to fill an actual total.

The original eight fencing work readings and financial calculations remain
authoritative. New source findings are bound to exact records and original-file
hashes; if those change, the finding needs another review. An unavailable finding
does not hide the existing readings. Supporting information uses collapsible
sections within the established layout.

Base v8.48 SHA-256:
5d786af57e3986fc912cf34d33f094566a41836ee88a1160f5a3dab05e339a47
Candidate SHA-256:
924955d5560006bcac1fd07765dffb51692154e04585dae1eefcc292ef602fb1

Build from the exact live base using the reviewed private evidence input:
  FENCE_EVIDENCE849_INPUT=/private/path/evidence.json \
    toolchain/build.sh v8.49 v8.49_fencing_components_LIVE/patch_v849.py

Private evidence inputs, originals and detailed source findings remain outside
Git. The public patch and synthetic tests contain no private fixtures. Review
state and publication evidence are recorded in RELEASE_REVIEW.txt.

Implementation a3c99efb; READY 99425f18. The guarded upload matched the exact
unchanged base and the public view serves the tested build byte for byte.
Actual-public laptop/phone checks pass 82/82, with no local HTML substitutions,
runtime errors or operational writes. All 33 shared-record collections remain
unchanged. Server health is OK on v5.87; no backend deployment. Existing tabs need
one reload to v8.49. Claude remains intentionally paused.
