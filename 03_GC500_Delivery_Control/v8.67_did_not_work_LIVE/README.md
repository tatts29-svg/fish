# v8.67: Did not work — VERIFIED LIVE

Author: Andrew Fisher.

Andrew (Claude chat, 6 Oct 2026): "in the place where we do hours can we have a remove button if someone or people did not work ... so i can fix please."

## What it does

On the running sheet (Costs & P&L → Workforce costs), one more column at the end of the day's table, for the edit link only:

- **Did not work** on any row that has a shift for that day. One tap, one confirm, and the shift comes off the record for that day. It leaves the day's totals, the whole-job roster table, the Finance review and the P&L labour forecast together, because they all read the same line.
- **Put back** on a row whose shift was taken off. One tap restores it, to the cent.

The removal is a tombstone on the record (`S.deleted`), the way every other removal on this job travels, so it reaches every copy and carries the name of whoever did it. The shift line itself is not destroyed, which is what makes Put back possible. Planned roster lines (the event roster with no hours yet) can be taken off the same way. View-only links see nothing new. No rate, rule or model changes.

## Checks (candidate `5a2dd218…`)

- `tests/test_didnotwork867.cjs`: desktop 11/11, phone 11/11 (`evidence/test867_*.log`). It picks a real worked shift on the record, checks the day table has the new column with every row the same width as the header, that a view-only link sees no button, then in memory (never saved): the row offers Did not work; taking the shift off removes it from the day, the paid hours and the labour line count; the row then offers Put back and a view-only link sees nothing; putting it back restores the day, paid hours and wages to the cent; on a view-only link neither write goes through; the P&L summary comes back whole; no page errors; no writes.
- `v8.66 tests/test_handover866.cjs`: 24/24. `v8.65 tests/test_costs865.cjs`: 33/33. `test_flicker863.cjs`: 24/24. Sweeps desktop/phone: 21 tabs, 15 shown, 0 errors, 0 console, 0 attempted writes (`evidence/sweep_*.json`). `check_page.py`: PASS. Secrets: 0.
- Codex's `test_finance862.cjs`: PASS 1366 and 390 (`evidence/finance862.log`). Two earlier runs failed only because Andrew was editing the record while they ran (3858 → 3949); the test compares two reads of the record inside one run.
- Screenshots: `evidence/runsheet867_desk.png`, `evidence/runsheet867_phone.png` (editor view previewed in the harness; nothing written).

## Candidate

- Base live v8.66 `6fa8a9f3b71191b3e268272aa80a052cdf1855188e86348642da9f03adef16e4`.
- Candidate `5a2dd2183464b488bc1c04577d4831c78f2e898846e0af9c5464953318bbd6a5`, 11,054,519 bytes.
- Build: `toolchain/build.sh v8.67 v8.67_did_not_work_DRAFT/patch_v867.py`. Upload: `toolchain/upload_page.py`.

## Codex publication

Published6 Oct2026 at09:44 AEST. SourceClaude d6366617, integration83dcd355, READY39dc7f73. Exact public SHA-256 `5a2dd2183464b488bc1c04577d4831c78f2e898846e0af9c5464953318bbd6a5`, 11,054,519 bytes, on v8.66 `6fa8a9f3`. Independent shift11/11, Finance24/24 and flicker24/24 laptop/phone; both21-route/seven-link/Back sweeps; finance862 model/record preservation1366/390 pass. Guarded upload verifies exact public bytes. Actual-public shift11/11 laptop and11/11 phone pass, zero local substitutions, errors or attempted writes. Machine manifest exactly unchanged v8.64 `b469a99c`; server health OKv5.87, record4000. No operational shift removed or backend deployed. Claude independent final readback pending. Candidate read-only captures inspected. Use this LIVE folder path for future patch references.

## Independent public readback (Claude, 6 Oct 2026 ~09:50 AEST, GET only)

- Public page `5a2dd2183464b488bc1c04577d4831c78f2e898846e0af9c5464953318bbd6a5`, 11,054,519 bytes, footer `· v8.67`, byte-identical to the candidate.
- `tests/test_didnotwork867.cjs` against the actual public bytes with a fresh fetch cache: desktop 11/11, phone 11/11 (`evidence/public_readback_*.log`). Machine unchanged, v8.64 `b469a99c`. Both agents have now independently verified this release.
- The `_DRAFT` build's evidence is kept in `evidence/`; the `_DRAFT` folder is retired.
