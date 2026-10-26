# Event crew evidence checks

Author: Andrew Fisher.

These tests use fictional paper numbers and aggregate supplier hours. Supplier attendance must preserve the agreed customer scope, windows, hours, rates and overrides; it is not authority to recalculate customer Revenue. Browser tests use a frozen native state snapshot and the public view URL. Every HTTP write is refused; rehearsed native saves stay in the disposable browser and its original record is restored.

- `node tests/test_resolver1237.cjs` checks explicit linkage, conflicts, invalid evidence, duplicate sources and exact decimal cents without a browser.
- `PAGE=<candidate> STATE=<private-snapshot> flock -x /tmp/gc500-browser.lock node tests/test_native1237.cjs` checks native capture, source serialization, unchanged agreed customer scope and separate supplier ownership, overrides, category/branch preservation, Finance guards, stale evidence and restoration. Repeat with `MOB=1` for phone.
- `BASE=<live-base> PAGE=<candidate> STATE=<same-private-snapshot> flock -x /tmp/gc500-browser.lock node tests/test_preservation1237.cjs` compares financial models before any event allocation. Both pages read the same snapshot.
- `MOB=1 PAGE=<candidate> STATE=<private-snapshot> OUT=<private-evidence-directory> flock -x /tmp/gc500-browser.lock node tests/capture_phone1237.cjs` captures the current fencing card, evidence, invalid-link warning, native form, original customer agreement row and running-sheet summary. Screenshots remain private and require visual inspection.

The shared harness needs Playwright on `NODE_PATH` and its Chromium executable in `CHROMIUM_PATH`. No edit credential is used. Shared navigation sweeps and guarded publication remain separate release checks.
