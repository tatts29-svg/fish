# v12.27: the Advanced race crew is a fencing cost on the P&L, not wages (DRAFT)

Author: Andrew Fisher.

- **Base:** live v12.26 `82589211d0b07c43b71f5859e1fbb6fe43dabf338e2509e750ea815cef5fa26e`
- **Candidate:** `2db3457f12692ccd660de48b6c134d964827e27c3a4be976b482f12edbccc9b2`, 15,450,051 bytes

Andrew, 25 Oct 2026, on the race-day crew in the wages: "For advanced / We pay advanced". Then: "Check again".

## Figures

| Race crew, Fencing 1–6, 23–25 Oct | Hours | Rate | Amount | Source |
|---|---|---|---|---|
| We pay Advanced | 216 planned | $142.00 | **$30,672.00 forecast** | Quote 27172 (4 Jun 2026), page 2: race day $142/person/hour, 4 h minimum |
| We charge the V8s, unchanged | 213 | $91.14 | **$19,412.82** | C004-26003-01 event labour scope, Fence team (6 people × 11.5 / 11.5 / 12.5 h) |
| Difference | | | **−$11,259.18** | |

**Why the hours are only a forecast.** The 216 h is the planned roster (6 × 06:00–18:00 × 3 days), recorded by Andrew Fisher on 12 and 15 Oct.

- The crew's source line never had Saturday's or Sunday's times: "Planned event roster; shift hours not provided".
- No Advanced docket or green-book note is on the record for 23–25 Oct. The last are dockets 36765–36768 on 23 Oct, which are fence jobs with no labour.
- Advanced bills from signed daily event dockets.

The page's own running-sheet rule decides the treatment. A planned shift stays a forecast until its hours are recorded or Finance verifies the actual. So the whole $30,672.00 goes in "to job end", not "known today".

## What changes

| Where | Live v12.26 | v12.27 |
|---|---|---|
| Direct costs known | $417,803.57 | $417,803.57 (unchanged) |
| Direct costs to job end | $429,510.83 | $460,182.83 |
| Gross margin to job end | $592,352.79 (58.0%) | $561,680.79 (55.0%) |
| P&L 2142 Installation — external contractors, to job end | $21,100.00 | $51,772.00 |
| Costs to job end, fencing still to come | $10,350.00 | $41,022.00 |
| Wages to job end (tracked, not in the P&L) | $82,113.10 | $51,441.10 |
| Wages note | 74 hired-in shifts, $67,413.10 | 56, $36,741.10, plus where the crew went |
| Difference to job end | $479,993.80 | $479,993.80 (unchanged: it already took the wages off) |
| Finance handover, costs and wages to job end | $541,869.82 | $541,869.82 (fencing +$30,672.00, labour hire −$30,672.00) |

- **Costs to job end** lists "Fencing race crew — the hours on Advanced's race-day dockets" as the item to confirm. When the dockets or Finance's verified actuals are recorded, the cost moves from forecast to known by itself.
- **Not changed:** revenue, the V8 charge and every other cost line. All 17 reconciliation ties hold to the cent.

## How

`patch_v1227.py` inserts `racecrew1227_src.js` (RaceCrew1227) after the Workforce1010 script.

- **What RaceCrew1227 reads:** the running sheet's Fencing 1–6 race-day rows (`fin745Rows`): quote cost, or Finance's verified actual; known only when recorded, not planned.
- **Edits:** 24 exact-text edits, each required to be found once on the verified base, plus `labourNote753` replaced whole and the footer moved v12.26 → v12.27.
- **Where the crew goes:**
  - `moneySummary_` direct costs known (its known part);
  - `moneyStreams` and `costCategories` fencing (out of the hours-only external labour);
  - `pl770Model` 2142;
  - `cj764Model776Held`: the fencing line's still-to-come, plus the docket gap; out of the labour-hire wages;
  - out of `fh868People`.
- **Where it's worded:**
  - `labourWholeJob865` gives the crew its own row, so labour charged and labour cost still compare like with like;
  - the At-a-glance wages row, both Questions labour notes, the email's fencing parts and the Rehire-by-branch note.
- **Wages hours "not in this P&L"** leave out the crew's 216 h.

## Checks

- **`check_page`:** PASS, 203 scripts. The attribution scrub left the build byte for byte.
- **`tests/test_v1227.cjs`:** 25/25 on desktop and 25/25 on phone (`evidence/`), reading the live record only.
  - Base and build were held to the deltas above, to the cent.
  - The reconciliation ties are 17/17.
  - `fh866` costCheck and peopleCheck both pass.
  - 0 page errors and 0 record writes on either page.
- **Both full sweeps:** `evidence/sweeps.json`.

No record change. Codex's separate record correction (PR #1 6401808644) is untouched.
