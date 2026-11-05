# Workshop release controls

Author: Andrew Fisher · 5 Nov 2026

These tools prepare and publish the machine only. The dashboard stays exactly v13.01:
`2f6bc154b896a33252f21b1b438593b2d7453b79bb47ef3ff01abb0721624e7b`.
The retained machine is exactly
`674404701b251917625f8589420d33896fbbf13d018da2a20591b3d31eb4e90a`, 236 files.
The new manifest version is `v13.02-coates-workshop`.

All 236 existing paths remain. `car-app.js` changes; the five new files are
`workshop-ui.js`, `engine-lift-preview.js`, `workshop-finish.js`, `crew-polish.js`
and `workshop-learning.js`. `index.html` is the only optional replacement. It should
version the `car-app.js` script URL so a previously cached module does not hide the
upgrade. The complete union has 241 paths. Every map, explorer, 3D dependency and
other retained descriptor is checked unchanged.

The existing shared publisher remains
`../../satellite_explorer/tools/machine_set.py`, exact SHA-256
`920fbad67167526dc9118d007c394d050f579bd97d18a8251ee8ea3994c03d73`.
The build invokes it in dry-run mode with network access blocked. Publication wraps
that same helper, allowing only the approved immutable blob PUTs and one manifest
registration. There are no operational-record write routes.

## Prepare and test

Use fresh private directories outside every checkout. The base capture already
completed in `/workspace/gc500-machine1302-release-base-private/`: all 236 public
files were read and matched the complete prior published manifest, including its
canonical digest. Public page/machine guards passed before and after the retrieval.
The manifest came from the exact v12.85 publication receipt; the service's public
status route does not return the full manifest. Authenticated GET-only checks also
confirmed edit access, server v5.94, and the exact 247-blob inventory: all retained
files plus eleven protected server blobs, with no unknown blobs. This is readiness
evidence, not publication or browser acceptance.

To reproduce the base capture:

```bash
python3 release/build1302.py \
  --keep /private/prior-publication/candidate-manifest.json \
  --out /private/fresh-base \
  --fetch-base-only
```

Once all final candidate files exist:

```bash
python3 release/build1302.py \
  --keep /private/fresh-base/retained-manifest.json \
  --base-root /private/fresh-base/machine \
  --candidate-dir /private/final-prepared-modules \
  --out /private/final-candidate
```

The builder outputs a complete `machine/` tree, `candidate-manifest.json`,
`source-evidence.json` and `build.json`. It verifies all bytes, uses the shared
manifest builder, and checks the unchanged live bases again. Build evidence says
browser acceptance is incomplete. Run the actual workshop checks and unchanged
dashboard sweeps against this complete frozen tree/manifest. A candidate change
requires a new build and the affected checks.

Four distinct browser receipts are required by the publisher: suites `machine1302`
and `dashboard1302`, each with viewport `desktop` and `phone`. Each receipt must
contain the following values from the real completed check, including every changed
file (and optional index) under `machineFiles`:

```json
{
  "suite": "machine1302",
  "viewport": "phone",
  "passed": true,
  "errors": [],
  "consoleErrors": [],
  "recordWrites": 0,
  "dashboardSha256": "2f6bc154b896a33252f21b1b438593b2d7453b79bb47ef3ff01abb0721624e7b",
  "machineManifestSha256": "<final candidate canonical digest>",
  "machineFiles": {"<every changed or added path>": "<its exact SHA-256>"}
}
```

Existing suite output may keep its detailed assertions; add these identity fields
from the same frozen inputs. The publisher rehashes the whole candidate tree and
receipts before registration. It does not create a passing browser receipt or infer
acceptance from the earlier draft preview. Actual phone hardware performance remains
a distinct question from browser emulation; report that limit accurately.

## Read-only preflight and later publication

From the release directory, with paths adjusted to the actual private candidate:

```bash
python3 publish1302.py \
  --keep /private/final-candidate/retained-manifest.json \
  --candidate-dir /private/final-candidate/machine \
  --manifest /private/final-candidate/candidate-manifest.json \
  --evidence /private/final-candidate/source-evidence.json \
  --expected-base 674404701b251917625f8589420d33896fbbf13d018da2a20591b3d31eb4e90a \
  --machine-tool ../../satellite_explorer/tools/machine_set.py \
  --out /private/fresh-preflight \
  --preflight
```

Without `--publish`, this command performs no network writes. `--preflight` checks
the edit credential and full protected inventory through GETs. The credential comes
only from `GC500_EDIT_TOKEN`, is sent only in a header, and is redacted from errors.
Redirects are refused. Publication uses a fresh output directory and adds `--publish`
plus four `--check /private/completed-receipt.json` arguments. The named release
owner must first finish the claimed source, review/checks, shared READY record and
coordination required by AGENTS.md. No publication was performed while preparing
these tools.

Before the single registration, the wrapper rechecks source/evidence/helper hashes,
all candidate bytes, completed browser receipts, server health and the full inventory,
then reads the exact current page and machine again. The server contract has **no
proven atomic compare-and-swap for the old manifest**. The immediate expected-old
GET-to-POST guard narrows that race; it does not eliminate it. One coordinated owner
must publish, with other machine/server publishers idle. This workflow does not
alter the server or its protected-blob configuration.

After registration, the wrapper verifies manifest digest/count, every changed/added
public file byte for byte, the complete candidate-plus-protected-server inventory,
server readiness and the unchanged dashboard. `publication.json` is written only
after all checks pass. `publication-attempt.json` records registration acknowledgement
before readback; if verification fails after registration, inspect that journal and
the live status before recovery. A `registration-outcome-pending` journal means the
request outcome is unknown, not that publication failed safely. Never blindly retry
or roll back a registered set. Old replaced blobs are pruned by the service; the full
private retained tree is available if an authorised recovery needs to restage them.

Current execution dependencies are final candidate modules, four exact final browser
receipts and the release owner's READY/coordination work. A changed live hash, server
build, unknown inventory blob, changed helper or changed candidate is a hard stop to
reconcile and rebuild, rather than a guard to bypass.

Run the fake-network guard tests:

```bash
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s release -p test_release1302.py -v
```

They exercise normal dry-run/preflight/publication, full retention, stale bases,
source/receipt mutation, cross-publisher inventory changes, protected server blobs,
credential handling, exact readback and partial-success journalling. No test contacts
the live service. Independent source review found no remaining release-control blocker;
the documented service race still applies.
