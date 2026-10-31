# v10.21 publication review and reproducible candidate

Author: Andrew Fisher · 15 Oct 2026

**State: VERIFIED LIVE. Page published 15 Oct 2026 02:34 AEST; paired six-file map publication and actual-public32-check phone verification passed. Claude owns all subsequent building and record operations.** `STATUS.md` remains the shared ownership and release board.

Andrew asked Codex to touch base with Claude and make his completed work live. Claude's exact ready implementation is commit `3be8e2b8`, carried in source checkout `501656cc` with the separate pre-start preparation. The publication checkout is `codex/gc500-claude-release-15oct`; its subsequent claim and review commits do not change the original handover identity. Codex owns integration, final tests, guarded publication and fresh public verification. Scoped independent reviewers examined the P/O, map, programme and native-operation work. A posted handover is not a claim that an external assistant acknowledged it. Claude's separate moving v10.22 event-night run-sheet claim is outside this candidate.

## Exact source and candidate

| Item | SHA-256 |
|---|---|
| Required page source: live v10.18 | `2d09fa44794596c52c54d41aed6f98d16fbb6f5ff1ccf608f9d275874559785d` |
| Original three-patch v10.21 candidate | `9db6edd2492e6f25d4144cc8762f8a223f1cca1a6ad01d25d9c648e17280456b` |
| After the P/O review correction | `e116d2a58deed0f4c155482f5d240ce89204eb69f6d16ef123050fd2656d9ef6` |
| Final reviewed page candidate | `06d6e6b0956c793299c99b5e48a7ee1c3fe16616f20a60ff0696d410f111848d` |
| Required retained machine source | `6a5582b6e60a0e1449ee42c63900912fda875c08c825cbc3dc13c42b24d6047f` |
| Reviewed machine candidate | `eb8a01ffa79dc336057b2b369a6500344058e9a5f4635205d0fa1dbe9ef3e0c2` |

These are source/candidate identities, not proof of what is currently published. The release owner rechecks both live bases before publication. The observed starting native record was version **6078**; this candidate's page and machine patches do not change it.

## Reproduce the five-patch page chain

Run from any directory; the wrapper resolves the shared toolchain and sources relative to itself:

```sh
bash 03_GC500_Delivery_Control/release_review1021/build_review1021.sh
```

The default invokes the shared `toolchain/build.sh`, which fetches the fresh public page and applies these patches in order:

1. `v10.19_po_values_prestarts_signed_DRAFT/patch_v1019.py`
2. `v10.20_gate6_compound_DRAFT/patch_v1020.py`
3. `v10.21_schedule7_1_DRAFT/patch_v1021.py`
4. `release_review1021/po/patch_po_review1021.py`
5. `release_review1021/map/patch_provenance1021.py`

The wrapper accepts the corresponding `_LIVE` source directories after the release lead renames them. If both `_LIVE` and `_DRAFT` copies exist, it refuses an ambiguous source. The expected input and final hashes are checked; a changed live base or changed implementation requires review and a new candidate. It then runs the normal attribution scrub and static page check. This is not a substitute for the required desktop/phone sweeps, focused browser checks and visual inspection.

Output defaults to `build/GC500_v10.21-reviewed/`. `--version <label>` selects a separate build output. `--print-only` prints the resolved patch chain without fetching or building. After this release is live, reproduce from the retained exact original v10.18 base:

```sh
bash 03_GC500_Delivery_Control/release_review1021/build_review1021.sh \
  --base /private/path/to/exact-v10.18-base.html \
  --version v10.21-reproduced
```

The archive option checks the original hash before copying or applying patches. Neither mode uploads anything or changes native records.

## Changes retained and corrected during review

**Purchase orders.** The original v10.19 page adds readable currency values, a recorded checked state and clean person-name presentation. Review found that a saved check could survive a material order edit and that Mark checked could discard unsaved input. The added correction binds a new check to the reviewed saved values, clears it when those values change, preserves it for an unchanged save or receipt-only edit, and requires Save before checking an edited row. No rate or amount is altered by this page patch. See `po/README.md` and its focused checks.

**Gate 6 maps.** The original v10.20 moves P60, P62, P63, WC49 and GN06 using the revised iEDM layout. Review preserves those positions and polygons, but correctly calls them approximate revised-layout positions rather than surveyed master-plan unit positions. It removes an invented observation timestamp and keeps navigation aimed at the revised destination. The retained machine update carries the same five locations into standalone 2D/3D snapshots, adds the revised footprints, marks superseded footprints on plan views and includes the revised layer in PNG export. The underlying D001 drawing is not represented as reissued. All unrelated machine files and snapshot entries are retained. See `map/README.md` for preparation, source-bound evidence and guarded publication.

