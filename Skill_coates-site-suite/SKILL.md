---
name: coates-site-suite
description: >-
  Stand up, extend or maintain a Coates site reporting suite — the pattern
  proven on the Cement Australia K2 Shutdown 2026 (Gladstone). Use this
  whenever Andrew starts a NEW job (a shutdown, project or tool store at any
  site — Ampol, MMG, Glencore, Boral, an Olympics project) and wants "the
  same setup as K2", or asks to add a report, a button, a My Gear page, email
  packs, charge tracking or a stocktake scorecard to an existing suite.
  Trigger on phrases like "set up the suite for <job>", "same as K2 but for
  <site>", "new job starting", "build me the tool store system", "add a
  report to the suite". Covers the numbered-button layout, SiteIQ data flow,
  drafts-never-send email discipline, My Gear on the store Wi-Fi, two-laptop
  sync, and the one-zip update loop.
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
  00_..._46_*.bat        numbered buttons - the ONLY interface Andrew uses
  *.py / *.ps1           the engines behind the buttons
  Data_SiteIQ\           fresh SiteIQ exports dropped here each morning
                         (previous\ keeps dated copies automatically)
  Reports\<date>\        one folder per day: Pages\ PDF\ Emails\
  K2_MASTER_EQUIPMENT_PRICING.xlsx   the master file - ONE tab, keyed on
                         ITEM_NUMBER: descriptions, replacement costs
  Coates_Report_Recipients.xlsx      who gets which report (never in code)
  <Job>_Daily_Email_Report_Allocation.xlsx   company pack routing
  Gear_Lookup\           the My Gear page served on the store Wi-Fi
  Coates_K2_Charge_Reporter\         charges: transport, damage, consumables
  Updates\               backups: sync, update, contact and poster backups
  START_HERE.txt         the human manual - numbered, plain
  HOW_IT_WORKS.html      the visual process map
