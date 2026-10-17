# Guarded v10.65 machine publication

Author: Andrew Fisher.

The shared `satellite_explorer/tools/machine_set.py` is still the publisher. This wrapper pins its reviewed SHA-256,
checks the current 236-file v10.64 manifest, and permits exactly three replacements: `explorer/explorer.js`,
`explorer/explorer-merge.js`, and `explorer/index.html`. All other 233 descriptors remain identical.

Candidate preparation belongs to the parent release pipeline. Supply the reviewed candidate files and
`source-bound.json` with `baseManifest` plus exactly three `files` entries, each containing `base`, `sha256`, and
`bytes`. Each `base` must match the retained manifest. Candidate bytes are checked before any network access and
again before registering the manifest.

Use the script with:

```sh
python3 release/publish_machine1065.py \
  --keep /private/path/to/v1064-manifest.json \
  --candidate-dir /private/path/to/1065-machine-candidate \
  --evidence /private/path/to/1065-machine-candidate/source-bound.json \
  --expected-base 1348bf1bbcf69400aab0e510e7239d68dac567d40d103898323bf9abdef7bf6f \
  --machine-tool /path/to/shared/satellite_explorer/tools/machine_set.py \
  --out /private/path/to/fresh-empty-receipt-directory \
  --preflight
```

Default mode builds a manifest without writes and reads only the public current manifest. `--preflight` also checks
edit access, server readiness and full blob inventory with read-only requests. Explicit `--publish` performs those
checks again and enables the three reviewed blob PUTs and one manifest registration. The edit credential comes
only from `GC500_EDIT_TOKEN`. Use a new empty output directory for every run.

The reviewed server protection evidence is the v5.89 deployment handover (PR #1 comment 6241517868 and the
current `STATUS.md`), which names `SERVER_FILE` and all five `SERVER_FILE_KEEP` blobs. Full hashes and sizes were
matched against the read-only inventory. Inventory presence alone does **not** prove environment protection.
The helper requires exactly the known v5.89 build and those six blobs. An older or newer unknown server build,
missing protected blob, or extra unlisted blob stops publication until its handover is reviewed; it is never
assumed safe merely because its version number is higher.

A full inventory baseline is taken before staging and checked again in the shared tool's immediate pre-upload
inventory read. Before registration, the inventory must equal that baseline plus this run's successful reviewed
uploads. Any unrelated addition, deletion or size change stops registration. Pre-existing exact candidate blobs
may be reused, allowing a safely interrupted staging step to resume with a fresh output directory. The active
manifest is rechecked as the last read before registration. These GET checks are **not atomic** with POST:
coordinate one publisher and honour deployment holds. An external upload between the final read and POST
cannot be excluded by this client-only wrapper.

After registration, the active manifest and all three public asset byte streams must match exactly. The inventory
must then contain exactly the candidate manifest's blobs and the six handover-protected server blobs; server
health is rechecked. A mismatch raises an error and never writes a success receipt. This does not undo a manifest
that was already registered: investigate its explicit stage before retrying.

Tests mock every network call, including the actual shared publisher. They cover exact descriptor preservation,
invalid evidence, changed inputs, unsafe or changing server builds, missing/provisional server blobs, unrelated
inventory mutations, failed post-publication verification, dry-run write refusal and stale success receipts.

```sh
MACHINE_TOOL=/path/to/shared/satellite_explorer/tools/machine_set.py \
  PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s release -p test_machine1065.py -v
```
