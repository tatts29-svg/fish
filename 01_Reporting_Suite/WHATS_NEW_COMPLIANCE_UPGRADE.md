# Compliance on every line — what changed

**Coates | Cement Australia K2 Shutdown 2026 — Gladstone**
Author: Andrew Fisher | POWERED BY SITEIQ | 25 Jul 2026

---

## The short version

Every hire line, on every report and on My Gear, now carries its own requirement
underneath the item name:

| Badge | Shows on | Means |
|---|---|---|
| 🔵 **CURRENT TAG COLOUR: BLUE · ELECTRICAL** | 564 assets | Must carry a current blue inspection tag with legible dates |
| 🔵 **CURRENT TAG COLOUR: BLUE · RIGGING** | 666 assets | Same tag, plus legible ID and Working Load Limit |
| 🔵 **CURRENT TAG COLOUR: BLUE · HEIGHT SAFETY** | 257 assets | Harnesses, lanyards, anchor straps, tool tethers |
| 📝 **DAILY PRE-START AND LOGBOOK ENTRY REQUIRED** | 83 assets | Operated plant — no entry, no operation |
| ↺ **RETURN DAILY…** | 536 assets | Gas monitors, radios and battery gear due back that shift |

**2,098 of 5,225 assets** now carry a compliance line. On today's 500 on-hire
items that lands as **191 lines with a check**.

Plus: a **daily safety conversation** on the Safety Assurance report and the
Daily Brief, and the **Log Books site notice** rebuilt as a clean page in the
safety pack.

---

## Where it comes from — one file, as always

`K2_MASTER_EQUIPMENT_PRICING.xlsx` picked up four new columns:

```
ELECTRICAL_TAG | RIGGING_TAG | LOGBOOK_REQUIRED | RETURN_REQUIREMENT
```

`Y` turns a badge on. `N` or blank turns it off. **No data in the column,
nothing in the report** — nothing is guessed at render time.

**Got one wrong?** Change the cell in the spreadsheet and run the reports
again. That's it. Don't touch any code.

Lookup order for any line: exact `ITEM_NUMBER` first, then the description
matched against the master — so barcode-keyed tables (stocktake run sheet,
team pack) get it right too.

---

## The tag colour

Lives in **one place** — `TAG_PERIODS` at the top of `equipment_compliance.py`:

```python
TAG_PERIODS = [
    (date(2026, 7, 1), date(2026, 8, 31), "BLUE", "#2F80ED"),
]
```

When the inspection colour rolls over, add the next period there and every
report follows on the next run. Outside a known period the badge says
**CHECK INSPECTION TAG IS CURRENT** rather than name a colour we can't stand
behind.

---

## The daily safety conversation

Twenty topics on a 20-day cycle, keyed to the **report date** — so the store,
the crews and the client all see the same topic on the same day. Topic 1
(Daily Plant Logbooks) falls on 25 Jul 2026.

- Full version: **Safety Assurance** report, its own page, plus the Outlook body
- One-liner: **Daily Brief**, straight under the story card

**To pin a topic** after an incident, set `TOPIC_OVERRIDE = 9` in
`safety_conversation.py` and run. Set it back to `None` for the cycle.
Anything outside 1–20 is ignored with a note on the console — it will never
quietly show a topic nobody chose.

See the fortnight ahead any time:

```
py safety_conversation.py 2026-07-25
```

---

## New files

| File | What it does |
|---|---|
| `equipment_compliance.py` | The badges, the tag colour, the counts. One place. |
| `safety_conversation.py` | The 20 topics and the rotation. |
| `logbook_poster.py` | The Log Books site notice, vector HTML. |
| `SETUP_COMPLIANCE_FLAGS.py` | Fills the four columns for new gear. |
| `15_RUN_COMPLIANCE_FLAGS.bat` | Double-click version of the above. |
| `Coates_LogBook_Site_Notice_A4.html` | Print it, laminate it, put it on the machine. |

Existing scripts changed: `master_equipment.py`, `build_company_onhire_report.py`,
`BUILD_MY_GEAR.py`, `build_plant_dashboard.py`, `build_clean_report.py`,
`00_RUN_EVERYTHING.bat`.

---

## When new gear arrives

`00_RUN_EVERYTHING.bat` now runs the flag setup as step 0. It only fills rows
where all three Y/N columns are blank — brand-new gear — so **anything you've
corrected by hand stays corrected**. Nothing new? It leaves the file alone and
writes no backup.

