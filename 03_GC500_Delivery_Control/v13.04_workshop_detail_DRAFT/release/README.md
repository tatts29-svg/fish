# Workshop detail release controls

Author: Andrew Fisher · 5 Nov 2026

These tools build and publish only the machine. The dashboard remains exact v13.01,
`2f6bc154b896a33252f21b1b438593b2d7453b79bb47ef3ff01abb0721624e7b`.
The required live machine base is the complete 245-file v13.03 set,
`380d057f6eee18c948c29741a0ab5d431801ff7f796fef9b5c158170214c5c98`.
The candidate version is `v13.04-workshop-detail`, with 246 files.

`scope1304.json` fixes the nine required paths: replacements `car-app.js`,
`index.html`, `workshop-finish.js`, `workshop-lessons.js`, `workshop-mechanic.js`, `workshop-service.js`,
`workshop-showcase.js`, `workshop-ui.js`; addition `workshop-render.js`.
All 245 existing paths remain. The other 237 descriptors must remain identical,
including the lift, learning, crew polish, maps, explorer and 3D dependencies.
Changed existing module imports need a v13.04 query so a browser cannot reuse older
cached bytes. This includes index → car-app, car-app → finish/UI and UI →
mechanic/service/showcase/lessons. The new render module has a new path.

The Python guards and both browser harnesses read the same scope file.
`source-evidence.json` binds its exact bytes in `releaseScopeSha256`; its `files`
map remains the exact nine source hashes, byte counts and original hashes.
A changed scope requires rebuilding evidence and affected acceptance receipts.

The existing shared helper `../../satellite_explorer/tools/machine_set.py` builds
the manifest. Its required SHA-256 is
`920fbad67167526dc9118d007c394d050f579bd97d18a8251ee8ea3994c03d73`.
The wrapper restricts publication writes to reviewed immutable blobs and one exact
manifest registration. No operational-record write is permitted.

## Preparation and current evidence

Offline checks verified all 245 files in
`/workspace/gc500-machine-1303-private/candidate4/machine` against
`/workspace/gc500-machine-1304-private/base-manifest.json`, including its canonical
digest, and verified the pinned shared helper. The 28 fake-network guard tests pass;
both JavaScript harnesses parse. This preparation did not run browsers, network
requests or publication. Fresh live-base, authenticated server/inventory preflight
and final candidate acceptance remain with the root release owner.

To capture every current public base file into a fresh private directory, from the
release's parent directory:

```bash
python3 release/build1304.py \
  --keep /workspace/gc500-machine-1304-private/base-manifest.json \
  --out /private/fresh-base --fetch-base-only
```

Build only after the nine final source files are ready. The root-owned
`prepare1304.py` supplies those files; this wrapper assembles the complete retained
tree and invokes the pinned helper in dry-run mode with helper network access
blocked:

```bash
python3 release/build1304.py \
  --keep /workspace/gc500-machine-1304-private/base-manifest.json \
  --base-root /workspace/gc500-machine-1303-private/candidate4/machine \
  --candidate-dir /private/prepared-modules \
  --out /private/final-candidate
```

The builder checks the exact live machine and dashboard before and after its work.
Every output directory must be fresh and private, outside the checkout. Output is
`machine/`, `retained-manifest.json`, `candidate-manifest.json`,
`source-evidence.json` and `build.json`. Browser acceptance remains incomplete.

## Actual browser receipts

Publication requires four distinct actual receipts: `machine1304` and
`dashboard1304`, each for viewport `desktop` and `phone`. Each must have
`passed: true`, empty `errors` and `consoleErrors`, `recordWrites: 0`, exact
`dashboardSha256`, final `machineManifestSha256`, and `machineFiles` containing
all nine exact reviewed hashes. The publisher rechecks both receipt contents
and their byte hashes immediately before registration.

The release owner freezes the candidate before browser runs. Run browsers serially
under the shared lock. From the release's parent directory:

