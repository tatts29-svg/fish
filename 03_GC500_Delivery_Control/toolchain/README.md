# GC500 shared build and upload tools

Author: Andrew Fisher.

Claude and Codex use the same code and may publish ready, tested releases. Andrew confirmed this in the Codex chat on 5 Oct 2026: “stop blocking claude from uploading builds” and “You both build he needs the code”. No Codex-only build or upload restriction applies. Coordinate ownership through `STATUS.md` and PR #1 so two releases do not overwrite one another.

The current shared branch is `codex/gc500-current-release-03oct` in `tatts29-svg/fish`. Fetch that branch and read its current `STATUS.md`, rather than relying on the older board on another branch. The tools do not depend on a Codex environment or identity.

## Set up either agent's environment

Requirements: Bash, Python 3, curl, Node.js/npm, network access to the GC500 Railway service, and Chromium for browser checks.

From `03_GC500_Delivery_Control`:

```bash
npm ci --prefix toolchain
npx --prefix toolchain playwright install chromium
```

If Chromium is already installed, set `CHROMIUM_PATH` to its executable instead. The uploader needs the authorised `GC500_EDIT_TOKEN` in its process environment. Configure it through the environment's private secrets/settings, or enter it at a masked terminal prompt:

```bash
read -rsp 'GC500 edit token: ' GC500_EDIT_TOKEN
export GC500_EDIT_TOKEN
```

Do not put the token in source, a command argument, a GitHub comment, a file or a screenshot. This package contains code only, not credentials. The uploader reads the environment variable and passes the header to curl on standard input.

## Build, check and publish

Claim a version on the current board before editing. Start every new release from the current live page with `build.sh`; use a patch for that exact live base. Replace the version/path below with the claimed release:

```bash
toolchain/build.sh v8.NN v8.NN_change_DRAFT/patch_vNNN.py
PAGE=build/GC500_v8.NN/GC500_Delivery_Control_hosted.html node toolchain/harness/sweep.js
MOB=1 PAGE=build/GC500_v8.NN/GC500_Delivery_Control_hosted.html node toolchain/harness/sweep.js
python3 toolchain/upload_page.py build/GC500_v8.NN/GC500_Delivery_Control_hosted.html --dry-run
python3 toolchain/upload_page.py build/GC500_v8.NN/GC500_Delivery_Control_hosted.html
```

Also run checks appropriate to the change, inspect a phone screenshot and push the exact source/tests and READY state before uploading. The dry run checks upload access without changing the service. A missing token, view-only token or changed live base stops publication with a reason. If the live base changed, rebuild and retest; do not bypass the guard.

The uploader proves that the public view serves the candidate byte for byte. Verify the actual public UI, record the LIVE time/source/base/candidate hashes on the board, rename the release folder to `_LIVE` and push it. Operational records and real messages must not be written by tests.

## What is shared

`build.sh`, `fetch_live.sh`, `rep.py`, attribution scrub/check scripts, browser harness and `upload_page.py` are the common toolchain. The v8.61 source/tests illustrate a completed release; its patch is deliberately bound to the v8.60 base and must not be reapplied to the newer live page.

Code availability does not prove that either agent's environment has an edit token or network access. The agent setting up the environment should confirm the dry run result. Recurring checks also require explicit confirmation that they are enabled.

## Claude secure API credential

For a cloud environment that injects a credential on outbound requests, configure its secure credential for the exact host `gc500-production.up.railway.app`, header `x-gc500-token`, empty prefix, and the private edit-key value. Do not use `Authorization: Bearer` for this service. The environment name is a label, not the key binding. Keep the credential out of the visible Environment variables field.

Use the explicit proxy option when the key is injected by the platform instead of available as a private process binding:

```bash
python3 toolchain/upload_page.py build/GC500_v8.NN/GC500_Delivery_Control_hosted.html --credential-proxy --dry-run
python3 toolchain/upload_page.py build/GC500_v8.NN/GC500_Delivery_Control_hosted.html --credential-proxy
```

