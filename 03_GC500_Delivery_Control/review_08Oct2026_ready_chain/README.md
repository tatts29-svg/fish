# Independent review of the held GC500 release

Author: Andrew Fisher.

## Current integrated build review — 8 Oct 2026 AEST

Andrew directly asked Codex to help with implementation and the build. Claude transferred v8.96/v8.97 in
[6045839392](https://github.com/tatts29-svg/fish/pull/1#issuecomment-6045839392), updated 7 Oct 20:04:09 UTC.
The imported source is `c85b79c35778134ea88ecfd6d3d6f6da47c6e091`; Codex's claimed ownership is recorded on STATUS.
Claude retains v8.91–v8.95 corrections and their frozen READY handover. This is build/review work, not a release certificate.

- Independently reproduced v8.94 `950b42b8691cac9b810d43c3b79465689da1786614f3a400db75c7c6bf24a704`
  and v8.95 `388292e5947916e35f8d7b8fbb2fc3edf59b1388c56016d0e72456c346c36b54`.
  Their existing lighting and contract browser suites pass on laptop and phone, 35/35 and 26/26 respectively.
- Additional in-memory lighting fixtures found that a short-delivery conflict can still receive confirmed scope credit,
  while a drawing callout promoted to a real completed asset can receive no location credit. The Done/Total drill-downs
  also retain recorded quantities while their headlines use capped map scope. The existing passing suite did not cover
  these cases. See [6045955855](https://github.com/tatts29-svg/fish/pull/1#issuecomment-6045955855) and
  `tests/check_lighting894_edges.cjs`. The fixtures restore every replaced reader and leave the record unchanged.
- The v8.95 source replay and identity checks pass. Pricing preservation was checked privately against the supplied
  exports; no financial amounts or original attachments are included here. Two metadata carry-through observations
  were reported separately from the current user-facing results.
- Integrated 893/894/895 page: `20f32bb1cd01ae9765ee87ce3ffe8f3de982422fe2cedd8cc1e724265d676f50`.
  Adding truck flow and polish requires order 893, 894, 891, 892, 895: v8.91's footer guard rejects a v8.95 base.
  That complete pre-scene base is `858042cf8c6b4c7aeb1e1c340a0ec04ac22a2f50864632fda4ec177413e3c5fd`.
- The v8.93 publisher can create a plan with a missing or stale asset directory. Its plan must be bound to the full
  expected manifest and referenced files before upload. Its alignment browser test also has an absolute checkout import.
  Both findings were sent to its owner; the new shared release runner fails on this portability issue.
- Local reconstruction reproduced the exact v8.93 scene hash and 73 unchanged assets, but the rendered replacement
  tile bytes differ from the expected manifest. No approximate assets qualify for integration. The exact encrypted
  archive parts named in the v8.93 README are still required; their checksums alone are not the assets.
- Codex completes the Today scene and map-completion patches in their respective DRAFT folders. Their READMEs record
  source-specific checks and distinguish early v8.90 visual previews from the pending final v8.93 integration.
- A portable shared release runner now captures stage hashes, requires positive test assertions, rejects failures and
  missing local explorer assets, serialises browsers, and requires final 21-route/seven-link/Back sweeps. It cannot publish.
  Stage-specific layout checks are explicitly distinguished from final combined-page checks.

The latest combined page after the rain-coverage optimisation is
`fc3432fa76d3d56745b77359f7b6240c174932c6c6c7692ff5e3a445b9a0730e`. Its build passed the six identities, script checks and
completion semantics. The runner now binds selected source files and external build inputs as well as patches and stages;
13 fixture tests include rejecting a resumed build after referenced JavaScript changes without a patch-file change.

The map-completion browser suite passed 12/12 on laptop, phone and reduced-motion phone using the preceding `af2a20ba…`
combined page, current v8.97 code and exact v8.90 preview drawing assets. Both 21-route/seven-link/Back smoke sweeps also
passed on that bounded preview, with zero runtime/console errors or attempted writes. The unmodified release runner
correctly refuses those assets for v8.93. Private preview results explicitly set release readiness false and fail the release
validator. They do not establish final drawing alignment, full print output or 3D rendering correctness.

Concrete correction proposals are included for Claude to adopt without overwriting the claimed drafts:

- `proposals/v891-correction.diff`: isolates unloading windows by stable load ID and preserves unknown Crew requirements.
  Thirteen native-function checks pass on a private corrected candidate and on a replay of the proposed builder patch.
  The pre-existing Crew/day-order file-import limitation is disclosed separately; it is not hidden by these checks.
- `proposals/v892-correction.patch`: repairs card-control state after replacement DOM and cancels stale scroll restoration.
  Native-function fixtures reproduce both defects and pass corrected-behaviour assertions on the private proposal.
- `proposals/README_lighting894_proposal.md`: verified native completion, promoted callouts and reconciled scope drilldowns.
  Twenty-four fictional/native-function and HTML-output checks pass. Other scripts, DATA and financial readers are unchanged.
- `proposals/v893-alignment-portability.patch`: removes the test's fixed checkout path. Exact assets are still required.

These proposals have not been applied to the claimed release sources. They need owner review/adoption, a rebuilt chain and
affected browser checks. A successful reproduction of a defect is clearly labelled and is never a release-acceptance pass.

All evidence containing records or screenshots remains outside Git. No page, media or machine upload, and no operational
record write, was made during this build. Live baseline remains v8.83 until a guarded upload and exact public readback prove
otherwise. The final page and aligned explorer must be published together after the outstanding corrections and checks.

## Earlier review history

Codex reviewed Claude source `487c0de`, then corrected navigation source `9d3a267`. Publication is held pending Claude's aligned v8.93 page/media/machine chain. No upload or operational record write was made.

- Withdrawn rebuild matched `fe52302cda02d73c4f63ca73943360d66e740b074527b2685e2384ea5d00802c`, 11,256,999 bytes.
- Corrected rebuild matched `adc967ab0bcab45c78f952711386e94f3e34eaf8196923206911bdbc0881a113`, 11,257,271 bytes. All 165 existing navigation coordinates unchanged.
- Independent read-only desktop/phone checks on the unaffected cost code: Transport888 29/29, Costs865 33/33, Finance866 24/24. Zero runtime errors or attempted operational writes in these checks. These are not a release certificate for the later moving drafts.
- The withdrawn page passed master889 on both sizes; corrected master889 passes 16/16 on desktop and phone. Both shared sweeps checked 21 routes, seven deep links and Back with no runtime/console errors. Redirected and edit-only routes are intentionally not claimed as visible panes.
- GET-only media/machine preflights verified the configured edit credential, expected live base, and preserved machine blobs. No publish commands run. The machine candidate is also held, not live.
- Original encrypted 7 Oct sources were decrypted privately; the master original's SHA-256 matched `8753d875cf90682e09afefae8c774144d9e9725ece87f726707882fb3711c56d`. Private source comparisons and screenshots are not copied into this public review.

## Open gates and owners

Claude owns v8.91/v8.92/v8.93, lighting source reconciliation and Costs source-freshness disposition. Codex owns independent review and guarded publication/readback after an exact replacement READY handover. The page/explorer inset mismatch is a release blocker. Unreconciled lighting quantities cannot establish an independently verified whole-job percentage or a lower bound without evidence. Finance reconciliation does not make missing or unallocated source costs complete. The latest Baseplan source must be dispositioned before claiming every source is current.

See [coordination PR #1](https://github.com/tatts29-svg/fish/pull/1#issuecomment-6043837383). The duplicate map-hold reply was removed; the retained source acknowledgement is [6043752075](https://github.com/tatts29-svg/fish/pull/1#issuecomment-6043752075).

## Later source correction

Claude comment [6043879766](https://github.com/tatts29-svg/fish/pull/1#issuecomment-6043879766), updated 7 Oct 18:06:52 UTC, reinstates the original master-derived locations (`dc20a92` / `fe52302c`) and withdraws the navigation-preservation intermediate (`9d3a267` / `adc967ab`). The 165-pin preservation check above is historical evidence on that intermediate, not the contract for the final release. The settled master-plan rule applies. No intermediate was published. Final review/publication still waits for one paired v8.93/v8.94 READY chain; source classification, latest contract export and unconfirmed totals must be dispositioned by their implementation owner.

Both shared sweeps completed: 21 route calls, seven deep links and Back; zero runtime/console errors. This sweep is bounded evidence on the pre-correction chain, not a claim that future builds have no defects. After verifying all 617 imported source files had identical Git blobs in this same public repository, the previously blocked source push was approved and completed; no new private evidence was added.
