# v7.97 — photo outbox durability

Author: Andrew Fisher · 2 Oct 2026

**DRAFT — implementation and CPU regression complete; independent root review, official fresh-base build, standing suites and desktop/phone review remain before READY. Not published.**

A successful file upload previously deleted its IndexedDB outbox entry before saving the photo's reference. If localStorage then refused the save, the page still said “saved” and lost its durable retry entry. A failed Forget deletion also said the photo would not be sent while leaving it available for a later retry.

The queue now keeps the blob, returned service file ID and reference plan until the current photo document is both saved locally and acknowledged by the existing shared-record sync. It uses the existing `bump`, `syncPush`, `syncSend` and `syncSettled` path; no second record writer is introduced. Failed storage operations retain the queue or stop before upload, and the message says what actually happened. A later caption, removal or replacement is not overwritten by an older queued upload. A normal Replace still removes the intended previous photograph by its own tombstone and waits for both documents.

The existing pending-photo cell describes queued, uploaded and confirmation states; its layout stays the same. Forget cannot promise cancellation while processing or after the file is uploaded. A completed queue deletion that fails is retried without uploading the file again. There is no additional confirmation prompt.

## Recovery and concurrency

- A durable attempt checkpoint precedes file upload; a durable receipt precedes reference mutation.
- After a lost response/reload, the page checks the fresh file index by exact generated filename **and SHA-256**, and retains the actual returned service ID. Ambiguous or conflicting matches stay queued for review.
- When no matching file is listed, the normal automatic retry sends the same generated filename. The reviewed live server v5.87 derives the file ID deterministically from that name and replaces the same file/index entry. A retransmit may refresh upload metadata; this is stable file identity, **not an exactly-once transaction claim**.
- Web Locks serialize one photo across open pages when supported. A same-page reservation precedes IndexedDB awaits, and a fresh queue read prevents stale callers from reintroducing completed/forgotten entries. Browsers without Web Locks retain same-page protection; cross-page serialization is not claimed there.
- SHA-256 uses `crypto.subtle` and `Blob.arrayBuffer`, available in modern secure browser contexts. If unavailable, no new upload is attempted and the queue remains. The normal hosted HTTPS page is the intended context; real-device coverage is still part of final review.

## Verified server contract

The reviewed server source is `server_v5.87_pictures_from_shared_number_LIVE/server.js`, SHA-256 `d5a0d777da4871af1bf88804b4ef223354a29c2560213ab56f7897445b398fdc`, matching the deployment recorded on STATUS.

At lines 851–858, `fileId(name)` sanitizes the filename and `uploadFile` uses that deterministic ID. At lines 874–903 it writes the same destination and `files[id]`, then returns that exact metadata object. `upload_contract797_checks.cjs` runs that exact upload function twice with synthetic identical bytes in a temporary local directory: same ID, same checksum, one index entry and one physical file. No server is started and no service write occurs.

An authorised **GET-only** `/api/files` schema check found 188/188 current drop photos have a valid SHA-256, string name and ID; all 188 names equal their IDs and match the generated-name format. Evidence includes only field names and aggregate checks, no file/person identifiers. The normal frontend backend uses `cache: 'no-store'` for this index.

## Files and checks

- `patch_v797.py` uses the shared exact-replacement helper and checks SHA-256 of every original function span. It rejects repeated application and unexpected base changes.
- `photo797_src.js` contains only photo persistence/recovery functions and helpers.
- `photo797_checks.cjs` runs exact production photo/save/sync code with mocked storage and transport. **17 cases pass:** success/acknowledgement, local quota, document rejection, reload, receipt-checkpoint failure, lost response, file rejection, initial queue failure, Forget failure/success, cleanup failure, later removal, late upload versus newer slot, ordinary Replace, checksum conflict, IDB abort, two-page locking/stale retry, and no-Web-Locks fallback.
- `upload_contract797_checks.cjs` independently exercises the exact reviewed server upload function with temporary synthetic files.
- `evidence/` contains the CPU results and sanitised file-schema observation.

Run from `03_GC500_Delivery_Control`:

```sh
node v7.97_photo_outbox_durability_DRAFT/photo797_checks.cjs build/GC500_v7.97/base_live.html v7.97_photo_outbox_durability_DRAFT/evidence/photo797_checks.json
node v7.97_photo_outbox_durability_DRAFT/upload_contract797_checks.cjs "$SOURCE_SERVER_JS" v7.97_photo_outbox_durability_DRAFT/evidence/upload_contract797_checks.json
bash toolchain/build.sh v7.97 v7.97_photo_outbox_durability_DRAFT/patch_v797.py
```

The development patch/static check used the immutable v7.94 snapshot `bb245eb19de977e984bc8d1c045fa9bf59fc943649933f416f7d384f9fa0c8e1` with unchanged photo functions. Root owns the official build on the then-current live page after v7.96 publication. No operational record has been changed, and no production upload was used as a test. The unrelated print font fallback remains outside this patch.

## Review record

Implementation and the 17 CPU scenarios completed by the assigned persistence agent. Root's independent review is in progress. No second-agent approval, official browser regression or final release state is claimed by this README.
