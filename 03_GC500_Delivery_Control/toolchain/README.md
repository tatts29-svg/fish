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
