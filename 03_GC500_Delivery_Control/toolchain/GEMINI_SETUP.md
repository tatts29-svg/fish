# Gemini coding environment for GC500

Author: Andrew Fisher · verified 14 Oct 2026

Use **Gemini CLI** to read and edit the project, run the existing tests and publish
ready releases through the shared toolchain. The Gemini website alone does not
provide this terminal or deployment access.

**Setup state — 14 Oct 2026:** Andrew reports Gemini running in the separate
`/workspaces/fish-gemini` worktree on `codex/gc500-current-release-03oct`, initially
at `0f375b77`. The existing Claude checkout remains intact. Gemini reports a clean
checkout, installed Node dependencies and Playwright Chromium/OS libraries, a
successful headless launch and all 21 toolchain runner unit tests passing.
`GC500_EDIT_TOKEN` is unset there, so publishing access is not yet verified.
These Codespace observations are reported by Gemini through Andrew; the setup
agent has not directly inspected that remote terminal. Use this same Codespace
from the computer and phone.

## Start on the computer; use the same workspace on the phone

1. Open [Your Codespaces](https://github.com/codespaces). If a Codespace for
   `tatts29-svg/fish` already exists on `codex/gc500-current-release-03oct`, open it.
   Leave workspaces on other branches intact. Otherwise open
   [the shared project branch](https://github.com/tatts29-svg/fish/tree/codex/gc500-current-release-03oct),
   choose **Code → Codespaces → Create codespace**. Confirm the branch is
   `codex/gc500-current-release-03oct`.
2. In the Codespace, choose **Terminal → New Terminal**. From the repository root,
   start Gemini with:

   ```bash
   NO_BROWSER=true npx @google/gemini-cli
   ```

   If npm asks to install `@google/gemini-cli`, accept that package. Choose
   **Sign in with Google**. Open the sign-in URL printed by Gemini in your browser,
   sign in, then enter the authorization code from Google's page into the
   waiting Codespace terminal. `NO_BROWSER=true` uses Gemini's manual sign-in flow
   so a remote workspace does not depend on a callback to your computer's
   `localhost`. Enter the code only into that terminal prompt.
3. Once Gemini opens, paste this first message:

   ```text
   This is a read-only setup check for Andrew Fisher's GC500 project.
   Read these files in full:
   - GEMINI.md and its imported AGENTS.md
   - 03_GC500_Delivery_Control/STATUS.md
   - 03_GC500_Delivery_Control/toolchain/README.md
   - 03_GC500_Delivery_Control/toolchain/GEMINI_SETUP.md

   Confirm this checkout is tatts29-svg/fish on
   codex/gc500-current-release-03oct. Fetch origin and check the latest shared
   STATUS.md for the LIVE release and active work claims; do not rely on an
   old version mentioned in chat. Report whether Node, Python, Git, curl,
   flock and the browser test dependencies are available. Report whether
   GC500_EDIT_TOKEN is set, never its value. Tell me what setup remains.
   Do not edit files, claim work, install more tools, change operational
   records, build or upload during this setup check.
   ```

On the phone, sign into the same GitHub account at
[Your Codespaces](https://github.com/codespaces) and open **the same Codespace**.
There is no need to create another environment or copy the project between
devices. The computer is easier for the initial terminal and Google sign-in.

The Gemini website chat remains a separate conversation. Its link does not give
Gemini CLI the chat history, repository permissions or publication credentials.
The shared files and current board provide the project handover.

There is currently no repository-specific `.devcontainer` configuration. The
standard Codespaces environment can be checked first; Gemini needs Node 20 or
newer. Use the setup sections below for any missing project dependencies.

## Enable publishing in the Codespace

The build tools work without the edit key. Publishing requires the existing
private GC500 edit key in this Codespace; a Google login does not supply it.

1. Open [GitHub personal Codespaces settings](https://github.com/settings/codespaces).
2. Under **Codespaces secrets**, choose **New secret**. Name it
   `GC500_EDIT_TOKEN`. Enter the existing private edit-key value directly into
   GitHub's secret value field. Select only the `tatts29-svg/fish` repository.
   Do not paste the key into an assistant conversation, source file or command.
3. Save the secret, then stop and reopen the same Codespace so the environment
   receives it. Start a new Gemini process in `/workspaces/fish-gemini`.
4. Ask Gemini to verify access without uploading. From the repository root, this
   uses the shared uploader's existing GET helper and prints only status/level:

```bash
python3 - <<'PYCODE'
import json, sys
sys.path.insert(0, '03_GC500_Delivery_Control/toolchain')
from upload_page import curl
status, body = curl('GET', '/api/version')
level = json.loads(body).get('level') if status == 200 else None
print({'http_status': status, 'access_level': level})
if status != 200 or level != 'edit':
    raise SystemExit('Publishing access is not verified; nothing uploaded')
PYCODE
```

A result of HTTP `200` and level `edit` verifies the service grants access to that
environment. It does not upload a page or replace the tested-candidate release
checks. Continue to follow the current shared board and guarded publication flow.

The setup agent's current GitHub integration returns HTTP 403 for Codespaces
secret administration, so it cannot configure this secret remotely. Andrew adds
it using his own GitHub settings. No secret has been copied into this repository
or chat.

## Choose where it runs

| Environment | Practical setup |
| --- | --- |
| Windows | WSL2 with Ubuntu is recommended for this repository's Bash and `flock` scripts. Install and run the tools inside WSL. Gemini CLI also supports native PowerShell, but that does not supply the project's Unix build tools. |
| Mac | Use Terminal with Node/npm and the shared toolchain dependencies below. The browser runner needs `flock`; provide it or run the project checks in a Linux environment. |
| Cloud | Use a persistent Linux development workspace with a terminal, GitHub access and the private source files. Google Cloud Shell already includes Gemini CLI; follow the authentication guide for the chosen environment. |

Gemini CLI requires **Node.js 20+** and internet access. The GC500 build also needs
Git, Bash, Python 3, curl, npm, `flock` and Chromium. For larger sessions, Google's
recommended power-user specification is 16 GB RAM or more.

## Install and sign in

In the chosen environment:

```bash
npm install -g @google/gemini-cli
gemini
```

Choose **Sign in with Google** using your Google account. If you have **Google AI
Pro** or **Ultra**, use the account associated with that subscription; a paid
subscription is not required to start. Most personal accounts do not need a Google Cloud project.
Company or Google Workspace accounts can require separate Cloud setup.

Google AI Pro provides higher Gemini CLI usage limits. It does not provide GitHub
repository permissions, Railway access or a paid Gemini API allowance. Google
sign-in is the recommended path here; a separate API key is not needed for that
personal-account setup. Check the recognised plan and usage with `/stats model`.

## Open the same project

Authenticate Git using an account with access to `tatts29-svg/fish`. Write access
is needed to push work and participate in the existing GitHub handover. Use a
separate checkout, for example:

```bash
git clone --branch codex/gc500-current-release-03oct https://github.com/tatts29-svg/fish.git fish-gemini
cd fish-gemini
gemini
```

The root `GEMINI.md` imports `AGENTS.md`. Use `/memory show` to check it loaded;
after pulling updated instructions, use `/memory reload`. Read the latest
`03_GC500_Delivery_Control/STATUS.md` before claiming work. The board and original
documents provide shared context; another assistant's private chat is not
automatically available.

Provide authorised access to the source spreadsheets, PDFs, maps and media used
by the task. Some are deliberately outside Git. Use the existing private source
locations or restore them into the new environment; do not publish them to the
repository. The toolchain README explains media manifests and browser inputs.

## Build, check and publish with the shared tools

From `03_GC500_Delivery_Control`:

```bash
npm ci --prefix toolchain
npx --prefix toolchain playwright install chromium
```

If Chromium is already available, configure `CHROMIUM_PATH` instead. Claim the
work on the current board and follow [the shared toolchain README](README.md).
There is no separate Gemini build or deployment pipeline.

For the claimed release, replace the example version and patch path below:

```bash
toolchain/build.sh vX.YY vX.YY_change_DRAFT/patch_vXYY.py
PAGE=build/GC500_vX.YY/GC500_Delivery_Control_hosted.html node toolchain/harness/sweep.js
MOB=1 PAGE=build/GC500_vX.YY/GC500_Delivery_Control_hosted.html node toolchain/harness/sweep.js
python3 toolchain/upload_page.py build/GC500_vX.YY/GC500_Delivery_Control_hosted.html --dry-run
```

Also run the release's focused checks, inspect its phone presentation and use the
shared browser lock as documented in the toolchain README. Tests are read-only.
Record the exact tested source and READY state before publishing.

Publishing uses the existing private `GC500_EDIT_TOKEN` environment binding, or
the supported credential proxy where the host provides one. The environment owner
configures that binding securely; do not copy an existing secret into chat, Git,
commands or documentation. The uploader's dry run verifies access without
changing the site. A separate Railway dashboard token is not required for this
page-upload workflow.

For the ready, tested candidate owned by this session:

```bash
python3 toolchain/upload_page.py build/GC500_vX.YY/GC500_Delivery_Control_hosted.html
```

Keep the unchanged-live-base guard, verify the exact public result and record the
LIVE handover. Follow `AGENTS.md` for authorised operational record changes;
publishing code does not itself confirm any installation, charge or delivery.

## Official references

- [Installation and supported environments](https://geminicli.com/docs/get-started/installation/)
- [Authentication and Google AI Pro sign-in](https://geminicli.com/docs/get-started/authentication/)
- [Quotas, subscriptions and API billing](https://geminicli.com/docs/resources/quota-and-pricing/)
- [GEMINI.md context and imports](https://geminicli.com/docs/cli/gemini-md/)
- [Creating a Codespace on a repository branch](https://docs.github.com/en/codespaces/developing-in-a-codespace/creating-a-codespace-for-a-repository)
- [Gemini CLI manual Google authorization implementation](https://github.com/google-gemini/gemini-cli/blob/main/packages/core/src/code_assist/oauth2.ts)

Requirements and plan limits can change; check these official pages when setting
up the selected environment.
