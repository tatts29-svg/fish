# Fire extinguishers, VMS boards and compact Truck flow

Author: Andrew Fisher

State: DRAFT; final combined checks running. Nothing is published by this folder.

Andrew approved the extinguisher and VMS changes on 9 Oct and then directed that Truck flow sit behind a closed dropdown. This combines those three completed source parts on the v9.21 pins page.

- Fire extinguishers are quantities without asset numbers, saved through the existing accessories record. They use the approved one-off card rate where available and say “rate to confirm” elsewhere. A quantity replaces the building tick, so it cannot be charged twice. Taken-off quantities remain visible with their history.
- The Equipment VMS register keeps each board's company, fleet number, registration and delivery together. VMS09 is asset 1211404, moved from T0001 to T0103; VMS10 is on T0103 with the company, fleet number and registration Andrew supplied. Later shared-record entries take precedence. The old contract line remains a branch check, not an invented off-hire.
- Truck flow starts closed on each day. Opening retains the native card and controls; load flags open it when needed. Printing includes its contents.

Sources copied from frozen upstream `822b06a8`: v9.14 fire extinguishers, v9.13 VMS register and v9.00 part F. The composition wrapper requires v9.21, advances the footer and refuses repeat application. Operational records, DATA, master geometry, media and machine assets are unchanged by the build.

Build once v9.21 is live:

```sh
toolchain/build.sh v9.22 v9.22_fire_vms_takeover_DRAFT/patch_v922.py
```

The VMS and fire tests exercise read-only and simulated editing, capture and abort every proposed save, and compare a fresh shared record afterwards. `money922.cjs` includes the upstream scenario audit, with corrected expectations for derived percentages, balanced reconciliation parts and the separate rate-to-confirm quantity. No currency amounts are written into its results. The fold comparison uses the combined candidate with only the fold removed as its baseline, so VMS presentation changes are not mistaken for fold changes.

Required before READY: both feature suites on phone/desktop, fold controls and phone layout, finance identity/scenarios, both navigation sweeps, phone screenshot review and final source/base/candidate hashes. Private rendered evidence stays outside Git.
