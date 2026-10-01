# Working on Andrew Fisher's repo — for Claude and Codex alike

Author: Andrew Fisher · Shutdown Manager, Coates · last updated 1 Oct 2026

Two AI agents work on this repo: **Claude (Claude Code)** and **Codex (ChatGPT Codex cloud)**. Same jobs, same
rules, same tools. One day one of you does a job, the next day the other picks it up. Everything either of you needs
is in this repo; nothing lives only in one agent's session. Read this file first, then
`03_GC500_Delivery_Control/STATUS.md`.

## Who you are working for

Andrew Fisher, Shutdown Manager at Coates. Call him Andrew. Plain Australian English, warm and practical, no
corporate jargon. Lead with the answer, then the reasons, then next steps. Metric units, 24-hour time, dates like
29 Sep 2026, times in AEST (Brisbane, UTC+10, no daylight saving). Never invent facts, figures or policies; say
plainly what you could not check. Every deliverable says "Author: Andrew Fisher".

## What is in the repo

| folder | what it is |
|---|---|
| `03_GC500_Delivery_Control/` | **the live job**: the GC500 Delivery Control page for the Gold Coast 500 (Coates event hire) |
| `03_GC500_Delivery_Control/toolchain/` | build, check, test and upload a release — use these, not copies |
| `03_GC500_Delivery_Control/vX.YY_<what>_LIVE/` | one folder per release: the patch, its source, tests, evidence, README with the LIVE time |
| `03_GC500_Delivery_Control/STATUS.md` | **the shared board**: what is live, who is working on what, open questions for Andrew |
| `01_Reporting_Suite/`, `02_Ampol_Reporting_Suite/`, `Skill_coates-site-suite/` | other Coates reporting work |
| `HANDOVER.md` | the older handover (25 Sep 2026); history, not the current state |

## The GC500 page in one paragraph

A single self-contained HTML page (about 8.3 MB) served by a small Node service on Railway at
`https://gc500-production.up.railway.app`. The public **view link** is `/v/Coates-GC500-2026` (read only). The
**edit link** is `/e/<edit key>` and the key is secret. The page keeps a shared record (deliveries, pins, photos,
units, fencing dockets and more) on the service, synced document by document. The page on the service **is** the
source: every release starts from the live page, applies a patch, and goes back up.

## How a release goes (both agents, every time)

1. **Pull** the shared branch and read `STATUS.md`. If the other agent has claimed something, do not touch it.
2. **Claim** the next version on `STATUS.md` (one line: version, what, who, when) and push that before you start.
   If the push is rejected, somebody else just claimed: pull, take the next number.
3. **Write the patch** as `patch_vNNN.py` plus a `<name>NNN_src.js` / `.css` if needed. Patches use the shared
   helper, which insists every replacement matches exactly once:
   ```python
   import os, sys
   sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
   from rep import rep
   ```
   A patch refuses to run twice (look for a function it adds) and refuses to run on the wrong base (look for a
   function the previous release added).
4. **Build** from the live page: `toolchain/build.sh v7.44 path/to/patch_v744.py` → `build/GC500_v7.44/`.
   It scrubs name attributions out of the page text and runs `check_page.py` (every inline script parses, no new
   keys, no edit key, author line present).
5. **Test** with the harness (read only — every write the page tries is aborted):
   - practice tests for the change: `harness/open_page.js` opens the build at the live address reading the live
     record. For edit-mode practice, override in the page: `window.capability = () => 'edit'; window.mayWrite = () => true;
     SYNC.readonly = false; SYNC.level = 'edit'` and replace `SYNC.db.doc` with a capture so nothing is sent. The page
     polls the service every 4 s and will flip back to view-only unless the `/api/version` answer is also overridden
     (see `v7.41_photos_stick_LIVE/evidence/practice_tests.js`).
   - both sweeps: `PAGE=... node harness/sweep.js` and `MOB=1 PAGE=... node harness/sweep.js`. Pass is 21 tabs,
     0 errors, 0 console errors. `GC500_DEBUG=1` prints any request the rig could not fetch.
   - look at a phone screenshot of what you changed before calling it done.
