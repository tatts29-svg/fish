# Native planning document

Author: Andrew Fisher.

Applied and verified 21 Oct 2026. Fifteen individually reviewed originals were added through fifteen successful native saves and exact downloaded-byte checks, following fifteen read-only practices. The library grew from 533 to 548 entries; all prior entries and the complete native state remained unchanged. The exact v10.95 public page was preserved. Source `0909a9cedbbd5c904f9c6e8fd6b5f40bce2bfaf7`; sanitized evidence is in `validation.json`.

This is a file-library operation, not a page release. The private reviewed specification names one PDF and its approved ordinary library metadata. No attachment contents, private filenames, credentials or detailed findings belong in this folder.

`record_document.cjs` uses the existing page's `SYNC.backend.upload` function. It never assigns an asset reference, changes a current-map pointer, or imports operational data. The document appears in the existing Maps and drawings collection. The library keeps its current audience.

The runner has three modes:

- `--inventory`: fresh GET-only file-catalogue and operational-record backups; reports name, sanitized-ID and hash collisions.
- `--practice`: opens the reviewed candidate with the shared read-only harness. One exact native upload request is intercepted and answered locally. No POST reaches the service. It verifies the normal Documents projection and saves a private frozen specification.
- `--apply`: requires the exact frozen specification hash, the successful practice receipt, unchanged runner/guard hashes, the exact published page and native edit authority. It permits one reviewed `POST /api/files`. The page's background native writer is paused and every other mutation is refused. A fresh catalogue check precedes the request; every prior catalogue entry must remain exact afterwards. Downloaded PDF bytes, metadata, existing operational records and published page are verified before success is reported.

Every existing native record must remain exact. The only permitted concurrent native additions are complete new `photoLinks` records with their matching `stamps` and `by` records. Identity, independent author and observation-window timestamps are checked, and accepted additions are logged privately. Each fresh checkpoint protects previously observed additions as well. Partial triplets, edits, deletions and other native additions stop the operation. This does not relax the file catalogue check: the catalogue must gain exactly the one planned PDF.

Existing files, including exact duplicates, are never deliberately uploaded again. The server's existing upload endpoint does not provide atomic create-only semantics, so the owner must serialize this operation against other library writers. A failed or uncertain response is not retried: inspect fresh catalogue and original bytes first.

Run `node test_document_guards.cjs`, `node test_native_preservation.cjs`, `node test_runner_gate.cjs` and `node test_document_projection.cjs` for the synthetic checks. The latter two exercise callbacks extracted from the actual runner. All private evidence, screenshots, snapshots, specifications and original/downloaded PDFs go outside the repository.

Environment:

```text
GC500_DOCUMENT_SPEC       absolute private specification path
GC500_RECORD_OUT          existing absolute private evidence directory
PAGE                      exact local candidate, practice only
CHROMIUM_PATH             installed Chromium executable
GC500_DOCUMENT_PRACTICE   successful private practice directory, apply only
GC500_EXPECTED_SPEC_SHA   exact frozen specification hash, apply only
GC500_EXPECTED_PAGE_SHA   verified published page hash, apply only
GC500_EDIT_TOKEN          private environment credential, apply only
```

Use the shared browser lock for practice or application. Actual application remains with the release owner after concurrent native work is complete. A passing practice is not evidence that a document has been added.
