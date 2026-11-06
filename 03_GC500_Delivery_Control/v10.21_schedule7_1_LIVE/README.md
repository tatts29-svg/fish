> VERIFIED LIVE — 15 Oct 2026 02:34 AEST as part of reviewed combinedv10.21 page06d6e6b0 and machineeb8a01ff. See `../release_review1021/README.md` for final fixes, checks and source limitations. This declaration covers the app only; native P/O checks and pre-start PDF uploads were not applied. Author: Andrew Fisher.

# v10.21 — Schedule 7.1 and the 15 Oct iEDM programme issue, recorded (DRAFT)

Author: Andrew Fisher · 15 Oct 2026

**DRAFT — built and tested in the scratchpad from the saved live v10.18 page; not uploaded.** No edit token was used or
looked for. No operational record, rate, charge, quantity, position or date changes. STATUS.md is not updated by this
folder; the owner claims the version there before anything goes up.

Andrew, 15 Oct 2026 (this chat): "Please check and look. And update accordingly with anything that is relevant or
missing. Transport. Or references." (with `GC500_26_Schedule_7_1.xlsx`) and "This is also the excel that iEDM updates.
So access and ensure we have everything covered as well as references." (with
`P003-26003-01_Programme_-_Coates_Inf_V1_14.8.26_1.xlsx`). The review is in `../review_15Oct2026_schedule7_1/REPORT.md`.

## What the patch does

1. Appends two review blocks to the end of the `const DATA` line (every other byte of DATA stays as it is):
   - `DATA.schedule_review1021` — the 7.1 workbook (SHA-256 `98b6db43…`, saved 30 Sep 2026 15:59 AEST) is recorded as
     identical to Schedule 2 and as applying nothing: the page holds the later Schedule 7 and the site record.
   - `DATA.infrastructure_review1021` — the 15 Oct programme issue (SHA-256 `078dd52a…`, saved 15 Oct 2026 01:04 AEST),
     base sheet unchanged from the (2) issue the page holds, three changed cells: `CON WK 2!I101:I103` mark GN13, P69 and
     P45 "Complete" with no date.
2. Inserts `programme1021.js` after the v9.51 programme script. It wraps `infrastructure951Html` so the drawer of GN13,
   P69 and P45 gains a second closed fold, "Infrastructure workbook evidence · GN13 · 15 Oct 2026 issue", saying
   "Source status: Not stated → Complete (CON WK 2 sheet only; the Base information sheet and the other copies are
   unchanged)", "Source completion date: Not stated", "Source status only; current site records remain authoritative."
   Every other drawer renders exactly as before. The three references are already received on the site record; nothing
   is imported.
3. Footer ` · v10.18` → ` · v10.21`.

Nothing from Schedule 7.1 goes on the page: its content is the 30 Sep schedule.

## Source

| File | SHA-256 |
|---|---|
| `196709b7-GC500_26_Schedule_7_1.xlsx` (as uploaded; content = Schedule 2) | `98b6db43c734fc0d6ea4c02efccc1c5b2b1071f83b6a85b33df07843b9183fe4` |
| `6579a510-P003-26003-01_Programme_-_Coates_Inf_V1_14.8.26_1.xlsx` | `078dd52a9c0680fd5ace780332fd4d5b5a5d9f8fdf8e83a9e3f110f276abb96b` |
| Exact base: live v10.18 | `2d09fa44794596c52c54d41aed6f98d16fbb6f5ff1ccf608f9d275874559785d` (15,286,087 bytes, 119 scripts) |
| Candidate (scratchpad build) | `e22bf2aec03cd29517291112887bd84f6fd58ccf1efb75b25ffaa36c03f62b69` (15,290,353 bytes, 120 scripts) |

The workbooks are customer and branch documents and are not committed; they stay in the private upload area.

## Build and checks

```sh
# from the saved live page (fetch_live.sh was not used here):
cp live_now.html build/GC500_v10.21/base_live.html && cp build/GC500_v10.21/base_live.html build/GC500_v10.21/GC500_Delivery_Control_hosted.html
python3 v10.21_schedule7_1_DRAFT/patch_v1021.py build/GC500_v10.21/GC500_Delivery_Control_hosted.html
python3 toolchain/scrub_attributions.py build/GC500_v10.21/GC500_Delivery_Control_hosted.html
python3 toolchain/check_page.py build/GC500_v10.21/GC500_Delivery_Control_hosted.html --base build/GC500_v10.21/base_live.html
python3 v10.21_schedule7_1_DRAFT/tests/test_patch1021.py build/GC500_v10.21/base_live.html build/GC500_v10.21/GC500_Delivery_Control_hosted.html
node v10.21_schedule7_1_DRAFT/tests/test_programme1021.cjs
```

Or the standard way once the live page is confirmed still v10.18: `toolchain/build.sh v10.21 v10.21_schedule7_1_DRAFT/patch_v1021.py`.

| Check | Result |
|---|---|
| `check_page.py --base` | PASS: 120 inline scripts parse, no new keys, author line present (`tests/build_check.txt`) |
| `scrub_attributions.py` | no change to the candidate (15,265,408 → 15,265,408 characters) |
| `tests/test_patch1021.py` | 29/29: exact base, every anchor once, DATA parses, every earlier DATA key unchanged, nothing else in the page changed, script parses, footer, wrong base and repeat refused, built page carries each change (`tests/test_v1021_result.json`) |
| `tests/test_programme1021.cjs` | 10/10: GN13 / P69 / P45 gain the 15 Oct fold, other references unchanged, no date claimed, text escaped, no block → no change (`tests/test_programme1021_result.json`) |
| Desktop and phone sweeps, phone screenshot of a GN13 / P69 / P45 drawer | **not run here** — the toolchain's Chromium is not installed in this environment; whoever publishes runs both 22-tab sweeps and looks at the drawer on a phone first |

## Before this goes live

- Claim v10.21 on `STATUS.md`; confirm the live page is still `2d09fa44…` (the patch refuses any other base).
- Run both sweeps and the phone look at the drawer.
- Andrew's open questions in the REPORT (WC57 / WC59 quantities, WC67 total, six map positions, programme notes on
  drawers, 28 install dates, whether a newer schedule file exists) are not answered by this patch and do not block it.

## Combined build, 15 Oct 2026 about 02:00 AEST

`patch_v1021.py` also accepts the v10.20 candidate (`806800df…`, patch_v1019 then patch_v1020 on live v10.18), so one
page can carry all three releases:

```
toolchain/build.sh v10.21 v10.19_po_values_prestarts_signed_DRAFT/patch_v1019.py v10.20_gate6_compound_DRAFT/patch_v1020.py v10.21_schedule7_1_DRAFT/patch_v1021.py
```

Candidate `build/GC500_v10.21/GC500_Delivery_Control_hosted.html`, SHA256
`9db6edd2492e6f25d4144cc8762f8a223f1cca1a6ad01d25d9c648e17280456b`, 15,897,671 bytes, 120 inline scripts, `check_page.py`
PASS. `tests/test_patch1021.py` 29/29 against the live copy with this built page as the second argument;
`tests/test_programme1021.cjs` 10/10; desktop and phone sweeps on it (`tests/sweep_desktop1021.json`,
`tests/sweep_phone1021.json`): 22 tabs, no page errors, console clean apart from the pre-existing explorer tile 404s,
Back works; the v10.20 Gate 6 browser check 20/20 on it (`../v10.20_gate6_compound_DRAFT/tests/browser_check1020_result_on_v1021.json`).
