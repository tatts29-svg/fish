---
name: coates-site-suite
description: >-
  Stand up, extend or maintain a Coates site reporting suite — the pattern
  proven on the Cement Australia K2 Shutdown 2026 (Gladstone). Use this
  whenever Andrew starts a NEW job (a shutdown, project or tool store at any
  site — Ampol, MMG, Glencore, Boral, an Olympics project) and wants "the
  same setup as K2", or asks to add a report, a button, a My Gear page, a
  stores board, email packs, charge tracking, a hit list, a stock check
  sheet or a stocktake scorecard to an existing suite. Trigger on phrases
  like "set up the suite for <job>", "same as K2 but for <site>", "new job
  starting", "build me the tool store system", "add a report to the suite",
  "stores section", "fresh look", "walk-around sheet". Covers the
  numbered-button layout, SiteIQ data flow, drafts-never-send email
  discipline, My Gear + the code-gated stores board on the store Wi-Fi,
  printable counter sheets, two-laptop sync, and the one-zip update loop.
---

# The Coates site suite — the K2 pattern, portable to any job

This is the operating system Andrew runs a tool store with. It was built and
hardened on the Cement Australia K2 Shutdown 2026 and is designed to be
stood up again on the next job in an afternoon. Apply it alongside
`coates-reporting` (branding, report standards) and `coates-way` (voice,
decision lens) — this skill carries what those don't: the architecture, the
discipline rules, and the traps already paid for on K2.

## What a suite is

One folder on the site laptop. Everything in it. No internet needed to run.

```
01_Reporting_Suite\
  00_..._53_*.bat        numbered buttons - the ONLY interface Andrew uses
  *.py / *.ps1           the engines behind the buttons
  Data_SiteIQ\           fresh SiteIQ exports dropped here each morning
                         (previous\ keeps dated copies automatically)
  Data_Baseplan\         the SECOND invoice stream's raw pulls (see below)
  Reports\<date>\        one folder per day: Pages\ PDF\ Emails\
  K2 DAILY REPORTING\    company email packs + the control register
  K2_MASTER_EQUIPMENT_PRICING.xlsx   the master file - ONE tab, keyed on
                         ITEM_NUMBER: descriptions, plant IDs, replacement costs
  Coates_Report_Recipients.xlsx      who gets which report (never in code)
  <Job>_Daily_Email_Report_Allocation.xlsx   company pack routing
  Gear_Lookup\           My Gear (index.html) + the stores board (stores.html)
                         served on the store Wi-Fi
  Coates_K2_Charge_Reporter\         charges: transport, damage, consumables
  Updates\               backups + mygear_history.json (the movement scoreboard)
  Docs\ / _Archive\      where 51_TIDY files read-once paperwork & spent zips
  stores_code.txt        the stores board code   } on-site-only, PROTECTED,
  manager_code.txt       the money-view code     } never in git, never in zips
  shutdown_end.txt       the finish date the ordering maths runs to
  START_HERE.txt         the human manual - numbered, plain
  HOW_IT_WORKS.html      the visual process map
```

**Everything is a numbered .bat.** Andrew never opens a terminal or edits
Python. New capability = new number. Numbers are never reused or renumbered
— "what you knew still works" is a promise the suite keeps. If two update
streams ever claim the same number, the newer capability takes a NEW number
and the old file retires itself. When a button's job GROWS (K2: 10 was a
gas/radio right-sizer, became the full plant + tool store + consumables
utilisation report), point the button at the new engine, keep the old
script on disk still runnable, and say in the .bat header what happened
and that nothing was lost. High numbers as of K2: 47 personal QR cards,
48 add-contacts, 49 separate invoice tracker, 50 lifting/service charges,
51 tidy the folder, 52 pack for Claude, 53 which machine.

## The daily flow (what the suite does each morning)

