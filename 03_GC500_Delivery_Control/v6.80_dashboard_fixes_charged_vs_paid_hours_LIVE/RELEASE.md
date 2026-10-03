# v6.80 — LIVE 26 Sep 2026 (about 22:32 AEST), approved by Andrew

Author: Andrew Fisher

Built from v6.73 + `patch_v677.py` + `patch_v677b.py` + `patch_v677c.py` + `../v6.79_*/patch_v677d.py` + `../v6.79_*/patch_v679.py` + `patch_v680.py`.

## 1. Charged hours and paid hours kept apart (Andrew: "we charge V8s all hrs … we pay our workers or our casual staff what I told you")

| | What it is | Where it counts |
|---|---|---|
| **Worked (charged)** | Start to finish, with no break taken off. | Costs and the tracker: build and demob is back to **2,003.5 h**, and the race weekend to **159 h**. |
| **Paid hrs** | Worked hours less the unpaid weekday break (30 min standard, or the break typed on the line; weekend breaks are paid), split normal / ×1.5 / ×2 by type. | The running sheet's pay columns, and the Costs "Paid — ordinary hours" tile: 1,549.3 normal + 274 at ×1.5 + 85.7 at ×2 = **1,909 h paid**. |

The running sheet shows both columns side by side, for each day and across the whole job:
- worked: 2,162.5 h, including the race weekend;
- paid: 2,065.5 h.

Example: a Coates CNA on a weekday, 06:00–17:00, shows 11 h worked (charged) and 10.5 h paid, split 7.6 normal + 2 at ×1.5 + 0.9 at ×2.

## 2. The v6.77 dashboard fixes (not ticked on the first round; Andrew approved them now: "Proceed with option 1 too")

- **Wording D1–D16:**
  - "Deliveries due by today met";
  - 764 quantified + 26 awaiting quantity;
  - Coates Way "Not measured by this system", with the Not assessed list and fencing gaps shown as red;
  - Costs "Forecast incomplete", with the $/h scale line removed;
  - race weekend shown as "planned";
  - fencing "Client charge ex GST", with rates to 4 decimals;
  - fence "work on dockets", with gaps by type;
  - WB02 removal time taken from its own row;
  - the 2019 drawing marked "Reference only";
  - phase and day ("Build phase · day 20 of 68");
  - "return date not recorded".
- **Next delivery day box:** reads "Still to come" instead of "Not recorded on site", because the day has not happened yet.
- **Photo cards:** load the server's small copy; the full photograph opens when you press it.
- **Accessibility:** A1–A4 (tab list, plates, contrast, sideways-scrolling tables), plus the phone tab labels.
- **Race day:** Andrew's "race day" wording is kept.

## Checks
- **Local copy:**
  - scripts 3 / bad 0;
  - editor test: CNA weekday 11 worked / 10.5 paid = 7.6 + 2 + 0.9; labour hire 11 / 10.5 = 7.5 + 2 + 1; Saturday 11 / 11 = 2 + 9; Sunday 11 / 11 all ×2;
  - navigation sweep on desktop and phone: no errors, no sideways overflow;
  - automated WCAG A/AA check: 0 violations on the header, Where we are, Documents, Pricing, About and Today.
- **Live:**
  - `/v/` equals the v6.80 build byte for byte, and is served as brotli, 1.45 MB;
  - record version 1982 unchanged, `record_recovered: null`;
  - smoke test (reads only): no page errors on Today, Where we are, Running sheet, Questions, Pricing, Costs and Coates Way;
  - labour 9,728.14 / 7,875 / 23,126 / 32,401;
  - 59 questions;
  - hours 2,003.5 worked / 1,909 paid / race 159.
- **Screenshots:** `live680_runsheet.png`, `live680_costs.png`.

## Rollback
Re-upload the v6.79 page (v6.73 + `patch_v677d.py` + `patch_v679.py`). The server was not changed.
