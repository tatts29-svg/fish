# v12.69 (built and tested as v12.67) — the P&L tab in one cut of the costs, and one difference so far

Author: Andrew Fisher. Built and tested as v12.67 on 31 Oct 2026 07:4x AEST on the live v12.66 (candidate `fb36c30e…`, 16,212,351
bytes); rebuilt unchanged as **v12.69** at 09:3x AEST on the live v12.68 (`fd7b26e9bb750d5ad6f630c00ecf1ee844324589a140c87ec67c743b4c630547`,
16,520,784 bytes, the picked-up artwork on every Demob card) after it went live at 09:1x. The script and style are byte for byte the
v12.67 candidate's and keep their ids (pl1267); `patch_v1269.py` pins the v12.68 base and turns the footer v12.68 → v12.69.
Candidate `038bd277625bf5e3be5a47edaf7c2deb2eab34ffdec098bf4b2270870d6cbabb`, 16,540,615 bytes. **LIVE 31 Oct 2026 10:25 AEST** on Andrew's word "Go live" (10:2x AEST): the guard held (live unchanged since the build), record 12600 at
upload; two cache-busted public reads serve the candidate byte for byte (`evidence/live_reads.txt`); the tests on the public page pass
desktop 41/41 and phone 41/41 (`evidence/live_test_desktop.txt`, `evidence/live_test_phone.txt`). Record runners now expect
`GC500_EXPECTED_PAGE_SHA=038bd277…`.

Andrew, 30 Oct 2026 20:2x AEST: "I also want the p&l reviewed again. I want it clean and clear. Easy to understand. And u
understand where costs are." The review and the mock-up are in `review_30Oct2026_pl_again/`. Andrew, 31 Oct 06:5x AEST: "Yes
proceed". Andrew, 06:4x: "The business is looking. This will potentially get a sponsorship if it looks good."

## What the P&L summary now shows

1. **Three tiles**: Charged to the V8s · What it costs us · Difference so far, the figure so far big, job end under each.
2. **What we charge the V8s** — revenue by stream in plain words, the ledger code in small grey print for Finance: Our gear on
   hire (1005) · Hired-in gear at our rates (1010) · Delivery and pick-up (1030 · 1031) · Toilet pump-outs (1032) · Install,
   levelling, steps, cleaning, demob and the people over the event (1047 · 1025) · Consumables (1020) · the event scope's
   accommodation and travel · contract services. So far · Job end.
3. **Where the costs are** — one table under the eight categories management expect, each line naming who we pay and what for,
   the branch beside the group, So far · Job end: Temporary fencing and crowd control (Advanced's gear on the dockets, 2126) ·
   External contractor costs (Advanced's crew, 2142; the hired-in people on the running sheet, 3210 · 2143) · Rehire costs
   (Event Portables' hire 2126, servicing 3325 and water 2144; the sub-hired boards and plant at the suppliers' estimates) ·
   Internal labour hours and overtime (Coates wages in hours only; the salary allowance at job end) · Any other event-related
   expenses (transport paid to the carriers by branch, 2120 · 2140; accommodation; meals and expenses). The three categories
   with nothing recorded are said in one line.
4. **By branch, job end** — five cards: KINP, STPS, NVAC, MEAD and the job (Charged · Costs · Difference), the ruling of
   29 Oct 2026 under them (the people's event labour revenue, their travel, accommodation and meals sit on KINP).
5. **Not in it yet** — the model's gaps and the Coates wages line, the owner in each line.
6. **Three closed folds**: Finance's lines (the v12.65 ledger tables unchanged — cost of sales, gross margin, contribution, and
   the by-branch table), Fencing, everything included (the card as it was), Workings (every other card, moved, not removed, every
   button still bound).

Every figure is the page's own models' and the face says whether it ties: revenue is the Forecast P&L's (`pl770Model`,
`moneySummary().charge.total`); what it costs us is the Finance handover's total to the cent (`fh866Model().costTotal.toDate`,
`plJob`); the difference so far is the Forecast P&L's (`moneySummary().difference`); job end is the P&L's difference to job end.

## The model change — one difference so far

The review's finding 2: two "difference so far" figures on the one tab, $556,106.09 (At a glance, the Forecast P&L: revenue
less direct costs known) and $524,203.15 on the face (after the labour hire), the gap being what we pay for the hired-in people
on the running sheet. From v12.67 the Forecast P&L's `difference` (and `difference0`, printed to the dollar) takes the labour hire
worked so far off, as its job-end figure always took the wages priced off:

