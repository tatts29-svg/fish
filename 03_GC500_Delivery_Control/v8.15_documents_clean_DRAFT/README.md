# Documents — v8.15

Author: Andrew Fisher · 3 Oct 2026 AEST.

**READY for guarded upload; not yet live.** Frozen implementation 8c821da, owner evidence 139d917 and READY board 48b346a. Candidate `35ab136643f9b7b0fb5b4e237c501c58cb27bc31e4faaded75df013dad0f7770`, 9,118,422 bytes, built from verified live v8.14 `6365fd0965e1ae1fcf75fdd6aad076b2662697443addfae49a3d6016a39f9fce`.

Documents opens with the existing race-style category cards and a working find box instead of a long catalogue. Files sit under their category; the five duplicated pre-start entries resolve to their uploaded copies while preserving their notes. The existing file-opening, reference links, upload and removal functions remain. Fencing plan links land on drawings; header search retains the exact missing document selected.

The independent audit corrected public search being disabled, category focus loss, stale categorisation after incoming records, native printing and selected-row focus being lost during a later redraw. Selection now survives full and partial refresh while respecting a user's movement to another control. Native Print and Print the list include the complete catalogue and restore the on-screen filter/folds. There are no operational-record writes or Showcase/machine changes in this release.

Validation: owner desktop 58/58, phone 58/58 and paper 9/9; independent focused browser 80/80 and CPU 70/70; an additional independent lifecycle review found no blocker. All 15 final standing runs pass: 248 assertions plus desktop/phone 21-tab, seven-link and Back sweeps. Every run exited 0, all browser contexts closed, and page/console errors are zero. New desktop/phone screenshots were inspected. Full independent evidence is in `../review_v815_release/evidence/selection_final/`; historical failed candidates remain labelled and preserved. No actual upload/removal was performed during practice tests.

Measured initial pane height is 511px on desktop versus 8,949px before, and 1,102px on phone versus 21,878px. The native list prints 12 pages instead of 22, preserving every title previously printed. Category cards measure 14% empty; some desktop row groups remain above the 15% target (default 17.8%, Packs 21.7%, Drawings 22.2%) because the three-column grid has partially filled final rows. These are follow-up limitations, not passed targets. Phone measured empty space is 5.1–7.7%; neither device has horizontal overflow.

Owner six-run median opening time is 470ms desktop versus 434ms before, and 448ms phone versus 457ms. The desktop measurement is about 8% slower; no universal speed-up, strict no-regression performance target or physical-device frame-rate claim is made. Existing component appearance is retained. The patch docstring's mention of the former collection cache is stale documentation only; the verified source uses a fresh collection inside the existing asset hold.

Implementation and release-specific tests were provided by the implementation owner; bounded corrections, independent review, complete standing tests and publication preparation were performed by the release owner with independent subagent checks. The owner has frozen this source for upload and will independently read back the public release afterwards. Separate v8.16 Demob and v8.09 machine work is excluded.
