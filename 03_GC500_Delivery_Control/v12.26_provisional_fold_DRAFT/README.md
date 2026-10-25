# v12.26 — "Not in it yet": repeated provisional notes fold into one line

Author: Andrew Fisher. 26 Oct 2026. **Built; tests running; not live yet.**

- **Why:** Andrew, 25 Oct: "i want this the amount of info shortened no one is going to read all this we just want Figures".
  - v12.24 and v12.25 moved the 13 water-barrier notes into the Provisional lines ("WBxx · TL2: Contract 9994996 line 1 includes the combined installation / removal charge in Revenue …").
  - v12.22's short list folded only the plain lines, so "Not in it yet" showed 13 barrier lines again.
- **What:** `figures1220_src.js` (v12.22's script) now folds a provisional note that repeats for several references into one line: "Provisional: 13 × TL2 (WB01–WB07, WB13–WB18) — …".
- **Presentation only:** the full list under "Show the workings" is unchanged; no figure, wording or record change.
- **Patch:** `patch_v1226.py` replaces v12.22's block on the page whole, only if it's exactly the block v12.22 published (SHA-256 `69e17ac4…`), and moves the footer from v12.25 to v12.26.

Build: `toolchain/build.sh v12.26 v12.26_provisional_fold_DRAFT/patch_v1226.py`, on live v12.25 `25a68311ca34ba367d6d4f6b9c44e4867d65dbe4a66a9d1196c424663a04e221` → `82589211d0b07c43b71f5859e1fbb6fe43dabf338e2509e750ea815cef5fa26e`, 15,440,561 bytes, `check_page` PASS.