- `labourHireSoFar1267(day)` reads the running sheet the way Costs to job end does (`fin745Rows`: the hired-in people's shifts to
  today at the rates on the record, a verified actual where one is recorded; not Coates wages and salary, which stay in hours;
  not the Advanced race crew, a fencing cost). Today: $31,902.94 known (53 shifts), $3,023.85 to come, $34,926.79 to job end —
  equal to Costs to job end's `wages.toDate` and the Finance handover's Labour hire stream to the cent (checked by the tests).
- `cost.known` is unchanged ($455,995.07): direct costs known stay the Finance figure they were. The figures before the change
  stay on the model as `difference_before1267` / `difference0_before1267`, and `cost.labour_hire1267` carries the labour hire.
- The cards that show the difference say so: At a glance's Difference tile ("revenue less direct costs known and labour hire"),
  the Forecast P&L's Difference card, the Forecast P&L by branch (a labour hire line above the difference, "after labour hire"
  on the KPI), "Are we making money?" (the streams total "before labour hire", a labour hire row, then "Difference so far, after
  labour hire"), the emailed summary (a LABOUR HIRE (so far) figure between direct costs and the difference) and the labour note.
- "Everything reconciles" still ties on all 17 checks (`recon888Model().ok`); the all-in statement's job-end difference is
  unchanged at $481,118.66.

The business calls from the review, taken as the proposal had them on Andrew's "Yes proceed": labour hire counts in the
difference so far; the big figure is so far on the record with job end under it; transport is its own line under Any other
event-related expenses. Any of the three is a one-line change in `pl1267_src.js`.

## Figures on the candidate (record 12600, as at Sat 31 Oct 2026)

| | So far | Job end |
|---|---:|---:|
| Charged to the V8s | 1,012,101.16 | 1,018,879.23 |
| What it costs us | 487,898.01 | 537,760.57 |
| Difference so far | 524,203.15 (51.8%) | 481,118.66 (47.2%) |

By branch, job end: KINP charged 477,997.22 · costs 227,499.61 · difference 250,497.61; STPS 469,180.02 · 299,709.95 ·
169,470.07; NVAC 44,272.04 · 9,313.78 · 34,958.26; MEAD 27,429.95 · 1,237.23 · 26,192.72; the job 1,018,879.23 · 537,760.57 ·
481,118.66. (Since the mock-up of 30 Oct the fencing-to-come forecast rolled with the date and a labour-hire row came off the
Friday, so job-end revenue is 1,018,879.23, not 1,027,917.09, and the differences moved with it.)

## Files

- `patch_v1269.py` — in place on the live v12.68 (BASE pinned): the v12.65 face (pl1262) out, the model and wording changes
  (every anchor asserted once), the pl1267 style and script in before `</body>`, footer v12.68 → v12.69.
- `pl1267_src.js`, `pl1267.css` — the face: `PL1267.ledger()` is the v12.65 model unchanged (Finance's lines), `PL1267.model()`
  the face, `faceHtml`, `ledgerHtml`, the folds and the renderCosts hook.
- `tests/test_v1269.cjs` — on the real Costs & P&L tab, reading the live record, writing nothing: 41 checks, desktop and phone
  (`evidence/test_*.txt`): the face ties to the models to the cent, the labour hire is Costs to job end's and the handover's
  figure, the tiles and tables foot, the branches add to the job, At a glance, the Forecast P&L by branch and "Are we making
  money?" show the one difference (rendered by their own functions where this layout does not draw them), the old figure appears
  nowhere, "Everything reconciles" ties, the folds hold every old card with its buttons, no sentence on the face, no sideways
  scroll, 0 errors, 0 writes.
- `tests/shoot_v1269.cjs` — the whole face in one picture, desktop and phone (`evidence/face_*.png`).
- `evidence/` — tests, pictures, both sweeps (27 tabs and the deep links, 0 errors, 0 console messages, 0 writes; the ten
  routes that draw no pane of their own are the same ten as every earlier sweep).

## Checks

- `toolchain/build.sh v12.69 v12.69_pl_one_cut_LIVE/patch_v1269.py`: 222 inline scripts, check_page PASS.
- `tests/test_v1269.cjs`: desktop 41/41, phone 41/41 on the v12.69 candidate (31 Oct 2026 09:3x AEST, record 12600); the same
  41/41 on the v12.67 candidate at 07:4x.
- `toolchain/harness/sweep.js`: desktop and phone, 27 tabs, 0 errors, 0 console, 0 writes.
