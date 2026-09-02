# K2 Reporting Suite — handover

**Upload this as the first message in a new chat.** It carries the whole
picture so you don't have to re-explain any of it.

---

## Who and what

**Andrew Fisher** — Shutdown Manager, Coates Hire.
**Job:** Cement Australia K2 Shutdown 2026, Gladstone QLD.

Andrew runs the Coates tool store on site. The suite builds the daily
customer and internal reports out of SiteIQ exports, and serves a page
called **My Gear** that lets any worker on site see the gear signed out
in their name from their phone.

Branding on every output: `POWERED BY SITEIQ`, `Author: Andrew Fisher`.
Coates orange is `#F26222`, near-black is `#1D1D1B`.

---

## His machines

Two, and **chat is the only way files move between them** — no shared
drive, no USB, no network path.

| | |
|---|---|
| **Work laptop** | the site machine, runs the tool store |
| **Personal Surface Pro** | what he uses out of hours |

`39_SYNC_PCS.bat` packages one up for the other. `40_WHAT_VERSION_AM_I.bat`
run on both tells you whether they match — it hashes the master files
only, so two up-to-date machines read the same code.

Only the **code** moves between machines (1.7 MB). Report output stays
where it was generated.

---

## The tool store network — this is settled, don't re-litigate

```
4G unit ──► dual-band router ──ethernet──► Surface Pro (through the dock)
                             └──Wi-Fi "Tool Store" ──► everyone's phones
```

**One router doing everything.** The 4G is already plugged into it. The
Surface is on that router twice — cable and Wi-Fi — which is why the
network check shows two addresses:

- `192.168.0.190` — the cable
- `192.168.0.17` — the Wi-Fi, **this is the one on the posters**

The router is **dual-band**, so the Wi-Fi list shows **`Tool Store`** and
**`Tool Store 2`**. Same box, same network, both work. This is not a
fault and nothing needs turning off.

**Wi-Fi:** `Tool Store` / password `coates2026`

**My Gear address: `http://192.168.0.17:8123/`** — plain http, served by
`05_START_GEAR_LOOKUP.bat`.

> **Do not move him to https.** It was tried on 28 Jul and reverted. It
> buys camera card-scanning but puts a "not secure" certificate warning
> in front of every worker, and it silently breaks if the wrong server
> window is open. On a live site that trade is wrong. Plain http, people
> type their hire ID, everyone gets in.

A firewall rule named **"Coates My Gear"** is in place opening TCP 8123
and 8443 on Private/Domain profiles only. `44_ALLOW_PHONES_IN.bat`
re-creates it if needed.

---

## Settings that are currently live

**Companies switched on for reports:** DGH Engineering, Dark Knight
Engineering. Everything else is off. Change with `34_SWITCH_ON.bat`.

**Company name aliases** (in `build_company_onhire_report.py`):
- `DKE GROUP` / `DKE` → `DARK KNIGHT ENGINEERING`
- `ISH 24` / `ISH` → `ISH24`

Whether ISH24 is the same outfit as "Industrial Rescue & Emergency
Training" is still unresolved — Andrew said leave it.

**Customer-owned gear:** 24 Cement Australia bollards are in the rental
stock but belong to the customer. They carry **no replacement cost** and
are excluded from exposure totals. Flagged via `customer_owned()`.

**Emails never send by themselves.** Everything goes to Outlook Drafts
and waits. `26_`/`27_` turn draft creation off and on.

---

## Recently done

