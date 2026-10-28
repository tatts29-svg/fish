# Phone servicing table visibility — v12.54.1

Author: Andrew Fisher

READY TO UPLOAD. Focused checks and both final navigation sweeps pass. The exact v12.54 predecessor was independently verified live on 29 Oct 2026 at 08:59 AEST. The shared toolchain rebuilt this candidate byte for byte. Frozen implementation/tests source: `e32fe4954ffdbd191e1618bcea85cac19d050cf4`. Claude owns guarded publication; this version is not yet live.

On phones, the existing servicing table's wide sticky description column covers monetary text after a horizontal swipe. A narrow screen-only rule lets the first column scroll with the existing table at widths up to 640 px. The selector uses the servicing table's existing numeric Qty header and excludes the adjacent contract tables, whose identifiers stay pinned. All original styles, data and financial code remain byte-identical; only the appended rule and release footer change. Desktop and print retain their current behaviour.

Exact predecessor SHA256: `378d4b6632101ad6a1429f31b2241c567b3670ae0888f70b7df6f75109625a5c`.

Shared-build candidate SHA256: `20a81f75b8d47ed1c0d32cf3d5b5e5e79fe1bb5420b2fe459f9d4bbf94c771d5`, 16,106,179 bytes. Five exact-boundary tests and the shared 217-script checker pass. The shared live-base build equals the privately tested candidate; publication is pending.

Focused native checks pass on the same pinned record and time as v12.54: all 11 actual servicing monetary cells are fully visible and unobscured after scrolling at 390, 360 and 640 px, verified with complete text ranges and five hit points per amount. Both adjacent contract tables retain sticky identifiers. The servicing column stays sticky at 641 and 1440 px and in print at phone width. Complete financial models, source contract rows and operational documents remain exact after resizing, scrolling and navigation re-entry. Zero runtime errors, console errors or writes. Actual phone screenshots were inspected privately. Independent final desktop and phone sweeps each pass all 27 routes, seven deep links and Back navigation, with zero runtime errors, console errors or operational writes.

Rebuild through the shared toolchain from the verified exact v12.54:

```bash
GC500_V12541_BASE_SHA256=378d4b6632101ad6a1429f31b2241c567b3670ae0888f70b7df6f75109625a5c \
bash 03_GC500_Delivery_Control/toolchain/build.sh v12.54.1 \
  03_GC500_Delivery_Control/v12.54.1_phone_service_table_DRAFT/patch_v12541.py
```

Validation requires exact-boundary tests, native financial/record preservation, full monetary-text visibility with Range and hit testing on the actual phone table, screenshot inspection, and final desktop/phone navigation sweeps. Raw pages, records and financial screenshots stay private. Browser tests share `/tmp/gc500-browser.lock`. Claude retains publication through the guarded process after the final READY handover.

```bash
BASE=/private/exact54.html python -m unittest discover \
  -s 03_GC500_Delivery_Control/v12.54.1_phone_service_table_DRAFT/tests -p 'test_*.py' -v
flock /tmp/gc500-browser.lock env BASE=/private/exact54.html \
  CANDIDATE=/private/candidate54.1.html \
  CANDIDATE_SHA=20a81f75b8d47ed1c0d32cf3d5b5e5e79fe1bb5420b2fe459f9d4bbf94c771d5 \
  STATE=/private/pinned-state.json OUT=/private/focused54.1 \
  node 03_GC500_Delivery_Control/v12.54.1_phone_service_table_DRAFT/tests/phone_visibility.cjs
```

Set `CHROMIUM_PATH` when the environment uses its system browser. The focused test uses the shared read-only candidate harness from the archived v12.43 release and does not depend on the v12.54 draft folder name.

Current tested candidate SHA256: `20a81f75b8d47ed1c0d32cf3d5b5e5e79fe1bb5420b2fe459f9d4bbf94c771d5`,16,106,179 bytes. Five boundary checks,217-script parsing,33 complete money-text visibility checks across390/360/640px, adjacent contract-table preservation, desktop/print checks and full financial/source/document invariance pass. Independent code/byte review, both final shared navigation sweeps, verified-live54 and exact shared-rebuild gates pass. READY TO UPLOAD; not live.

## LIVE

LIVE 29 Oct 2026 09:18 AEST. Public bytes `20a81f75b8d47ed1c0d32cf3d5b5e5e79fe1bb5420b2fe459f9d4bbf94c771d5`, 16,106,179 bytes, byte for byte the tested candidate, rebuilt from frozen `e32fe495` on the verified live v12.54 `378d4b66…` with the command above. Byte diff against live v12.54: one 302-byte phone-only style rule before `</head>` and the footer `v12.54` → `v12.54.1`; nothing else. Money probe, base against candidate on the same record (11946): charge $1,007,518.57, cost $448,019.57, every P&L row and branch total identical. Guarded upload (live page unchanged since the build started); `cmp` of the public read-back against the candidate identical. Folder renamed `_LIVE`.
