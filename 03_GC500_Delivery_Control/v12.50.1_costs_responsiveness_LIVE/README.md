# Native Costs responsiveness — v12.50.1

Author: Andrew Fisher.

Status: READY TO UPLOAD, not live. Frozen implementation/tests source: `58ed6333706c2ac995e66da2d9349ef34a7fa48b`. Screenshot review and the exact shared live-base rebuild are complete; the rebuilt bytes match the tested candidate below and all 217 scripts pass. A fresh public read-back at 20:15 UTC on 28 Oct 2026 confirms the unchanged live50 predecessor. The affected native 47 comparisons and phone controls were repeated against the newer private record snapshot, which remained exact on the final 20:21 UTC read. The release owner retains the guarded upload and full public-byte read-back.

The separate current-record provenance review is still open with the operational owner. This release preserves the record and does not resolve or certify historical corrections. It does not include the presentation previews; those rebuild on the independently verified successor before any later release.

The patch removes repeated calculations during the existing Costs render. Labour tick totals are reused only within the native asset-hold lifecycle, with a separate deep copy returned to each caller. Standalone reads and calls with extra arguments calculate fresh results; the existing record and event-configuration invalidation remains in charge. The Finance wrapper passes its already-calculated Finance result to a private synchronous branch projection, avoiding its second identical read. Public branch calls still read fresh data in the original order. No Finance result persists between calls.

Only these reader boundaries and the version footer change. Native financial arithmetic, Revenue, Direct costs, categories, branches, documents, source controls and the current layout are preserved. The separate presentation previews are outside this release.

## Frozen build

- Exact live50 predecessor: `7ea8e4d2b8230bdece88a7d566c8ae8d2eea63892b8ba1b928a3440149ca4404`.
- Tested v12.50.1 candidate: `69bf04e72a45e084f0ba5227b4a26cf95ffe4078429044946af473120d4e7bb2`, 16,099,841 bytes.
- Native/control/performance/phone-interaction tests use one pinned private record snapshot; its exact fingerprint stays in the private evidence manifest. Shared route sweeps read the live record and clock.
- Implementation and repeatable tests: this folder. The release handover records the final source commit.

The patch rejects another predecessor or a second application. Reversing its scoped edits recovers the predecessor exactly. From `03_GC500_Delivery_Control/`:

```bash
GC500_V12501_BASE_SHA256=7ea8e4d2b8230bdece88a7d566c8ae8d2eea63892b8ba1b928a3440149ca4404 \
  toolchain/build.sh v12.50.1 v12.50.1_costs_responsiveness_DRAFT/patch_v12501.py
```

## Validation

- Shared checker: all 217 inline scripts pass.
- Eight source guards preserve the original calculation bodies, exact predecessor reversal and base/duplicate rejection.
- Six extracted Finance controls preserve public read order, fresh calls, ignored arguments, frozen inputs, genuine false invoice checks and exception behaviour. The outer Finance call makes one original Finance read instead of two.
- 47 native full-output comparisons preserve financial/category/branch/contract/document values, physical and Build projections, complete Finance models, CSV/text/HTML outputs and original control/render functions.
- 30 freshness and isolation checks cover standalone reads, nested result mutations, record/save/configuration invalidation, missing clone support, native exceptions, nested holds, Finance source changes and exact document restoration.
- Desktop and phone live-read sweeps each preserve all 27 native route destinations, seven deep links and Back behaviour against the native50 sweep baseline.
- Actual phone Summary, Pricing and Finance controls and Today/Costs re-entry preserve the complete native models and documents; native sections and Finance tables remain accessible. Private screenshots accompany the review.
- Every completed browser gate reports zero runtime errors, console errors and blocked record-write attempts. The pinned native/control/phone harnesses enforce GET-only requests; the shared sweep harness blocks record writes while retaining its existing Google tile-session exception. Test source changes are confined to the test fixture; no operational record changed.

Private diagnostic copies count 26 tick aggregate calculations before the patch and one after it during native Today → Costs navigation; original Finance reads fall from eight to six. These counters prove avoided work and are not timing measurements.

The unmodified timing runs reload exact predecessor/candidate bytes in one browser in ABBA order, verify the same record and business clock, exclude one warm navigation per block and measure four native Today → Costs navigations per version through two animation frames:

| Viewport | Predecessor median | Candidate median | Predecessor range | Candidate range |
|---|---:|---:|---:|---:|
| Desktop | 2,608 ms | 2,053 ms | 2,459–3,543 ms | 1,944–2,312 ms |
| Phone | 3,432 ms | 2,819.5 ms | 2,674–5,987 ms | 2,314–3,287 ms |

These are bounded warm-navigation results. Phone ranges overlap and the later predecessor phone block is faster than the first candidate block; warm-up, timer and host variability remain material. Two animation frames do not establish global network/timer idleness or universal real-device speed.

All browser checks hold `/tmp/gc500-browser.lock` and prevent live-record writes. Set the environment's `NODE_PATH` and `CHROMIUM_PATH`; supply `BASE`, `CANDIDATE`, `CANDIDATE_SHA`, `STATE` and a private `OUT` for comparison tests. Freshness uses `PAGE`; phone interactions use `PAGE`, `PAGE_SHA` and `MOB=1`. Detailed records, screenshots and superseded experiments remain private.

Before publication, the coordinated release owner rebuilds the frozen source, requires the exact candidate hash and unchanged live predecessor, verifies the current-record financial probe, then uses the shared guarded uploader and checks the complete public bytes. A changed predecessor or candidate requires reconciliation and affected checks again. No operational writes are part of this release.


## LIVE

LIVE 29 Oct 2026 06:30 AEST (Claude publication). Exact rebuild from `58ed6333` on the verified live50 predecessor `7ea8e4d2…` reproduced the tested candidate `69bf04e72a45e084f0ba5227b4a26cf95ffe4078429044946af473120d4e7bb2`, 16,099,841 bytes; the money probe on base and candidate was identical apart from the footer (charge $1,011,296.03, cost $448,019.57, every P&L row and branch total the same); guarded upload (live page unchanged since the build started; record 11766); public read-back byte for byte identical.
