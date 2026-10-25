# v12.26 — "Not in it yet": repeated provisional notes fold into one line

Author: Andrew Fisher. 26 Oct 2026. **READY TO UPLOAD on live v12.25.**

- **Why:** Andrew, 25 Oct: "i want this the amount of info shortened no one is going to read all this we just want Figures".
  - v12.24 and v12.25 moved the 13 water-barrier notes into the Provisional lines ("WBxx · TL2: Contract 9994996 line 1 includes the combined installation / removal charge in Revenue …").
  - v12.22's short list folded only the plain lines, so "Not in it yet" showed 13 barrier lines again.
- **What:** `figures1220_src.js` (v12.22's script) now folds a provisional note that repeats for several references into one line: "Provisional: 13 × TL2 (WB01–WB07, WB13–WB18) — …".
- **Presentation only:** the full list under "Show the workings" is unchanged; no figure, wording or record change.
- **Patch:** `patch_v1226.py` replaces v12.22's block on the page whole, only if it's exactly the block v12.22 published (SHA-256 `69e17ac4…`), and moves the footer from v12.25 to v12.26.

Build: `toolchain/build.sh v12.26 v12.26_provisional_fold_DRAFT/patch_v1226.py`, on live v12.25 `25a68311ca34ba367d6d4f6b9c44e4867d65dbe4a66a9d1196c424663a04e221` → `82589211d0b07c43b71f5859e1fbb6fe43dabf338e2509e750ea815cef5fa26e`, 15,440,561 bytes, `check_page` PASS.

## Checks
- `tests/test_v1226.cjs`, side by side with live v12.25: 13/13 on desktop and phone (`evidence/test_*.txt`).
  - Every money figure unchanged: revenue $995,341.22, direct costs $417,803.57, revenue to job end $1,021,863.62, direct costs to job end $429,510.83, fencing $364,816.40 / $244,368.20.
  - "Not in it yet" at 10 lines (from 23), with one "Provisional: 13 × TL2 (WB01–WB07, WB13–WB18) — Contract 9994996 line 1 includes the combined installation / removal charge in Revenue"; figures kept, no character cut.
  - The full list is unchanged; 0 page errors and 0 writes.
  - The visible-text check now compares with a base that already folds (v12.22): P&L card 67% of the live one, rehire and transport unchanged.
- Both full sweeps: 27 tabs and 7 deep links, 0 errors, 0 console messages, 0 writes (`evidence/sweeps.json`).
- Phone screenshot: `evidence/phone_not_in_it_yet.png`, name blurred.
