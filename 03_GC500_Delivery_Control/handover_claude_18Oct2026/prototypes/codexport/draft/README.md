# v10.57 — page and map performance

Author: Andrew Fisher

DRAFT — testing in progress; not published. Owner: Codex. Branch: `codex/gc500-performance-17oct`.

Andrew requested a bug and error sweep for slow pages, maps and loading. Profiling found repeated scans of unit identity and work records, repeated full-record serialization for day cards, and status callbacks reading the asset register outside a shared read pass.

The patch indexes native records only within the existing synchronous asset hold, reuses the day-work snapshot within that hold, and batches completion/status/alignment reads. Existing save and remote-hydration invalidation remains authoritative. Custom/snapshot inputs are not cached. Returned records retain their original ordering and copying behavior. Presentation, prices, quantities, branch allocation, map geometry and operational records are unchanged.

The test harness now respects HTTP `no-cache` and `no-store`; the old harness could replay a stale mutable map index. That was a test-harness defect, not proof of a live browser cache defect.

Validation so far: shared build/check_page passes; 237 index reference checks, 65 batching checks and 5 HTTP-cache checks pass. Live-model parity passed before correcting the test's rentalOf argument; full final parity, desktop/phone sweeps and map checks remain pending. Private profiles and live records are not committed.

Coordination: based on live v10.55 SHA-256 `0cfe02f8dd823bae3c89f3600db8343b2d384f432c8884bc0188323bc44c0b36`; source claim at `298c2b7`. Shared head `95db0509ae34839e13c19291ff2ff9899bed03de` retains separate ownership. Claude owns v10.56 day-card content and print/loading/lock/Timeline work. Andrew requested a fresh overlap check; publication is held while Claude confirms release order in PR #1 comment 6224891176. No acknowledgement or joint review is claimed.

Run synthetic checks with `node tests/test_read_indexes.cjs` and `PAGE=<candidate> node tests/test_batching.cjs`. The browser parity check requires `BASE=<base_live.html> PAGE=<candidate> node tests/test_live_parity.cjs`; all service writes are blocked by the shared harness. Run map checks with `PAGE=<candidate> node tests/test_map_performance.cjs` and repeat with `MOB=1`. Use the shared desktop/phone sweep too. Screenshots and profiles must remain in private local storage.
