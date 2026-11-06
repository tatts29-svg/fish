# Mechanic service release controls

Author: Andrew Fisher · 5 Nov 2026

These tools build and publish the machine only. The dashboard remains exactly v13.01,
`2f6bc154b896a33252f21b1b438593b2d7453b79bb47ef3ff01abb0721624e7b`.
The required live machine base is the complete 241-file v13.02 set,
`b4e46efb6726d18b807f8160d19199a40858f38fd93c2ab09bcd650c67b43cc7`.
The candidate version is `v13.03-mechanic-service`, with 245 files.

Exactly eight paths are allowed and required:

| Existing replacements | New files |
|---|---|
| `car-app.js` | `workshop-service.js` |
| `index.html` | `workshop-mechanic.js` |
| `engine-lift-preview.js` | `workshop-lessons.js` |
| `workshop-ui.js` | `workshop-showcase.js` |

All 241 existing paths remain. The other 237 descriptors must remain identical,
including the v13.02 finish, crew polish, learning modules, maps, explorer and 3D
dependencies. Version the existing changed module imports so the one-hour browser
cache cannot reuse their v13.02 bytes: index to car-app, car-app to workshop-ui,
and workshop-ui to engine-lift-preview, plus any other imports of changed modules.

The guarded wrapper uses the existing shared
`../../satellite_explorer/tools/machine_set.py`, pinned SHA-256
`920fbad67167526dc9118d007c394d050f579bd97d18a8251ee8ea3994c03d73`.
The shared helper builds the manifest; a wrapper constrains every publication write.
No operational-record route is allowed. Neither this preparation nor its tests
publish anything.

## Base and candidate preparation

Fresh GET-only base retrieval verified all 241 public files, their sizes and hashes,
and the full retained manifest digest. Exact page and machine bases matched before
and after retrieval. Files are at `/workspace/gc500-machine-1303-private/base/machine`;
`retained-manifest.json` and `base-retrieval.json` are beside that tree. The manifest
source is the verified v13.02 candidate/publication set in
`/workspace/gc500-machine-1302-private/release-candidate4/`.

Separate authenticated GETs confirmed edit access, healthy v5.94, and the exact
252-blob inventory: 241 retained blobs plus eleven protected server blobs. The
private readiness receipts are `base-preflight.json` and `inventory-preflight.json`
in `/workspace/gc500-machine-1303-private/`. These are readiness checks, not final
candidate browser acceptance.

To repeat the base capture into a fresh private directory:

```bash
python3 release/build1303.py \
  --keep /private/prior-publication/candidate-manifest.json \
  --out /private/fresh-base --fetch-base-only
```

Build the complete candidate only after the eight final files exist:

```bash
python3 release/build1303.py \
  --keep /private/fresh-base/retained-manifest.json \
  --base-root /private/fresh-base/machine \
  --candidate-dir /private/prepared-modules \
  --out /private/final-candidate
```

Every output directory must be fresh and private, outside the checkout. The builder
produces `machine/`, `candidate-manifest.json`, `source-evidence.json`, and `build.json`.
It hashes every retained/candidate file, invokes the shared helper in dry-run mode
with network access blocked, then checks the live bases again. Browser acceptance
is explicitly incomplete at this stage.

## Actual browser receipts

Publication requires four distinct actual receipts: `machine1303` and `dashboard1303`,
each for viewport `desktop` and `phone`. Each must contain:

```json
{
  "suite": "dashboard1303",
  "viewport": "phone",
  "passed": true,
  "errors": [],
  "consoleErrors": [],
  "recordWrites": 0,
  "dashboardSha256": "2f6bc154b896a33252f21b1b438593b2d7453b79bb47ef3ff01abb0721624e7b",
  "machineManifestSha256": "<final canonical manifest digest>",
  "machineFiles": {"<all eight reviewed paths>": "<their exact SHA-256 hashes>"}
}
```

The release owner supplies the final frozen candidate before browser runs start.
Run browsers serially under the shared lock. For dashboard acceptance, from the
draft folder:

