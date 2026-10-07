# v8.92 terminology report — one word for one thing

Author: Andrew Fisher. 8 Oct 2026. The authority is the table in `AGENTS.md` ("Andrew's business words, and how the P&L reads") and
Andrew's words on 8 Oct: *"Terminology needs to be correct with words in every part."*

How it was found: every user-visible string on the built page — the HTML text, the title/aria-label/placeholder/alt attributes and
every string literal in the page's scripts with the comments stripped — was scanned for (a) the words the table says not to use,
(b) a second spelling of one of Andrew's words and (c) American spellings and 12-hour times (`evidence/terminology_scan_raw.md`,
347 raw hits). Each hit was then read in its place. Strings inside DATA (the record: schedule notes, supplier plans, the
rental system's own words) are quoted documents and are never changed by a release.

## Fixed in v8.92 (labels, headings, hints, tooltips, chips)

| # | Where | Was | Now | Why |
|---|---|---|---|---|
| 1 | Reference drawer, footer button | **Plant page** | **Equipment page** | Plant is called Equipment (Andrew, 2 Oct); address stays `#plant` |
| 2 | Costs & P&L heading, Today's money card, 13 hints and links ("on the Costs & charges tab", "Open Costs & charges") | **Costs & charges** | **Costs & P&L** | the tab's name; one name for one page |
| 3 | 22 hints on Costs & P&L, Equipment and the drawer ("typed on the Pricing tab", "the Pricing tab's estimate", a "Pricing tab" link) | **the Pricing tab** | **Customer rates & charges** | Pricing has been the Customer rates & charges section of Costs & P&L since v8.57; the hints sent people to a tab that is not on the bar |
| 4 | Two branch hints on Costs & P&L | **the Register tab** | **the Equipment tab** | the Register tab was set aside in v5.91; the register is on Equipment |
| 5 | 26 chips, notes and labels (contract line chips, Rehire by branch, Costs to job end, the handover notes, Equipment counts, the drawer) | **subhired** (no hyphen), **sub-hire** | **sub-hired** | one spelling of Andrew's word; "Sub-hired locations say so first" (v7.43) |
| 6 | Equipment: the inventory card | **Sub-hire register — whose gear is where** | **Sub-hired gear — whose gear is where** | as above |
| 7 | Sub-hired gear form | label **Sub-hire company**; "Nothing recorded as a sub-hire here" | **Sub-hired from**; "Nothing recorded as sub-hired here" | as above |
| 8 | Location chips | **Sub-hire · Event Portables ×2** | **Sub-hired · Event Portables ×2** | as above |
| 9 | Finance handover stream names (and its CSV) | **Fencing — sub-hire**, **Toilets — sub-hire** | **Fencing — Rehire**, **Toilets — Rehire** | Rehire is the word for the money (Rehire cost, 2126) |
| 10 | Costs & P&L → Transport, the Demob plan line | **sub-hire pick-ups** | **sub-hired toilet pick-ups** | one spelling; says what is picked up |
| 11 | Demob tab (plan settings, flags, the permit fold and chip), Costs & P&L → Transport (flags, planning note) | **oversize** | **oversized** | Andrew's word |
| 12 | Contract line chips (Equipment, drawer, Costs) | **rate 1**, **rate 2**, **rate 3** | **Rate 1**, **Rate 2**, **Rate 3** | the table's spelling of the contract field |
| 13 | Pre-start declaration | **licenses** | **licences** | Australian English |
| 14 | Costs & P&L → Transport | long explanation above the four figures | folded under them as "How these figures are worked out" | the figures lead (lead's note, 8 Oct) — layout, kept here because the words moved |

Every change is a word on the screen. No key, class, data attribute, stored setting (`gc500.demob816.oversize` stays), test hook,
record field, pin, direction or navigation text changed; DATA and MASTER_LOC are byte-identical (`test_identity892.py`).

## Found, in v8.91's area — listed, not patched (daily runs, run sheets, Drivers/Install prints, crew planning, loading, printing)

| Where | String | Suggest |
|---|---|---|
| Timeline day print button and its title; v8.34 print words; booking groups | "Delivery driver sheet (GC500-DRV-01)", "delivery driver sheet", "See the driver sheet" | **Drivers** (the print's name on the Timeline) |
| Drop sheet units line (print) | "Subhired · no Coates number", "Sub-hire · {company}" | **Sub-hired** |
| Demob run sheets: group names and fallback company | "Sub-hire pick-up · …", "sub-hire supplier"; run words "Sub-hire toilet run" | **Sub-hired toilet pick-up**, **sub-hired supplier**, **Sub-hired toilet run** |
| Demob run sheet sign-off checklist | "For the loads flagged oversize, I have checked the current permit…" | **oversized** |
| Crew planning transport category (v8.83) | "Oversize transport planning" (the category label the Transport view's flags read; the flag word itself is fixed here) | **Oversized transport planning** |
| Loading / door side (v8.72) | link "Pre-Transit Checklist — Site Accommodation…" in orange on white (2.9:1); tick "short" 3.2:1 | darker orange ink (`--orange-ink`) as the buttons use |

## Found and kept, with the reason

| Where | String | Kept because |
|---|---|---|
| Finance month-end control (fin745), accruals | "billing month", "Expected billing month", "Baseplan billing columns", "Fencing paid before billing" | Finance's own timing words (when the invoice goes), beside the ledger names where Finance reads; not a synonym for Revenue |
| Workforce costs, Costs to job end, management's eight categories | "Labour, accommodation, meals and expenses", "Other expenses", "expense claims", "Any other event-related expenses" | staff expense claims are a thing of their own (Travel & Accommodation 3520), and the last is management's category wording, quoted |
| Finance journal request | "Debit account / cost centre" | Finance's own journal field |
| P&L section aria-label | "Profit and loss statement, forecast" | P&L is Andrew's word; the screen-reader label spells it out |
| Costs & P&L | "not a margin yet", "Gross Margin", "EBIT" (Coates Way cog) | the table's own phrasing and the ledger names |
| Costs & P&L (v8.88 Transport rows) | "sales analysis code" | the rental system's field name (KINP-SUB) |
| Workforce costs | "running sheet" (the staff roster sheet) alongside "run sheet" (a truck's sheet) | two different papers; both in the job's words (AGENTS table lists "running sheet") |
| Demob | "event portables" for the single toilets and urinals | Andrew's own usage (3 Oct: "demob toilets for event portables… they can take up to 24") |
| Master plan location words, Demob way-in words, schedule notes | "Pit Lane (~40 m)", "pitlane", "Gold Coast Hwy, north-west end of the pit lane" | directions and navigation text — not changed in v8.92 (lead, 8 Oct); and quoted notes in DATA |
| Documents, Equipment | "Register" (the equipment register card), "Plan on satellite" (the explorer's sheet button, also the machine's page name) | the register is the thing on Equipment; the explorer's own name is set in the machine bundle, out of scope — **for Andrew:** should the sheet button say **Map explorer** like the tab? |
| Quoted documents in DATA (site notices, service notes, the carrier plan) | "7:00pm", "6:30am", "freight", "logistics", "excl GST" | the documents' own words; a release never edits the record |

## Spot checks in the test (`tests/test_aplus892.cjs`)

Drawer button reads "Equipment page"; the Costs & P&L heading starts "Costs & P&L —"; Today's money card reads "Costs & P&L"; no
"Costs & charges", "Pricing tab", "Register tab", "subhired", "oversize" or "rate 1" in the visible text of Costs & P&L, Equipment,
Today or Demob; the handover streams read "Fencing — Rehire" and "Toilets — Rehire"; no stray "&amp;" anywhere a word was changed.