To preview: `15_RUN_COMPLIANCE_FLAGS.bat --dry-run`
To redo everything from the rules: `15_RUN_COMPLIANCE_FLAGS.bat --force`

A timestamped backup is written beside the master before any save.

---

## Two things worth a look

**1. Tool lanyards are badged HEIGHT SAFETY.** 257 tool tethers
(`Tool Lanyard - Technique - SWL 7 kg` and the bungee version) carry the blue
tag under a HEIGHT SAFETY label rather than RIGGING. They're dropped-object
tethers, not lifting gear — but they are inspection-tagged. If you'd rather
they didn't badge at all, set `RIGGING_TAG` to `N` for those rows.

**2. Diesel generators and battery plant get a logbook badge, not an
electrical tag.** The call was that they're inspected through the log book and
their own service regime rather than the test-and-tag register. A 100 kVA
generator's outlets and RCDs are arguably in the electrical regime — worth your
confirmation. One column, 14 rows, if you want it changed.

---

## One pre-existing thing this upgrade didn't cause

`build_cost_snapshot.py` and the plant reports look for the K2 workbook
(`.xlsm`) beside the scripts. It isn't in this folder, so:

- **RightSize / Plant Audit / Site Plant** show every category as
  *"Not in Plant Register"*
- **Executive Summary** — the Forecast v actual table is missing
- **Weekly Rollup** — empty

Drop the K2 workbook back in the folder and those fill themselves in. Flagging
it because it fails quietly — the reports still build and still look finished.


---

# Plant IDs, and how the pages hold up as the fleet grows

*Added 25 Jul 2026*

## The orange Plant ID, everywhere

Coates allocates a short Plant ID to the machines crews actually talk
about — *"bring number 41 back"*. It lives in the master file's `PLANT_ID`
column, and it now shows as an orange pill beside the asset number
**wherever an asset appears**:

| Where | Before | Now |
|---|---|---|
| Company on-hire reports | ✅ | ✅ |
| Site plant / audit / right-size | ✅ | ✅ |
| Executive summary, daily brief | ✅ | ✅ |
| CLEAN workbook (Plant ID column) | ✅ | ✅ |
| Plant dashboard | ✅ | ✅ |
| **Activity & Accountability pack** | ❌ | ✅ |
| **My Gear (the crews' phones)** | ❌ | ✅ |

The two that were missing are the two that mattered most — the new pack,
and the page a crew member opens on their phone. My Gear now reads
`Item 1320990  ID 41`.

**74 assets carry a Plant ID today**, and 235 pills render across the
current packs. Fill more in and they appear on the next run — one column,
no code.

It's one helper now (`equipment_compliance.asset_html`), so an asset
number can't be shown one way on one report and another way somewhere
else.

## The plan for growth — tested, not promised

`PAGE_FLOW_STRESS_TEST.py` (or `16_RUN_PAGE_FLOW_TEST.bat`) builds report
pages at **1x, 3x, 10x and 25x** the current fleet — every compliance
badge lit, every asset carrying a Plant ID, the longest descriptions we
hold — lays them out through the real paginator in a real browser, and
measures every page.

It **fails the run** if any page has a column off the sheet, anything cut
off, a heading stranded at the foot of a page, a blank page, or a page
missing the team strip.

Result today:

| Scale | Hire lines | Pages | Avg fill | Defects |
|---|---|---|---|---|
| x1 | 24 | 3 | 68% | 0 |
| x3 | 72 | 6 | 83% | 0 |
| x10 | 240 | 16 | 96% | 0 |
| x25 | 600 | 39 | 97% | 0 |

**Pages get fuller as the fleet grows, not messier** — a long table packs
a page densely, so 25x the gear reads better than today's.

### Why it holds

- **A long table splits at a row boundary, never mid-row**, and repeats
  its column headers on every continuation page. It does not jump to a
  fresh page and leave white space behind it.
- **A section heading never sits alone at the foot of a page.** It
  travels with its rows, and a final sweep catches any that slip through.
- **More gear makes tables LONGER, not WIDER.** The Plant ID pill and the
  compliance badges wrap inside their own column, so no column can ever
  be pushed off the sheet. This was a real failure once — the badges
  pushed Replacement Cost off the page — and it's now the thing the test
  watches hardest.
- **Each hirer still starts a fresh page.** More people means more pages,
  never two mixed on one.
- **Sparse tails get pulled back up** onto the page above when they fit,
  and split tables rebalance so a section's last page never looks
  abandoned.

Run the test after any layout change, or any time a lot of gear has gone
in and you want to be sure the packs still print clean.
