# v6.79 — LIVE 26 Sep 2026 (about 22:20 AEST), approved by Andrew

Author: Andrew Fisher

## What went live (Andrew ticked these)

1. **Labour, running sheet and Questions page**, on the dashboard page (v6.73 + `patch_v677d.py` + `patch_v679.py`).
   - **Expected labour:** every priced labour line on every reference, valued and split into four groups, by charge type and by branch:
     - charged: $9,728.14, equal to Costs to the cent;
     - expected: $7,875;
     - to come: $23,126;
     - later (demob and cleaning): $32,401.
   - **Running sheet (Tools → Running sheet):** per person per day, with editable start and finish. Hours and the normal / ×1.5 / ×2 split are worked out, and pay appears where a rate is entered. Meals, accommodation, R&M, consumables and stationery can be entered for each line. Each person's type (Salary / Labour hire / Coates CNA) and rate are set once. There is an "Add person" button, and the pay rules are editable.
   - **Pay rules:** CNA 7.6 h, labour hire 7.5 h, then 2 h at ×1.5, then ×2. Saturday: 2 h at ×1.5, then ×2. Sunday: all ×2. Weekdays have a 30 min unpaid break (Andrew: yes); weekend breaks are paid. Salary is hours only.
   - **Effect on Costs:** build and demob hours go from 2,003.5 to 1,909, and race-weekend hours from 159 to 156.5. Wages are not yet in the known-cost total.
   - **Questions (Tools → Questions):** 59 open questions, grouped by branch, fencing, transport, labour, and schedule and plant, each with an answer box.
2. **Satellite Plan Explorer:**
   - the 64 aerial patches were regenerated with transparency, so there are no more black areas in Original plan;
   - it opens in Satellite + plan;
   - the phone layout is fixed;
   - it shows an "imagery isn't loading" message and retries;
   - load failures time out with plain wording.
3. **Coates Way machine (set v5.86-noserver):**
   - clear opening shot, with nobody between the camera and the car;
   - a load watchdog that falls back to the static preview;
   - first open is 4.5 MB, down from 17.7 MB (meshopt + gzip, identical render);
   - "Fitted / 310 parts fitted / Ready to run / Interactive illustration — not a performance measure", and "Cog speed".
4. **Server v5.84** (blob sha256 `2643631…`; v5.83 `b8d38b8f…` kept for rollback). Railway variables were set:
   - `SERVER_FILE`
   - `SERVER_FILE_KEEP`
   - `RAILWAY_DEPLOYMENT_DRAINING_SECONDS=10`

   It includes brotli (the page is 1.44 MB instead of 1.83 MB gzip), save-before-confirm and a flush on SIGTERM, recovery from snapshot, a start-up snapshot, `__proto__` refused, HSTS / nosniff / strict-origin headers, 507 on a full disk and a wrong-key limiter. The server source is no longer public (404).

## Not approved, so not live
- The v6.77 dashboard fixes: wording D1–D16, Monday "Still to come", photo thumbnails, accessibility A1–A4 and phone tab labels. They stay in `../v6.77_v6.78_DRAFT_awaiting_approval/`.
- View link scope: Andrew chose to leave it as is.

## Checks
- **Before:** a full record export was taken off the platform (kept outside the repo).
- **Record:** version 1982 is unchanged across the deploy, with `record_recovered: null`.
- **Server blobs:** `kept_unlisted: 2` both server blobs.
- **Live page:** `/v/` equals the v6.79 build byte for byte, and is served as brotli, 1.44 MB.
- **Live smoke test** (browser through curl, reads only), no page errors on:
  - Today
  - Where we are
  - Running sheet
  - Questions
  - Pricing
  - Costs
  - Coates Way
- **Editor test** on the local copy:
  - weekday CNA 06:00–17:00 = 7.6 + 2 + 0.9;
  - weekday labour hire = 7.5 + 2 + 1;
  - Saturday = 2 at ×1.5 + 9 at ×2;
  - Sunday = all 11 at ×2.

## Rollback
- **Page:** re-upload v6.73.
- **Server:** set `SERVER_FILE=b8d38b8f…` and `SERVER_FILE_KEEP=2643631…`, then deploy. Do not import a machine set while on v5.83 (see `../v6.77_v6.78_DRAFT_awaiting_approval/server_v5.84/DEPLOY.md`).
