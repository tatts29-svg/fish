# Completion remains achieved after departure

Author: Andrew Fisher.

READY TO UPLOAD — engineering checks complete. The publication owner retains the requested preview/publication handover; no upload was performed in this work.

Build progress must retain completion recorded by the selected day after equipment leaves site. A movement-generated reset is distinguished from an intentional completion correction. Actual on-site quantities, departures, uncertainty and dated partial-completion rules remain separate.

This is a bounded correction to the existing progress readers and wording. It preserves the current layout, operational documents, rental and financial calculations. It does not infer completion from arrival, off-hire or a booked return.

Implementation and tests: `3fd2c24a5a2e8c2aaf1c1efc4f27994f2b826ac6` on `ccr-061f77e8-ivjhrv`. The patch requires the exact verified v12.54.1 public page, SHA-256 `20a81f75b8d47ed1c0d32cf3d5b5e5e79fe1bb5420b2fe459f9d4bbf94c771d5`.

The shared build produces `1e35528f32ff0b9cd3e0fb646b52cd92bc0c58733d3d9efaf9d02485e7c3a89b`, 16,114,393 bytes. Eight patch-boundary checks, 35 history/scope/alias fixtures, 54 VMS fixtures, 63 native acceptance checks and 59 financial/source comparisons pass. All 217 inline scripts parse. Desktop and phone sweeps each pass 27 routes, seven deep links and Back, preserving all eight existing aliases. Zero runtime errors, console errors or operational writes. Independent source review and actual desktop/phone previews were completed, including a fresh mobile session with no horizontal overflow.

The checks use pinned record 11984, SHA-256 `d41f43d846b480f5c79327f6c2bd190c234e29c67d6119c7ebc35ec5ff86d222`. A fresh public read at 06:06 UTC on 29 October confirmed the live predecessor and record still match those tested. The guarded uploader's dry run also confirmed unchanged live bytes and edit access, without uploading. This is financial preservation evidence, not a new certification of every contract or an assertion that every ancillary item is complete. Unticked work and unresolved physical units retain their existing safeguards. Detailed records and screenshots remain private.

Build and focused checks, with private `BASE`, `STATE`, `OUT` and exact candidate environment values:

```bash
bash toolchain/build.sh v12.59 v12.59_completion_achievement_DRAFT/patch_v1259.py
BASE="$BASE" python3 -m unittest discover -s v12.59_completion_achievement_DRAFT/tests -p test_patch_v1259.py -v
node v12.59_completion_achievement_DRAFT/test_completion1259.cjs
BASE="$BASE" PAGE="$CANDIDATE" node v12.59_completion_achievement_DRAFT/tests/vms_achievement1259.cjs
flock /tmp/gc500-browser.lock node v12.59_completion_achievement_DRAFT/tests/completion_native.cjs
flock /tmp/gc500-browser.lock node v12.59_completion_achievement_DRAFT/tests/financial_preservation.cjs
```

Publication follows the owner and preview requirements in STATUS.md and PR #1. The publisher takes the exact source, rebuilds through the shared toolchain and uses the unchanged-base guard, then supplies the full public-byte read-back and live time. A source candidate is not a live release. After verified publication, the implementation owner rebases the affected queued drafts; v12.55's separate clarification and other queued scope gates remain in place.
