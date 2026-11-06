# Pending delivery queue: v12.42 sync reproduction

Author: Andrew Fisher

This reproduces an incoming unit being lost when another unit on the same reference is already queued locally. It is an offline review of draft source, not a fix or live-record test. Claude retains ownership of v12.42.

The script reads these exact sources:

- Draft commit: `7d84b522ab249c31df647f3b02a16ee40c322c12`.
- Captured v12.41 HTML SHA-256: `e106502b347cb51519f6aaed1eec5b6ba20a301b06490df04e3d29569d55b422`.

The checkout must contain that commit. Supply an existing copy of the verified HTML; the script does not download anything.

```sh
node queued_unit_sync_repro.cjs --repo <checkout> --base <verified-v12.41.html>
```

Expected result on the pinned draft: **failure, exit code 1**. The queue-empty control retains synthetic units A and B. With a pending local delivery document containing A, only A survives the incoming server document containing B. Exit code 2 means the inputs or source extraction could not be verified. Exit code 0 would mean both cases retained both units.

The native `syncFold` first stores the incoming documents in `SYNC.last`, then overlays each pending whole document onto them, then calls `fromDocs`. The new hook in `patch_v1242.py` lines 53–55 calls `keepUnits` only after this overlay. At `singles1238_src.js` lines 1211–1218, it therefore sees the local document against the current local record; the incoming remote unit is no longer available to merge. The pending whole-document send can subsequently overwrite that unit on the service.

The existing queue-empty recovery test in `tests/test_v1242.cjs` lines 231–239 does not cover this case. A correction needs to preserve the new unit/history fields from the original incoming document as well as current and queued values, while retaining deliberate queue deletions and all unrelated fields. The owner must add pending-queue regression coverage and rerun the final release checks.

All identifiers and values in this reproduction are fictional. It uses a JavaScript VM with stubbed timers and sender; it makes no network requests and changes no application records or product files.
