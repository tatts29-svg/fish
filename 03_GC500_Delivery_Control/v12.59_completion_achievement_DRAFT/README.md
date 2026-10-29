# Completion remains achieved after departure

Author: Andrew Fisher.

DRAFT — implementation and checks in progress. This folder is not yet ready for upload.

Build progress must retain completion recorded by the selected day after equipment leaves site. A movement-generated reset is distinguished from an intentional completion correction. Actual on-site quantities, departures, uncertainty and dated partial-completion rules remain separate.

This is a bounded correction to the existing progress readers and wording. It preserves the current layout, operational documents, rental and financial calculations. It does not infer completion from arrival, off-hire or a booked return.

The patch requires the exact verified v12.54.1 public page, SHA-256 `20a81f75b8d47ed1c0d32cf3d5b5e5e79fe1bb5420b2fe459f9d4bbf94c771d5`. Build with the shared toolchain. Before READY, complete historical/current native acceptance, explicit-correction and partial-quantity regressions, financial and physical-count preservation, desktop/phone screenshots and both shared sweeps. Detailed records and screenshots remain private.

Publication follows the owner and preview requirements in STATUS.md and PR #1. A source candidate is not a live release.
