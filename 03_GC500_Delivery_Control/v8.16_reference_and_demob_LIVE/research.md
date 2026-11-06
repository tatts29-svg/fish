# GC500 reference drawer and demob: research findings

Author: Andrew Fisher · read-only research, 2 Oct 2026 (AEST). Nothing in the repo or the live record was changed.

**Source:** live page `scratchpad/live_now.html` (9,079,773 bytes). It was opened in headless Chromium through `toolchain/harness/open_page.js`, which aborted every write; the counters showed 0 blocked writes and 473 live GETs. Counts come from the page's own functions run against the live shared record (`allAssets()`, `effectiveDates()`, `branchOf()`, `dest782()` and so on), unless they are marked "DATA".

**Line anchors:** `Lnnnn` is a line in `scratchpad/demob/live_code.txt`. That file is the live page with only the very long data lines cut, so the line numbers match the live HTML.

**Working files** in `scratchpad/demob/`:
- `facts.json`: one row per reference.
- `zones.json`: the island classification.
- `census.json`: the drawer wording counts.
- `days.json`: the Timeline days.
- `photos_completion.json`
- `extra.json`
- `probe.js`, `probe2.js`, `zones.js`: the scripts that produced them.
- the screenshots.

**Reference counts:**
- `allAssets()` holds **201 references**. 4 are cancelled (P27, P29, P53, T0019), which leaves **197 live**.
- 172 of them come from `DATA.assets`.
- The other 29 are schedule rows given a reference: T00xx keys such as T0085, plus FL01, FL02 and NVLT.
- **No "GC-xxx" key exists.** T0085 is itself a reference: Access & plant, the SUPPLY compound.

---

## 1. The reference drawer

`openAsset(key)` (L22401) calls `openAsset_held` (L22593), which calls **`openAssetDraw(a, key, keep)`** (L22634–23290). That builds `#drawer` (`<aside class="drawer">` at L6676) in a single template literal. After that, `drawerTidy(a)` (L22435) removes the accessory form for gear that does not take accessories and rewords the units fold, and `foldStories()` (L41054) wraps cards into folds.

**Who sees and edits it:**
- Everyone sees every part: the public view link (`capability()==='view'`) and the edit link alike.
- On the view link, `applyCapability()` (around L41204) disables every input in the drawer. Buttons are refused by `mayWrite()`.
- Every setter needs the edit link: `setDate`, `setDone`, `setLevelled`, `setSteps`, `setLight`, `setBranch`, `setRental`, `setHireStart`, `setLocationText`, `setSupplied`, the photo functions and so on.
- No block is hidden by role. The only role hook is the CSS `body.viewonly .editonly{display:none}` (L3534). It already exists and could carry "editors only" folds.
- The four `details.dsect` folds start **closed**. `dsectOpen()` (L22395) reads localStorage `gc500.dsect.<name>`. The comment at L22758 says "Open by default", but the code defaults to closed.

### The drawer in order (from the P46 / WC05 / P42 render; heights are desktop px)

