# v8.68: Home branch (DRAFT, READY to upload)

Author: Andrew Fisher.

Andrew (Claude chat, 6 Oct 2026): "Every person belongs to a branch code ... KINP is the branch code, I've got more coming." He then gave the branch for every person on the roster.

## What it does

- **A person carries a home branch.** A branch field on the person line (cleaned to the code on save), shown in the Costs tab's person form.
- **Running sheet.** Under each person's employment group, the home branch: a box for the edit link (a list of the job's branch codes; any 2–6 letter code can be typed), the code itself for a view link. The whole-job roster table prints it beside the employment group.
- **Finance handover, under Costs by branch.** Two tables, numbers only:
  - *Wages by person — home branch*: person, home branch, paid hours, hours not priced, to date, to come, to job end. Adds to the wages priced to the cent.
  - *Wages — from the home branch to the branch the revenue is in*: each person's wages split by the labour per piece on each branch, so Finance can see what each home branch carries for which revenue branch. Branches whose people have no priced wages yet stay off this table.
  - Both in the CSV (sections 2b, 2c) and the Copy for Finance text.
- The Costs by branch table is unchanged (Finance's rule: cost to the branch the revenue is in).

## The home branches Andrew gave (6 Oct 2026) — for Codex to enter

Names as the record holds them; branch codes only (no contact details go into the repository or the record).

| Person on the record | Home branch | Andrew's words |
|---|---|---|
| Aaron Zelvis | KINP | Brisbane Portables (P) |
| Alfie Harris | NTSP | North Transport Hub |
| Andrew Fisher | NOIS | QLD Industrial Services |
| Daniel Gough | NOIS | labour hire |
| Jayden Paul | KINP | Brisbane Portables (P) |
| Kyle Gover | MEAD | labour hire, Brisbane Mechanical Specialist |
| Frank Devilles | BFIS | Brisbane Field Service (Andrew spells it De Villiers) |
| Ludwig Chee | NSNA | QLD SE Admin |
| Wayne Crimmin | STPS | Brisbane Traffic (T) |

Once v8.68 is live, each is one entry on the running sheet's home branch box (edit link), or `setOurPerson(name, {branch: code})`, recorded as "Andrew Fisher".

## Checks (candidate `8a447a82…`)

- `tests/test_homebranch868.cjs`: desktop 16/16, phone 16/16 (`evidence/test868_*.log`). With the nine branches set in memory (never saved): the person field takes and cleans a branch; wages by person add to the wages priced as the record stands and with branches set; each person carries the code given; lookup ignores case; setting a branch keeps the employment type; home-branch totals add to the total; every row of the home-to-revenue table adds to its home total and the table to the total; a new code (NTSP) joins the branch list; Costs by branch unchanged; the handover shows both tables with no notes; the CSV keeps its four sections and adds 2b and 2c; the running sheet shows the code to a view link with no box and every row the width of the header; a view-only link cannot set a branch; no page errors; no writes.
- `v8.67 test_didnotwork867.cjs` 11/11; `v8.66 test_handover866.cjs` 24/24; `v8.65 test_costs865.cjs` 33/33; `test_flicker863.cjs` 24/24; Codex's `test_finance862.cjs` PASS 1366 and 390; sweeps desktop/phone 15 tabs, 0 errors, 0 console, 0 attempted writes; `check_page.py` PASS; secrets 0.
- Screenshot: `evidence/homebranch868_desk.png` (all nine set in memory).

## Candidate

- Base live v8.67 `5a2dd2183464b488bc1c04577d4831c78f2e898846e0af9c5464953318bbd6a5`.
- Candidate `8a447a82c709225bd7b30b80d5648fcd64d1e51f7e81fefbda6a79d23517343c`, 11,061,532 bytes.
- Build: `toolchain/build.sh v8.68 v8.68_home_branch_DRAFT/patch_v868.py`. Upload: `toolchain/upload_page.py`.
