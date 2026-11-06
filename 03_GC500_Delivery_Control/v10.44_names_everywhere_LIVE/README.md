# v10.44 — the person's name only, everywhere (page-wide safety net) — LIVE 16 Oct 2026 15:59 AEST

Author: Andrew Fisher. Standing instruction: no mention on any tab that an entry was done through an assistant. Picks
up the person-name half of the other agent's unfinished v10.43 fencing review (`v10.43_fencing_review_DRAFT/`), which
found who-did-it fields drawn by routines other than `esc()` (night-service run sheet and print, transport evidence,
area sign-off). A full search found about a dozen such routines, many inside sections that start closed.

Instead of patching each call, one observer cleans any text or title that lands on the page containing "via Codex" or
"via Claude", the moment it lands. Nothing else is touched. `recorderDisplay772` now uses the full cleaner. The record
is not changed. Footer v10.43 → v10.44.

Built on live v10.43 (`1d3d1423…`): 18,060,347 bytes, sha256 `62b96d62ea38758f31b0f3876d1d0a00886dbf504ed26e7ed79ec1db863f9399`, check_page PASS.
`tests/test_names1044.cjs` 5/5. On v10.43, WC20's drawer still showed "Recorded by Andrew Fisher via Codex" in a closed
section. On v10.44, every tab, three print/route views and all 187 drawers were scanned with closed sections opened and
titles included: no agent name anywhere. No tab slower (heaviest: timeline 2,251 → 2,175 ms). Sweeps desktop and phone:
18 tabs shown, 0 errors, 0 console.

    bash toolchain/build.sh v10.44 v10.44_names_everywhere_DRAFT/patch_v1044.py
    python3 toolchain/upload_page.py build/GC500_v10.44/GC500_Delivery_Control_hosted.html