```

**Everything is a numbered .bat.** Andrew never opens a terminal or edits
Python. New capability = new number. Numbers are never reused or renumbered
— "what you knew still works" is a promise the suite keeps.

## The daily flow (what the suite does each morning)

1. **Pull** — SiteIQ exports (RENTAL_STOCK, ON_HIRE, TRANSACTIONS,
   SALES_STOCK, STOCKTAKE, DAILY_SUMMARY) land in Downloads;
   `28_PULL_SITEIQ_EXPORTS` files them into `Data_SiteIQ\` (previous copies
   kept, dated).
2. **Build** — `00_RUN_EVERYTHING` (or `37_PICK_A_REPORT` for one thing):
   aligns the Excel workbook, builds every report as framed HTML pages +
   PDF, rebuilds My Gear, drafts every email.
3. **Check** — `35_CHECK_REPORTS` reads what was built and flags blanks,
   `{placeholder}`, `None`, `nan`, `$nan` before anything is sent.
4. **Send** — nothing sends itself, ever. Drafts sit in Outlook until
   Andrew presses Send (or types YES at `06_SEND_TODAYS_REPORTS`).
5. **Serve** — `05_START_GEAR_LOOKUP` serves My Gear on the store Wi-Fi all
   day. Window stays open.

## The rules that make it trustworthy — apply to every new suite

These are non-negotiable. Each one exists because its absence burned a real
day on K2.

- **Real data only.** A value not in the source shows `TBC` or a dash —
  never a guess, never $0-fill. Missing exports are named in plain English.
- **Nothing sends by itself.** Every email lands as a draft. The kill
  switches (`26_`/`27_`) turn draft creation off entirely.
- **Nothing is overwritten.** Dated report folders are append-only; a rerun
  writes `(2)` beside the first. Replaced code is backed up before
  replacement. Live registers (recipients, charges, requests) are never
  touched by updates or sync.
- **Idempotent everywhere.** Charges, contact imports, gear additions and
  update zips are all safe to run twice — re-running because "did that
  work?" must never double anything.
- **The company name ties data, folder and recipients together.** A DGH
  report can physically never go out on another company's list; failed
  checks hold the pack, never send it.
- **Fails loudly, in plain English.** Names the file it wanted and where it
  looked. A stack trace at 05:00 is not a message.
- **Code and data are different things.** Code syncs newest-wins between
  laptops; data diverges on purpose and is only ever compared and reported,
  never auto-merged.

## Standing up a NEW job — the checklist

1. **Copy the suite folder** from the last job. Delete `Reports\`,
   `Data_SiteIQ\*` contents, charge register rows, and the day outputs in
   `Gear_Lookup\` — keep every script and every .bat.
2. **Rename the job constants**: site/customer name, report titles, the
   workbook filename, `<Job>_Daily_Email_Report_Allocation.xlsx`. Grep for
   the old customer name across `.py` — it appears in report headers,
   email subjects and folder names.
3. **Rebuild the master file** for the new fleet: ONE tab, keyed on
   ITEM_NUMBER; storage unit, plant ID, original + NEW description,
   replacement cost (AUD), price source, category. Prices come from the
   contracted rates schedule — anything unpriced shows on the daily GAP
   list until fixed.
4. **New recipients workbook** — start empty. Contacts are imported from an
   Outlook CSV export (`33_UPDATE_CONTACTS`), companies switched on
   deliberately (`34_SWITCH_ON`). Nothing on = nothing drafted.
5. **My Gear**: new site Wi-Fi name/password, run the network check, rebuild
   posters (`32_UPDATE_POSTERS` reads the Wi-Fi off Windows). Serve plain
   http on the store router — a cert warning in front of 100+ workers costs
   more than it buys. Type-the-ID beats scan-the-card.
6. **First morning dry run** before any customer is switched on: pull, build
   everything, run `35_CHECK_REPORTS`, open the drafts, read one end to end.
7. **Second laptop**: `39_SYNC_PCS` + `40_WHAT_VERSION_AM_I` until both
   machines show the same version code.

## The improvement loop (how changes reach the site)

Andrew asks in chat → Claude sends back **one flat zip named
`K2_UPDATE_<thing>.zip`** (code, docs and posters only — never data, never
the workbook, never registers) → Andrew double-clicks `46_APPLY_UPDATE`.
The applier finds the zip itself, backs up what it replaces, skips
protected data, compile-checks everything and rolls the whole update back
automatically if anything is broken. Then `39_SYNC_PCS` carries it to the
other laptop.

When building an update zip for him: complete files only, never diffs;
flat zip, no nested zips; include `SUITE_VERSION_MASTER.txt` so
`40_WHAT_VERSION_AM_I` can prove both machines are current.

## Traps already paid for — never repeat

- **`.format()` on a bare literal inside a `+` chain silently breaks** —
  only the middle piece formats; headline numbers render as `{v}`.
  `35_CHECK_REPORTS` catches the symptom; don't write the cause.
- **Don't guess network topology.** Ask one question instead of inferring
  from a symptom. The settled K2 answer: one dual-band router, 4G in,
  laptop on ethernet + Wi-Fi (two addresses — the Wi-Fi one goes on
  posters), phones on the store SSID.
- **Don't read stale report folders as truth** — check live data before
  declaring something broken.
- **Verify QR codes by decoding them**, by position, not by trusting the
  encoder.
- **Australian dates.** `DD/MM/YYYY` parsed as US produces plausible wrong
  reports. Parse explicitly.
- **On-hire day counting** is `(today - on-hire) + 1`, inclusive.
- **Prefer the boring thing that works.** Live site. Anything adding a step
  for 100+ workers must earn it.

## Branding — every output

`POWERED BY SITEIQ` · `Author: Andrew Fisher` · Coates orange `#F26222` on
near-black `#1D1D1B` · orange rounded border on every page · dates as
`11 Jul 2026`, metric, 24-hour · data-as-at stamp from the export's
modified time in every footer · RAG only with root cause, owner, deadline ·
exceptions first, full lists behind.
