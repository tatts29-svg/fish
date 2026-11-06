# Workshop inspection release controls

Author: Andrew Fisher · 6 Nov 2026

**Published and verified live on 6 Nov 2026 at 15:39:50 AEST. Do not rerun publication.** The current machine is the 249-file manifest `b4cf3f0b2b768031f26d7463bdb8c7168506a1faee048f046407d8d1103b75b2`. The commands below document how this release was built and published from its historical base. Future work must start from the current manifest.

This release changes only the Coates Way machine. Its historical starting base was the
246-file v13.04 set, manifest
`f139782e513a360ab87e05b7899defb02348355a4e7e09e7ae06fdfcedba9aad`.
The dashboard remains v13.01,
`2f6bc154b896a33252f21b1b438593b2d7453b79bb47ef3ff01abb0721624e7b`.
Candidate version: `v13.05-workshop-inspection`, 249 files.

`scope1305.json` fixes four replacements (`car-app.js`, `index.html`,
`workshop-learning.js`, `workshop-ui.js`) and three additions
(`workshop-camera.js`, `workshop-lighting.js`, `workshop-selection.js`).
All 246 existing paths remain; 242 retained descriptors must stay identical,
including maps, explorer, 3D, original model, service, lessons and tour assets.
No operational-record writes are allowed.

## Freeze and build

Root coordinates publication. Use fresh private output directories outside the
checkout. The source freezer is offline and never changes the source files:

```bash
python3 prepare1305.py \
  --keep /workspace/gc500-workshop-1305-private/base-manifest.json \
  --base-root /workspace/gc500-machine-1304-private/candidate2/machine \
  --out /private/fresh-prepared
```

It verifies every original file, requires all seven final sources, checks the
index → app → UI → learning cache boundaries use v13.05, and checks every changed
module is reachable from the app. The new module paths do not require a query.
It refuses stale imports, unchanged replacements and source changes during capture.
The build then verifies the current public machine and dashboard before and after
assembling the complete retained tree:

```bash
python3 release/build1305.py \
  --keep /workspace/gc500-workshop-1305-private/base-manifest.json \
  --base-root /workspace/gc500-machine-1304-private/candidate2/machine \
  --candidate-dir /private/fresh-prepared \
  --out /private/final-candidate
```

The shared `../../satellite_explorer/tools/machine_set.py` helper is pinned at
SHA-256 `920fbad67167526dc9118d007c394d050f579bd97d18a8251ee8ea3994c03d73`.
Its dry-run build cannot contact the network. Outputs include `machine/`,
`retained-manifest.json`, `candidate-manifest.json`, `source-evidence.json` and
`build.json`. The source evidence also binds the exact release scope bytes.
A changed candidate requires affected acceptance to run again.

## Actual acceptance

Publication requires four distinct actual receipts: `machine1305` and
`dashboard1305`, each for desktop and phone. Each must report a pass, zero runtime
and console errors, zero attempted record writes, and exact candidate/dashboard
hashes plus all seven changed source hashes. Receipts and their bytes are checked
again immediately before registration. A source check is not a browser receipt.

Run browsers serially under `/tmp/gc500-browser.lock`. The root owns full machine
acceptance. From the release parent directory, dashboard integration is:

```bash
CANDIDATE_DIR=/private/final-candidate \
PAGE=/workspace/gc500-machine-5nov-private/page.html \
OUT=/private/fresh-dashboard-desktop \
GC500_CACHE=/private/dashboard-cache \
CHROMIUM_PATH=/home/agent/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome \
flock -x /tmp/gc500-browser.lock node tests/test_dashboard.cjs
```

Repeat with `MOB=1` and a fresh `OUT`. It validates all 249 candidate files and the
unchanged dashboard, uses actual HTML security headers, checks native iframe
entry/bench/crank/exit and parent focus restoration, 27 routes, seven links and
Back, and retained explorer. Phone bench controls must keep the actual model
visible. The parent machine-status response is locally simulated and recorded.
Network and record access are GET-only; all pending handlers drain before a pass.

## Guarded publication

From this `release/` directory, read-only authenticated preflight is:

```bash
python3 publish1305.py \
  --keep /private/final-candidate/retained-manifest.json \
  --candidate-dir /private/final-candidate/machine \
  --manifest /private/final-candidate/candidate-manifest.json \
  --evidence /private/final-candidate/source-evidence.json \
  --expected-base f139782e513a360ab87e05b7899defb02348355a4e7e09e7ae06fdfcedba9aad \
  --machine-tool ../../satellite_explorer/tools/machine_set.py \
  --out /private/fresh-preflight --preflight
```

`GC500_EDIT_TOKEN` is read from the environment, sent only in its intended header,
and redacted from errors. Redirects and alternate origins are refused. Default
operation and `--preflight` make no writes. Only the named root publisher uses
`--publish` after READY coordination, with a fresh `--out` and four `--check`
receipt arguments.

Publication permits only the seven reviewed immutable blob PUTs and one exact
manifest registration. It verifies the reviewed v5.94 server and the complete
inventory, retaining eleven protected unlisted server blobs. It checks source,
helper, evidence, receipts, old machine and dashboard again immediately before
registration. There is no proven server-side atomic compare-and-swap, so this
narrows the race and requires one coordinated publisher.

After registration, all seven changed public files must match byte for byte. The
active manifest, complete inventory, server health and unchanged dashboard are
checked, then active identity is checked again. `publication.json` is written
only after these checks pass. `publication-attempt.json` records staging and
registration state; inspect it and actual live state after an uncertain result.
Never blindly retry or roll back a possibly registered manifest.

Offline guard tests (fake network only):

```bash
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s release -p test_release1305.py -v
```

## Fresh public verification

Only after guarded publication, root runs with an empty cache and fresh output:

```bash
MANIFEST=/private/final-candidate/candidate-manifest.json \
OUT=/private/fresh-live-phone \
GC500_CACHE=/private/fresh-empty-live-cache \
CHROMIUM_PATH=/home/agent/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome \
flock -x /tmp/gc500-browser.lock node tests/test_live.cjs
```

No candidate bytes or media overrides are substituted. It verifies fresh public
GETs for all seven changed files and hashes every loaded machine response. Native
checks cover manual camera start/settle, phone model/control visibility, real
component tap selection and drag rejection, inspection lighting and exact exit
restoration, service play/pause, idle accounting, bench, hand crank, keyboard cycle
angle, isolated rotation and normal view restoration. Real light UUIDs, colour,
position, shadow settings and exposure are compared to the original snapshot.

Native action budgets remain 120 seconds without forced clicks. Live identity and
unchanged dashboard are checked again; errors and pending handlers drain before
`live-browser.json` can pass. These tests establish functional correctness and
layout in browser emulation, not physical-phone sharpness or frame-rate guarantees.
