# Read-model consistency — DRAFT

Author: Andrew Fisher.

Bounded read-only association of existing evidence when a canonical native unit ID changes. The projection requires one current physical identity and one matching typed evidence entry on the same reference. Unknown owners, anonymous slots, product/count rows, duplicate numbers and conflicting or repeated evidence do not create an association. Asset numbers are compared exactly, including leading zeros.

Original records, event objects, financial models and physical quantities are unchanged. The existing direct-ID and complete-type/reference rules remain in place. The map frame and off-site presentation implementations are untouched.

The patch requires both the exact reviewed base SHA-256 and its explicit footer version. Root must rebuild from the verified release that immediately precedes publication. This folder is DRAFT, not ready to upload; final-successor preservation, desktop/phone navigation and guarded publication/read-back gates remain outstanding.

Public tests use synthetic fixtures only. Native findings and original records remain in private storage.

Local checks passed on the reviewed v12.43 predecessor: 43 identity cases, 19 checks using the actual native reader and remaining-model functions, strict patch boundary/replay checks, and syntax checking of the complete changed inline script. The unchanged native reader reproduces the missed association on the synthetic canonical-ID fixture; the candidate resolves it without changing the neighbouring unit. These checks do not establish a live release.

An independent Codex subagent reviewed the implementation, patch and tests without finding a concrete defect or private-data leak. This was a code review, not Claude review.

The separate native browser comparison passed 1,403 checks on one frozen record. Actual current native metadata was read without supplementation. Only the expected association and remaining-model membership changed; financial models, source contracts, documents, reference status/aggregates and board projections remained exact. Runtime errors, console errors, HTTP write attempts and queued/inflight writes were all zero. A focused phone read-back also passed and its screenshot was visually inspected with the changed label clear below the fixed header. This verifies the preview, not a published release.

Tested predecessor: v12.43 SHA-256 `7efda7e067d34b1455d8da9e3de29c695d4d216afc072e49e27754295a09976f`. Tested preview: `e358899422d24c3ac7b5728ae36567d2378eecbe319e34da9e754e22f5097ecb`, 16,033,283 bytes. All native artifacts and screenshots remain private. Rebuild and rerun affected checks on the final predecessor before publication.

```sh
node tests/test_read_model1246.cjs
BASE=/path/to/reviewed-predecessor.html BASE_VERSION=12.43 python3 tests/test_patch_v1246.py
BASE=/private/base.html PAGE=/private/candidate.html STATE=/private/state.json OUT=/private/read-back MATCH_FIXTURE=/private/matches.json node tests/native_read_model.cjs
PAGE=/private/candidate.html STATE=/private/state.json OUT=/private/phone-read-back MATCH_FIXTURE=/private/matches.json node tests/ui_readback.cjs
```

The native gate uses the existing read-only candidate harness, the same frozen record for both pages, and private expected-match parameters. It verifies actual native metadata without filling missing fields, compares all reference associations and remaining rows, preserves complete financial/contract/document/reference/board projections, and captures the changed card on a phone viewport. Native evidence and screenshots stay outside this repository.
