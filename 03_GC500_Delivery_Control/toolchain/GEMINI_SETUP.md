# Gemini coding environment for GC500

Author: Andrew Fisher · verified 13 Oct 2026

Use **Gemini CLI** to read and edit the project, run the existing tests and publish
ready releases through the shared toolchain. The Gemini website alone does not
provide this terminal or deployment access.

**Setup state:** instructions prepared; Windows, Mac or cloud environment still to
be chosen. No installation, sign-in or access grant has been performed.

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

Choose **Sign in with Google** using the Google account that holds the **Google AI
Pro** subscription. Most personal accounts do not need a Google Cloud project.
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

Requirements and plan limits can change; check these official pages when setting
up the selected environment.
