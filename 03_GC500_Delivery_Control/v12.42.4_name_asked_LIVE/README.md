# v12.42.4: a new person is asked for their name — LIVE

Author: Andrew Fisher · 27 Oct 2026 · a point release on live v12.42.3 (Demob saves quicker, `81cacbcf…`).
**LIVE 27 Oct 2026 14:06 AEST**, sha256 `20c0978543b3bc16c6663a68a3bae3cc699ca7498219bda3f390e6a7094174e9`, 15,819,642 bytes. Pages opened before 14:06 keep the old behaviour until refreshed.

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
2. **`flash()`** (core): the message stays on the page exactly as before, so "booked … recorded by" still shows once the sheet closes. While a sheet or form sits above the page (an open modal dialog, or the pick-up form while it shows something), the same words are also shown at the top of it. That copy lets taps through to the sheet's buttons (Save stays tappable on a phone), and it goes when the sheet closes or after the same 3.6 s.
3. The footer reads v12.42.4.

Every `whoAmI()` caller in the page (148) was checked: each runs from a press or a change in a field, none while drawing, on a timer or on the sync.

## Checks

The candidate is built by `toolchain/build.sh v12.42.4 v12.42.4_name_asked_DRAFT/patch_v12424.py` on the live v12.42.3 (`81cacbcf…`, still live at 13:50): sha256 `20c0978543b3bc16c6663a68a3bae3cc699ca7498219bda3f390e6a7094174e9`, 15,819,642 bytes, `check_page.py` PASS (214 inline scripts, no keys). The patch refuses any other base and refuses to run twice.

| Check | Desktop | Phone |
|---|---|---|
| `tests/test_v12424.cjs` (new) | 13/13 | 13/13 |
| `tests/test_v12424_regress.cjs` (the v12.42.3 tests, footer v12.42.4) | 90/93 | 90/93 |
| The v12.42.3 tests on the live v12.42.3 page, for comparison | 90/93 | — |
| Shared sweep (`toolchain/harness/sweep.js`), 27 tabs | no errors, 0 blocked | no errors, 0 blocked |
| `tests/test_v12424.cjs` on the live v12.42.3 page (shows the fault) | 0/4: no name asked, nothing booked | — |

The new test, in edit mode with the sync held (writes captured, nothing sent):

- With no name, Book pick-up asks once, in the browser's own box, and keeps the answer in Tools · Recording as. Save booking then books in that name, the sheet closes, nothing more is asked, and "booked … recorded by" shows on the page.
- A name already set asks nothing.
- Cancel the question: nothing is saved, the sheet stays open, the message shows at the top of the sheet in view, and Save booking can still be tapped through it. The copy goes once the sheet closes.
- One press asks once. A "name" of "0" is asked again on a Ready tick.
- The pick-up form: cancel leaves the form open with nothing saved and the message at the top of the form; given a name, the pick-up is recorded in it.
- No page errors.

The three regression failures are the same three on the live v12.42.3 page (`evidence/sweeps_and_regression.json`). They test a day ahead with nothing booked, and tomorrow (28 Oct) now has real bookings. They come from the data, not from this change.

Review, 27 Oct 2026: the first way of showing the message (moving the page's message into the sheet) hid "booked … recorded by" once the sheet closed, and on a phone covered Save. It was replaced with the copy on top that lets taps through. A second finding: the copy was attaching to the Demob pick-up panel, which stays on the page empty after it closes. It now prefers an open modal dialog and only uses a panel that is showing something. Both are covered by the new test.

## Files

- `patch_v12424.py`: the two replacements and the footer, on the verified live v12.42.3 page.
- `tests/test_v12424.cjs`: `PAGE=<build> OUT=<dir> [MOB=1] node test_v12424.cjs`.
- `tests/test_v12424_regress.cjs`: `PAGE=<build> OUT=<dir> [MOB=1] [TIMING=0] node test_v12424_regress.cjs`.
- `evidence/`: each run's checks and summary.

## Live

- Uploaded 14:06 AEST after record run 23 (P65) was in; `upload_page.py` proved the view link serves the build byte for byte, and a fresh `fetch_live.sh` matched it with `cmp`.
- `tests/test_v12424.cjs` on the live page: desktop 13/13, phone 13/13, no page errors, 0 blocked (`evidence/live_*`).
- The record runner on the live page: a dry run of P67 (nothing sent) passed at 14:06, then record run 28 (WC53) was applied through the live v12.42.4 page at 14:12 and verified.
- The long regression (`tests/test_v12424_regress.cjs`) was started on the live page and stopped part way so a record run could have the browser; it is not counted here. Before upload it was 90/93 on desktop and phone, the same 3 failing on live v12.42.3.