The dry run must report that the service grants edit access. Merely saving the environment does not prove access. The unchanged-base guard and exact public-byte check still apply; never bypass them. Without working credential injection the dry run stops without a write. Start a session with the saved environment selected.

## Portable combined candidate runner (build and checks only)

`release_candidate.sh` resolves the toolchain from its own location and calls the existing `build.sh`. It never uploads,
registers media, changes READY/LIVE state or treats a selected draft as approved. Choose the exact patches after coordinating
their source. The supported order is **884, 885, 886, 887, 888, 889, 893, 894, 891, 892, 895, 896, 897**.
The current upgrade omits v8.95 while the separate contract audit is parked:
v8.91 currently accepts v8.94's footer but not v8.95's. Select only the needed versions, in that order; each patch still
asserts its own prerequisites. Alternatively repeat `--patch /absolute/path/to/patch.py` in the required order.

Run from any directory, using the actual checkout path:

```bash
bash /path/to/fish/03_GC500_Delivery_Control/toolchain/release_candidate.sh \
  --versions 884,885,886,887,888,889,893,894,891,892,896,897 \
  --label v8.97-review-1 --evidence-dir /workspace/private-gc500-review-1 \
  --regression --wide
```

Use a fresh label and a new private evidence directory **outside every Git checkout**. Raw logs, screenshots, caches,
before/after stage pages and the v8.95 source-change log stay there with private permissions; the terminal prints only
check names and status. Do not copy raw evidence into a commit: inherited tests may print private contract figures.
The page and generated media manifests remain in the normal ignored `build/GC500_<label>/` directory.

Set the inputs needed by the selected patches/tests in the environment. `NODE_PATH` and `CHROMIUM_PATH` are respected;
without them, Node modules default to `toolchain/node_modules` and Playwright chooses its installed Chromium.
If v8.95 is explicitly selected after source reconciliation, `V895_BASEPLAN` must name its exact pinned workbook. All browser runs require `CODE` and `ASSETS` for the
complete local explorer code and restored assets, so the final sweep checks the paired candidate. The v8.93 checks also
require `MEDIA893` and `POC3D` for the decrypted picture folder and 3D proof folder.
`MEDIA` defaults to `MEDIA893`; `LOCAL` defaults to `CODE` and must resolve to that same directory. `ATLAS896` can name a private atlas folder; otherwise
the v8.96 test uses its release's `assets/`. Before v8.93, the master test needs `MEDIA889`. Missing inputs or selected tests
stop the run; hardcoded checkout paths in inherited selected tests are reported for their owner to correct.

Browser/release checks also require `MACHINE_MANIFEST` naming the frozen **final** `gc500-machine-v1` JSON, including
the v8.97 explorer code when selected. `MACHINE_ROOT` supplies a complete local tree for retained files such as the
Coates Way machine and 3D dependencies. `CODE`, `ASSETS` and `POC3D` override their corresponding subtrees; any missing
file can resolve from `MACHINE_ROOT`, but a present file with wrong bytes fails immediately. Every declared file must
exist locally and match its SHA-256 and size, and the manifest must reproduce its own canonical digest. For example:

```bash
export MACHINE_MANIFEST=/workspace/private-review/machine897.json
export MACHINE_ROOT=/workspace/private-review/machine897
export CODE="$MACHINE_ROOT/explorer"
export ASSETS="$MACHINE_ROOT/explorer/assets"
export POC3D="$MACHINE_ROOT/poc3d"
```

The first browser attempt writes `snapshots/machine-inputs.json`, binding the manifest's exact bytes, canonical digest,
resolved roots and all declared file hashes to that candidate/base/source. A resumed attempt must match it. Inputs are
rehashed before and after every suite and at final acceptance; changed code, tiles, proof files, retained dependencies,
candidate pages or captured stages stop the run. The final sweep serves every machine URL from verified local manifest
bytes and aborts undeclared/missing machine requests; it does not fall back to the live machine. The report records both
manifest and machine hashes. This proves the tested local set; publication still needs its own unchanged-base/readback
checks. `--build-only` deliberately needs no machine assets and cannot establish release acceptance.

