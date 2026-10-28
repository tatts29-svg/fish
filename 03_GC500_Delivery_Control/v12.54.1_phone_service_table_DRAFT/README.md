# Phone servicing table visibility — v12.54.1

Author: Andrew Fisher

DRAFT CHECKED. Focused checks pass; independent navigation sweeps remain in progress. This repair is based on the exact reviewed v12.54 candidate. It is not ready or live.

On phones, the existing servicing table's wide sticky description column covers monetary text after a horizontal swipe. A narrow screen-only rule lets the first column scroll with the existing table at widths up to 640 px. The selector uses the servicing table's existing numeric Qty header and excludes the adjacent contract tables, whose identifiers stay pinned. All original styles, data and financial code remain byte-identical; only the appended rule and release footer change. Desktop and print retain their current behaviour.

Exact predecessor SHA256: `378d4b6632101ad6a1429f31b2241c567b3670ae0888f70b7df6f75109625a5c`.

Private candidate SHA256: `20a81f75b8d47ed1c0d32cf3d5b5e5e79fe1bb5420b2fe459f9d4bbf94c771d5`, 16,106,179 bytes. Five exact-boundary tests and the shared 217-script checker pass. No shared live-base build or publication is claimed.

Focused native checks pass on the same pinned record and time as v12.54: all 11 actual servicing monetary cells are fully visible and unobscured after scrolling at 390, 360 and 640 px, verified with complete text ranges and five hit points per amount. Both adjacent contract tables retain sticky identifiers. The servicing column stays sticky at 641 and 1440 px and in print at phone width. Complete financial models, source contract rows and operational documents remain exact after resizing, scrolling and navigation re-entry. Zero runtime errors, console errors or writes. Actual phone screenshots were inspected privately. Independent final desktop/phone navigation sweeps remain pending.

Build through the shared toolchain only after this exact v12.54 is verified live:

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

Current tested candidate SHA256: `20a81f75b8d47ed1c0d32cf3d5b5e5e79fe1bb5420b2fe459f9d4bbf94c771d5`,16,106,179 bytes. Five boundary checks,217-script parsing,33 complete money-text visibility checks across390/360/640px, adjacent contract-table preservation, desktop/print checks and full financial/source/document invariance pass. Independent code/byte review passes. Final shared navigation sweeps and the verified-live54/shared-rebuild gate remain; not READY.
