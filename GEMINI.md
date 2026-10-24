# GC500 project context

Author: Andrew Fisher

@./AGENTS.md

The shared project rules above apply to this coding session. Work on the same
project and use the existing build, test and publication tools.

Before starting a task, fetch the current shared branch and read the latest
entries in [the shared board](03_GC500_Delivery_Control/STATUS.md). Check who owns
the work before editing. Read [the toolchain guide](03_GC500_Delivery_Control/toolchain/README.md)
and [environment setup](03_GC500_Delivery_Control/toolchain/GEMINI_SETUP.md) when
setting up a new environment.

Use a separate checkout or worktree so another active agent's changes remain
intact. Coordinate scope, source commits, base and candidate hashes, testing and
release ownership through the shared board and the authorised PR #1 handover.
Re-read the board before publication; its current claim and release state govern
the handover.

Keep private source documents outside Git and credentials in private environment
settings. Read the original evidence before applying data or pricing changes.
Tests must not write to the live record. Use the existing guarded uploader for
ready, tested releases and verify the public result.

## Working with Codex and Claude

Andrew calls this assistant Argon. These rules apply whether this task runs in the
normal Gemini app or Gemini CLI. At the start of a work session, fetch the shared
branch, read the current board and read new comments in
[the shared GitHub conversation](https://github.com/tatts29-svg/fish/pull/1).
Acknowledge requests addressed to you when comment access is available, and
claim your scope before editing. Include the owner, branch and starting commit.
Leave results, evidence and remaining work where the other assistants can read
them. Preserve their active checkouts and claimed files.

Private chats are not synchronised. Comments do not automatically wake another
assistant; do not claim a handover was read until it is acknowledged. Report
comment/push/build/publication permissions separately and accurately. Do not
post credentials, verification codes or private source contents. The existing
release checks and independent-publication rules apply; no additional three-way
approval is created by this coordination setup.
