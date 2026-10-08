# v9.01 staff picker — reconciled design (DRAFT, before Andrew's yes on the mock-up) (8 Oct 2026, ~12:15 AEST; UPDATED ~12:25 by Andrew's own words below)

## ANDREW'S UPDATE, 8 Oct ~12:25 AEST — this OVERRIDES section 3 wherever they differ
> "so based off roster they are the selection of people we can use. So select person and then select roles he will play.. As in
> spotter/Forklift for that Reference.. i want to go back through past history too and look at it and assign people to each reference"

1. **The roster is the pick list for each date** (section 1): the people rostered that day (plus the regulars, marked if not
   rostered) are the people offered.
2. **Allocation is per REFERENCE, with roles.** For each reference on the day (grouped under its load, in run order): tap a person
   chip, then tap the role chips that person plays for that reference — Spotter · Forklift · Installer · Escort (the existing
   crew883 roles; one or more; one person with several roles is ONE person). Show it as one row per reference: "Load 3 · WC29 ·
   [<name>: Spotter, Forklift] [<name>: Installer] [+ person]". This writes the EXISTING crew883 per-reference plan
   (`crew883SavePlan(day, ref, {people:[{slot, roles}], …})`) with each person's slot = their position in that day's `names`
   (appended if new, never reordered) — no new per-load document is needed. The load-level view just summarises its references.
3. **Past history:** the same works on any earlier date. Opening a past day offers that date's roster (the labour rows recorded
   for it) and lets him assign people and roles to each reference that was delivered or removed that day. Past arrival times are
   never inferred (v8.83 rule) — only who and which roles. A "Days to fill" list (past days with references but no crew) makes it
   quick to work back through history.
4. Everything else in this spec stands (Staff on roster grid, roster suggestions only on tap, words, checks, traffic-control
   service status read-only, no money, no writes on viewing).

The mock-up must show: (a) the roster grid; (b) one day's references with a person picked and the role chips open for them;
(c) a PAST day (e.g. Mon 14 Sep 2026 — the record already has crew plans P01, P03, P04, P05, P33, WC05 for that day with
unnamed Spotter/Installer rows) with its roster names offered and one reference assigned; (d) the phone layout of (b).

Author: Andrew Fisher. Inputs: Andrew's words (8 Oct ~11:25 AEST: "also with days if there 9 loads for that day. need a easier
selection on what days are set for these each one.. section of people know staff onsite with installers and me so selection of
staff and allocation should be set and we should be able to pick someone rather than not"; relayed ~12:00: the selector should
use the staffing forecast already supplied, so people expected on a date can be selected for each task on that date), the design
workflow (wf_73706498-ab2), its two critiques, and Codex's forecast review (`review_v901_forecast/README.md` at 7f178c20).

## Words on the page
- **Staff on** — the people on site for a day (Andrew + installers, plus anyone else rostered that day).
- **Allocated** — the people given to a load.
- "Crew" stays only for the existing Crew plan fold (requirements by role). Never "install team" for the pick list.

## 1. The pick list (who can be picked on a date)
- **Regulars:** DATA.team.people in groups 'site' and 'install' (today: Andrew and the four installers). Never the fencing crew, iEDM, transport, account or office groups.
- **Rostered on that date (the forecast):** labour rows from `ourCosts()` for the exact ISO date with `usable === true` and
  `rosterIncludes858(row)`. Hours-only rows give a name with the window "time unknown". Group placeholders never become a named
  person. Nothing from the workbook, raw DATA.workforce.lines or contacts. A rostered name not in the regulars (e.g. a race-weekend
  extra) is offered on that date as an extra chip.
- No dated rows and no saved day = "availability unknown" (never zero).

## 2. Staff on for a day — one roster grid, one place
- A **Staff on** section at the top of the Timeline's day view (and its fold for other days): rows = every day from today to the
  last demob day (days with no loads show "0 loads" and can still be set), columns = the pick list (first names as heads; full
  names in aria-labels/titles). Today's row first and highlighted.
