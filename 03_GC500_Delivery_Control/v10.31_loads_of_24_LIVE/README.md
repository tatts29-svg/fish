# v10.31 — Loads of 24, as many loads as the day needs (LIVE 16 Oct 2026 04:53 AEST, with v10.29 and v10.30)

Author: Andrew Fisher. Andrew, 16 Oct 2026: **"Toilets are all due in today. Loads of 24."**

## What was wrong

The Event Portables run sheet (Sub-hired tab, v10.00) capped proposed portaloo deliveries at **24 a calendar day** and
pushed the rest to the next days, and took the **later** of the Coates schedule date and the supplier's own load day
as the proposed day. So the 34 still to come read as 24 today, 4 Saturday, 1 Monday and 5 Tuesday, while Event
Portables' plan v10 (3 Oct) had almost all of them on 13 to 16 Oct.

## What v10.31 does

- A load is 24 portaloos (or 6 pee panels and 18 portaloos); a day takes as many loads as it needs. The page's own
  `pack()` already splits a day into loads of 24 in route order; the daily cap in `dailyPlan1000` is gone.
- The supplier's own load day is the proposed day (the page's stated rule since the 7 Oct plan reading: "The
  supplier's load day is the page's planned delivery day; a day recorded on the shared record always wins"). A day
  recorded on the shared record still wins. A load whose day has passed is proposed for today.
- The run-sheet PDF says "Loads of 24 portaloos, as many loads as the day needs" instead of a daily maximum.
- Footer v10.30 → v10.31. No charge, quantity or record value changes (every contract line charges what v10.29 charges).

## What the page shows now (16 Oct, live record)

| Day | Portaloos | Loads |
|---|---|---|
| Fri 16 Oct | 31 | load 1: 24 (WC46 1, WC45 8, WC65 1, WC35 1, WC62 2, WC85 1, PG01, PG03, PG05, PG29, T0162 1, Shell V-Power team area 1, WC30 4) · load 2: 7 (WC19 1, WC09 6) |
| Sat 17 Oct | 3 | T0176 Red Bull team area 2 and one team-area unit, on the supplier plan's own day |

The three on Saturday are the supplier plan's dates, not the page's. To bring them onto today the record's planned
day for those references is moved with the drawer's "Change the dates" (a record change, on Andrew's word; this
session was not permitted to prepare a runner for it).

## Checks

| Check | Result |
|---|---|
| `check_page.py` | PASS |
| `tests/test_loads1031.cjs` (every write aborted) | ALL 5 CHECKS PASSED |
| `harness/sweep.js` desktop and phone | 24 tabs, 18 shown, no errors |

Built on the live v10.28 after `patch_v1029.py` and `patch_v1030.py`; goes out as v10.31 on Andrew's "Upload".
