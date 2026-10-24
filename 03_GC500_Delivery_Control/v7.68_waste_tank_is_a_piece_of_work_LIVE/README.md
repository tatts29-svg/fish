# v7.68 — a waste tank is a piece of work (LIVE within v7.69)

Author: Andrew Fisher · 1 Oct 2026

## Released — 1 Oct 2026 17:02 AEST

The combined v7.68 + v7.69 release is live: **8,637,431 bytes**, SHA256
`ea4643899d33b677c0911b679b0b3e97e5610fe686ab383a39a239a34baf2c43`.
The uploader verified the public view byte for byte. Final review corrected the tank helper to preserve a single
numbered piece and the unnumbered remainder of a partly numbered order, retaining existing ticks.
Seven synthetic regression cases pass; fresh v7.69 desktop/phone checks pass 18/18 each, tank phone checks 16/16,
and both sweeps pass 21 tabs and seven deep links without page or console errors. Phone screenshots inspected.
The earlier build evidence below is historical; `evidence/release.json` records this released candidate.


Andrew, 1 Oct 15:30 AEST: "WC60 has 2 waste tanks, I told you this. This needs to have a level cost and install cost."

## What was wrong

The page charges labour per piece of equipment, against a reference's charge lines. WC60's schedule row named its two
toilet blocks only ("Toilet Block 6m ×2"), so the page had nothing to tick the tanks' install and levelling against —
even though the four numbers (1119489 with tank 1328980, 1087500 with tank 1328981) are on the record, Andrew's note
says which tank goes with which, and the contract carries a sewage holding tank line for each tank (9968955 lines 94
and 95). The card prices a waste tank's install ($145.74) and levelling ($104.10) per piece; WC05, WC20 and WC27 carry a
"Waste tank" line from the schedule and their tanks tick as pieces of work. WC60 did not. The toilet blocks' own
install, steps and levelling were ticked by Andrew in the drawer at 15:13–15:15 ($811.98); the tanks had no line.

## The rule (one place, the asset builder)

Where the contract carries sewage holding tank lines for a reference and the schedule gave it no waste-tank line, the
line is added from the contract: one **Waste tank** line, quantity = the contract's tank lines, named with the contract
and its line numbers ("from the contract — 9968955 lines 94, 95: 2 sewage holding tanks on this reference; the schedule
row named the toilet blocks only"). Hire on the line is included in the toilet-block price (the contract treatment of
1 Oct); the line is here for the labour. Nothing is ticked by the patch.

- `tank768LinesFor(key)` beside `ONHIRE_ROWS`: the contract's tank lines by reference — a tank line names its reference
  first in the description ("WC60 Sewage Holding Tank 6.0M x 2.4M"), or the build matched it by asset number (WC05's
  1328978). Built once.
- `buildAllAssets()`: the item type and the charge line appended when the reference has none (`_tank768` on the line).

On the live record this touches **WC60 only** (WC05, WC20 and WC27 already carry the line from the schedule). The two
tank numbers become the two pieces (`labourUnits` → 1328980, 1328981; the toilet blocks keep 1087500, 1119489), so a
tick is "this tank installed", "this tank levelled". WC60 also stops being listed as "carrying more numbers than it
ordered" on Questions (four numbers against two ordered; now four against four).

## What it charges, once ticked

Per tank: install $145.74 + levelling $104.10 = $249.84 · two tanks **$499.68** of Labour Install revenue, charged to the
V8s, on the Forecast P&L's "Labour — Install" line. Rehearsed on the build with every write blocked: four ticks, keys
`WC60/u1328980|Toilets & amenities|Waste tank|install` … `levelling`, the tank line reads $499.68, the P&L's labour
rises by exactly that. Until the ticks are on, no figure moves (revenue, labour, costs, accruals, journals all equal the
live page on the same record); the Pricing tab's card comparison rises by the two tanks' card hire (2 × $750.56), as
WC20's and WC27's schedule lines already do.

## The ticks — a record write, after the upload