6. **Upload**: `python3 toolchain/upload_page.py build/GC500_v7.44/GC500_Delivery_Control_hosted.html`. It refuses
   if the live page changed since your build started (the other agent released in between): pull, rebuild, retest.
   It proves the view link serves your build byte for byte and prints the LIVE time.
7. **Record it**: `vX.YY_<what>_LIVE/` with the patch, source, tests, evidence and a README (Andrew's words, what
   changed, checks, the LIVE time); update `STATUS.md`; commit; push.

**Never leave work only on your own machine.** Whenever you stop — waiting on Andrew's approval, a question, or the
end of a session — push the patch, its source and its tests in `vX.YY_<what>_DRAFT/` with a short README saying
where it is up to. The other agent may be the one who finishes it, and can only do that from what is in the repo.
Rename the folder to `_LIVE` when it goes live. **Never upload another agent's `_DRAFT` unless its claim line on
`STATUS.md` says READY TO UPLOAD** — a draft may still be moving (1 Oct 2026: a draft went live mid-correction and
overstated revenue by $66,000).

**The other agent does not hear your chat with Andrew.** Anything he decides that matters beyond the one job — a
rule, a price, a yes or no — goes into `STATUS.md` (or into the rules below if it is lasting), in his words.

**Both agents read the original documents** (Andrew, 1 Oct 2026: "What ever documenet claude gets you need to read
and also understand"). When either agent receives a document, share its filename, revision/date, accessible source
location and Andrew's accompanying decisions through the authorised handover location. Use `STATUS.md` for
non-sensitive coordination; keep private originals and detailed findings in an authorised private location. Do not
publish a private attachment merely to hand it over. The receiving agent reads the source, including relevant
sheets, notes and attachments, checks it against the current records and settled rules, and records what it means
for quantities, asset numbers, rates, labour, Revenue, Direct costs or Finance reporting. Distinguish what the source
says from interpretation and Andrew's decisions. Record the review status, discrepancies, action owner and resulting
release or record change; "received", "read" and "applied" are different states. A summary alone is not a source
review. If the original is inaccessible, name the missing file and ask the other agent for its location; never claim
it was read. Check for newer revisions before applying changes. Reading a document does not itself authorise a
record change or a ledger posting.

Andrew asks for changes and expects them live once tested — that has been the way since 25 Sep. Anything he
marks as a draft, or anything risky to the record, waits for his yes.

## Rules that are never broken

- **The edit key never goes in a file, a commit, a log, a screenshot or a message.** It lives only in the
  environment variable `GC500_EDIT_TOKEN`. The toolchain reads it from there and redacts it. Links and QR codes
  always use the view link `Coates-GC500-2026`, never the edit key.
- **Tests only read the live service** (GET). Never write to the live record in a test.
- **Record changes only when Andrew asks**, and then only through the page's own functions on the edit link, named
  "Andrew Fisher via <Claude or Codex>", with a backup of what you are changing first and a fresh read afterwards to
  prove it. Keep the backup and the log in a `record_<date>_<what>/` folder. Example:
  `record_29Sep2026_master_plan_positions/`.
- **No pre-bill amounts for anything.**
- **Email: drafts only, never send.** PDFs are attached, not linked ("we are emailing the PDFs, no link").
- Anything shown to partners or sub-hire companies: no mention of the hidden tabs, and never "sub-hire partners" or
  "our partners".
- A rule on the page never hides a record: data already recorded is always shown somewhere.
- Do not kill processes by pattern (`pkill -f`); stop only what you started, by its id.
- Commits: plain English subject saying what changed and whether it is live. No AI model names in READMEs, code or
  the page. Author "Andrew Fisher". Each agent adds only the attribution trailer its own platform requires.

## Rules the page lives by (settled with Andrew — do not undo)

- **Master plan wins** (v6.85, confirmed 29 Sep 2026): a reference the master plan D001-26003-03 tags on the unit
  takes its position from the plan, always. Pins are used only where the plan has no unit tag.
- **The pit lane is the way in** (v7.42): everything in Macintosh Island Park comes off the Gold Coast Highway into
  the pit lane at its north-west end and drives it the way the race cars go.
- **Photos: one document per photograph** (v7.41), sent from an outbox on the phone until the service has them.
  Never go back to one list per reference; that is what lost photographs.
- **Sub-hired locations say so first** (v7.43) and carry no Coates contract, branch or Rental ID.
- **What a reference is decides what its drawer offers** (v7.43): no accessories on generators, towers, barriers.
- **A forklift goes by its day rate** (Andrew, 1 Oct 2026): where a contract line's Rate 1 is a card forklift day rate
  x the line's days written as one figure (MEAD 9968726 line 1: $1,483.20 = $185.40 x 8 days), the line is charged by
  the day rate, not that figure by the day again.
- **How the branch charges** (Brenden Meek, Branch Manager - Relief, by email; Andrew said "remember", 1 Oct 2026):
  "Labour is charged per piece of equipment. Only hourly labour charged is over the event. Forklifts, VMS and
  water barriers are charged for from when they go in. Everything else is only charged for over the event."
  The event is 23, 24 and 25 October, both ends billed (three days). Pricing for the rehire toilets came attached to
  that email; "no updated pricing yet, waiting on Corey Machado". A card daily rate for a generator or a light
  tower is therefore charged for the three event days, never for its days on site.
- **Generator pricing** (Andrew, 1 Oct 2026): "If a generator price is not there you go for the lower, so 70 kVA becomes
  the 60 kVA. If the client asks for a 60 kVA and we supplied larger, they get the price of a 60 kVA." The rate
  follows what was asked for; a size the card has no line for takes the next size down.
- Track mat and water-filled barriers have no asset numbers (v7.38). Fencing purchase orders use the Receipt ID No.
  (v7.39). Fencing hire agreements and service notes are typed on the Fencing tab (v7.40).

## Andrew's business words, and how the P&L reads (Andrew, 1 Oct 2026: "remember my business terminology")

Use these words, not synonyms, on the page, in READMEs and in messages.

| say | not | means |
|---|---|---|
| **Revenue** / **charged to the V8s** | sales, income, billing | what Coates charges the customer (Supercars, "the V8s"). **All hire is revenue.** |
| **Direct costs** / **what Coates pays** | expenses, spend, COGS | what Coates pays out for the job |
| **Rehire** (Rehire Revenue, Rehire cost) | sub-hire partners, our partners, cross-hire | gear hired in from another company (Event Portables for toilets and servicing, Advanced for fencing) — charged to the V8s at **our** rates as if it were ours, with the supplier paid for it |
| **Transport Revenue** / **Transport (cartage)** | freight, logistics, delivery fees | the delivery and pickup lines charged on the contracts / what Coates pays the carriers (SFL, Irwins, Torrens, Teams; **Internal** = a Coates truck, no carrier bill) |
| **Installation — external contractors** | subcontract labour | what Coates pays Advanced's crew (the green book) |
| **Difference so far — not a margin yet** | profit, margin, EBIT | revenue less the direct costs known so far; it is a margin only when the costs are complete |
| **Contract lines**, **Rate 1**, **Rental ID**, **branch** (KINP, NVAC, MEAD, STPS) | invoices, SKUs, cost centres | the rental system's hire contracts, one line per item, one rate per line, on a branch |
| **The card** / **street rate card 2026** | price list, tariff | the rates we charge from when a contract line has none; a card figure is an estimate until the branch puts a rate on the line |
| **Hire**, **install**, **demob**, **pre-start**, **docket**, **hire agreement**, **receipt ID No.**, **running sheet**, **green book**, **blue book** | — | the job's own words for its paper and its phases |
| **ex GST**, **damage waiver** (never on labour, steps, fire extinguishers, cleaning, install/demob, pump outs) | — | every figure is ex GST; damage waiver is a separate charge on hire only |
| **Over the event** (23, 24, 25 Oct, both ends billed) / **from when they go in** | on-site days | the two charged windows: forklifts, VMS and water barriers from when they go in; everything else over the event only |
| **Pre-bill** | — | never used for anything |
| **What we are charged, we charge on** (Andrew, 1 Oct 2026: "all our cost — what we charge should cover what we get charged") | absorbing a cost, no revenue assumed | every Rehire cost has a Rehire Revenue at least equal to it. Where the card has no line and the branch no rate, the line is charged to the V8s at the supplier's figure — the floor, never less — until a rate lands, and says so ("at cost"). A rate typed on Costs stands in; one under the supplier's figure is not applied, and the line says so. The Rehire by branch card says, per group, whether what we charge covers what we are charged |

**What the Coates P&L calls these** (the ledger lines, read from the July 2026 Industrial Solutions P&L,
`03_GC500_Delivery_Control/pl_guide_01Oct2026/README.md` is the plain-words guide). Use Andrew's words on the page; put
the ledger name beside them where Finance will read it.

| Andrew's word | the P&L line it lands on |
|---|---|
| Revenue for our own gear | **Hire Revenue** (1005 Hire Fleet; 1008 Accrual is hire earned but not yet billed; 1054 Rebates) |
| Rehire Revenue | **Rehire Revenue** (1010) — hired-in gear charged at our rates |
| Transport Revenue | **Transport** (1030 Cartage Internal, 1031 Cartage External) · toilet pump-outs charged are **1032 Toilet Pumpouts**, in the same group |
| labour charged per piece, install, steps, levelling, demob | **Installation** (1047) — the ratio the business reads is "Labour Recovery – Installation" |
| cleaning charged, damage waiver, environmental charge, consumables | 1025 Cleaning · 1015 Damage Waiver · 1048 Environmental Charge · 1020 Consumables |
| Rehire cost | **Rehire** (2126 Re Hire Contract Costs) |
| Transport (cartage) | **Transport** (2120 Cartage – Recoverable; 2140 Not Recovered when we wear it; a Coates truck is Internal Truck Costs; 3325 Toilet Pumpout Costs) |
| Installation — external contractors | **Installation** (2142 Installation – External Contractors); our own people's install time is 2143 Installation – Internal Labour |
| wages (Coates people) | **Direct Staff** (3210 Wages & Salaries, an overhead) unless charged to the install (2143); labour-hire people are Temporary Staff |
| accommodation, meals, travel | **Travel & Accommodation** (3520) and Rent – Residential (3345): overheads, not direct costs, unless Finance journals them to the job |
| Difference so far | **Gross Margin** (revenue less direct costs) once the costs are complete; **GM %** = Gross Margin ÷ Total Revenue |
| recovery | **Rehire Recovery** = Rehire Revenue ÷ Rehire cost · **Transport Recovery** · **Installation Recovery** · for every $1 paid out, what was charged on |
| the bottom lines | **EBITDA** (Gross Margin less overheads) · **EBIT** (less depreciation) · **TU** time utilisation · **FU** financial utilisation · **ROC** return on capital |

The July workbook is Industrial Solutions' (business units EAIS, NOIS, STIS, WAIS). GC500's contracts sit on KINP, NVAC,
MEAD and STPS; which P&L the job reports into is Andrew's to say, and the line names are the same on every branch.

**How the P&L reads (top to bottom):** Revenue (by stream, then by branch) → Direct costs, recorded against the
eight categories management expect — *Internal labour hours and overtime; External contractor costs; Rehire costs;
Equipment costs (including generators and associated assets); Temporary fencing and crowd control; Any
installation-related costs; Buy invoicing branch costs; Any other event-related expenses* — → Difference so far, with
what is **not in it yet** named in one line (wages in hours only, accommodation nights unpriced, transport only partly
in, rehire cost for hired-in plant, water). Revenue and cost are **never added together**; a charge is never shown under
a cost category. Every figure traces back to a contract line, a card rate, a docket or a quote. Estimates from the card
say so. Labour is charged per piece of equipment; the only hourly labour charged is over the event.

## Setting up a machine to do this

Needs `python3`, `node` 20 or later, `curl`, and a Chromium for the tests:
```bash
cd 03_GC500_Delivery_Control/toolchain
npm install
npx playwright install --with-deps chromium    # or set CHROMIUM_PATH to an existing Chromium
```
Network: `gc500-production.up.railway.app` is required; the sweeps also load map tiles and fonts from the usual
public hosts. For uploads, `GC500_EDIT_TOKEN` must be set in the environment.