- **Elite improvements pass (28 Jul 2026, this repo's branch):**
  - **46_APPLY_UPDATE.bat** — the improvement loop. Ask Claude → download
    the `K2_UPDATE_*.zip` → double-click 46. Finds the zip itself, backs
    up what it replaces, never touches live data, auto-rolls-back a
    broken update, refuses to double-apply. Update zips must be named
    `K2_UPDATE_<thing>.zip`.
  - **My Gear security fixes** (worker experience unchanged — same Wi-Fi,
    same address, same type-your-ID page): the office People List
    (whole-site names + hire IDs) now writes to `People_List\`, NOT the
    served `Gear_Lookup\` folder, and old served copies are purged on
    every run; the HTTPS server now binds the store-router address via
    `net_pick.best_guess()` (never 0.0.0.0, never the 4G card); firewall
    rule tightened to Private profile + local subnet; the committed
    HTTPS private key was removed (regenerates on demand);
    `Old\TEST_SERVE_EVERYWHERE.bat` retired for real.
  - **One 10 MB email limit** in `email_images.MAX_EMAIL_MB` (was 20 in
    k2_daily_packs only). The report emitter weighs the captured pages
    and drops to PDF-attached when the body would be too heavy — that's
    the DGH 17.3 MB fix. `35_CHECK_REPORTS` now also flags any .eml over
    the limit.
  - **Activity report visuals**: company page gained a "The position"
    story callout with highlight colours, an age-of-gear stacked bar and
    a returns-mix stacked bar — all drawn from the same fields the
    scorecards show.
  - **HOW_IT_WORKS.html** — the whole machine on one printable page,
    linked from START_HERE.txt.
  - **`coates-site-suite` skill** — the whole suite pattern captured for
    standing up the next job; lives in the repo at
    `Skill_coates-site-suite/` and installed in Claude's skills.
- **4 charges submitted 28/07/2026** — 1 transport (conveyor Brisbane→
  Gladstone, $1134) and 3 consumables (Paramount Safety Bollard Stem
  24 × $21.30; Paramount Bollard Bases 6 KG 24 × $16.22; Squids 3155
  Elastic Tool Lanyard and Clamp 20 × $15.30). Approved by Ben
  Vandenbroek. `38_SUBMIT_CHARGES.bat` is idempotent — it will not
  double-charge if re-run.
- **Contacts rebuilt** from an Outlook CSV (65 contacts), company names
  resolved against live rental data rather than guessed.
- **889 people carded** from the site hirer roster (`Hirers_ID.xlsx`).
- **Posters rebuilt** for `http://192.168.0.17:8123/` with the Wi-Fi
  join code. Colour and black-and-white versions of each.

---

## Outstanding

1. **Verify pricing and take in Andrew's newer register sheet.**
   Long-standing, not started.
2. **Replacement-cost gap list** — 38 descriptions covering 58 items
   still have no replacement cost. `Replacement_Costs_GAP_LIST_2026-07-25.xlsx`.
3. ~~DGH's email is 17.3 MB~~ **Fixed 28 Jul 2026** — over-10 MB reports
   now go out PDF-attached instead of pages-in-body, and 35 flags any
   heavy .eml before send.
4. **Duplicate report variants** — a single run produces 37 files where
   about 14 would do. Investigated 28 Jul: ~21 of the 37 are the page
   PNGs that ARE the email body (structural, not waste), and the rest
   are deliberate no-overwrite records. 45_ARCHIVE handles the bulk.
   Left as-is on purpose — do not "fix" by deleting old days.
5. **Report output is ~1.1 GB** across `Reports\` and
   `K2 DAILY REPORTING\`. All the company reports are dated 2026-07-26
   — that is the last full run and the only copy. Do not prune by
   "keep today only".

---

## Traps — real mistakes made on this job, don't repeat them

**Don't guess his network topology.** It was got wrong four times in a
row on 28 Jul, each wrong guess producing confident instructions that
sent him to change the wrong thing. It is written down above. If
something doesn't match, **ask him one question** rather than inferring
from a symptom.

**Don't read stale report folders as truth.** A claim that four Veolia
contacts were being dropped came from an old output folder; the live
data was correct all along. Check against live data before telling him
something is broken.

**`.format()` inside a string-concatenation chain silently breaks.**
This wiped every headline number in the activity report — they rendered
as literal `{v}`. Python binds `+` before `.format()`, so
`"a" + "{x}".format(x=1) + "b"` only formats the middle piece. Any
`.format()` call on a bare literal inside a `+` chain is a bug.
`35_CHECK_REPORTS.bat` catches the symptom — it strips tags and flags
leftover `{placeholder}`, `None`, `nan`, `$nan`.

**Verify QR codes by decoding them, not by trusting the encoder.** The
Wi-Fi code was silently omitted once, producing two identical My Gear
codes. Decode by position and confirm left vs right.

**Idempotence matters more than elegance here.** Charges, contact
imports and gear additions all get re-run when he's unsure whether the
first attempt worked. They must be safe to run twice.

**He is on a live site.** Prefer the boring thing that works over the
clever thing that's better. Anything that adds a step for 100+ workers
needs to be worth it.

---

## How to talk to him

Plain Australian. Recommendation first, then the reasoning. He wants a
straight answer, not a survey of options. If something's wrong, say so
in a sentence and fix it — no long apologies. He's running a shutdown
and reads most of this on a phone.

---

## Ampol suite — also in this repo (added 2 Sep 2026)

**Job:** Ampol Tool Store, Lytton Refinery. Suite lives at
`02_Ampol_Reporting_Suite/`, v1.0 (12 Aug 2026), stood up on the K2
pattern: 13 numbered buttons, one `Data\` area for every workbook,
dated `Reports\` output, drafts-never-send, CHECK gates.

It got here the same way everything else did: Andrew zipped the folder
on his laptop, uploaded it in chat, and it was committed from the zip.
**No path on his machines is reachable from a session** — not the Coates
OneDrive on the work laptop, not the personal OneDrive on the Surface.
The repo is the copy a session can see; a fresh zip in chat is how a
newer copy arrives.

Unlike K2, the Ampol suite has **no sync / version-check / apply-update
buttons yet** (K2's 39, 40, 46). Two laptops carrying it will drift
unless one of those is added or the repo is treated as the master.

### Gas monitor report rebuilt (2 Sep 2026)

Andrew was questioned on the accuracy of the gas monitor PDF. Root cause:
the report quoted the Excel workbook's summary tab, whose Issued / Not
Returned columns ran over a window that was neither year-to-date nor 30
days while the pages said both; "recovered today" was hard-coded to 0;
custody accounts were named as people. Fix, in the suite (v1.1):

- `gasmon_engine.py` counts every figure from RENTAL_STOCK.xlsx and
  TRANSACTIONS.xlsx. The workbook is optional (email attachment only).
- `generate_k2style_gas_monitor_report.py` (PDF, 16 pages), the
  house-style email and the V18 dashboard all read that one engine.
- Rules live in `RULES` at the top of the engine and are printed on
  the PDF's data page: same-day = back on the calendar day (night-shift
  draws after 15:00 get until 08:00), overdue = on hire since before
  today, windows = YTD / 30 days / yesterday.
- The PDF build measures every page in the browser (`layout_check`)
  before printing. Chromium drops an SVG that does not fit WITHOUT
  changing the page count - the old page-count check never saw it.
- Verified 2 Sep 2026 against an independent pandas recount: fleet
  878 / 335 available / 543 on hire; 77 overdue (36 at 30+ days);
  yesterday 280 draws, 36 not back, 21 recovered, 15 still out; last
  30 days 6,464 draws at 81.2% same day; YTD 65,152 at 80.7%.

The Ampol suite still has no sync / version / apply-update buttons
(K2's 39, 40, 46). Updates go across as a flat zip dropped over the
suite folder.
- Second pass the same day: three windows side by side (30 days, 3
  months = 13 full weeks + this week, year to date), a "where these
  numbers come from" page, and the workbook no longer attached to the
  email. Serial list gaps (57 barcodes, mostly AMP088/023-076, plus one
  serial on two barcodes) sent to Andrew as an Excel to complete.

### Every family onto the raw exports (2 Sep 2026, v1.2)

Andrew asked whether the big .xlsm workbooks are needed at all. Answer:
no. The rule for the whole suite is now: RENTAL_STOCK, TRANSACTIONS and
STOCKTAKE plus the small lookup files (serial lists, pricing master,
description corrections) are the only sources. The calibration and
rigging registers stay because they hold what SiteIQ does not (due
dates, test dates, register membership), but only as the list Andrew
types into; each report joins them to the live RENTAL_STOCK itself.

Audits of the other four families (independent recounts against the
raw exports) found the same pattern as the gas report: workbook tabs
quoted as today's numbers when they were stale. Fixed so far:

- Radio: workbook tabs were 14 Aug; now counted from RENTAL_STOCK.
- Stocktake: gas tier swept in 177 chargers + 4 probes (516 "monitors"
  vs 335 real); "last 24 hours" was 48; bay "oldest" printed "never"
  for a same-day sighting; 17 rigging-bay items dropped as "transit"
  while the register showed them on the shelf; 493 serial-numbered
  monitors were unpriced. All fixed in the engine
  (`build_stocktake_compliance_tool.py`) and the house-style skin.
  Verified: 8,165 countable, $5,582,641 priced fleet, gas 324/335.
- Tooling: the .xlsm tabs were a month stale (utilisation refreshed
  6 Aug) and four tabs gave four on-hire totals. The Power Query logic
  was ported to Python; the workbook is now optional and only cross-
  checked on the console. Verified: 1,500 on hire (140/544/816),
  $525,700.50, 4,053 available, 70 at repairs, 90,602 transactions.
- Rigging: the workbook's "To Help Locate" tab was a static June join,
  stamped with the file's save time. Now joined live to RENTAL_STOCK;
  143 register barcodes SiteIQ no longer returns are printed as
  "whereabouts unknown", never "accounted for".

Workbook query defects worth telling Andrew if he keeps the tooling
workbook for his own use: the Master/Q/Available/Repairs queries look
for a column named `CorrectedDescriptionsTable.Corrected Description`
(the file's header is `Corrected Description`) so corrections never
apply; the per-query Filtered Rows steps differ, which is why the tabs
disagreed.
- Calibration: the report presented the register's 14 Aug refresh as
  today's position (26 overdue when 48 were, by 2 Sep). Now computed
  from Register Entry due dates joined live to RENTAL_STOCK; the
  register's own view prints beside it, labelled; the staleness banner
  is about the age of the due-date entries. 5 chase items were hired
  out after their due date (report says check both the issue and the
  register date).

