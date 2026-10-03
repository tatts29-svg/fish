Author: Andrew Fisher

v8.30 source-note reconciliation — LIVE

Two existing plan-page notes omit source context. This change appends the verified
context to those notes without creating another task, note row, quantity or charge.
The existing renderer, source dates, work completion and map geometry are retained.
Historical references do not become current operational instructions.

Base: v8.29
SHA-256: 8af09119006f7fad218b4fad3146ccc49d5c7cb6546f5f8a2ab626304484ccbf
Candidate: 10,115,041 bytes
SHA-256: 24b9bc1f256171330e5f02546fbf64fb3f82d3e9ec919ad60c4c1737182535d0

Build through toolchain/build.sh with patch_v830.py. The reviewed private JSON
specification is supplied using GC500_V830_PRIVATE_SPEC and bound by its exact
GC500_V830_SPEC_SHA256. The generic helper accepts only two existing note-text
appends, refuses a stale base or repeat application, and proves every other DATA
value unchanged. Private source text and source documents are excluded here.

Eight portable patch tests and the standard inline-script/credential checks pass.
Final focused desktop/phone checks pass 28/28. Both navigation sweeps pass all
22 tabs, seven deep links and Back with zero browser errors or attempted writes.
Independent source comparison confirms only the two note texts and release labels
change. Financial and recorded numeric projections match the base on both sizes.
Desktop/phone screenshots inspected. Exact frozen source: 2229c982.
Guarded upload and public readback completed 4 October 2026 at 05:12 AEST.
Actual-public desktop/phone smoke passed 18/18 at 05:15 AEST, with no local
HTML or asset substitutions, browser errors or attempted operational writes.
Public raw bytes match the candidate. Chromium's decoded response omits only
the source's UTF-8 BOM; decoded parity and matching response ETags were verified.
All operational collections are unchanged across this frontend publication.
See RELEASE_REVIEW.txt for verification scope and retained harness limitations.
No operational-record write or backend deployment is performed by this patch.
Implemented and independently reviewed by Codex; Claude remains intentionally paused.
