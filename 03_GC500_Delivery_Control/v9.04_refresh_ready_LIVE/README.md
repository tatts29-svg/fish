# Refresh readiness

Author: Andrew Fisher.

**VERIFIED LIVE as part of v9.04 — 8 Oct 2026, uploaded 02:31:13 UTC.** Public page SHA-256 `d0d630046090cc4dd9f2bcd8ad3d85d818cc0a8bfe87cae4f8ee059e95b7b57d`; 11,450,666 bytes. Both public phone/desktop checks confirm the new panorama and current record.

A refresh previously drew the embedded/browser copy before the shared record arrived, then replaced it. A direct asset refresh could also route into a map extension before that later inline script had been defined, stopping startup before the shared connection began.

The first page draw now shows a short loading panel while the current record is read. Its CSS is installed in the head before any data rendering. The existing header and navigation remain present. Data panes and an initial asset drawer reveal once all shared collections have arrived and their fresh render has completed. A single collection or a `live` connection flag is not sufficient. Later polling, changes and navigation do not reapply this gate.

If the service is unavailable, refuses the connection or takes more than 12 seconds, the existing copy remains available under **Saved copy — current record not confirmed**, with a Retry connection button. A successful retry replaces it and removes that notice. File editions retain their local workflow. Record contents, offline merge rules, write queues, permissions, costs and progress calculations are unchanged.

Only the initial route waits for `DOMContentLoaded`, so all inline map/progress extensions exist before opening an asset or day link. Sync boot still starts immediately. Later navigation and polling keep their existing timing. The phone header's CHECKING text fits its existing record box.

`patch_v904.py candidate.html` patches the supplied candidate in place. It accepts v8.99–v9.03, refuses repeated/wrong bases, and advances only the footer version. Apply after the current presentation/traffic patches.

Validation on integrated v9.02 + final v9.03:

- Four synthetic Chromium cases passed: fresh laptop; warm phone including reload; direct `#asset/P55` including warm reload; phone `#day/2026-10-07` with unavailable service followed by Retry.
- Every data pane/drawer is hidden during a delayed state response, the full collection set precedes reveal, and the current synthetic reference replaces its stale cached wording. URLs survive startup, no horizontal overflow and no page errors occurred. All requests were mocked GETs; attempted writes: zero.
- Isolated lifecycle checks passed for partial snapshots, the 12-second fallback, an unchanged complete snapshot, one reveal only, a later connection loss, and the local-file edition.
- Exact patch reproduction, unchanged embedded DATA/COMMITTED, early gate placement, wrong/repeated base refusal and all inline script/secret checks passed.
- The phone loading screenshot was visually inspected. Screenshots and raw evidence remain outside Git. Final live-data navigation sweeps, combined motion checks, guarded publication and fresh public readback passed.

Integration input: `b83663791a42d2ba3f9bfe7c6c9753d62ed3fff294e6c97a543508af567b59ab`.

Verified candidate: `d0d630046090cc4dd9f2bcd8ad3d85d818cc0a8bfe87cae4f8ee059e95b7b57d` (11,450,666 bytes).
