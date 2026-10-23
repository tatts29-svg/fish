# v11.61 — cleaners' operational card

Author: Andrew Fisher.

Andrew: “We are live now. So we need to ensure we are making things really easy for these cleaners.”

DRAFT — not yet published. Base: v11.60, `e17bd3d868b00f421f23a249c39f39c94801c05b57533ae8d4bfcd7674cf683f`.

The phone review found practice days alongside tonight and a map and long asset list ahead of the completion buttons. Previous nights now fold into saved history; the existing map and long asset lists open on demand. The reference, area name, location, quantity and job buttons remain visible. Closing historical nights returns to the current operational night. The saved screen distinguishes this code's jobs from other work at the reference, so a cleaner who finished cleaning and water is not told their own jobs still require pump-out.

No change to task rules, completion weights, signing, token, tracker configuration, contact, send/retry/undo functions or operational records. Completion and recovery tests use a local mock only. All raw snapshots, signatures, screenshots and publication payloads stay in private storage.

## Checks and publication

`tests/test_crew.cjs` extracts the exact candidate template, runs at 360 px, 390 px and desktop, and exercises history, map/asset disclosure, role-specific saved messages, offline/reload/reconnect, undo confirmation, 08:00 rollover, final-night tasks and view-only mode. Requires `PAGE`, `OUT`, Chromium and the repository's mock server; `SERVER_JS` can select the server source if using a sparse checkout.

`tests/publish_tracker.cjs` captures the page's native update in dry mode without sending it. Execute mode requires `--execute` and `GC500_NATIVE_TRACKER_EXECUTE=1`, an exact live page match, a fresh private backup, an existing key/token, unchanged configuration/contact/metadata, one native POST, exact crew HTML read-back, every printed signature retained and all prior ticks preserved. It permits no completion or job-record writes. Publication backup/read-back GETs of the crew page are part of the release, not test scans; the service may record those views. `native_bridge.py` restricts routes and keeps credentials on stdin/environment only.

Build uses the shared `toolchain/build.sh`; full desktop/phone sweeps and guarded main-page upload remain required. The local rehearsal is the TEST check for this unchanged configuration; the previously confirmed event area placement/directions are retained byte for byte. Native dry-run and all final checks must pass before READY.
