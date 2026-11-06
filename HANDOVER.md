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

- **Ampol suite v2.0 (06 Nov 2026):** one look across every report, an Excel twin beside every PDF, the client copy (`REPORT_OPTIONS.txt`), the non-return trend pages (gas first, then radios and tooling). Truth table identical to the pristine v1.14 run. See the Ampol section below.
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

## The on-hire report kit — `02_Onhire_Report_Kit/` (Weipa, MMG, any job)

A **standalone** kit, separate from the K2 suite: one folder, four
buttons, nothing installed. It reads RENTAL_STOCK / SALES_STOCK /
TRANSACTIONS (+ STOCKTAKE) and writes the on-hire **workbook** (14 tabs,
Dashboard first; 15 with the internal *Forecast* tab while the roster has
days to come), the on-hire **email** (draft, no costs) and the
**company pack PDF** (cover with the asks, *The story*, *Looking ahead*
while a shut is ahead or under way, *At a glance* charts, then a section
per company that touched the counter), plus one PDF per company in
`By_Company\`. *Looking ahead* and the email card carry dates, people
and movements only; dollars (cost by day, running total, split) live on
the Forecast tab, read off the two typed tabs at build time. `4_MAKE_OUTLOOK_DRAFT.bat` saves the
email as a native Outlook draft. The PDF is drawn by `coates_pdf.py`, a
standard-library PDF writer that travels in the kit.

The job is set in `JOB.txt`: names, `engagement` (fixed rate),
`shutdown_end` (demob countdown + gear-return push from 4 days out),
`tidy_names`, `acronyms`; `COMPANY_ALIASES.txt` folds SiteIQ's spellings
(only what is written). Per-job copies live under `jobs\`.

Settled rules, 04–05 Nov 2026:

- **Every on-hire item is dated from the START of its issue transaction**,
  never from RENTAL_STOCK's ON_HIRE_DATE. No transaction in the export
  window = **undated**, said so. Pull TRANSACTIONS from the shut start.
- A report is never dated before its own data; day counts never negative.
- One palette across email, workbook and PDF: orange `#F26222`,
  near-black `#1D1D1B`, charcoal `#2A313C`; red/amber/green only for
  meaning. Email is tables + inline styles, no images (Outlook = Word).
- Amber means "order more"; red is kept for overdue (21+ days) and
  safety. A good zero (items on hire 0) reads green as "All back".
