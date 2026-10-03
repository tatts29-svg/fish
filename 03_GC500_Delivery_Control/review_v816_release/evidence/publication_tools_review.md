# Publication tooling review

Author: Andrew Fisher · 3 Oct 2026 AEST.

The page and machine releases use separate endpoints. Source review found no operational-record write in the helpers below. This audit made no service request and published nothing.

The reusable snapshot helper is `review_v815_release/evidence/release815_verify.py`. It makes cache-busted GET requests only, stores collection fingerprints and the record version in a required repository-external directory, creates snapshots exclusively with mode 0600, preserves each failed comparison, and prints aggregate results. Exit 1 means page mismatch or verification failure; exit 2 means the record or version changed and needs private inspection. Use a fresh before snapshot immediately around each publication, not a historical audit-start snapshot.

From `03_GC500_Delivery_Control`, after setting `GC500_V816_PAGE` to the exact tested HTML:

```bash
python3 review_v815_release/evidence/release815_verify.py before --private-dir /workspace/private-publication-v816-record
python3 toolchain/upload_page.py "${GC500_V816_PAGE:?Set the exact tested v8.16 HTML path}"
python3 review_v815_release/evidence/release815_verify.py after "$GC500_V816_PAGE" --private-dir /workspace/private-publication-v816-record
```

Run these sequentially and stop on an unexpected result. The uploader requires `base_live.html` beside the build, compares it byte-for-byte with the current public page, requires edit capability, writes only `/api/admin/app`, then verifies exact public HTML bytes. Do not use `--force`. Its service-response stdout should remain private until reduced to safe publication evidence.

The stock machine helper has no live-base guard or post-registration readback. Its source is tracked at `satellite_explorer/tools/machine_set.py`; that path is absent in the sparse checkout. The existing runnable copy `/workspace/private-gc500-final-release/machine_set.py` matches the tracked source exactly: SHA-256 `920fbad67167526dc9118d007c394d050f579bd97d18a8251ee8ea3994c03d73`. The prior `publish_machine813.py` wrapper is restricted to four map replacements and forbids additions, so it cannot publish this machine union unchanged.

The new `review_v809_release/evidence/publish_machine809.py` pins that helper and both frozen manifest files, verifies the canonical base `65c47180…` and candidate `7d2ff39f…`, requires exactly 17 changed, 7 added, 202 unchanged and zero removed descriptors, checks all four retained maps and all 63 local work files, and permits only the 24 reviewed payload hashes. It rechecks the live base immediately before manifest registration, checks the expected public HTML, then verifies the registered digest and all 226 public files by SHA-256 and length with four concurrent GET requests. It prints only aggregate outcomes and keeps partial-failure state outside Git. The only permitted writes are content-addressed machine blobs and the machine manifest.

After v8.16 is verified live, this performs GET-only preflight:

```bash
python3 review_v809_release/evidence/publish_machine809.py \
  --base-manifest v8.09_coates_way_machine_DRAFT/evidence/handover/base_manifest_v813.json \
  --manifest v8.09_coates_way_machine_DRAFT/evidence/manifest_v809.json \
  --work v8.09_coates_way_machine_DRAFT/work \
  --machine-tool /workspace/private-gc500-final-release/machine_set.py \
  --private-dir /workspace/private-publication-machine809-preflight \
  --expected-page-sha 7ae89da4e80b070ade2977ef4e47ed3e766be6dc7722bd610e21ad78ddaa77d0 \
  --dry-run
```

For authorised publication, use the same command without `--dry-run` and a different, new private directory, after taking a fresh record snapshot. Follow it with the snapshot helper's `after` mode against the live v8.16 page. A failed post-registration readback is a potentially published state: inspect the private outcome before retrying. The final preflight is a client-side comparison, not an atomic server compare-and-swap; maintain the agreed release freeze through registration. The wrapper's independent review is recorded separately before execution.

Offline AST parsing and frozen-manifest validation passed. No publication command or wrapper network path was executed by this audit.
