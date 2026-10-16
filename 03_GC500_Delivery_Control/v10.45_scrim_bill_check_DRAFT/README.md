# v10.45 — Fencing tab lists where Advanced's bill and the signed docket disagree on scrim — READY TO UPLOAD

Author: Andrew Fisher. From the fencing audit of 16 Oct 2026 (`audit_16Oct2026_fencing/`).

Seven dockets where Advanced's scrim metres differ from the signed docket now appear in "What needs reconciling" (4 → 11
items), each with what it means both ways: Advanced's bill over clean fence, and the V8s charge if braced fence is
charged as scrim. Worked out live from the record. Gate-panel-only differences are left out. No charge, cost or record
changes. Footer v10.44 → v10.45.

Built on live v10.44 (`62b96d62…`): 18,063,523 bytes, sha256 `8c7f3253f91b895f2ebabc329080602faa66efc8af046d39ca73e327c31c84d0`, check_page PASS. `tests/test_scrim1045.cjs`
9/9 (existing 4 items unchanged, exactly the 7 added, 36577 left out, totals unchanged at $275,347.99 / $168,642.20).
Sweeps desktop and phone: 18 tabs shown, 0 errors, 0 console.

    bash toolchain/build.sh v10.45 v10.45_scrim_bill_check_DRAFT/patch_v1045.py
    python3 toolchain/upload_page.py build/GC500_v10.45/GC500_Delivery_Control_hosted.html