All browser processes run serially under `flock`, including desktop/phone and optional 1600/2560 px checks. Other runners
must use the same lock to share this guarantee: default `/tmp/gc500-browser.lock`, configurable with `GC500_BROWSER_LOCK`.
Every normal check run includes final-page sweeps of the 21 routes, seven deep links and browser Back on desktop and phone.
The sweep reports intentional public aliases by their visible destination, and fails on a wrong destination, console/page
errors or attempted writes. Nonzero exits, timeouts, printed FAIL/assertion errors, false JSON assertions, malformed JSON
and empty assertion output all fail the runner. No generic expected-failure bypass exists.

Check scope is explicit in the private `result.json` and each log name:

- Identity tests use snapshots immediately before and after their own patch, including required media sidecars.
- The v8.93 master suite replaces v8.89's old picture expectations; v8.94 replaces v8.85's old Lighting basis.
- With v8.96 selected, v8.84/v8.85 layout checks run on their stage pages; the final Today layout is checked by v8.96's suite.
- The owned v8.86/v8.94 fixtures replace record-dependent historical assertions on the final candidate; their source
  is also captured. v8.96's final scene/scope suites replace v8.76's superseded width/column assumptions.
- The inherited v8.92 UI suite accepts the later footer and runs on the final page. The owned money wrapper compares
  that final page with v8.92's immediate base, sharing one clock and capturing native record content/version atomically
  with model values. Drift is inconclusive; model excerpts stay out of logs. The final page also runs the corrected
  redraw/scroll reproduction with exact embedded-source matching.
- The owned alignment wrapper keeps upstream tag, navigation, inset, search and image-correlation checks. Its marker
  rounding assertion uses the native 0.1 CSS-pixel rendering precision (0.051 px per axis), with fixtures rejecting a
  deliberate 1 px displacement at phone and desktop widths. No map positions change for that test correction.
- With v8.95 selected, its identity and final contract tests replace v8.71's obsolete 6 Oct source expectation.
- `--regression` adds the active standing suites. Handling875 and Paired879 remain excluded because the full-chain README
  records identical baseline failures on live; adding either explicitly with `--test` preserves its real failure result.

`--build-only` builds and runs static identity checks without opening a browser. Its result says browser checks were not
run. Resume that exact candidate later with `--page /absolute/build/GC500_Delivery_Control_hosted.html`, the same patch
selection, `--snapshots /workspace/private-gc500-review-1/snapshots` and a fresh `--evidence-dir`. The resume path verifies
the candidate, base, selected patch, bounded source inputs and stage/sidecar hashes against `snapshots/build.json`;
it rejects changed evidence. The source binding includes Python, JS, CSS, JSON, shell and HTML files under selected draft
folders and the toolchain, including local uncommitted source changes. README files and evidence, archive, generated,
build, cache and dependency directories are excluded. Direct inputs used by this chain are added explicitly: the v8.86
plan, v8.94 keyed-tower evidence and optional schedule workbook, v8.95 workbook/matches, and v8.96's eight atlas pictures.
Source hashes are checked before and after building/checking. This binds the documented source scope; it does not hash
restored media archives or claim to discover arbitrary custom imports. For a custom patch's dependencies outside that
scope, repeat `--source-input /absolute/path/to/input` on both build and resume. Old snapshots without this source binding
require a fresh build; the runner never labels a later source snapshot as the original build source.
Repeat `--test /absolute/path/to/test.cjs` for extra final-page suites. Custom patches without a known check mapping require
an explicit test unless using `--build-only`.

Runner-only verification (fixture processes, no browser or network):

```bash
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover \
  -s /path/to/fish/03_GC500_Delivery_Control/toolchain/tests -p test_release_candidate.py -v
```