| # | Block | Function / anchor | Shown | Editable | Notes |
|---|---|---|---|---|---|
| H1 | Header: plate, traffic-light instrument, Complete/Levelled/Steps chips and their tick buttons, next-day ›, Cancel | `refPlate`, `dstat`, `doneChip/levelChip/stepsChip`, `doneBtn/levelBtn/stepsBtn` (L8680–8715), `nextDayBtn` (L8658), `cancelBtn`; L22691 | always | ticks: edit link | On desktop the P46 plate overlaps the Navigate button (`drawer_P46_desktop.png`) |
| H2 | Sub-line: Short chip, sub-hire chip, name · discipline · **Rental ID** · customer code | `shortChip`, `subhireChip`, `contractOf` (L22693) | always | – | money/contract fact in the header |
| H3 | Navigate (with source label, e.g. "MASTER PLAN"), Send to a phone, × | `navBtn` (L27306), `dest782` (L21118) | always | – | |
| 1 | Prev / Next | `#drawerNav` | hidden unless opened from a list | – | |
| 2 | "Reported from the drop card" | `reportedCard` (L26892) | only when a report exists (0 today) | – | |
| 3 | **Sub-hired gear at Pxx**, with "Add sub-hired gear" | `subhireBanner`/`subhire744Banner`, `subhire744DrawerHtml` (v7.44) | **on all 201** (166 px) | edit link | the view link always reads "View only. Open your edit link…" — **dense / rarely useful** |
| 4 | Install notice | `installNotice744` (L29049) | conditional | – | |
| 5 | Moved line | `movedLine` (L7413) | only when moved | – | |
| 6 | Five precision tags: Observed by · Kept in · Revision · Location · This link | `precisionTags` (L23413) | always (129 px) | – | **dense**; "This link: Live · view only" is not about the reference at all |
| 7 | **Delivery card** | `deliveryCard` (L23431); its parts are listed below | always (≈540–780 px) | edit link | holds the Due in, Planned time, Due out, Delivery note and Light history from Andrew's screenshot |
| 7a | 3-lens light (red not on site / amber in transit / green on site), "set … by …" | `lightSet` (L9402), `setLight` (L9205) | always | edit link | |
| 7b | "On hire — Coates rental system": per line asset, description, branch, contract, delivery, from, **off hire** | inline in `deliveryCard`, from `rentalOf` (L7908) | 80 refs | – | **repeats** the onhireBlock in Hire and costs |
| 7c | Tick row: Complete / Levelled / Steps; "✓ Complete" with who and when | `doneBtn/levelBtn/stepsBtn`; Steps only if `mentionsSteps(a)` (L8555) | always | edit link | **repeats** the header ticks |
| 7d | **Due in on** (date, plan-date hint) | `data-date` input, `setDate(key,iso,'in')` (L8993) | always | edit link | |
| 7e | **Planned time to site** / "Unloaded by (the time asked for)" | `data-eta` input | always | edit link | |
| 7f | **Due out on** ("no off-site date on the plan" when there is none) | `data-outdate` input, `setDate(...,'out')` | always | edit link | blank on 150 drawers |
| 7g | **Delivery note** | `data-dnote`, `setDeliveryNote` (`wireDelivery`, L23486) | always | edit link | blank on 162 |
| 7h | **Light history · n** fold | in `deliveryCard` (L23480) | when there is history (77 refs) | – | |
| 8 | **Breakdowns** card, "Report a breakdown" | `breakdownCard` (L17350) | **always** | edit link | "Nothing reported against this one" on **201/201**; `S.breakdowns` is empty — **hide unless one exists** |
| 9 | fold **The record — type, dates, position** | inline L22723–22750 | always (closed) | – | **dense**; mostly build-time DATA wording |
| 9a | Type · Asset no. · On site (first → last) · weeks between | `a.item_types`, `assetNosOf` | | | |
| 9b | **Demob-week row** yes/no + `a.demob_state` | DATA | | | "NO" on 153 |
| 9c | Reference unresolved · Schedule "on the drawing only" · Shared row · Tower series · Asset-number caveats | conditional | | | |
| 9d | **Off-hire**: "nothing takes it off site" / "closed by a demob-week row" / "removed by a schedule row" + `offhire_note` | DATA `offhire_state` | | | "NOTHING TAKES IT OFF SITE" on 136 |
| 9e | **Position**: chip of DATA `position_state` | DATA (25 Sep build) | | | **stale** — see section 8 |
| 9f | "What this location looks like" (aerial crop or reason) | `satelliteBlock` (L28572) | | | callout-only; "No drawing callout matches…" on 58 |
| 10 | fold **Driver's card and load brief** | `driverCard` (L22160), `loadBrief` (L30289) | always (closed; 2,900 px open on WC05) | – | **dense**; carries transport cost text (`$290+`, "no carrier charge on the row") |
| 11 | fold **Hire and costs** (closes after Hire starts, at L22801) | inline L22763–22801 | always (closed) | edit link | **all financial** — see section 9 |
| 12 | **Map attached** + "Map for Pxx" select | inline L22800 | always | edit link (`S.mapRef`) | "No map attached…" on 187 (14 attached) |
| 13 | Filed map | `filedMapBlock` (L28376) | conditional | | |
| 14 | **Costs** card | `costCard` (L18004) | always | – | "No cost line names this asset" on **201/201** — **hide** |
| 15 | **What was asked for, and what we supplied** | `suppliedBlock` (L20608), `wireSupplied` (L20656) | always when the reference has item types | edit link | see section 10 — **hide** |
| 16 | "Also written as" · "Notes the parser did not classify" | inline L22807–22809 | conditional | – | rarely useful |
| 17 | **Contents and accessories**: list, "Attach an accessory" form, "Taken off" fold, units fold "Other things standing under Pxx" | inline L22816–22840, `unitBlockInline` | buildings/toilets (removed by `drawerTidy` where it does not apply and none are recorded) | edit link | 90 drawers say "Nothing recorded inside this one" |
| 18 | **Asset numbers on Pxx** + "Add the number that turned up" | inline L22842–22863, `supplierNumbersHtml744` | always | edit link | "Asset number not recorded yet" on 86 |
| 19 | **Where Pxx goes**: "The schedule says …", "where it actually goes" input, "Save where it goes" | inline L22865–22878, `setLocationText` → `S.locations` | always | edit link | only **1** typed override exists |
| 20 | **Photographs of this drop (n of 5)** | `dropPhotoBlock` (L28471) | always | edit link | 5 empty slots per unit: 702 px on P46 — **dense** |
| 21 | **Photographs filed against Pxx** | `filedPhotoBlock` (L28333) | always | – | "None filed on the admin page" on 197/197 |
| 22 | fold **History and sources**: Drawing links + Scheduled events (n) | inline L22884–22888 (`links` L22636, `evs` L22683) | always (closed) | – | "No drawing link" on 59; "No scheduled events" on 20 |
| 23 | **Your note** textarea + "Save note" | inline L22890–22894 → `S.notes` | always | edit link | only 8 notes saved |
| F | Footer: Close · Print drop sheet · Email with pictures · Plain email · Text it · Copy link · Plant page · **Delete** · Show on the map | L22896–22906 | always | Delete: edit link | 9 buttons; wraps to 3 rows |