- Each box is one 44 px tap, saved at once. **Ticks are the count** ("4 on"); a small "+ others" stepper for people not on the list
  ("4 on · +2 others"). The old number box shows only where a day already has a typed count.
- **Roster suggestions:** a not-set day shows its rostered names as hollow chips and one tap **Use roster** (writes only on the tap);
  one **Use roster for every not-set day** tap. Never ticked automatically. "Same as <nearest set day above>" when the crew repeats.
- Storage (Codex's API, compatible with v8.98/v8.99 tabs): `crew883/<day>/availability` via `crew883SaveDay(day, count, names)`.
  A tick appends the full name to `names` (never reorders; slots keep their meaning); an untick blanks that position (never splices).
  Count = max(saved count, distinct non-blank names); an untick lowers the count only if the count equalled the named count before.
  Saved day documents win exactly as saved (count 0, blank slots, order).

## 3. Allocating a day's loads — one grid on the Truck flow card
- Rows = the day's loads in run order ("3 · WC29 · 09:30"), deliveries and removals (removals flagged), from the unfiltered
  `dpLoads(d)` IDs. Columns = that day's Staff on (first names). One 44 px box per person, "Same as above" per row, sticky header.
- A 9-load day: tick the day's 4 people (or one Use roster tap), then 2 taps a load = about 20 taps, on one screen, no typing.
- Each load line on the Timeline shows one read-only line: "Allocated: <first names>" or "Allocated: not yet" (edit link) and
  "Change" jumps to the grid row. View link: the line shows only when there are picks.
- Storage: new additive `flow891/<day>/crew/<encodeURIComponent(loadId)>` = {kind:'flow891', day, ref:'', loadId, people:[full
  names], by, at}; people must be on that day's Staff on or rostered; [] = nobody allocated (never "none needed"). Written with
  mayWrite + whoAmI once, all documents validated before any is written, one bump.
- crew883 per-reference plans stay the requirement (rows and roles) and are not rewritten. Badge "n of N": N = the most plan rows
  among the load's references, else the site rule of 2, labelled "· site rule" or "· Crew plan".

## 4. Checks (each fact once)
- The day's load order is the sequence: a person on several loads is fine unless planned windows overlap in different areas or the
  2-trucks-at-once / 2-people-per-unload limits are broken. Estimated windows never clear or raise a check.
- Flag: someone allocated but not on that day; crew saved for a load no longer on the day (with Clear); a typed name matching a
  list name counts once.
- Pre-dispatch: "Load n: <names>" / "Load n: not allocated yet" as report lines, not hold-the-truck warnings.

## 5. Traffic control (Codex v9.03, no-charge V8s service)
- Shown read-only beside each load row: To confirm / Not required / Required — V8s to organise / Arranged by V8s. Never in a count.

## 6. Prints and messages
- Drivers / Install sheets and each run sheet: "Allocated · Load 3: <full names>" once per load (full names).
- Daily install message: each load's notes "Allocated: …" or "not allocated yet".
- "Who is printing?" offers the pick-list names as chips plus "Someone else".

## 7. Never
- No record write on opening, viewing, changing date or printing. No Finance, attendance, hours, rates or cost writes. No money
  figure changes. Unknown stays unknown. One person with several roles is one person.

## 8. Acceptance (Codex's A–J verbatim, plus)
A–J from review_v901_forecast. Plus: 7 Oct's saved {count:4, names:[]} reads "4 on · 4 not named" and a first tick keeps 4;
names ['Bob','','Jim',''] + one tick; a one-load day gets the grid row; 8 Oct's two WC09 trucks get separate rows; filtered view
shows picks read-only; a refused last document writes nothing; phone 390 px with no horizontal overflow; view link has no
controls.

## Open question for Andrew (in the mock-up message)
"Which days are set for these each one" — which days each **person** is on (the roster grid), or which day each **load** goes on?
The mock-up shows the roster grid; a load can already be moved to another day from its own date box.
