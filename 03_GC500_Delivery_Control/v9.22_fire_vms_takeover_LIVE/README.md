# Fire extinguishers, VMS boards and compact Truck flow

Author: Andrew Fisher

State: VERIFIED LIVE — 9 Oct 2026 02:57 AEST. The guarded publisher verified that the public view serves the candidate byte for byte. Implementation and publication ownership are recorded on the shared status board.

Andrew approved the extinguisher and VMS changes on 9 Oct and then directed that Truck flow sit behind a closed dropdown. This combines those three completed source parts on the v9.21 pins page.

- Fire extinguishers are quantities without asset numbers, saved through the existing accessories record. They use the approved one-off card rate where available and say “rate to confirm” elsewhere. A quantity replaces the building tick, so it cannot be charged twice. Taken-off quantities remain visible with their history.
- The Equipment VMS register keeps each board's company, fleet number, registration and delivery together. VMS09 is asset 1211404, moved from T0001 to T0103; VMS10 is on T0103 with the company, fleet number and registration Andrew supplied. Later shared-record entries take precedence. The old contract line remains a branch check, not an invented off-hire.
- Truck flow starts closed on each day. Opening retains the native card and controls; load flags open it when needed. Printing includes its contents.

Sources copied from frozen upstream `822b06a8`: v9.14 fire extinguishers, v9.13 VMS register and v9.00 part F. The composition wrapper requires v9.21, advances the footer and refuses repeat application. Operational records, DATA, master geometry, media and machine assets are unchanged by the build.

Build from the live v9.21 page:

```sh
toolchain/build.sh v9.22 v9.22_fire_vms_takeover_LIVE/patch_v922.py
```

The VMS and fire tests exercise read-only and simulated editing, capture and abort every proposed save, and compare a fresh shared record afterwards. `money922.cjs` includes the upstream scenario audit, with corrected expectations for derived percentages, balanced reconciliation parts and the separate rate-to-confirm quantity. No currency amounts are written into its results. The fold comparison uses the combined candidate with only the fold removed as its baseline, so VMS presentation changes are not mistaken for fold changes.

The final candidate passed fire 61/61 on desktop and phone; VMS 68/68 on both; Truck flow 27/27 desktop and 29/29 dark phone; and all 27 finance scenarios. Both full sweeps exercised 21 routes, seven deep links and Back with zero page or console errors. The existing six redirects match v9.21. Fourteen source identity checks passed, all 29 inline scripts parse, and phone fire/VMS/fold screenshots were reviewed. Record version stayed 4599 throughout the read-only checks.

The fold test now waits for the existing same-origin explorer's one-time hint flag to finish initializing before taking its storage snapshot. Its full local/session-storage and record comparisons then pass; no storage key is ignored. Tests use the shared GET-only harness with software WebGL and answer vendor telemetry locally. Private rendered evidence stays outside Git.

- Frozen implementation checkpoint: `2861f996` (no page changes after its source).
- Base v9.21 SHA-256: `7138c402c8827056524d6b1ebbd2c50cd7c7e8a549b0d1dbea91184ec6cc8774`.
- Candidate SHA-256: `7e3fe251373c97582119f41002cbda0cfacb71bd23ec5fe1fdf2c3dde3d46abc` — 11,696,428 bytes.
- Validation: `evidence/validation.json`.

The release changes only the HTML page. Media and the paired machine file remain the live v9.21 assets. Publication used the normal live-base guard and verified all served bytes.
