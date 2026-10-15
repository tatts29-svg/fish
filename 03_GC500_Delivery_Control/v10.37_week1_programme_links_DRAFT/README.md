# v10.37 — week 1's signed agreements matched to the fencing programme (READY, not live)

Author: Andrew Fisher. Andrew, 16 Oct 2026: "You should be able to match with schedule and maps, or close to, to
understand this more, like you have been doing. You have already matched dockets up with purchase orders and dockets
and maps."

The same reviewed-link catalogue v9.58 built for week 2 (a link needs the one exact current docket, its photographed
paper's hash, the verified programme file and one unchanged programme row; anything that moves withholds the link and
says so in the docket's details) now carries ten of the sixteen week-1 agreements against their CON WK1 rows, and the
CCB review catalogue (v8.47) carries 36611 confirmed as Event and 36613 pending.

| Paper | Where | Programme row(s), CON WK1 | Programme allowance | Signed actual |
|---|---|---|---|---|
| 36603 | Eastern residents & demarc, Cable St to Gate 8A | 16 (+17, 18, 19, 21, 22, 23, 25, 26) — the runs the paper's notes name | 553 m clean, 767 m demarc CCB, 6 ped gates | 537.5 m, 672.5 m, 4 |
| 36604 | Breaker St, T11 DL | 20 (the programme's flat-feet row) | 90 m flat-feet CCB | 93 m / 42 pieces |
| 36605 | Aloha Lane to Cronin St (Crest) | 36 | 150 m clean, 2 ped gates (14 Oct) | 95 m (13 Oct) |
| 36606 | Fishermans Walk | 32 | 10 m clean, 1 ped gate | 10 m |
| 36607 | Main Beach Tower | 34 | 38 m clean, 1 ped gate | 47.5 m |
| 36608 | Ferny Ave to Narrow Neck Court | 13 (+12, 11) | 89 m clean; 60 m demarc CCB (Ferny Ave East) | 117.5 m; 192.5 m "S05 to Ferny Ave", mostly beyond the programme's rows |
| 36609 | Esplanade south of Meriton, Porsche Lounge C2 | 40 (+41, 39) | 350 m clean | 420 m, not scrimmed |
| 36610 | G8 and surround | 35 (+29, 31, 33, 30) — the runs the paper's notes name | 229–277 m clean, 139 m demarc CCB, 1 ped gate | 367.5 m, 200 m, 2 |
| 36611 | Surfers Paradise Light Rail | 45 (+47, 46) | 170 m clean; **115 m CCB Event** | 165 m; 130 m CCB → **Event** |
| 36612 | Pacific Ave to Cable St | 44 | 300 m clean, 10 vehicle + 2 ped gates | 315 m, 3 ped gates |

**36611 corrected on the record first** (record 6643 → 6646, `record_16Oct2026_hire_agreements_36601_36616/fix_spec.json`):
the paper says only "CC Barrier 130 m" and this morning it was booked to demarcation "to confirm"; programme row 46,
"CCB - Hi Surf (West) to Ocean Ave", 15 Oct, is 115 m of CCB **Event** at the same place and day, so the 130 m moved to
the event line. Charged at the 2026 card $3,642.82 instead of $4,366.92 (event $7.51 a metre, not demarcation $13.08);
paid to Advanced unchanged at $2,352.00 ($5.40 either way).

**The notes on the record** of the sixteen agreements were changed first to say "Owner sign-off: Andrew, 16 Oct 2026" rather than the full name (record 6646 → 6693, `notes_fix_spec.json`): the page's attribution rule rewrites the full name in prose it shows, the catalogue's snapshots are prose the page shows, and a snapshot must read exactly as the record or the link withholds itself. Quantities unchanged.

**A week-2 duplicate, and a wrong turn put right:** the test showed 36592's link reading "missing or duplicated" on the live page too. The record holds 36592 (The Hill, Monster CZ, 9 Oct) twice: `F-AFV-0035·2904` at 137.5 m with 55 panels, and `F-AFV-0035·1e26` at 132.5 m with 53 panels. The backups settle which is which: at record 6128 (14 Oct, 22:34 UTC) there was one copy, the corrected one at 137.5 m / 55 panels (the 14 Oct inventory audit calls it "the previously corrected 36592"); by 6163 (23:05 UTC) the docket had been re-keyed to `·2904` and the old 9 Oct reading had come back beside it as `·1e26`. The page's v10.14 attribution expects the corrected signature (137.5 m, 55 panels, credited at the 135 m allowance), so the corrected copy is the one to keep. On 16 Oct the wrong copy was set aside first (6693 → 6699: `·2904` aside, `·1e26` kept, `aside_spec.json`). The swap back, through the page's own Put back and Set aside, is prepared and dry-run (11 planned writes) in `record_16Oct2026_hire_agreements_36601_36616/swap_spec.json` and waits on permission to write the record. Until it is applied the 36592 link reads "the signed docket has changed" and the test's eighth week-2 check fails. The paper itself reads 132.5 m and 55 panels; the 137.5 m correction predates this work and is kept as found.

**Not matched, and not guessed:** 36601 Commodore Park ticket entry, 36602 Cove – Optus, 36613 Porsche C2 (CCB; the
nearest rows are 38, demarcation at S18, and 63, event Pacific Plaza to The Triangle on 16 Oct — pending Andrew's
call), 36614 S08 BOH, 36615 Gate 5 Compound, 36616 Triangle C2. The programme has no CON WK1 row for any of them.

**Maps:** the Map tab's fencing trace is built from the CW2–CW6 installation-plan pages; the CW1 plan (`05_CW1_Fencing_
Installation_Plan.pdf`, in Documents) has not been traced, so week 1's links are to the programme rows, not to map
areas. Tracing CW1's pages is the next step if Andrew wants the map too.

| Change | Effect |
|---|---|
| `FENCE_PROGRAMME958`: ten rows and ten photo sources added (`also_rows` carries the other rows a paper's notes name; `week1_links_1037` names the six unmatched) | The Fencing tab's docket details show the task link, as the week-2 ones do; the weekly comparison is unchanged (no forecast attribution is claimed for week 1). |
| `DATA.fence_ccb_review847`: 36611 confirmed Event on row 46; 36613 pending | The CCB review on those two dockets reads from the programme. |
| Footer | v10.36 → v10.37 |

No rate changes. The one record change (36611) is in the record folder's report.

## Checks

| Check | Result |
|---|---|
| `check_page.py` | PASS |
| `tests/test_links1037.cjs` (every write aborted) | 8 of 9 pass on the live record (6699): the ten week-1 links, the six unmatched, 36611 confirmed Event at the event rate, 36613 pending, the detail render; the eighth week-2 check fails only because 36592's link waits on the swap above |
| `harness/sweep.js` desktop and phone | 24 tabs each, 18 shown, 0 page errors, 0 console errors, the 7 hash routes clean, 0 writes attempted |

Build `build/GC500_v10.37/` sha256 `902615e283b292fa…` (18,049,243 bytes) on the live v10.36 (`d72e7f61…`). Goes live
on Andrew's "Upload".

```sh
toolchain/build.sh v10.37 v10.37_week1_programme_links_DRAFT/patch_v1037.py
PAGE=build/GC500_v10.37/GC500_Delivery_Control_hosted.html node v10.37_week1_programme_links_DRAFT/tests/test_links1037.cjs
```