```bash
CANDIDATE_DIR=/private/final-candidate \
PAGE=/workspace/gc500-machine-5nov-private/page.html \
OUT=/private/fresh-dashboard-desktop \
GC500_CACHE=/private/dashboard-cache \
CHROMIUM_PATH=/home/agent/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome \
flock /tmp/gc500-browser.lock node tests/test_dashboard.cjs
```

Repeat with `MOB=1` and a fresh `OUT` for phone. The harness validates all 246 files
and serves their exact bytes inside the unchanged dashboard, using actual live
HTML security headers. It checks native workshop/service entry and exit, parent
focus, 27 routes, seven links, Back and retained explorer. Parent `/api/machine`
metadata is locally simulated and that override is recorded. Operational requests
remain GET-only. Inputs and live bases are checked again; pending request handlers
and late errors are drained before recording a pass. Native actions have the proven
120-second budget, without forced clicks. Viewport emulation does not measure
physical-phone performance. The root owns the separate machine acceptance suite.

## Preflight and publication

From this `release/` directory, this command performs read-only authenticated
preflight and builds the exact same manifest again:

```bash
python3 publish1304.py \
  --keep /private/final-candidate/retained-manifest.json \
  --candidate-dir /private/final-candidate/machine \
  --manifest /private/final-candidate/candidate-manifest.json \
  --evidence /private/final-candidate/source-evidence.json \
  --expected-base 380d057f6eee18c948c29741a0ab5d431801ff7f796fef9b5c158170214c5c98 \
  --machine-tool ../../satellite_explorer/tools/machine_set.py \
  --out /private/fresh-preflight --preflight
```

The secret is read only from `GC500_EDIT_TOKEN`, sent in a header and redacted from
errors. Redirects and alternate origins are refused. Default operation and
`--preflight` send no writes. The named root release owner publishes only after
actual final checks and shared READY coordination, using a fresh output directory,
`--publish`, and four `--check /private/completed-receipt.json` arguments.

Publication allows only the nine exact immutable blob PUTs and one exact
registration. It verifies every candidate file, source/evidence/helper/receipt
bindings, healthy v5.94 and stable full inventory including eleven protected server
blobs, then rechecks the exact old page and machine immediately before registration.
The service has no proven atomic compare-and-swap here: the GET-to-POST guard
narrows that race but cannot eliminate it. One coordinated publisher is required.

After registration, all nine changed public files must match byte for byte. The
active manifest digest/count, complete inventory, server health and unchanged
dashboard are checked; active manifest identity is rechecked at the end.
`publication.json` exists only after these checks pass. `publication-attempt.json`
records staging, pending registration and acknowledgement before verification. If
a later check fails, inspect that journal and actual live state before recovery.
A pending outcome is unknown; never blindly retry or roll back a registered set.

Guard tests use only fake network responses:

```bash
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s release -p test_release1304.py -v
```

A changed base, unknown blob, changed server/helper, scope or candidate is a stop to
reconcile and rebuild. Final source and actual browser receipts remain prerequisites.

## Public verification after publication

Only after guarded registration/readback, root runs from the release's parent:

```bash
MANIFEST=/private/final-candidate/candidate-manifest.json \
OUT=/private/fresh-live-phone \
GC500_CACHE=/private/fresh-empty-live-cache \
CHROMIUM_PATH=/home/agent/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome \
flock /tmp/gc500-browser.lock node tests/test_live.cjs
```

The cache must be empty and `OUT` must not exist. Remove candidate media overrides.
The harness validates the canonical 246-file manifest, active service version/hash
and unchanged dashboard. Fresh public GETs verify all nine changed source hashes;
every loaded machine response is also hashed. It substitutes no candidate bytes.
Native phone checks cover service play/pause, bounded idle-frame reuse at unchanged
DPR, native bench wake and new draws, supported bench, hand crank, cycle slider,
component rotation and exit restoration. The idle and wake checks each wait at most
120 seconds, polling every 500 ms; diagnostic counters are compared with their own
actual pre-action samples. Public identity is checked again
and pending handlers are drained before recording `live-browser.json`. This public
smoke test supplements the full final-candidate suites.