1. **Pull** — SiteIQ exports (RENTAL_STOCK, ON_HIRE, TRANSACTIONS,
   SALES_STOCK, STOCKTAKE, DAILY_SUMMARY) land in Downloads;
   `28_PULL_SITEIQ_EXPORTS` files them into `Data_SiteIQ\`.
2. **Build** — `00_RUN_EVERYTHING` (or `37_PICK_A_REPORT` for one thing):
   aligns the workbook, builds every report as framed HTML + PDF, rebuilds
   My Gear AND the stores board, drafts every email.
3. **Check** — `35_CHECK_REPORTS` flags blanks, `{placeholder}`, `None`,
   `nan`, `$nan` before anything is sent.
4. **Send** — nothing sends itself, ever. Drafts sit in Outlook until
   Andrew presses Send.
5. **Serve** — `05_START_GEAR_LOOKUP` serves Gear_Lookup on the store
   Wi-Fi all day. Window stays open.

## The two pages on the store Wi-Fi

**My Gear (`index.html`)** — the crew's page. Enter/scan your ID, see YOUR
gear only: score ring, badges, crew comparison, items longest-held-first,
day colours, compliance chips, return clearance. Save picture (a PNG
*drawn* on a canvas from the data — never screenshotted from the DOM, so
it can't inherit a layout bug or catch a counter mid-animation) and Print
A4 (its own #printsheet renderer). Landing page: live counters (active
users, not database rows), movement arrows (day-on-day rank, from
`Updates\mygear_history.json` — no history means NO arrow), the crew
catalogue, guides, and a floating pill stack bottom-right (RADIO and GAS
as quiet dark pills, CONTACTS coloured and ringed — if three things glow,
nothing does).

**The stores board (`stores.html`)** — the counter's page, behind a code.
One door for everybody: the stores code typed into the SAME ID box the
crew use drops the team on the board (handed over via sessionStorage,
never the URL, cleared on use). Panes: product groups (with family
seams), chase up, hit list, print & send, fresh look, stocktake (with
not-found sheets), walk an aisle, day v night, consumables, standards,
arriving, plant (with on/off toggle), idle plant — and Money, which only
the manager code can see.

### The gate — encryption, not enterprise auth (describe it honestly)

- Stores payload encrypted under the stores code; manager payload
  encrypted under the manager code; a key blob (stores code encrypted
  under the manager code) lets the manager code open the whole board.
  **Neither code ever appears in the page** — sweep every build: strip
  the base64 blobs, count occurrences of both codes, expect zero.
- Money is not hidden from the stores code — it is **not decryptable**
  with it. Rates/SHIFT_RATE never render in any crew- or stores-reachable
  view, whatever the data source.
- The stores code forgives case; the manager code is a password and is
  checked raw AND upper (upper-casing a mixed-case password destroys it —
  paid for: the manager path was "verified" in Python, where the JS
  upper-casing didn't exist; only a browser test caught it).
- **Every letter code gets a numeric phone-keypad twin** (NOIS ⇢ 6647),
  wired like the manager key: a blob the twin decrypts the real code out
  of. Reason: below.

### The code files — the trap that cost an evening

`stores_code.txt` and `manager_code.txt` live on each machine, are
PROTECTED from updates, and are **created with defaults on first run**
(`2026` / the agreed manager password). The FILE wins, always. Two
machines can therefore be keyed differently while everyone "knows" one
code. Rules: the build prints the code it wired, masked but diagnostic —
`Stores door: code N*** (4 chars, from stores_code.txt) | phone keypad
twin 6*** works too` — and if the stores-page build throws, the door is
DEAD (no code opens anything), so that failure prints a banded WARNING,
never a one-line NOTE that scrolls past.

### The counter's tools (all verified in a browser before shipping)

- **Hit list** — the four overdue rules, identical to the report pack's
  daily hit list (one standard, never two): radios, gas monitors and
  Milwaukee batteries back daily; Milwaukee tooling three days. Flagged
  once PAST the allowance (days > N), so a nightshift radio isn't accused
  an hour before it walks back in. Named by PERSON (you chase a bloke,
  not a description), grouped so one visit clears a name. Collected
  BEFORE the crew-catalogue filter — a DO-NOT-HIRE item out with a crew
  is exactly what this list must show. The tab pulses — the only looping
  motion on the board, because it means "walk somewhere".
- **Print & send** — pick radios / gas / hit list / one company / one
  person → preview → Print (the device's print menu is where the Wi-Fi
  printer lives) or Email (mailto: opens the phone's Outlook with the
  report written INTO THE BODY — an offline page cannot attach a file, so
  the body is the report and long lists truncate honestly: "...plus 47
  more - see the printed report", capped ~1700 chars).
- **Printable sheets** — ALL printed output goes through ONE frame
  function (brand rule, title, as-at, footer) so every sheet lands in the
  tray as the same family of document. Clipboard sheets carry write-in
  furniture (ruled boxes, tick squares, signature lines) — paper is the
  interface on purpose; the reorder number is a human decision the page
  collects, not makes. The set: consumable stock check & reorder (every
  line A–Z: on shelf, used, last count qty/date/by, COUNTED NOW box,
  REORDER box); per-aisle stocktake not-found sheets SPLIT BY STATUS —
  available items are the hunt list (FOUND tick box + where/note line),
  on-hire items get their own "do not hunt" sheet. That split reframed
  K2's number: "329 uncounted" was really a 30-item hunt — the rest were
  on hire, doing their job.
- **Fresh look** — a raw SiteIQ export downloaded onto THE PHONE, read on
  the spot: the page carries its own .xlsx reader (a faithful port of
  zlib's reference inflate + minimal zip walk + just-enough XML — no
  library, no network; proven cell-for-cell against openpyxl, 19,323
  cells, zero mismatches). Everything stamped INTERIM (pane, print band,
  and the print header's as-at becomes the export's own pulled time);
  lives on that phone only; the morning build stays the record; raw
  descriptions come out in Andrew's clean names because the rename map
  (~4,400 renames keyed on ITEM_NUMBER) and plant IDs ride in the
  payload; SHIFT_RATE never renders.
- **Consumables pane** — same engine as the utilisation report (shared
  module, so counter and manager can never tell different stories).
- **Entrance motion only** — tiles count up once (with a HARD 900 ms
  timeout writing the real parsed value back — animation frames can
  simply not arrive in throttled webviews, and the first cut left every
  tile at ZERO; worst failure must be "right number instantly"), bars
  grow once, scores punch once. Working panes hold still. Print media
  disables all of it; reduced-motion phones skip the lot.

### Presentation rules that hold everywhere

- **One ordering rule**: companies A–Z, hirers inside a company A–Z, a
  person's items longest-held first with A–Z breaking ties — on screen
  AND on paper, so the counter finds a name by eye.
- **Family seams**: inside any aisle/category over 25 lines, browsing
  shows an orange sub-heading per family (the name minus its trailing
  size — "1in Drive Impact Socket", 47 sizes). Search results and small
  aisles stay flat; seams there are noise. Same function on the crew
  catalogue and the stores board. Don't go deeper than the data honestly
  carries — SiteIQ's PRODUCT column is mush; inventing structure is lying.
- **Cut lists say so**: "Showing the first 60 of 253 — the rest are in
  SiteIQ." A silent cut reads as "that's everything".
- Item number on every on-hire row, everywhere (screen, paper, email
  body); Plant ID as the orange pill wherever the master allocates one —
  "bring number 41 back" is how machines are asked for.

## Utilisation & consumables — the analysis rules

- **"Used" is three signals, not one**: charged (TRANSACTION_CHARGES) OR
  moved without charge (CUSTOMER_CONTRACTOR_EQUIP) OR on hire right now.
  Charge-sheet-only reported K2's radios at 0% when the true figure was
  80% — free-issue gear never touches the charge sheet, and continuous
  hires from before the report period are in neither sheet.
- **Two numbers both called "utilisation"**: OUT NOW (snapshot) and EVER
  MOVED (since shut start). Label both; cutting a fleet on the wrong one
  is how a store runs out of what it just sent back.
- **SALES_STOCK is TWO row types in one sheet**: stock lines (no
  SALES_DATE — the shelf: available/min/reorder) and sale rows (a date, a
  quantity, a person; AVAILABLE=0 means "sale row", not "none left").
  Split first, always. Quantities and dates are TEXT.
- **Reorder points**: SiteIQ's MINIMUM/REORDER fields may all be zero
  (nobody set them). Never pretend a trigger came from SiteIQ — compute
  from burn: rate since the line FIRST moved (not since shut start),
  against days left to `shutdown_end.txt`. Under 24 h of cover prints
  "under a day", never "0 days".
- **Twin SKUs**: the same item on two SKU records (live one holding
  stock, duplicate on zero) trips false "Stock Low" flags. SiteIQ won't
  merge them — the engine FOLDS them (duplicate's stock/counts/sales
  absorbed into the live record; a Stock Low status never survives a fold
  that proved the stock exists). Arithmetic-neutral on totals; genuine
  physical variances still surface.
- **Count fairness**: before calling a stocktake line wrong, subtract
  what sold AFTER the count date. A count from the 25th should differ
  from Friday's stock.
- **"Stock Low" is a claim, not a fact** — on K2, ten flags, zero empty
  shelves. Lead with "do not order these", then the real order list.

## The rules that make it trustworthy — apply to every new suite

- **Real data only.** A value not in the source shows `TBC` or a dash —
  never a guess, never $0-fill. Missing exports are named in plain English.
- **Nothing sends by itself.** Every email lands as a draft.
- **Nothing is overwritten.** Dated folders append-only; replaced code
  backed up; live registers never touched by updates or sync.
- **Idempotent everywhere.** Safe to run twice, always.
- **The company name ties data, folder and recipients together.**
- **Fails loudly, in plain English** — and if a failure kills a whole
  capability (the stores door), it shouts in a band, not a NOTE.
- **Code and data are different things.** Code syncs newest-wins; data
  diverges on purpose and is only compared, never auto-merged.
- **Two invoice streams never share a dollar.** Separate-invoice gear by
  BARCODE ONLY (SUB prefix + explicit list) — never description, never a
  count.
- **The fixed oversight Cc lives in TWO places** in the routing workbook
  (Summary FIXED CC block + each company row); add via the idempotent
  tool, never silently in the builder.
- **The pages are read-only.** Nothing a phone does can corrupt SiteIQ or
  the registers. That property outranks any feature. "Update from the
  phone" = the phone couriers an export to the laptop (or Fresh look
  reads it locally); the laptop stays the only brain.

## Standing up a NEW job — the checklist

1. **Copy the suite folder** from the last job. Delete `Reports\`,
   `Data_SiteIQ\*` contents, charge register rows, `Gear_Lookup\` day
   outputs, `Updates\mygear_history.json`, and BOTH code files (so the
   new site mints its own; then immediately set them — see 5b).
2. **Rename the job constants**: site/customer name, report titles,
   workbook filename, routing workbook. Grep the old customer name across
   `.py`. Set `shutdown_end.txt` to the new finish date. Update
   SHUT_START in the shift/battle and utilisation modules.
3. **Rebuild the master file**: ONE tab, keyed on ITEM_NUMBER; storage
   unit, plant ID, original + NEW description, replacement cost, price
   source, category. Unpriced = daily GAP list.
4. **New recipients workbook** — start empty; companies switched on
   deliberately. Nothing on = nothing drafted.
5. **My Gear + stores board**: new Wi-Fi, network check, rebuild posters
   (`32`). Serve plain http — a cert warning in front of 100+ workers
   kills adoption (paid for on K2: "everyone had a security lock, no one
   wanted to use it"); phones' NATIVE camera reads the personal QR cards
   (`47`) with zero warnings; in-page scanning is the only thing HTTPS
   buys and it isn't worth the interstitial. Serve on the network the
   PHONES are on. If the address changes, re-run 32 AND 47.
   **5b. Set the codes**: write the agreed stores code into
   `stores_code.txt` and the manager password into `manager_code.txt` ON
   EVERY MACHINE THAT BUILDS, then run 04 and READ THE MASKED LINE it
   prints. The file wins — a machine left on the default answers to
   `2026` while the whole site is told the real code.
6. **First morning dry run** before any customer is on: pull, build,
   `35_CHECK_REPORTS`, open the drafts, read one end to end.
7. **Second laptop**: `39_SYNC_PCS` + `40_WHAT_VERSION_AM_I` until both
   show the same version code. Run `21_CHECK_MY_SETUP` FIRST on any new
   machine (kills Read-only bits and stale `~$` locks).

## The improvement loop (how changes reach the site)

Andrew asks in chat → Claude sends back **one flat cumulative zip**
(complete files only, never diffs; never data, never registers; includes
`SUITE_VERSION_MASTER.txt`) → Andrew drops it in the suite folder and
double-clicks `46_APPLY_UPDATE` → runs the affected build button. The
applier backs up, skips protected files, compile-checks, auto-rolls-back.
`39_SYNC_PCS` carries it to the other laptop.

Claude-side discipline for every zip: keep the zip CUMULATIVE for the day
(his machines may have skipped intermediates); test-apply on a pristine
baseline extracted from git — and make sure the extraction actually
happened (a failed `cd` before `git archive` produced a fake "already up
to date" pass TWICE on K2); prove protected files survive; build My Gear
end-to-end on the applied copy; version parity on both sides.

## Verification discipline (what "verified" means here)

- **Browser-verify behaviour, never just Python.** The gate bugs
  (upper-casing the manager password; STORES_TAG dead because a build
  block threw) were invisible outside a browser.
- **`node --check` the BUILT pages after every build.** Python eats
  JavaScript escapes (`\'` and `\n` both killed the whole script block in
  one day). Anything regex-heavy embedded in Python lives in a RAW
  string. Reworded prose beats re-escaped apostrophes.
