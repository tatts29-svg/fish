# v12.64 — the page matched to Baseplan (11) on the lines it moved

Author: Andrew Fisher. 30 Oct 2026. **READY TO UPLOAD** on Andrew's word, chained on v12.63: built on the live v12.61 (`ddd1bd7a…`,
16,143,727 bytes) as `patch_v1263.py` then `patch_v1264.py`; candidate `afbbc0d1448f3ecf83db854a2ec44634d3704884a9b0e95e24c4ee6407c966c0`,
16,144,243 bytes. One upload carries both releases.

Andrew, 30 Oct 2026 15:1x AEST, on the Baseplan (11) review (`review_30Oct2026_baseplan11/README.md`): "Can we match baseplan data on
those". His rule of 29 Oct stands: Baseplan is what invoices on the 31st, so the page follows Baseplan's line figures where they
are not disputed. The record of what left when is untouched: the departures stay as recorded; only the charge on these lines
follows Baseplan.

## What moves: nineteen lines, net +409.70 on the charge to the V8s

The page's pin table (BP12429, re-struck against Baseplan (10) by v12.55) is re-struck against Baseplan (11) of 30 Oct 14:2x on
the lines whose amount moved. Every other pin is unchanged; WB02 (9972648/3) stays unpinned at the site record's 1,364.08, as
in v12.55 — Baseplan's 280.84 is the branch's to fix.

| Line | What | Page today (Baseplan 10) | Baseplan (11) | Move |
|---|---|---|---|---|
| 9961265/3 | VMS01 REED, construction board | 2,734.11 | 3,538.77 | +804.66 |
| 9961265/4 | VMS02 MARS | 3,645.48 | 3,431.54 | −213.94 |
| 9961265/5 | VMS03 | 2,787.72 | 3,002.60 | +214.88 |
| 9961265/6 | VMS04 | 3,645.48 | 3,538.77 | −106.71 |
| 9961265/7 | VMS06 | 3,645.48 | 3,538.77 | −106.71 |
| 9961265/8 | VMS07 | 2,734.11 | 3,109.83 | +375.72 |
| 9961265/9 | VMS08 colour | 2,787.72 | 3,646.01 | +858.29 |
| 9961265/25 | VMS19 487T Premiair | 428.88 | 0.00 | −428.88 |
| 9961265/26 | VMS20 475T Premiair | 428.88 | 0.00 | −428.88 |
| 9961265/29 | VMS22 445T Premiair | 268.05 | 428.88 | +160.83 |
| 9961265/30 | VMS23 453T Premiair | 268.05 | 321.66 | +53.61 |
| 9961265/32, 35, 37, 39 | VMS13, 15, 16, 17 post-event, to 13 Nov | 428.94 each | 428.88 each | −0.24 |
| 9961265/43 | VMS05a | 375.27 | 0.00 | −375.27 |
| 9972648/1 | WB01, 12 barriers | 637.20 (site rule) | 608.88 | −28.32 |
| 9972648/2 | WB03, 30 barriers, Baseplan's term 19 Oct 21:00 | 1,451.40 (site rule, left 29 Oct) | 1,097.40 | −354.00 |
| 9972648/5 | WB04 | 184.08 | 168.74 | −15.34 |
| | | | **net** | **+409.70** |

VMS 9961265 +807.36; barriers 9972648 −397.66. The two Premiair boards at nought and WB03's 19 Oct term are Baseplan's figures,
matched on Andrew's word; the questions to the branch about them stay in the (11) review.

## How

`baseplan11_pins.py` reads the page's pin literal, checks each of the nineteen lines carries the Baseplan (10) figure it should
(or no pin, for WB01 and WB03), writes the (11) figure, and changes the pin's basis wording from "Baseplan (10) … 29 Oct 2026"
to "Baseplan (11) … 30 Oct 2026". `patch_v1264.py` requires v12.63's footer and merge change to be present (it chains), keeps
every style byte-identical, and moves the footer v12.63 → v12.64. No script, card or rule changes.

## Checks (candidate `afbbc0d1…`)

(filled in from `tests/test_v1264.cjs`, desktop and phone, and the sweeps — see `evidence/`.)

## To upload (on Andrew's word)

```
cd 03_GC500_Delivery_Control
bash toolchain/build.sh v12.64 v12.63_removals_stick_DRAFT/patch_v1263.py v12.64_baseplan11_pins_DRAFT/patch_v1264.py
python3 toolchain/upload_page.py build/GC500_v12.64/GC500_Delivery_Control_hosted.html
```
Then the parked spec95 (WC41's duplicate out with its tombstone; T0023's withdrawn entry tombstoned).
