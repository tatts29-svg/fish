# Native purchase-order checks and pre-start upload safeguards

Author: Andrew Fisher · 15 Oct 2026

This folder owns only the four previously confirmed P/O checks: **4647508, 4647509, 4647515 and 4647517**. It does not upload pre-start documents or mark attendance, talks, safety checks or future work as completed.

## Purchase-order operation

`po_checked_guarded.cjs` imports the inspection and queue functions from the exact original `po_checked.cjs` source (SHA-256 `4c4f565d7d50f3740280c9df85517a281d35e36a1159c77f099388da7f95d503`). It never executes that original file's top-level runner. The final reviewed page must contain `poReviewBasis1021`; its native `setPo` creates the review basis. The person's confirmation remains **Andrew Fisher** at the existing spec's recorded confirmation time; the native audit actor is **Andrew Fisher via Codex**. The page's normal display formatting handles the person's visible name.

The runner saves the **entire native snapshot** privately before staging anything. After calling native `setPo`, it checks the whole-document diff and saves the exact request bodies in `request-plan.json`, with an fsync and directory fsync, **before allowing any request through**. Only the four purchase-order documents and their corresponding stamp/author documents are eligible. No monetary or other business field can change. Eight or twelve documents may change depending on whether the existing audit authors already match; the actual native diff determines the count.

Every request must exactly match the durable plan. Requests are forwarded serially, once each, and require HTTP 200 with a strictly advancing numeric version. The next request cannot be sent after an acknowledgement fails. Credentials and request data are passed to curl on stdin. No automatic retry, repair or rollback is attempted. A report is saved before each attempted request and after each acknowledgement. **The finally block always attempts a fresh full native read and records partial outcomes**, including every unrelated document change. Private files must stay outside Git.

Practice (all PUT responses are simulated in the browser, no network writes):

```sh
node release_review1021/records/po_checked_guarded.cjs --page /absolute/path/to/final-candidate.html --audit-dir /tmp/private-gc500-po-practice-UNIQUE
```

After the tested final page is published, the release owner can run the authorised operation with `GC500_EDIT_TOKEN` and `GC500_EXPECTED_PAGE_SHA` set privately. No `PAGE` substitution is permitted in apply mode:

```sh
node release_review1021/records/po_checked_guarded.cjs --apply --audit-dir /tmp/private-gc500-po-apply-UNIQUE
```

`report.json` records attempted and acknowledged counts; `before-state.json`, `request-plan.json` and `after-state.json` retain the evidence. A failed run must be inspected before a fresh plan is made. Never reuse its audit folder. Browser practice and the live application are the release owner's steps; only offline tests were run while preparing this folder.

## Pre-start uploader safeguard plan — held

The original `upload_prestarts.py` must **not** be used for the proposed batch until the underlying attendance and completed-pre-start claims are resolved. A programme, roster or scheduled task alone is not evidence that a person attended, a talk occurred or a check was completed. The generated PDFs have not been uploaded by this work.

Before any later authorised upload:

1. Resolve the document claim for each date and crew against the user's confirmation or original signed evidence. Produce no attendee or sign-off claims from planned names. Keep future run sheets explicitly uncompleted unless the user confirms a completed event.
2. Freeze a per-file manifest with exact SHA-256, byte count, title, crew, date, evidence basis and any exact replaced file IDs. Visually check the final pages. Use a private output/evidence folder outside Git.
3. Before the first POST, durably save the complete service listing, full operation plan and byte-verified backups of every file proposed for removal. Persist the partial report throughout and in `finally`, including a fresh listing even after failure.
4. Upload with no automatic retries and validate each server acknowledgement. A missing or mismatching hash is a hard stop: the original uploader merely warns in one such case, which is insufficient. Independently download each newly uploaded file and prove its bytes/hash, title, crew/date and metadata before considering removal of any old file.
5. Prefer retaining the previous originals until the replacement set is verified. If removal is explicitly authorised, remove only the exact backed-up IDs after rechecking their unchanged hashes. Stop on the first failure and retain all other originals.
6. Check the entire final listing: expected new files exist byte for byte, only authorised IDs are absent, all unrelated file IDs/hashes are unchanged and no duplicate title/date/crew was introduced. Keep a durable partial report even if verification cannot complete.

This is an uploader plan only; it does not authorise a batch, alter the original uploader or create completed attendance evidence.