```bash
CANDIDATE_DIR=/private/final-candidate \
PAGE=/private/exact-v13.01-page.html \
OUT=/private/fresh-dashboard-desktop \
GC500_CACHE=/private/dashboard-cache \
CHROMIUM_PATH=/path/to/chrome \
flock /tmp/gc500-browser.lock node tests/test_dashboard.cjs
```

Repeat with `MOB=1` and a fresh `OUT` for phone. The harness validates all 245 files,
serves exact candidate bytes inside the unchanged dashboard with the live HTML
security policy, and checks native workshop/service entry and exit, parent focus,
27 routes, seven deep links and Back. All machine requests resolve locally from the
verified manifest; operational API reads remain GET-only. It locally simulates the
candidate `/api/machine` metadata for the parent UI, and records that override.
It drains request handlers before writing a receipt so late failures cannot be lost.
Both full input bindings and the live bases are checked again before acceptance.
Viewport emulation is not a physical-phone performance measurement.

## Preflight and publication

From this release directory, the command below is read-only:

```bash
python3 publish1303.py \
  --keep /private/final-candidate/retained-manifest.json \
  --candidate-dir /private/final-candidate/machine \
  --manifest /private/final-candidate/candidate-manifest.json \
  --evidence /private/final-candidate/source-evidence.json \
  --expected-base b4e46efb6726d18b807f8160d19199a40858f38fd93c2ab09bcd650c67b43cc7 \
  --machine-tool ../../satellite_explorer/tools/machine_set.py \
  --out /private/fresh-preflight --preflight
```

The secret is read only from `GC500_EDIT_TOKEN`, used in a header, and redacted from
errors. Redirects and alternate origins are refused. Default operation and
`--preflight` never send writes. The named root release owner alone publishes after
the actual checks and shared READY coordination are complete, using a fresh output
directory, `--publish`, and four `--check /private/completed-receipt.json` arguments.

Publication permits only the eight exact immutable blob PUTs and one exact manifest
registration. It checks source/evidence/helper/receipt hashes, every candidate byte,
server health and stable protected inventory, then the exact old page and machine
immediately before registration. The v5.94 service has no proven atomic
compare-and-swap for this endpoint: the GET-to-POST guard narrows that race but cannot
eliminate it. One coordinated publisher is required; this work does not change the
server or its protected-blob configuration.

After registration, every changed public file is read back byte for byte, along
with the active manifest digest/count, complete candidate-plus-server inventory,
server health and unchanged dashboard. Active manifest identity is rechecked at the
end. `publication.json` exists only after all verification passes.
`publication-attempt.json` records registration acknowledgement before verification;
if a later read fails, inspect that journal and live status before recovery. A pending
outcome is unknown, not proof of failure. Never blindly retry or roll back a registered
set. The private complete old tree permits authorised restaging if recovery is needed.

Fake-network guard tests (no browser or live API writes):

```bash
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s release -p test_release1303.py -v
```

Final source, final browser receipts and root release coordination remain prerequisites.
A changed base, unknown blob, changed server/helper or changed candidate is a stop to
reconcile and rebuild, never a guard to bypass.

## Actual public verification after publication

The root release owner runs this only after the guarded registration/readback:

```bash
MANIFEST=/private/final-candidate/candidate-manifest.json \
OUT=/private/fresh-live-phone \
GC500_CACHE=/private/fresh-empty-live-cache \
CHROMIUM_PATH=/path/to/chrome \
flock /tmp/gc500-browser.lock node tests/test_live.cjs
```

Run from the draft/live folder, not this `release/` directory. The cache must be
empty and the output directory must not exist. Remove local candidate media
overrides from the environment. The harness validates the 245-file manifest's
canonical digest, checks the actual service identity and unchanged dashboard,
and reads all eight changed public files by fresh GET with exact size/hash checks.
It then opens a fresh phone browser on the real public machine. Every loaded machine
asset is fetched and hashed against the manifest; no candidate body is substituted.
It exercises native service play/pause, supported bench, hand crank, four-stroke
slider, component rotation and exit restoration, then rechecks public identity.
Requests are GET-only, pending handlers are drained before acceptance, and the
private `live-browser.json` records any failure. This smoke test supplements the
full candidate checks; it does not replace them or claim physical-phone performance.