**Size.** With every fold closed, the P46 drawer is about 3,400 px of scroll on desktop. With every fold open it is **10,012 px** on desktop and **11,379 CSS px** on a phone.

**Screenshots** (`scratchpad/demob/`):
- `drawer_P46_desktop.png`, `drawer_P46_phone.png`, `drawer_P46_desktop_all_open[_drawer_only].png`, `drawer_P46_phone_all_open.png`
- the toilet: `drawer_WC05_*`
- Andrew's example: `drawer_P42_*`

---

## 2. Off-site / due-out dates

**Where the plan's out date comes from:**
- `effectiveDates(a)` (L8956): `out_plan` = the earliest schedule event with `movement === 'remove'` (`a.events[].movement`, `.date`). For a page-added asset it is `a.last_date`.
- DATA also carries per reference:
  - `hire.offhire`, `hire.offhire_date`, `offhire_state` (`stated` / `demob row` / `none`) and `offhire_note`;
  - `removals`, `demob_covered` and `demob_state`;
  - `DATA.summary.programme_end = "2026-11-13"`.

**Where a typed due-out goes:**
- `S.delivery[key].out_date`, with `out_by` and `out_at` (`setDate(key, iso, 'out')`, L8993). Clearing it sets `out_off_by` / `out_off_at`.
- It syncs in the `delivery` collection.
- **No due-out dates are typed today** (`S.delivery` has no `out_date`).
- **Gap:** `programmeDaysBefore801()` (L30319) uses a typed out date only to **move an existing remove event** (`eff.out_moved`). On a reference with no remove event, a typed due-out shows in the drawer but **never reaches the Timeline, the day lists or the driver sheets.**

**Live counts (197 references):**

| Group | Refs | Plan due-out | No plan date, but contract off-hire | Neither | On site now | Sub-hired |
|---|---|---|---|---|---|---|
| Toilets & amenities | 74 | 6 | 15 | 53 | 29 | 10 |
| Portable buildings | 53 | 21 | 26 | 6 | 33 | 0 |
| Lighting towers | 21 | 0 | 4 | 17 | 2 | 0 |
| Generators | 15 | 5 | 8 | 2 | 5 | 0 |
| Water-filled barriers | 15 | 15 | 0 | 0 | 3 | 0 |
| Variable message signs | 7 | 0 | 2 | 5 | 1 | 0 |
| Access & plant | 5 | 3 | 2 | 0 | 5 | 0 |
| Furniture | 4 | 0 | 0 | 4 | 0 | 0 |
| Other (FL01, FL02) | 2 | 0 | 1 | 1 | 2 | 0 |
| Ground protection | 1 | 0 | 0 | 1 | 1 | 0 |
| **Total** | **197** | **50** | **58** | **89** | 81 | 10 |

| Branch | Refs | Plan due-out | Contract off-hire only | Neither |
|---|---|---|---|---|
| KINP | 131 | 27 | 41 | 63 |
| NVAC | 43 | 8 | 15 | 20 |
| STPS | 23 | 15 | 2 | 6 |

- DATA-only (172 assets): 47 have an off-hire date (15 stated by a row, 32 closed by a demob-week row) and 125 have none.
- **Fencing is not a reference.** It lives in `DATA.fencing`, `DATA.fence` and the fence dockets, so it is outside these counts.