`../record_01Oct2026_wc60_waste_tanks/apply_through_the_page.js` (Codex holds the key; or Andrew in the drawer: WC60 →
Waste tank → Install and Levelling on each tank). It also pins which numbers are the tanks and which the toilet blocks
(`setSupplied`, in Andrew's words), so the pieces never depend on the order the numbers sit in. **Run only on v7.68 or
later** — on v7.67 there is no line to tick, and the script stops.

## Files

- `patch_v768.py` — the two insertions; `python3 patch_v768.py <page.html>`.
- `evidence/practice_tests.js` — 16 checks: the line from the contract; install and levelling priced per tank; the two
  tanks are the pieces; the toilet blocks' six ticks still read; nothing ticked on the tanks yet; WC05/WC20/WC27
  untouched; only WC60 gained a line; WC60 no longer over-numbered; P&L unmoved against the live page read at the same
  moment; card comparison rises by the tanks only; the rehearsed ticks charge $499.68; no broken values; no overflow;
  no errors; every write blocked. Desktop and phone (`practice_results*.json`, `desktop_run.log`, `phone_run.log`).

## Build

```
bash toolchain/build.sh v7.68 v7.68_waste_tank_is_a_piece_of_work_LIVE/patch_v768.py
python3 toolchain/upload_page.py build/GC500_v7.68/GC500_Delivery_Control_hosted.html
```
On the live v7.67 (8,626,587 bytes): **8,629,390 bytes**, check_page PASS, key grep clean. Results of the test chain
(v7.68 desktop and phone; v7.63–v7.67 suites; Codex's six synthetic checks; sweeps) are recorded below when they finish.

## Results — the chain on `build/GC500_v7.68` (8,629,390 bytes), 1 Oct 2026 16:00–16:35 AEST

| Check | Desktop | Phone |
|---|---|---|
| v7.68 practice tests (`evidence/practice_results*.json`) | **16/16** | **16/16** |
| v7.67 priced by us (`evidence/regress/v767*`) | 12/12 | 12/12 |
| v7.66 rehire by branch (`regress/v766*`) | 18/18 | 18/18 |
| v7.64 costs to job end (`regress/v764*`) | 22/22 | 22/22 |
| v7.65 the Costs tab in one flow (`regress/v765`) | 22/22 | — |
| v7.63 accruals in Andrew's words (`regress/v763`) | 33/33 | — |
| Codex's six synthetic checks (`review_v764_v767/evidence/synthetic_regressions.js`, now reading the `_LIVE` folders) | 6/6 | — |
| Sweep, 21 tabs (`regress/sweep_desktop.json`, `regress/sweep_phone.json`) | 0 errors, 0 console | 0 errors, 0 console |

The P&L on the build equals the live page read on the same record at the same moment (revenue $558,017.15, labour
$19,170.02 over 177 ticks, direct costs known $235,371.76 at 16:05 — Andrew had ticked the WC60 toilet blocks and
more since 15:00); the Pricing tab's card comparison is $1,501.12 higher, the two tanks' card hire, as WC20's and
WC27's lines already are. An adversarial code review of the patch (three lenses, each finding verified) is recorded
below when it reports.

## The adversarial review (1 Oct, three lenses, every finding verified) and what changed

Confirmed and fixed: the two tank pieces were whichever two numbers sorted highest, not the tanks — now the numbers the
delivery note names as a waste tank ("toilet block 1119489 with waste tank 1328980") go to the Waste tank line first
(`tank768NotedNumbers`, read in `lineNumbersOf`), and `labourUnits` for a tank line reads the tanks whether or not they
count as buildings, so a tank recorded later as a unit named "Waste tank" keeps its piece and its ticks. Noted, by
design or pre-existing: the Pricing comparison (never added to revenue) shows the tanks' card hire as WC20's and WC27's
schedule lines already do; the expected-labour forecast moves by the tanks' $499.68 before any tick (that is what
"expected on site" means); WC60's "what was supplied" row reads "not recorded" until the record script pins the numbers.

## Results on the combined build (`build/GC500_v7.69`, 8,637,181 bytes): 16/16 desktop and 16/16 phone; the whole chain
clean — see `../v7.69_what_we_are_charged_we_charge_on_LIVE/README.md`.
