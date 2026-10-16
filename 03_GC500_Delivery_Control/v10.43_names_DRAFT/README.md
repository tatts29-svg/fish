# v10.43 — the person's name only, on screen, in CSV downloads and in copies — READY TO UPLOAD

Author: Andrew Fisher. Standing instruction: no mention on any tab that an entry was done through an assistant. Taken
over from the other agent's v10.43 claim (person-name display corrections) on Andrew's word, 16 Oct 2026.

- v10.30 already strips " via Codex" / " via Claude" from what the page shows. 52 record entries read
  "Andrew Fisher (via Claude)", in brackets, and slipped through: the WC41 and WC43 drawers showed "Marked by Andrew
  Fisher (via Claude)". The cleaner now takes both forms; other "via" wording (e.g. "via Coates truck") is untouched.
- CSV downloads (all go through `fin745Download`) and copy-to-clipboard don't pass the display escape; both now run the
  same cleaner.
- The record is not changed. Footer v10.42 → v10.43.

Built on live v10.42 (`f7c29263…`): 18,058,399 bytes, sha256 `1d3d14231bada5b2d7b658f12f450967df25ea8f0f414bcec613a9682a796478`, check_page PASS.
`tests/test_names1043.cjs` 8/8: the leak reproduces on v10.42 and is gone on v10.43; 14 tabs and all 187 drawers scanned
with no agent name; a CSV carries the person only. Sweeps desktop and phone: 18 tabs shown, 0 errors, 0 console.

The fencing audit half of the other agent's claim had no defined findings; it is not in this release.

    bash toolchain/build.sh v10.43 v10.43_names_DRAFT/patch_v1043.py
    python3 toolchain/upload_page.py build/GC500_v10.43/GC500_Delivery_Control_hosted.html
