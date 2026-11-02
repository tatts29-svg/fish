# Fencing classification review — draft v12.82

Author: Andrew Fisher

**HELD — DO NOT UPLOAD.** [Coordination comment 6572823375](https://github.com/tatts29-svg/fish/pull/1#issuecomment-6572823375), updated 2 Nov 2026 08:47 UTC, says docket 36641 is under Andrew's review and may be set aside. That newer instruction supersedes this candidate's assumption that its current allocation can be treated as settled. No publication is authorised while that disposition remains unresolved. The candidate is retained only for technical review; current record and ownership must be rechecked before any continuation.

The current fencing card reopens a programme range because the newly recorded hire agreement 36641 has no entry in the source-review catalogue. Its accepted Event allocation is already in the record. This patch adds that one reviewed fingerprint and its original's checksum. The existing build-completion rule then applies through the shared model used by Today and Progress.

The original names CC barrier, without an Event/Demarcation category. The recording notes establish the current Event allocation. Gate 1 has programme work in both categories, so the review does not claim that location alone proves an exact programme-row match. It preserves the recorded category under the existing docket-authority rule.

No operational record, quantity, category, price, cost, revenue, month or branch allocation is changed. The original programme comparison remains available in the completion evidence. Changed record fingerprints, missing or changed sources, duplicate identities and other unreviewed dockets still require review; the patch never forces a percentage.

## Exact source and private input

- Starting source: `61657ebf1fca65ee87e0fa803269b7db38ec1cd1`, branch `ccr-061f77e8-ivjhrv`.
- Required live base v12.81: `3b17c3de36c8c3f2d99042b0c83dfd9fdc110ccb9db7a1c21ef6c9f72704a85b`.
- Private review JSON SHA-256: `7615128c0618e3a0f5076e2d8619ff3c48782c09fd9d257ebfe06b3f99e5b0bc`.

Set `FENCING1282_REVIEW_JSON` to the authorised private review JSON. It is intentionally absent from this repository: the exact fingerprint contains operational notes. The build refuses a missing or altered input, a different live base, or a second application. Exact record names in the fingerprint survive the normal attribution scrub by JSON escaping, as in the existing reviews.

From `03_GC500_Delivery_Control`:

```sh
FENCING1282_REVIEW_JSON=/authorised/private/data_v1282.json \
  toolchain/build.sh v12.82 v12.82_fencing_completion_DRAFT/patch_v1282.py

BASE_HTML=/authorised/private/live.html \
FENCING1282_REVIEW_JSON=/authorised/private/data_v1282.json \
  python3 v12.82_fencing_completion_DRAFT/tests/test_patch1282.py

PAGE=build/GC500_v12.82/GC500_Delivery_Control_hosted.html \
STATE=/authorised/private/state.json EVIDENCE=/authorised/private/evidence \
  node v12.82_fencing_completion_DRAFT/tests/test_v1282.cjs
```

Repeat the browser test with `MOB=1`. `STATE` is optional; when supplied, it pins the read-only shared record used in the regression. Browser checks reproduce the reported range without the review, verify the shared completed reading with it, retain the historical comparison, exercise each stale/source/duplicate guard, and compare operational data and financial models before/after. The harness blocks operational writes. Detailed evidence and screenshots remain private.

`tests/test_set_aside1282.cjs` requires `PAGE` and the original private `STATE`. It serves a synthetic set-aside GET fixture to the read-only harness; it never runs the record action. That fixture passes 7/7 and proves the original model and candidate are identical after the docket is set aside. The existing live v12.81 completion rule already restores the completed reading in that case, so this patch would be unnecessary. This test does not establish that the real record has changed or that a decision has been made.

## Status

Held draft. Preservation/input guards pass 5/5; the shared-model/source-guard test on frozen record 12856 passes 32/32 on the phone, with no page errors, console errors or operational writes. Earlier desktop model assertions also passed; its first screenshot attempt failed on a closed custom fold. The corrected phone capture is clipped under the existing sticky interface and is not a full visual-composition sign-off. A separate source review confirms exact byte preservation outside the one added script/footer and exact fingerprint preservation through the standard scrub. These checks do not settle the newer docket review or authorise publication. No live publication or independent live read-back is claimed here.

Both broad release sweeps on the identical candidate passed 27 tabs with zero page errors, console errors and operational writes. Detailed sweep outputs remain private. The newer hold still applies.