- **Rasterise the PDF; never trust an HTML screenshot** for print output
  (kiosk gradient-text failure; near-invisible print greys; bar tracks
  printing as slabs; a 90 px dead gap from a hidden element's padding —
  all caught only in the rasterised page).
- **Check the instrument before the artwork.** Probe false-failures on
  K2: injected into a `</body>` inside a JS string (use `rpartition`);
  grepped for a literal the probe itself contained; read counters
  mid-animation; headless clamps viewports to ~500 px so narrow
  "phone" screenshots cut the image, not the page — measure
  `scrollWidth` vs `clientWidth` instead of eyeballing.
- **Cross-validate parsers cell-for-cell** against a reference reader
  before shipping (the JS xlsx reader vs openpyxl).
- **Sweep every stores build for plaintext codes** (strip blobs, count,
  expect zero) — the code leaked twice on K2: once as a `dec('CODE',…)`
  literal, once inside the COMMENT explaining the previous fix.
- **Provers assert what the design promises, not what one day looked
  like.** The pack register is a LEDGER (a company re-appears when its
  status changes); "exactly one row per company" failed the first day a
  held pack was fixed and re-run — which is the register working.

## Traps already paid for — never repeat

- **`.format()` on a bare literal inside a `+` chain** binds to the LAST
  literal only. Parenthesise the whole concatenation; sweep output for
  `{placeholders}`.
