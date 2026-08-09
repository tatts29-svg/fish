# K2 Reporting Suite — handover

**Upload this as the first message in a new chat.** It carries the whole
picture so you don't have to re-explain any of it.

---

## Who and what

**Andrew Fisher** — Shutdown Manager, Coates Hire.

**Jobs:** the suite now runs more than one.

| key | job | live? |
|---|---|---|
| `k2` | Cement Australia K2 Shutdown 2026, Gladstone QLD | |
| `rio_weipa` | Rio Tinto Weipa May26 Shutdown, Weipa QLD | ← current |

`SITE.txt` names the live one; `57_SWITCH_JOB.bat` changes it. Each job
is one small file in `Sites\`, and everything follows it — which exports
get read, where reports land, the customer name on every heading.
**Do not hardcode a job into anything new.** Ask `site_config.site()`.

K2's folders are exactly where they always were. Weipa lives under
`Jobs\Rio_Weipa\`. They cannot mix: every export carries a SiteIQ
PROJECT SCHEDULE stamp, and a report will not build off an export
belonging to another job.

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

- **Cross-computer + Rio Weipa pass (9 Aug 2026, this branch):**
  - **`_RUN.bat` — one launcher for every button.** The buttons used to
    start Python five different ways and three of them broke on a fresh
    machine: `python` isn't on PATH unless the installer's box was
    ticked; Windows ships a fake `python.exe` that only opens the
    Store and passed the old `where python` test; and
    `where py && (py X) || (python X)` **runs the script a second time
    whenever the first run exits non-zero** — which is how you
    double-charge on 38. All 49 buttons now `call _RUN.bat`, which
    proves a Python 3 actually runs (each candidate must print its own
    path), falls back to the usual install folders when PATH is empty,
    installs openpyxl once, and runs the script **once**.
  - **Line endings pinned.** The .bat files were a mix of CRLF and LF.
    A LF-only .bat runs most of the time and then fails on a label or a
    multi-line IF — a fault that only shows up on someone else's
    computer. All .bat/.ps1/.txt are CRLF and `.gitattributes` holds
    them there. Report output trees were deliberately left alone.
  - **`site_config.py` — the job is data now, not code.** See the table
    above.
  - **`58_RUN_ONHIRE_WORKBOOK.bat`** builds the twelve-tab shutdown
    on-hire workbook for whichever job is live. Cover was blank in
    Andrew's file — it now carries the headlines, what fed the
    numbers, and the rating rules written out. **Coates Labour and
    Cost Breakdown are his typing** and are carried over cell for cell,
    formulas and all — never recalculated, never overwritten. His
    `.xlsm` is never written to (VBA, a logo drawing and Power Query
    tables don't survive an openpyxl round-trip), so a clean dated
    workbook is built alongside it.
  - **Two real defects found in the Rio workbook while rebuilding it:**
    the Company Summary TOOLING row was a copy of the CONSUMABLES row
    (ACS showed 13 tooling transactions when it had none), and the
    tooling Usage Rating didn't follow any consistent rule — one line
    was "Low Use" on 36 transactions, another "Good Use" on one.
    Tooling is now rated on **turns** (transactions ÷ units on site),
    consumables on **share of position sold**, and both rules are
    printed on the Cover so the recommendations can be argued with.
  - **`59_CHECK_EVERY_BUTTON.bat`** — presses nothing, changes nothing,
    and says whether every button on this machine would work: shared
    launcher, target present, valid Python, libraries installed, line
    endings, and whether the live job's exports are here and belong to
    it. Run it after an update or on a new machine.
  - **Dead weight gone:** `Old\` (10 retired files), the one-off
    `FIX_DELETE_LIFTING_CHARGES_28JUL`, and a stale duplicate
    `Gear_Lookup\START_GEAR_LOOKUP.ps1` that nothing ran. Docs that
    pointed at them were fixed. Everything else at the suite root was
    checked and is live — nothing else was removed.

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

**Some tabs are his typing, not output.** `Coates Labour` and
`Cost Breakdown` in the on-hire workbook are entered by hand. Anything
that "refreshes" them destroys work nobody can rebuild. Read them,
write them back, leave them alone.

**Don't round-trip his .xlsm files through openpyxl.** They carry VBA,
logo drawings and Power Query connections that don't survive. Build a
new workbook alongside instead.

**Reading a text file in Python translates line endings unless you say
otherwise.** `open(p).read()` turns CRLF into LF, and writing it back
with `newline=""` then saves a Unix .bat. Use `newline=""` on the
*read* as well, or work in binary. This silently un-did the CRLF fix
twice in one sitting.

---

## How to talk to him

Plain Australian. Recommendation first, then the reasoning. He wants a
straight answer, not a survey of options. If something's wrong, say so
in a sentence and fix it — no long apologies. He's running a shutdown
and reads most of this on a phone.
