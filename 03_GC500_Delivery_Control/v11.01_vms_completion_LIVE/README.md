# Native VMS board completion

Author: Andrew Fisher

Status: VERIFIED LIVE — published 21 Oct 2026 12:36 AEST. Frozen source f2e918c043ddef2e0e35baede082aad0c2cf3956; exact public SHA-256 eb8373a49087060adaf4fac26668c4ad02c87482dabfdcf14155ad3137322395 (20,925,976 bytes). Guarded unchanged-base upload and separate fresh native read-only browser/full-record verification passed.

A VMS board can be on site and installed without a delivery-reference association. Those boards previously had no way to record the final complete tick. This change adds a native Complete control and a dated completion history to the existing board record. The VMS register, plan, printed sheet, Today counts and existing shared-count consumers read the same physical-board completion projection.

Completion requires confirmed arrival and installation. Repeated ticks are idempotent. Undo, departure and removing installation append history and clear completion. Repeated positions for one physical board count once; per-board event order resolves actions recorded at the same time. Unassigned positions retain independent evidence. The change does not create delivery associations or change identity, location, quantities, rates or charge lines.

Build from the exact verified v11.00 live predecessor `d4a10a7fe07637fdfbb97f31ff2a07f48af4a632479acce8fd29aeb9cf9c97d7` using:

```sh
bash toolchain/build.sh v11.01 v11.01_vms_completion_LIVE/patch_v1101.py
node v11.01_vms_completion_LIVE/test_vms_completion1101.cjs
python3 v11.01_vms_completion_LIVE/test_patch_v1101.py build/GC500_v11.01/base_live.html
```

The pure tests cover completion preconditions, history, undo, repeated actions, duplicate physical positions and the no-evidence/legacy paths. The patch test refuses wrong/repeated bases and checks all 150 script tags, styles and source asset/charge data. The toolchain parses all inline scripts and checks secrets. A private native GET-only rehearsal uses captured writes to prove the intended record diff, financial parity and shared UI counts before any authorised record save. Private operational evidence stays outside the repository.

Both final sweeps passed: 25 routes, seven links and Back per viewport, zero page or console errors. The native phone view was inspected. Guarded publication and exact public/native read-back passed. Record changes are separate from page publication and require Andrew's direct instruction plus native save and fresh full read-back.

Verified live candidate: `eb8373a49087060adaf4fac26668c4ad02c87482dabfdcf14155ad3137322395` (20,925,976 bytes). Evidence: `evidence/focused_checks.json`. The native phone view was inspected; original installation time remains separate from completion time.

The directly requested native completion saves were applied separately through the page, with a private backup and exact document allowlist. All acknowledgements and full read-back passed; a fresh GET-only browser independently confirmed the shared views with zero attempted writes or page errors. Existing identities, positions, arrival/installation history, charge lines and unrelated records were preserved. Private operational details and receipts remain outside the repository.
