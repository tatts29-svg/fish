# Bounded map release preparation

Author: Andrew Fisher

These helpers retain the current 236-file machine set and replace only `explorer/explorer.js` and
`explorer/index.html`. The retained base is
`43c59fc5ea41cfabe9941d72cead4d4a61b6c2e86ec883e5b0f2b067f2962f7c`, available in
`../../v10.41_compass_LIVE/evidence/candidate_manifest_43c59fc5.json`.

Keep fetched sources, prepared complete assets, and output reports outside the repository. The source directory
must contain the two paths under `explorer/`. Fetch them from the public `/w/Coates-GC500-2026/` route; preparation
checks both hashes and byte counts against the retained manifest before applying the tile recovery transformer.
It updates exactly one `explorer.js?v=...` URL in the index and writes `source-bound.json` with the reviewed bytes.

From this directory, with private absolute paths substituted:

```sh
python3 prepare_machine1064.py \
  --source /private/source --target /private/candidate \
  --manifest ../../v10.41_compass_LIVE/evidence/candidate_manifest_43c59fc5.json

python3 publish_machine1064.py \
  --keep ../../v10.41_compass_LIVE/evidence/candidate_manifest_43c59fc5.json \
  --candidate-dir /private/candidate --evidence /private/candidate/source-bound.json \
  --out /private/dry-run \
  --expected-base 43c59fc5ea41cfabe9941d72cead4d4a61b6c2e86ec883e5b0f2b067f2962f7c \
  --machine-tool ../../satellite_explorer/tools/machine_set.py
```

The default publication helper only reads the public machine status and prepares a manifest locally. It does not
stage blobs or register anything. After the complete candidate passes the required browser, map, page and release
checks, the same command with a fresh private output directory and `--publish` stages the two reviewed replacements
through the existing shared `machine_set.py` and registers their union with all 234 unchanged descriptors.
Publication requires `GC500_EDIT_TOKEN` in the private environment and a service response confirming edit access.
There is no credential-proxy mode in this helper.

The publisher requires a fresh, empty output directory so a failed rerun cannot be confused with an earlier success
receipt. It checks the live base before preparation and immediately before its one manifest registration. It
also rechecks source evidence and candidate bytes before registration, then verifies the resulting live digest and
both public replacement files byte for byte. Failure after a registration attempt requires reading the actual live
state before retrying. This helper does not publish the main page: its matching `EXPLORER_BUILD` pin and the final
page upload/read-back remain part of the coordinated release. A machine-only success does not prove that the page's
shape injection is compatible or that the combined release is live.

The final base check and registration are separate HTTP requests, matching the existing guarded process. They are
not an atomic compare-and-swap. Keep one coordinated publisher; do not register another machine release concurrently.

Offline guard tests, using the repository's shared machine tool:

```sh
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest test_machine1064 -v
```

For a sparse checkout, set `MACHINE_TOOL` to an available copy of the shared tool. All network calls in these tests
are mocked. Nineteen tests cover exact retention, pinned digests, paths and MIME types, source evidence, source and
candidate mutation, no-write preparation, credentials, live-base races, and public byte verification.
