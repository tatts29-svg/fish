# Paired page and machine publication

Author: Andrew Fisher.

`paired_machine.py` separates the long machine blob upload from registration. It reuses the reviewed v8.93 publisher's
plan and final registration/readback, binding the **full** final manifest (including version and label) and its exact file
SHA-256. It never uploads a page, changes operational records or calls a media endpoint.

Run only after the selected page and exact machine pair have completed review/tests and ownership is coordinated.
The edit credential must already be supplied privately as `GC500_EDIT_TOKEN`; never put it in an argument or file.
Use a fresh private report outside every Git checkout for each invocation. A shared nonblocking machine-publisher lock
prevents these wrappers overlapping; coordination is still required with tools which do not use that lock.

From `03_GC500_Delivery_Control`, with the reviewed paths already configured:

```bash
machine_args=(
  --base-manifest v8.87_map_explorer_DRAFT/machine/retained_manifest_v864_b469a99c.json
  --frozen-manifest "$MACHINE_MANIFEST"
  --expect-candidate '<reviewed canonical machine SHA-256>'
  --expect-manifest-file '<reviewed exact manifest-file SHA-256>'
  --code "$CODE" --assets "$ASSETS"
  --over v8.93_maps_aligned_DRAFT/assets_small
  --readme v8.93_maps_aligned_DRAFT/explorer_text/README.md
)
python3 review_08Oct2026_ready_chain/publication/paired_machine.py "${machine_args[@]}" \
  --dry-run --report /private/release/machine-dry-run.json
python3 review_08Oct2026_ready_chain/publication/paired_machine.py "${machine_args[@]}" \
  --stage-only --report /private/release/machine-stage.json
```

The complete release sequence is:

1. Revalidate reviewed page/source/machine hashes and both unchanged live bases; run the normal media/page dry runs.
2. Upload/register the final v8.96 media manifest using its existing uploader and all required image folders.
3. Run `--stage-only` above. It uploads only missing reviewed content-addressed machine blobs, checks inventory after
   each upload and confirms the live machine base remains unchanged. No manifest POST is possible in this phase.
4. Upload the exact reviewed page using `toolchain/upload_page.py`. Its unchanged-page-base guard remains in force.
5. Immediately run the command below. It refuses any missing blob, then delegates to the existing publisher with
   frozen final version/label. The transport forbids PUT and allows one exact manifest POST after another base/input/
   inventory check. The existing public asset readback must pass, followed by exact public digest/version/label checks.

```bash
python3 review_08Oct2026_ready_chain/publication/paired_machine.py "${machine_args[@]}" \
  --publish --report /private/release/machine-publish.json
```

This removes bulk uploads from the page/machine transition window; it is not an atomic server transaction. If staging
stops, the active machine registration is unchanged and some reviewed blobs may already exist. Inspect the report and
fresh inventory before a new invocation. If publication stops after a POST attempt, inspect the public/admin machine
digest before any retry. Never bypass a changed-base or missing-blob guard. Claim the pair live only after both page and
machine exact readbacks and live UI checks pass.

The upstream publisher's original response output is suppressed. Reports contain controlled hashes, paths, request
methods and phase states only. Its temporary proof is kept privately and removed after validation.

Offline verification (mock transport only):

```bash
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover \
  -s review_08Oct2026_ready_chain/publication -p test_paired_machine.py -v
```