**Programme evidence.** The original v10.21 records that the submitted Schedule 7.1 is the older 30 Sep workbook and applies none of its superseded operational data. It adds closed documentary-evidence folds for the three programme Complete cells at GN13, P69 and P45, without importing completion, dates, quantities or charges. Existing onsite records remain authoritative.

## Source review and evidence limits

The Schedule 7.1 binary (`98b6db43…`) was independently located under an earlier attachment filename: its exact bytes match, and the reviewer confirmed 12 sheets, 2,809 populated cells and the 30 Sep 2026 15:59 AEST saved time.

The latest programme binary (`078dd52a9c0680fd5ace780332fd4d5b5a5d9f8fdf8e83a9e3f110f276abb96b`) was not accessible to the receiving reviewer. Its claimed latest saved time has not been independently verified. Accessible original programme files `fc39ba08…` and `501d229b…` were compared directly: the only three cell-value changes are `CON WK 2!I101:I103`, blank to Complete; the corresponding completion dates and base-sheet cells remain blank. Therefore the displayed three documentary facts have original-source support, while the newest file identity remains a specific handover gap.

The original 14 Oct iEDM Gate 6 email photograph was also requested from its receiving assistant. The reviewer read the committed transcription, measured positions, calculation and generated comparison images; the private original has not been independently re-read. The drawing-derived positions remain labelled approximate. Do not claim this review independently certified a survey or the unavailable original image.

Original private workbooks, photographs, financial snapshots and operation evidence stay outside the public repository. Questions and earlier source conflicts in the programme report are not silently converted into operational updates.

## Native P/O checks and pre-start documents

Page/machine publication is separate from record operations. After the corrected page is live, the release lead may carry out the four already-confirmed P/O checks using `records/po_checked_guarded.cjs`, after a successful read-only practice against the exact final candidate. The native setter supplies the reviewed-value basis. The runner durably saves a full snapshot and exact request plan before any admitted write, allows only the four P/O records and their native audit documents, checks each acknowledgement and verifies the entire native record afterwards, including on failure. See `records/README.md` for the precise scope and private audit files. Preparation alone does not mean these checks were written.

**The proposed pre-start PDF batch remains held pending factual confirmation.** Rostered names, planned work, generated PDFs and printed sign-off wording do not establish actual attendance or that a pre-start occurred. No bulk attendance or completed-pre-start claim is part of this candidate. The safeguard plan in `records/README.md` requires source confirmation, immutable file identities, backups before uploads, strict byte/hash verification and a durable partial report before any replacement/removal workflow is considered. Do not run the original uploader merely because the page release passes.

## Release owner's remaining gates

The lead completes the final combined focused checks, desktop and phone sweeps, relevant screenshots and native/financial parity, then records their exact evidence on the shared board. Independently passed component checks are documented in the subfolders; they are not presented here as final combined release results.

Before any upload, re-read current shared coordination and confirm that both source hashes still match. Publish only the prepared page and retained machine with their guarded tools; verify the actual public page bytes, machine identity and changed public files afterwards. Run public map/navigation checks against the published resources. Rename source folders and record LIVE only after that proof. The four P/O confirmations, if executed, receive their own private backup, request plan and fresh readback evidence. Name which separate drafts must rebuild on the verified new live base; v10.22 remains with its existing owner.

Final pre-publication verification is recorded in `verification-summary.json`: desktop and phone22tabs/7links/Back, P/O17+31, Gate6phone32, financial107. The20 allowed financial-capture differences are WC49 location metadata only; all amounts and native records match. Phone screenshots were inspected.

## Final live handover

The public page matches the reviewed06d6e6b0 bytes. Machineeb8a01ff is registered; all six public changed files match and227 other files remain unchanged. Actual-public phone map checks32/32 pass, including revised sources, matching standalone snapshots and refresh preserving selection/zoom. Zero browser errors or operational writes; native6078 unchanged. The four checked records were rehearsed only (12 simulated writes, full native before/after identical); apply remains with Claude. All pre-start originals remain retained.

Claude acknowledged the review in PR1 comment6173184045 and announced ongoing ownership in6173252107. The handover/publication messages crossed while the guarded page upload was running;6173274195 records that timing and the paired map completion. No old9db6edd2 upload or duplicate v10.23 fix is required. Rebuild v10.22 from the current public06d6e6b0 base after incorporating this branch. This release does not establish actual pre-start attendance or completion of future night work.
