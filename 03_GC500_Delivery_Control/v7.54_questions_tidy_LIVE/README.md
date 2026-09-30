# v7.54 — Questions review and note reliability

Author: Andrew Fisher · 1 Oct 2026

**LIVE 1 Oct 2026 05:22 AEST.** Built on the live v7.53 Questions and financial fixes, with the approved v7.52 Forecast P&L and v7.54 branch Rehire handovers at shared-branch commit `aef7e5c`.

FL01 now shows supplier fleet number **50004**, explicitly written in contract 9961976 line 31's Phillip Park location note. Its adopted T0003 schedule row identifies the match. The source is visible in the drawer, a recorded site number takes precedence, and no supplier name is invented. This is a read-only display correction: no unit or contract record is created. The asset-number question closes only when the numbering checks succeed. Blank supplier numbers and duplicate entries no longer count as separately numbered units.

Questions keeps saved notes accessible when a dynamic check leaves the current list. The retained history explicitly distinguishes a saved note from evidence of a price, delivery or verified cost. Typing survives refreshes, including when the underlying check disappears; an unsaved draft stays labelled as such. Finishing the edit saves it once without cancelling the next click. Folds, focus and cursor position survive redraws, and Open/Pending group links have unique targets.

The P36 planned/current asset allocation stays open and no longer directs unsupported deletion. Temporary fencing stack-down on service note 24455 and reinstatement on 24456 are explained without claiming completion of the later 115 m removal task or adding charges. The drawing question names the held master revision and still asks whether a later issued set exists. Scheduled accommodation dates no longer imply confirmed stays or actual costs.

Current expected queue: **16 open, 8 pending and 33 answered/history**. Revenue remains **$555,929.94 ex GST**. Remaining accessory/water rates, final transport/install figures, actual labour costs and uncertain site allocations require evidence or a decision. No rates, deliveries, Finance journals or other shared records were changed. The existing MP4 car, weather and speedos are preserved.

The combined release also adds the Forecast P&L at the head of Costs and Rehire details for every branch. Entered rates remain estimates rather than source contract rates. Rehire detail is clearly included in the branch Revenue, and supplier costs are separate. The existing partial labour outlook stays separate from verified actual costs.

## Build

Run from the delivery-control folder with the shared toolchain, in order:

```bash
toolchain/build.sh v7.54 v7.52_the_pl_as_management_read_it_LIVE/patch_v752.py v7.54_every_branch_shows_its_rehire_LIVE/patch_v754.py v7.54_questions_tidy_LIVE/patch_v754_assets.py v7.54_questions_tidy_LIVE/patch_v754_workflow.py v7.54_questions_tidy_LIVE/patch_v754_evidence.py v7.54_questions_tidy_LIVE/patch_v754.py v7.54_questions_tidy_LIVE/patch_v754_finance.py
```

**201 focused checks and 14 patch guards passed.** Desktop and phone sweeps each passed 21 tabs and seven deep links with zero page, console or navigation errors. Phone screenshots were inspected. The public page matched the build byte for byte: **8,475,019 bytes**, SHA256 `231a7bf4dd5095ab2e0cc408ad9501cd01cfb9dae18a213960c5531b150d6f13`. Shared-record version **3082** was unchanged from the pre-upload check.

Tests use the GET-only browser harness and in-memory edits. Evidence includes number-count/source checks, Questions and note-workflow checks, fencing/drawing checks, patch guards, desktop and phone sweeps, phone screenshots and public release verification.

## Handover

The Three.js Showcase and Today · Current Position proposals remain on hold. The existing live car, weather and gauges remain in place. Coordination on PR #1 confirmed the two ready financial handovers; Andrew then explicitly requested their upload, live verification, folder/board updates and a PR to the shared branch.