- **Inline styles beat the theme stylesheet** — all inline ink through
  theme-aware constants.
- **Blank is not zero.** A never-filled cell renders as dash + "not
  logged", not $0. "Trued to the invoice" = invoiced days appear as real
  rows.
- **One re-issue must not churn forever** — append-only filing recognises
  an identical alternate as already filed.
- **A PDF-engine timeout is a stall, not a verdict** — retry with a fresh
  profile.
- **Email weight needs MIME headroom** — bytes × 1.37 + 0.5 MB vs 10 MB.
- **Never two parallel update streams**; 52 + per-file merge if it
  happens anyway.
- **Dates in registers are `datetime` objects, never strings.**
- **`inputmode="numeric"` is a lockout, not a convenience** — real hire
  IDs carry letters (18479CEM). Full keyboard, caps-biased; lookups try
  typed then upper-cased; barcode scanners must not strip letters
  (require ≥3 digits in a token so a label word never reads as an ID);
  and any letters-only CODE needs its numeric keypad twin.
- **Escaped JS inside Python strings**: see verification discipline —
  raw strings + node --check, every time.
- **Grouping keys need a real separator** — `\u001F` (the ASCII unit separator), written as a
  visible escape, never a bare concat and never a raw control byte in
  source.
- **Don't guess network topology; ask.** K2 settled: one dual-band
  router, 4G in, laptop ethernet + Wi-Fi, posters carry the Wi-Fi
  address.
- **Don't read stale report folders as truth.**
- **Verify QR codes by decoding them.**
- **Australian dates**, parsed explicitly. On-hire day counting inclusive.
- **A kill-a-capability exception must shout.** `_x = ''` before a try
  block, silently swallowed, turns into "no gear found" at the counter
  with no clue on either screen.
- **Prefer the boring thing that works.**

## Branding — every output

`POWERED BY SITEIQ` · `Author: Andrew Fisher` · Coates orange `#F26222` on
near-black (screen) / white with the orange rule (print) · dates as
`11 Jul 2026`, metric, 24-hour · data-as-at stamp in every footer (an
interim sheet carries ITS OWN pulled-at time, banded INTERIM) · RAG only
with root cause, owner, deadline · exceptions first, full lists behind ·
anonymous person-level comparisons (no worker ever sees another worker's
name) · every printout through the one shared frame.
