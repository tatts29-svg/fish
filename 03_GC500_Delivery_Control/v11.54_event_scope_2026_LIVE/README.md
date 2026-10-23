# v11.54 — The Coates Event Labour Scope C004-26003-01 (23 Oct 2026) on the page

Author: Andrew Fisher. Built on live v11.53 `fe6080b6…`. LIVE 23 Oct 2026 12:46 AEST: page
`d23c1278283e5c7225d946d81f7372796f3d53d86fa6410cc811b08abe6be410` (21,414,888 bytes), guarded page upload, byte for byte;
no media change, no record change. Full entry in STATUS.md.

## Andrew's words, 23 Oct 2026 12:35, with the workbook

"please analyse these costs and update where we need to this is what we charge the v8'S".

## What the page had, and what the workbook says

The page ran the 2025 document (C004-25003-01, received 25 Sep 2026): the 2025 card roles ($145.74 and $88.49 an hour),
every gate at 07:00 and track opening 16:30 / 17:20 / 16:30, with each access-plan row marked "to be updated off access
plan", so the P&L carried the caveat "event labour times still to be updated". The 2026 workbook (last saved 23 Oct 2026
12:30) carries the 2026 access plan, the workbook's own rate cells ($150.11 and $91.14, 3% over the card roles) and the
shifts that follow from them.

| Line (people × shift) | 2025 document on the page | 2026 workbook (now on the page) |
|---|---|---|
| Project Manager | 31.75 h at $145.74 = $4,627.25 | 30.75 h at $150.11 = $4,615.88 (Fri 09:30–18:30, Sat 08:00–18:30, Sun 08:00–19:15) |
| Gen Tech | 31.5 h at $145.74 = $4,590.81 | 27.25 h at $150.11 = $4,090.50 (09:00–18:15, 09:00–18:15, 09:00–17:45) |
| Fence team × 6 | 195 h at $88.49 = $17,255.55 | 213 h at $91.14 = $19,412.82 (06:45–18:15, 06:45–18:15, 06:45–19:15) |
| Toilets | 31.5 h at $88.49 = $2,787.44 | 27.25 h at $91.14 = $2,483.57 (09:00–18:15, 09:00–18:15, 09:00–17:45) |
| VMS board movements × 2 | 63.5 h at $88.49 = $5,619.12 | 65.33 h at $91.14 = $5,954.48 (07:00–18:00, 07:00–18:00, 07:00–17:40) |
| Gen Tech — entertainment | 7.83 h at $145.74 = $1,141.63 | 4.5 h at $150.11 = $675.50 (18:15–20:30 Fri and Sat) |
| Toilets — entertainment | 7.83 h at $88.49 = $693.17 | 4.5 h at $91.14 = $410.13 (18:15–20:30 Fri and Sat) |
| People | $36,714.96 | $37,642.87 |
| Accommodation and travel | $19,101.60 | $19,101.60 (unchanged; half 3.14, half 3.16) |
| **Race-weekend charge** | **$55,816.56** | **$56,744.47** (+$927.91) |

Access plan 2026: accredited and patron gates Fri 09:30, Sat and Sun 08:00; gate closure 07:00 each day; track opening
18:00, 18:00 and 17:40; entertainment concludes 20:30 Friday and Saturday, none Sunday.

Things worth knowing in the workbook, carried as read notes on the page: Gen Tech and Toilets start 30 minutes before
*Friday's* patron-gate time on every day (09:00, while Saturday's and Sunday's gates open at 08:00), as the cells are
written; the VMS lines run gate closure to track opening although the note beside them still reads "30 min pre patron
gates to conclusion of racing"; the VMS section's invoicing total cell (M46) adds up M20:M44 and double-counts the day
staffing, reading $58,453.63 — the page adds the lines, never that cell; the day-staffing, VMS, entertainment and
accommodation blocks come to $56,744.47.

## What changes on the page

`DATA.event_scope` only — the 2026 transcription (`event_scope_2026.json`, built and checked by `scope2026.py` against the
workbook: every day's start, finish, hours and cost reproduced by the page's own rules, and the block totals). The scope
engine, the Customer rates & charges card (now "C004-26003-01 … received Fri 23 Oct 2026"), the P&L race line and the text
export read it; the provisional caveat goes. The scope stays editable on the page as before; nothing is typed over it.
No record change. The workbook itself stays out of the repository (its SHA-256 is in the JSON). Footer v11.53 → v11.54.

## Files

- `scope2026.py` — the transcription and the checks (run against the private workbook; prints the old-vs-new table).
- `event_scope_2026.json` — the transcription the patch embeds.
- `patch_v1154.py` — requires live v11.53 by SHA-256; replaces the event_scope object; footer.
- `tests/test_v1154.cjs` — desktop and phone: the 2026 document received 23 Oct with nothing typed and no provisional flag;
  every line's rate, days, hours and amount against the JSON; people, accommodation and travel, hours and the total to
  the cent; the 2026 access-plan times in force; the P&L race line and no "to be updated" caveat; the Customer rates &
  charges card; record unchanged, no errors, no writes. Screenshot of the scope card.

## Checks

- Dry build on a copy of live v11.53, scrubbed as the build is, check_page PASS; the real build from live byte for
  byte the same (hash in STATUS.md).
- `tests/test_v1154.cjs`: 10/10 desktop and phone on the build (evidence/dry/) and 10/10 desktop and phone on the live page
  after the upload (evidence/live_*_test_v1154.json, the figures in evidence/*_scope_figures.json, screenshots
  `scope_card_live_*.png`).
- Regressions on the build: v11.52 (not charged here) 16/16 desktop and phone, v11.53 (questions) 12/12 desktop and phone —
  evidence/dry/regress/.
- Sweeps, desktop and phone, on the build: 27 tabs (19 shown) / 7 hashes / Back, 0 errors, 0 console, 0 blocked writes —
  evidence/dry/sweep_*.json.