**Contract off-hire as a source (Andrew's "off-hire 13 Nov"):**
- It is in **DATA**, not the shared record: `DATA.rental_on_hire.rows[].demob_date`. Each row also has `booked_pickup_date` and `expected_term_date`, which usually match.
- These are the 9 Baseplan contracts, "supplied_by Andrew Fisher, supplied_on 2026-09-24": 307 rows (KINP 225, NVAC 34, MEAD 9, STPS 39).
- `S.contracts` and `S.rental` are empty.
- Rows by off-hire date: 13 Nov 245 · 26 Oct 33 · 27 Oct 15 · 3 Sep 4 · 17 Sep, 18 Sep, 19 Oct, 27 Sep, 29 Oct and 6 Nov 1 each · null 4.
- Per reference: 80 live references have contract lines (13 Nov 59, 26 Oct 20, T0005 mixed 17 Sep + 26 Oct).
- **58 references have a contract off-hire but no plan due-out:**
  - **43 on Fri 13 Nov:** CP1 HRP P09–P21 P33 P36–P39 P41 P42 P44 P58 WC02 WC04 WC06 WC100 WC11 WC12 WC15 WC16 WC17 WC20 WC21 WC27 WC50 T0001 T0021 T0022 T0024 T0243 T0103
  - **15 on Mon 26 Oct:** GN01 GN03 GN19 GN20 GN21 GN23 GN25 LT05 LT06 T0002 T0085 T0109 T0268 FL02 NVLT
- **Caution:** these look like contract-term placeholders, not truck days. 13 Nov is the programme end; 26 Oct is the Monday after the race and the "from when they go in" items. Where both exist they disagree on 21 references. Examples: P46 plan 29 Oct against contract 13 Nov; GN06 plan 27 Oct against 26 Oct.
- `assetWeeks` (L28745) already uses the rental off-hire for weeks on 11 references ("first scheduled date to the rental system's off-hire date"). `effectiveDates` / Due out does not.
- The drawer shows these dates twice:
  - in the Delivery card's "On hire — Coates rental system" (`· off hire Fri 13 Nov`);
  - in `onhireLine()` (L16390) inside Hire and costs → Branch.

---

## 3. Programme dates

- `DATA.race_days = ["2026-10-23","2026-10-25"]`; `DATA.event.race_dates_as_supplied = "23–25 Oct 2026"`. The state says: "as supplied in the handover brief; not confirmed against a Supercars publication".
- `DATA.charge_basis.event_days = ["2026-10-23","2026-10-24","2026-10-25"]`.
- `DATA.closures.event.friday / saturday / sunday` give the same dates.
- `DATA.weeks`:

| Sheet | Phase | Dates |
|---|---|---|
| Event Week | Event | 19–25 Oct |
| Demob Week 1 | Demob | **26–30 Oct** |
| Demob Week 2 | Demob | 2–6 Nov |
| Demob Week 3 | Demob | **12–13 Nov** (11 rows) |

- `DATA.summary.programme_end = "2026-11-13"`.
- "Demob starts" and "End of demob" are **not stored text**. `dsnMilestones()` (L36265) computes them: Demob starts = the first `weeks[].start` with `phase==='Demob'` (26 Oct); End of demob = the last programme day (13 Nov).
- **Conflict to put to Andrew:** "Demob is 2 weeks from the Monday after the race" gives Mon 26 Oct to about Fri 6 Nov (or Mon 9 Nov). The schedule's Demob Week 3 and the contracts' off-hire run to Fri 13 Nov.

---

## 4. "The island"

- The page already has an island boundary: **`ZONES782.island`** (L21199). It is a 15-point polygon in master-sheet coordinates (D001, 0–1), drawn in v7.82 for the driver way-in rules.
- `zoneEntry782()` (L21215) uses it to give "ENTRY: Macintosh Island area - in via the pit lane".
- **The island here is Macintosh Island Park:** the pit lane and paddock compound. AGENTS.md says "everything in Macintosh Island Park comes off the Gold Coast Highway into the pit lane".
- Neighbouring zones in the same object: `mbp` (Main Beach Pde, split by `ROAD782` into seaside and land side), `surfers`, `gate1` (Tedder Ave / Helen Park / The Hill) and `gate2` (Commodore Park).
- It is hand-drawn and is not a survey.
- `zoneEntry782` returns null for anything on site (`inPlace782`). A demob classifier must call `ptOf782` + `inPoly782` directly.

**Positions per reference:**
- `MASTER_LOC` (L24991): 165 entries with lat/lon `ll` and sheet `pt`; `prec` is `unit` 142 or `area` 23. They also carry `near`, `next`, `beside` and `sec`; "Macintosh Island (~75 m)" is in `near` on 31.
- Also: `S.fixes` (3 GPS pins), `S.places` (33 placed points), the water-barrier description spots (`descLoc782`, 15) and one project-manager-confirmed spot.

**Classification** (`zones.js`; own position only — the pit-lane fallback is not counted as a position):
- **Outside the island: 94**
  - Gate 1: 21
  - Main Beach seaside 15, land side 14
  - Surfers seaside 11, land side 8
  - Gate 2: 9
  - outside every zone: 16 (CP1 GN04 LTC02 WB03 WB07 WB13 WB14 WB18 WB20 WC21 WC25 WC44 WC45 WC47 WC81 T0265)
- **Inside the island: 73**
  - 31 buildings, 24 toilets, 7 towers, 6 generators, 3 furniture, 1 barrier, 1 other
- **No position: 30**: GN25 GN? LT01–LT06 WC10 WC100 WC85 T0001 T0002 T0003 T0004 T0021 T0089 T0103 T0109 T0128 T0158 T0159 T0162 T0268 T0169 T0170 T0176 FL01 FL02 NVLT

**Due-out coverage by zone:**

| Zone | Plan date | Contract only | Neither |
|---|---|---|---|
| Outside | 39 | 7 | 48 |
| Inside | 9 | 39 | 25 |

**Inside the track loop:**
- `DATA.circuit.ring` (outer and inner) exists only in K220 key-plan PDF points ("not a survey, not to scale, not the centreline").
- `DATA.geoFrame` registers it to local metres, but there is no lat/lon anchor in DATA. Its registration file `print/gc3d_registration.json` is not carried.
- The map explorer (`satellite_explorer/explorer/assets`) has the sheet-to-tile georeference and a "MACINTOSH ISLAND" label, but no track polygon.
- So "inside the track" cannot be computed from DATA today. "Inside the island" can.

---

## 5. Branches

`branchOf(key)` (L16452) takes the first of:
1. a code typed in `S.branch[key]`;
2. the committed record (`CROW`);
3. `DATA.rental_on_hire.assignments[key].branch_code`;
4. the single branch on its rental lines.

`DATA.branches` holds the stated list. Live:

| Branch | Refs | From the rental contract | Typed |
|---|---|---|---|
| **KINP** | 131 | 112 | 19 |
| **NVAC** | 43 | 39 | 4 |
| **STPS** | 23 | 21 | 2 |
| **MEAD** | 0 references | – | – |

MEAD has 9 contract lines, none assigned to a reference. Every live reference has a branch.

The 10 sub-hired toilets still resolve to KINP, although v7.43 says sub-hired locations carry no Coates branch on screen.

---

## 6. Pick-up / removal today

- **Timeline removals:**
  - `calendarDays()` (L30384) and `programmeDays()` build `day.removals` from remove events.
  - Due out is counted in the day panel (L10115), the hub (L12244), the tiles (L30718/L30787), the day block (`dayBlock`, L31139, "Due out (n)") and the per-load list (`ldList`/`ldGroups`, L31070).
  - It is also in the change page (`chday`, L24226–24238, "Due out on …") and the mail summary (L34868).
- **Removal rows by day:**

| Date | Removals | References |
|---|---|---|
| 19 Oct | 1 | WB03 |
| 25 Oct | 1 | WB14 |
| 26 Oct | 6 | GN04 WB13 WC29 WC30 WC45 WC47 |
| 27 Oct | 18 | GN06 GN10 P25 P60 P62 P63 P65 P66 P67 WB01 WB04–WB07 WB15–WB18 |
| 28 Oct | 3 | GN13 P69 WC60 |
| 29 Oct | 5 | GN18 P46 P47 P51 WB20 |
| 30 Oct | 5 | P52 P54–P57 |
| 6 Nov | 1 | WB19 |
| 12 Nov | 5 | P03 P04 P05 WC05 T0023 |
| 13 Nov | 4 | P01 T0003 T0004 T0005 |

- **Carrier loads:** `DATA.transport.carrier.loads` (Brendan Gill, 7 Sep) cover build days only. **0 loads on any demob day.**
- The v8.01 bookings (`bookingGroups801`, L30208) group deliveries only.
- **Removal grouping already exists:** `dpLoadsBefore801()` (L32426) groups removals by load time + carrier, else one per reference, and ranks them after deliveries.

---

## 7. Run sheets a demob sheet could reuse

- **Day documents plate** (L31856) has the Drivers / Install menus.
  - `dpPrint(iso, doc)` (L32961) prints one A4 per load from `dpLoads(d)` (L30252); `dpPage` (L32845).
  - It already handles removals: `g.kind==='removals'` gives a "Collection" header (L31709), a "Removal list" section on the install sheet (L32848), and `.out` styling.
  - The driver check `drvCheck782` (L31931) and the location signs `pl782Pages` come with it.
  - Link form: `#print/drivers/<iso>`; the PDF maker passes `o.pdf`; drafts go out by email (`DP_MAIL`, L32370).
- `dropPage(a, …, kind)` (L31666): per-reference drop / collection page.
- `ps7Print` (L15505): the pre-start sheet.
- The drawer's "Print drop sheet", Text it and Send to a phone (`navBtn`/`dest782` give the destination).
- **A demob run sheet** = pick a day → references with an effective out date that day → `dpLoads` groups → `dpPrint(…,'drv')`.
- **Needed first:** typed `out_date` must create a remove event on references that have none (section 2 gap), plus a way to group references into loads.
- The labour "Running sheet" (L10389) is labour hours, not a truck run sheet.

---

## 8. Andrew's P42 / asset 1327221 and "no drawing link found"

**What P42 is:**
- **1327221 = P42 "Production"**, Portable buildings, Building 6m, drawing D022-26003-02.
- KINP contract 9968862 (2 lines: the building and a refrigerator), match "same asset number".
- Delivery docket 26094139; contract off-hire 13 Nov.
- On site 28 Sep 13:13, set by Andrew Fisher.
- Master plan: unit `-27.984541, 153.427654` ("tag on the unit, master D001", near Macintosh Island ~75 m, beside P38 and P39).
- **Inside the island.**

**Why the drawer says "no drawing link found":**
- The record fold's **Position** row prints DATA `position_state`, from the 25 Sep build. That was before the master plan became the position source (v6.85, 29 Sep).
- `satelliteBlock` and `driverCard`'s position line use only `aerialPointFor()` (drawing callouts in `DATA.sheets[].markers`).
- The header Navigate ("MASTER PLAN"), the `precisionTags` Location tag ("Master plan D001") and the maps use **`dest782()` → `navTargetFor()`**:
  description spot (water barriers) → pit-lane report if no drop → newest pin, **including the master-plan fix** (`masterFixFor`, L24999) and the project-manager confirmed spot → placed point → drawing callout.
- **So the map already has the fallback chain; the drawer's Record, satellite and driver blocks do not.**

**Where positions live:**
- `MASTER_LOC`: code constant, 165 entries.
- `S.fixes`: collection `fixes`, 3. Pins on master-placed references are ignored by `pinsNow`.
- `S.places`: collection `places`, 33. All on master-unit references.
- `descLoc782`: 15 water barriers.
- `locSrc782`: project-manager confirmed or unverified spots.
- `DATA.sheets` callouts: 139 references.
- `S.mapRef`: attached maps, 14.

**Counts:**
- "no drawing link found" (28): **25 have a real position** (6 master unit, 4 master area, 15 description spot); 3 have none (WC10, WC100, WC85).
- "not on any drawing — a plant line" (26): 10 have a position.
- "candidate — drawing label only, not verified" (142): 131 are actually placed **on the unit** by the master plan, and 1 is confirmed by the project manager.
- satelliteBlock "No drawing callout matches…": 58 drawers. Driver card "Nothing on the 2026 drawings places this one": 59, although the same card's map says "Where it is — master plan" with coordinates (P42).
- **167 of 197 live references have their own position. 30 have none.**

---

## 9. Money and contract items in the drawer

**All visible to everyone, on the view link as well:**

1. **Header sub-line:** "Rental ID 9968862" and the customer code (`contractOf`, L22693).
2. **Delivery card:** "On hire — Coates rental system" lines: branch, contract, delivery, from, off hire (no $).
3. **Fold Hire and costs** (`dsectHire`, closed by default):
   - Weeks on site (`assetWeeks`, L28745, "assumed" on 119)
   - Days charged (`chargeSpanOf`, L24700, "over the event" / "from the day it goes in")
   - What is on hire (`assetTotal`, L28989): $ line totals, "days × $rate × qty", the card's minimum hire
   - Labour on this reference (`labourTicksHtml`, L29052): $ ticked, still to tick, Install $ and Demob $ per line
   - Override weeks on hire (`#wkBox` → `S.weeks`)
   - Rental contract (`contractBlock`, L17043): Rental ID select, Contract details, PO / customer ref
   - Branch (`branchBlock`, L17062): code input, "Put on the listed", and **`onhireBlock`** (L16423) "On the rental contract · same asset number":
     - per `onhireLine` (L16390): asset, description, branch, contract + line, docket, **off-hire**
     - per `contractMoneyWords` (L16409): rate 1 $, rate 2/3, flat monthly, charges $, billed $, minimum days, subhired chip, charge-line chip
     - the basis paragraph
     - "Add asset number" button
   - **Hire starts** (L22792): "No hire start typed — the schedule's span" (166) or "On hire from … the rental system" (23), the **Charged from** date and **Set hire start** (`setHireStart`, L9122 → `S.hireStart`; 0 typed).
4. **Costs card** (`costCard`, L18004): cost lines with $. Empty on all 201.
5. **Driver's card / load brief:** transport cost text (`$290+`, "the workbook writes a plus after it — the figure and more, ex GST", "no carrier charge on the row").

Only the edit link can change them (`mayWrite`).

---

## 10. "What was asked for, and what we supplied"

- **Renderer:** `suppliedBlock(a)` (L20608). Wired by `wireSupplied` (L20656), "Save what was supplied" → `S.supplied[key]` (collection `supplied`), and "Raise a variance" → `varDialog` → `S.variances`.
- **Who sees it:** everyone. Inputs are disabled on the view link. It sits outside any fold, about 290–480 px.
- **Records:**
  - `S.supplied` has 6 keys: P19, P37 and T0022 hold only a "recorded by" with no items; T0025 (Trakmat ×20), WC31 (16Pan Block ×1, Accessible Toilet ×0) and WC60 (Toilet Block 6m ×2, Waste tank ×2) hold items.
  - **4 references show a supplied value** through `itemRows` (L8170): P19 (committed), WC31, WC60, T0025.
  - Variances: **1** (V-AF-0001, P19, substitution, committed).
- **Shown elsewhere:**
  - the Variances tab (`allVariances`, L8211; the block's "See all … on the register");
  - Equipment: `plantTable` (L14042) and `inventory()` (L10727) read `itemRows`;
  - the Change page's **"What turned up"** Ordered / Arrived (`chGotHtml`, L11255), which writes the same `qty_supplied`;
  - Short chips (`shortChip`);
  - `groupTotals`, Pricing, `dsnState_` and the asset email.
- **Hiding it from the drawer loses no record.**

---

## 11. Empty-state census (drawer text across 201 references; full list in `census.json`)

| Message | Refs | Suggest |
|---|---|---|
| Sub-hired gear box (view only) | 201 | editors only, or only when sub-hired |
| Breakdowns "Nothing reported against this one." | 201 | hide unless one exists |
| Costs "No cost line names this asset." | 201 | hide unless one exists |
| "What turned up" / qty blank (supplied) | 207 / 204 rows | hide unless a record exists |
| "None filed on the admin page" (filed photos) | 197 | hide unless any |
| No map attached | 187 | editors only |
| No hire start typed | 166 | editors only (money) |
| Delivery note blank | 162 | show when set |
| Due out blank / "no off-site date on the plan" | 150 | fill from a demob default |
| Demob-week row: NO | 153 | drop (derived) |
| Off-hire "NOTHING TAKES IT OFF SITE" | 136 | replace with the out date |
| Position "candidate — drawing label only…" | 142 | replace with the live source |
| Driver card "Drawing position · confirm exact spot" | 133 | use `dest782` |
| Not ticked complete / no delivery recorded yet | 121 / 120 | keep, as the action |
| Weeks "assumed" | 119 | editors only |
| "Nothing recorded inside this one" (accessories) | 90 | show "Add" only |
| "Asset number not recorded yet" | 86 | keep (it is a task) |
| "Nothing on the 2026 drawings places this one" (driver card) | 59 | fix via `dest782` |
| "No drawing link…" (history) | 59 | hide |
| "No drawing callout matches…" (satellite) | 58 | use the master map |
| "no drawing link found" (Position) | 28 | fix |
| "The schedule says nothing about where this one goes" | 21 | |
| "No scheduled events" | 20 | |
| "No Rental ID recorded yet" | 7 | |

---

## 12. Completion today

**Lights:** `LIGHT` (L8291): `not on site` (red), `in transit` (amber), `on site` (green). Set with `setLight` (L9205) from the drawer's `lightSet` lenses (L9402) and the Timeline.

**Ticks:** stored in `S.delivery[key]`.

| Tick | Fields | Applies to | Rule |
|---|---|---|---|
| Complete | `done/done_by/done_at/done_history` | every reference | `setDone` (L8500): ticking complete ticks green; un-ticking clears levelled and steps |
| Levelled | `levelled…` | `needsLevel()` (L8556): **Portable buildings and Toilets & amenities only** (127 references) | `setLevelled` (L8560): ticking it also ticks complete and green |
| Steps | `steps…` | the same 127 in the header | in the Delivery card only where `mentionsSteps(a)`, i.e. the card prices steps (60 references) |

**Buttons:**
- the header's small `doneBtn/levelBtn/stepsBtn`, plus `nextDayBtn` and `cancelBtn`;
- the Delivery card's tick row (repeated).

Labour ticks (install, demob, cleaning per piece; `labourTicksHtml`) are a separate, financial thing inside Hire and costs.

**Live:** on site 81 · complete 80 · levelled 39 of 127 · steps 37.

---

## 13. Photos today

**Drop photos:** `dropPhotoBlock` (L28471).
- **Five fixed places** `DROP_SLOTS` (L27491), `DROP_MAX = 5`:
  - 0 In position
  - 1 Access and surrounds
  - 2 Way in off the street
  - 3 Aerial — overhead
  - 4 Aerial — the approach
- One set per asset number (unit), or per reference where there is no number. Each empty place has its own "Add a photo" and "Use an existing photo…" select.
- **Stored as one document per photograph** (v7.41) in `S.photoLinks[id]` = `{id, name, ref, unit, slot, by, at, caption, removed…}` (`photoLinkPut`, L27800). Legacy records are in `S.dropPhotos[key].photos`.
- The image is uploaded to `/api/files` (`SYNC.backend.upload`, kind `'drop-photo'`) and served at `/f/<token>/<id>`.
- On the phone, photos wait in the outbox `PHOTO_OUTBOX` (IndexedDB, L27731) until sent.

**Filed photos:** `filedPhotoBlock` (L28333), admin-page "Photo of a location" files: 0.
**Drop-card reports with photos:** `reportedCard`: 0.

**No stage field.** The only "what is this" field is `slot` (0–4) plus a free `caption`, and every caption is empty. There is nothing for arrival, levelled, steps, damage or collection. Adding stages means new slot meanings beyond 4 (`Replace` only offers `hi < DROP_MAX`; extras fall to `photoStrayBlock`) or a new field on the link document.

**Live:**
- 48 references have drop photos, 138 photos in all (110 on unit groups).
- By slot: In position 57 · Access 54 · Way in 0 · Aerial overhead 26 · Aerial approach 1.
- By type: buildings 32 of 53, toilets 13 of 74, generators 3 of 15, everything else 0.

---

## 14. Proposed drawer structure (top to bottom)

1. **Summary header** (sticky)
   - Plate, name and type, status light + Complete / Levelled / Steps chips.
   - One line: "In Mon 28 Sep · Out Fri 13 Nov (contract)" with its source.
   - Where: master plan / pin / spot, plus Inside or Outside the island and the way in (`zoneEntry782` geometry).
   - Branch code (no Rental ID).
   - Navigate · Send to a phone · ×.
2. **Complete it**
   - The 3 lenses plus the Complete / Levelled / Steps buttons once (drop the header duplicates). Only the ones `needsLevel` / `mentionsSteps` allow.
   - Due in · planned time · Due out. The Due out is prefilled per section 2 and marked "assumed" until typed.
   - Delivery note, shown only when set or when editing.
   - Light history fold.
3. **Where it goes / where it is**
   - Mini map from `dest782` (master → pin → placed → spot → callout), with a source chip.
   - The schedule's wording plus the override box (editors).
   - Drop the Record "Position" chip, the "What this location looks like" reason text and "Map attached" (editors only).
4. **Photos by stage**
   - Filled slots as a strip.
   - One **Add a photo** button with "What is this a photo of?" (the slot list, plus the asset-number picker where there are several units), writing the same `photoLinks` document.
   - Empty places are not drawn.
   - "Filed" photos merged into the strip when there are any.
5. **Contents and asset numbers**
   - Numbers and accessories as a compact list; "Add" behind a button.
6. **Folds:**
   - History and sources: schedule events, drawing links, the Record facts that remain, notes.
   - **Contract and charges** (`.editonly`): Rental ID, branch editor, on-the-contract lines with rates, hire start, weeks, days charged, labour ticks, Costs card.
   - What was supplied / variances: only when `itemRows` has a value or a variance exists, or behind an editor-only "Record a difference".
   - Driver's card and load brief.
   - Breakdowns: only when one exists; "Report a breakdown" as a footer action.
   - Sub-hired gear: editors only, or only on sub-hired references.

**Dropped or merged:**
- Precision tags merge into the header's source chips.
- The Demob-week row and Off-hire lines are replaced by the Out date.
- The Delivery card's "On hire — rental system" merges into Contract and charges.
- The duplicate tick buttons go.
- The empty Costs, Breakdowns, Filed-photos and Supplied blocks are hidden when empty.
- The footer keeps Close, Print drop sheet, Text it, Copy link and Show on the map. Email ×2 and Plant page go under "More". Delete is editors only.

**The Demob tab** would read the same facts as the header:
- the out date (typed → plan remove event → contract off-hire → default demob window);
- the zone (outside first, then inside);
- the branch;
- grouped into loads and printed through `dpPrint`.

This needs the section 2 fix: a typed `out_date` must create a remove event.
