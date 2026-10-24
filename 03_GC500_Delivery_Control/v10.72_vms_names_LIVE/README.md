# v10.72: the eight Coates VMS boards carry their VMS numbers (LIVE 18 Oct 2026 20:27 AEST)

Author: Andrew Fisher · built and uploaded by Claude, Codex being offline (Andrew: "Codex is offline at the moment").

Andrew, 18 Oct: "vms1 1211354 rego EX0017 · vms2 asset no 1211370 REGO ES3206 · vms3 asset no 1271129 REGO 536UOO · vms4 asset
no 1191877 REGO EM6306 · vms6 asset no 1211359 REGO ER9247 · vms7 asset no1182999 REGO 410UFQ · vms8 asset no 1211383 REGO
ER9381 · Vms9 asset no 1211404 REGO TF15JR ... 1211404 was orginally vms5 but was taken off and added to vms9 ... THIS NEED TO
BE FIXED and updated".

- **What changed:** the VMS boards register shows VMS01–04 and VMS06–08 for those asset numbers. The asset number shows in
  the fleet column, and the rego beside it. VMS09's row says "first VMS05, taken off and made VMS09 (18 Oct)". Only the name
  changes: record keys stay the asset numbers, the VMS plan position (`b.vms`) is untouched, and no line, rate, tick or count
  changes. The regos went on the record earlier on 18 Oct; installed and complete ticks are in `record_18Oct2026_vms_regos/`.
- **Build:** `bash toolchain/build.sh v10.72 v10.72_vms_names_LIVE/patch_v1072.py` on live v10.71 `34a6b81b…`. The diff
  against live is four hunks; `check_page` PASS.
- **Live:** `ad9d7c0cdb4a63a55072712ea89c31fd88437bfd1b930b76a2feaa831894e587`, 18,507,417 bytes, byte for byte. Record 9735,
  unchanged by the upload.
- **Evidence (`evidence/`):** `test_v1072.cjs` passes on desktop and phone on the build, and on the live page. Both `sweep.js`
  runs (desktop and phone) cover 24 tabs and 7 links with 0 page/console errors.
