# v12.42.4: a new person is asked for their name — DRAFT

Author: Andrew Fisher · 27 Oct 2026 · a point release on live v12.42.3 (Demob saves quicker, `81cacbcf…`).
**DRAFT: built and tested locally. Not uploaded.**

Andrew, 27 Oct 2026, on site: "Im getting reports others cant change dates or add times why", then "Works on my phone....and laptop. I sent a edit link and they cant add times".

## What was wrong

Found on the live page (v12.42.3), and the same since the Demob cards' booking sheet came in with v12.42 (26 Oct 20:19):

- A phone or laptop opening the edit link for the first time has no name in **Tools · Recording as**.
- Every save asks the page's `whoAmI()` for the name first. With none, it flashed "Put your name in "Recording as" first" and focused the Recording as box.
- On the Demob card's **Book pick-up** sheet (a modal dialog) that message was drawn **behind** the sheet, and the box sits inside the closed Tools menu. So the person picked a day and a time, pressed **Save booking**, and nothing happened that they could see. Nothing was saved, and the sheet stayed open.
- Andrew's own phone and laptop already carry his name, so it worked for him.
- Probe on the live page (desktop, no name, edit mode, sync held): sheet still open, nothing captured, the message's centre point lands on the sheet (`DIALOG.bkd1238`), the name box not focused.

The server rejected nothing: from 12:29 to 13:00 the only real-device save (a booking on P65 at 12:51) was accepted, under the name "0".

## What changed

1. **`whoAmI()`** (core): with no name, or a "name" with no letter in it (such as "0"), it asks for the name in the browser's own box, which shows above any open sheet or form. The answer is kept in Tools · Recording as and on this device as before, and the press carries on (the booking is saved, the pick-up recorded, the Ready tick made). Cancelled, it says where the box is ("Tools · Recording as") and returns no name, as before. One press never asks twice (a second ask within 1.5 s of the last does not ask). A name already set is used exactly as before, with no question.
2. **`flash()`** (core): while a sheet or form is open as a modal dialog, the message is shown inside it, where it can be seen; otherwise on the page as before.
3. The footer reads v12.42.4.

Every `whoAmI()` caller in the page (148) was checked: each runs from a press or a change in a field, none while drawing, on a timer or on the sync.

## Checks

The candidate is built by `toolchain/build.sh v12.42.4 v12.42.4_name_asked_DRAFT/patch_v12424.py` on the live v12.42.3 (`81cacbcf…`, fetched 13:27): sha256 `07c8d5f17efb3e2e9cafad652ed3a1162ef4937e38a492b7b4814f491cb93000`, 15,817,792 bytes, `check_page.py` PASS (214 inline scripts). The patch refuses any other base and refuses to run twice.

- `tests/test_v12424.cjs` (new): desktop 11/11 (results below as they finish).
- `tests/test_v12424_regress.cjs`: the v12.42.3 tests kept whole, only the footer they expect changed to v12.42.4.
- Both shared sweeps.

## Files

- `patch_v12424.py`: the two replacements and the footer, on the verified live v12.42.3 page.
- `tests/test_v12424.cjs`: `PAGE=<build> OUT=<dir> [MOB=1] node test_v12424.cjs`.
- `tests/test_v12424_regress.cjs`: `PAGE=<build> OUT=<dir> [MOB=1] [TIMING=0] node test_v12424_regress.cjs`.
- `evidence/`: each run's checks and summary.