- One chase email (.eml + .draft.json) per company beside its PDF in
  `By_Company\`; `5_MAKE_COMPANY_DRAFTS.bat` makes them native Outlook
  drafts. Subjects carry the position. The pack ends with a "How to read
  this pack" page. `Reports\history.csv` holds one line per report day.
  The run ends with a self-check line ("Checks 7 of 7 passed").
- The cover and email masthead carry a shut-progress strip (from the
  roster) and "since the last report" deltas read from the newest earlier
  `Reports\<day>\` workbook; sections carry a company mark and an
  age-of-what-is-out bar; At a glance and the Dashboard carry the on-hire
  line (gear out at each day's end) and the age bar.
- Workbook tidy (06 Nov, Andrew: "the excel looks very messy"): `cover()`
  rebuilt on a 12-column grid with uniform row heights and a lighter
  section heading (orange rule under the first two columns); nine primary
  facts, secondary facts as notes under the sources table; two rating
  legends side by side; page break after the directory. `dashboard()` now
  tiles + four cell-built dials (big figure, "a of b", data-bar row with
  `;;;` number format) + six charts in a 2x3 grid via `chart_finish()`
  (12pt title, `axis.delete = False` - without it Excel 365 hides axes on
  openpyxl 3.1 charts - hairline border); the chart tables moved to a new
  grey `Chart Data` tab at the back, and the Dashboard is built before the
  Cover so the Cover can list it. Data tabs byte-identical before/after on
  Rio and MMG (checked with openpyxl). `showRowColHeaders = False` on the
  three front tabs.
- Once-over round (06 Nov, five parallel reviewers: customer eye, workbook
  auditor, MMG first-time user, Windows/robustness tester, figure auditor;
  reports under scratchpad/qa2/ at the time): customer-owned gear is split
  out of every Coates figure (`_coates_gear()` on each transaction row via
  CUSTOMER_CONTRACTOR_EQUIP ids / ITEM_OWNER / RENTAL_STOCK OWNER; `tooling_tx`
  Coates-only, `cust_tx` the rest; Tooling Utilisation from `coates_owned`;
  Weipa regression vs the original builder now differs by exactly the 9
  customer-owned transactions and 5 Rio-owned lines, deliberately); undated
  items with old stock dates are called long out; items whose stock date is
  on or after the TRANSACTIONS window end are "late" (evening pull) with a
  WARN, an advisory check and a reworded ask; one basis per figure (scans vs
  movements, consumables since project start, honest "another N" captions,
  "not moving" excludes anything on hire and says it counts lines of two or
  more); `person_name()` for display; `_greeting()`, `_short_co()`; item
  numbers shrink before wrapping; alias targets typed in mixed case are kept
  as typed, caps targets are tidied; `_phase()` tests mobilisation before
  travel words; one NOTE per typed tab; "exports current", "transactions
  window reaches the stock pull" and "LATEST workbook refreshed" are
  advisory checks; a fatal STOP removes the main email draft; launchers:
  `3_GET` version probe via a temp file, `_RUN.bat` apostrophe-safe,
  buttons 4/5 explain a failure, `check_this_laptop` only claims the file it
  wrote, PS1 names Constrained Language Mode. New: `pull_siteiq_exports.py`
  + `6_PULL_EXPORTS_AND_MAKE_REPORT.bat` (Downloads -> Data_SiteIQ by data
  sheet and PROJECT SCHEDULE, newest by REQUESTED_DATE/TIME, old files to
  Data_SiteIQ\previous, then builds). The main email attaches the workbook,
  which carries costs: for a customer send the pack alone (documented).
- Third-opinion round (06 Nov): OpenAI Codex pushed four commits on the
  same branch (tests under `02_Onhire_Report_Kit/tests`, CI workflow
  `.github/workflows/onhire-kit.yml`, draws windowed to the exact minute,
  consumables excluded from CUSTOMER_CONTRACTOR_EQUIP own-gear counts,
  transaction-outcome partition, collision-safe filenames, font checksum).
  Verified here on the real exports; then fixed on top: fatal vs advisory
  self-checks (`fatal_names`), an honest "typeface embedded" check, a sale
  after the TRANSACTIONS window no longer re-dates the report, the email
  moving strip matches the pack partition, and the cover keeps every
  company on the list (`action_layout_compact`, three-step fit) with the
  fleet/customer-owned split in the hero. Run the suite with
  `python -m unittest discover -s 02_Onhire_Report_Kit/tests` (openpyxl on
  the path). A zero on hire now reads "Nothing on hire", not "All back".
- Tester round (06 Nov, after an independent rebuild-and-break test; report
  kept at the time under scratchpad/qa/QA_REPORT.md): "this period" draws =
  SALES_STOCK rows inside `transactions_window()` (`ctx`; the tab keeps all
  rows as `ctx_all`; `_PRINT["draws_note"]` on the Cover and DATA_SOURCES);
  customer-owned items counted via `owner_of` (RENTAL_STOCK OWNER) and named
  in the position sentence and chase emails ("on hire from the Coates tool
  store"); `By_Company` cleared each run and the check counts files present;
  the email attaches the dated workbook; one consumable-line count (`len(cu)`);
  Cover demob from `progress["last"]`, engagement not asserted; stale exports
  (`_PRINT["stale_days"]`) surfaced in call lines and Cover; undated ask
  checks stock dates against the window; `export_requested()` reads
  REQUESTED_DATE/TIME; history.csv gained `basis=window` and `_moves_delta()`
  compares tooling moves only against an old-basis previous report; phone
  media rules (`.mh` stacked masthead, `.hp` hidden columns, wrapping);
  `_RUN.bat`/`check_this_laptop.py` Temp guard narrowed; PS1 prefers today's
  folder and names classic Outlook; 3_GET_PYTHON uses `$env:` not quoted
  paths; a renamed job falls back to the one LATEST in the folder.
- Second-opinion round (06 Nov, after an independent code review and an
  independent rebuild-and-break test): Company Summary includes companies
  holding gear with no movement in the window; transaction de-dup keys on
  the whole line (`TRANSACTION_ID` + item + barcode + description + start
  + qty); the cover/forecast self-check compares the typed Cost Breakdown
  total with `cost_profile()["total"]`; the manifest's LATEST copy is
  refreshed every run; `job_seed(s, when)` applies a seed only within 45
  days of its own dates; Dashboard rating colours read `TONE`; exports are
  parsed once via `_open_ro()` (read-only cache, closed at exit; measured
  saving under 1 s on today's exports, so a tidy-up rather than a speed-up
  until exports grow); `_RUN.bat` lets `check_this_laptop.py` run on
  a half-unpacked kit; the cover contents list tightens to 12pt rows and
  then truncates with "and N more companies" so the asks card always fits.
- High-contrast round (06 Nov): the cover hero, the dials card, each
  section header and every footer are charcoal/near-black bands with white
  type (`P_SLATE` #2A313C, `card(dark=)`, `gauge(dark=)`,
  `progress_bar(dark=)`, `age_strip(dark=)`); the email masthead carries a
  hero line (`_hero_html`, `story["hero"]`); Dashboard and Forecast tiles
  are dark with white values. Small orange text on white is
  `P_ORANGE_TEXT` / `E_ORANGE_TEXT` #C8511A (readable); wordmark, rules and
  bars stay `P_ORANGE` #F26222. A quiet company's section still fits one
  page (band 60pt, 12 consumable rows); MMG 17 pages, Rio 23.
- The pack is set in Inter from `_fonts\` (OFL, subset-embedded by
  `coates_pdf.py`; Helvetica fallback). Item descriptions are tidied for
  display only (`item_name()`, `tidy_items: no` to turn off); transaction
  and stock tabs keep SiteIQ's raw text.
- Hand-typed tabs (Coates Labour, Cost Breakdown) carry over value for
  value and are skinned; a fresh kit seeds them per job (Weipa roster
  04 Nov; MMG roster + cost breakdown 05 Nov, corrected the same day:
  fly in Sun 22 Nov, mobilisation Mon 23–Tue 24, shutdown from Wed 25 Nov,
  Thomas Maher days, Cody Mitchel nights, fly out Wed 2 Dec, $90/$100,
  tooling $1,847.81 + site services $50 a day 25 Nov–1 Dec, flights $1,500 each
  way). The Cost Breakdown's Labour column is a SUMIF off the roster.
  A roster from a previous shut (last day a month+ behind the report) is
  replaced with the seed, with a note. Cover totals come from cached
  values or a small formula evaluator; otherwise TBC, never $0.
- MMG is a fixed-rate engagement: client packs never carry per-item
  charges; the internal cost breakdown stays in the workbook.
- `_lib` (vendored openpyxl) and all site data stay out of git.

## The Ampol reporting suite — `03_Ampol_Reporting_Suite/` (Lytton Refinery, permanent tool store)

The **permanent** tool-store suite, separate from K2 and from the on-hire
kit. Andrew runs it from his OneDrive folder `Ampol Report 2026\
02_Ampol_Reporting_Suite` (pin it "Always keep on this device"). Eighteen
numbered buttons; `00_RUN_EVERYTHING` is the morning. Six report
families — gas monitors (PDF + email + the executive dashboard email),
radios, tooling (`--everything` = executive summary, on-hire register,
quarterlies, utilisation, compliance), stocktake, calibration, rigging —
plus the one-page daily position. Every figure is counted from the three
SiteIQ exports in `Data\SiteIQ` (`RENTAL_STOCK`, `TRANSACTIONS`,
`STOCKTAKE`) and the editable lookups in `Data\Editable`; button 13 recounts
the key figures from scratch and fails red on a mismatch.

**v2.0 (06 Nov 2026)** — the makeover Andrew asked for after the Rio/MMG
packs, plus the client's three asks:

- **One look.** `k2style.css` is the one stylesheet: white page, dark
  COATES masthead and footer on every page, orange rule, dark hero cover,
  Inter embedded from `assets\fonts`. `k2shell.py` draws the fixed pages
  and the PNG/SVG charts, `k2flow.py` the flowing documents (tooling,
  radios) with `position:fixed` bars and `@page` margin boxes for the
  page number. The gas dashboard email (`generate_v18_...`) and the radio
  email frame moved to the same masthead.
- **The Excel twin.** `coates_xlsx.py` (the same writer the on-hire kit
  uses) + `ampol_xlsx_reports.py`: one `.xlsx` beside every PDF, attached
  to the draft — Cover, Dashboard with native charts, every table a tab.
  Built from the builder's own model, never from the PDF text.
- **The client copy.** `Data\Editable\REPORT_OPTIONS.txt` (`hide_company:`
  lines, `client_copy: yes`). `client_pass.py` runs each builder twice —
  the second time with `AMPOL_CLIENT_VIEW=1`; every loader asks
  `ampol_options.is_hidden()` as it reads rows, `ampol_names.report_stem()`
  adds ` - Client` to every file name, the data page carries
  `ampol_options.disclosure()`, `report_history.record()` is a no-op in
  client view and `VERIFY_NUMBERS` reads one set at a time. Every button
  and `PICK_REPORT.py` call the wrapper. `Docs\CLIENT_COPY.md` is the guide.
- **The non-return trend.** `gas_trends.py` (daily out / overdue / 30+,
  weekly return speed, ageing bands, companies by month with a
  worse/better/level word, repeat people) feeds a PDF page, an email
  section and five Trend tabs. `txn_insights.open_series()` gives the
  radio report "still out at each week's end"; `nonreturn_trend()` in
  the tooling builder does the same for tooling (hires open, past 30,
  past 90, by company, week by week) in the executive summary and the
  on-hire report.
- **Accuracy.** A pristine v1.14 copy and the v2.0 copy were both run on
  the same 06 Sep 2026 exports; the truth table passes on both with every
  checked figure identical.

**Not in git:** `Data\` (site exports and registers), `Reports\`,
`History\`, `assets\fonts` (the Inter TTFs — they travel in the update
zip), the Coates Way deck and the SOP PDFs under `Docs\`. The update zip
Andrew drops over his folder is the complete code; the repo copy is for
history.

Traps met on 06 Nov 2026:

- In the cloud container, Chromium's command-line `--print-to-pdf` hangs
  (the `google-chrome` on PATH is a wrapper for the same Playwright
  Chromium). Printing through Playwright's `page.pdf()` works in under a
  second, so builds there use a stand-in named `msedge` on PATH
  (`pwchrome.js`, not shipped). On Andrew's laptop Edge prints as before;
  `AMPOL_BROWSER` names one browser when a machine misbehaves.
- The client view must change the **file names**, not just the figures —
  the first test overwrote the internal set. `report_stem()` is the one
  place names are made; keep it that way.
- The fixed-page layout check finds the footer by its text; the position
  page's author line also says POWERED BY SITEIQ, so the footer must be
  picked from the bottom 15% of the page.
- The image viewer in the session showed two PDF covers "wrong" that were
  right when measured pixel by pixel. Measure before you fix.

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
