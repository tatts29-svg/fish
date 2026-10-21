# Native VMS board completion

Author: Andrew Fisher

Status: DRAFT — focused checks, independent source review and the final native read-only rehearsal passed. Required desktop/phone sweeps and guarded publication remain pending. Publication belongs to the claimed release owner on STATUS.md.

A VMS board can be on site and installed without a delivery-reference association. Those boards previously had no way to record the final complete tick. This change adds a native Complete control and a dated completion history to the existing board record. The VMS register, plan, printed sheet, Today counts and existing shared-count consumers read the same physical-board completion projection.

Completion requires confirmed arrival and installation. Repeated ticks are idempotent. Undo, departure and removing installation append history and clear completion. Repeated positions for one physical board count once; per-board event order resolves actions recorded at the same time. Unassigned positions retain independent evidence. The change does not create delivery associations or change identity, location, quantities, rates or charge lines.

Build from the exact verified v11.00 live predecessor `d4a10a7fe07637fdfbb97f31ff2a07f48af4a632479acce8fd29aeb9cf9c97d7` using:

```sh
bash toolchain/build.sh v11.01 v11.01_vms_completion_DRAFT/patch_v1101.py
node v11.01_vms_completion_DRAFT/test_vms_completion1101.cjs
python3 v11.01_vms_completion_DRAFT/test_patch_v1101.py build/GC500_v11.01/base_live.html
```

The pure tests cover completion preconditions, history, undo, repeated actions, duplicate physical positions and the no-evidence/legacy paths. The patch test refuses wrong/repeated bases and checks all 150 script tags, styles and source asset/charge data. The toolchain parses all inline scripts and checks secrets. A private native GET-only rehearsal uses captured writes to prove the intended record diff, financial parity and shared UI counts before any authorised record save. Private operational evidence stays outside the repository.

The normal desktop and phone sweeps, phone inspection and guarded public read-back remain required before claiming this release live. Record changes are separate from page publication and require Andrew's direct instruction plus native save and fresh full read-back.

Final focused candidate: `eb8373a49087060adaf4fac26668c4ad02c87482dabfdcf14155ad3137322395` (20,925,976 bytes). Evidence: `evidence/focused_checks.json`. The native phone view was inspected; original installation time remains separate from completion time.
