# v7.66 — Rehire by branch (DRAFT · built and tested)

Author: Andrew Fisher · 1 Oct 2026

Andrew, 1 Oct: "ensure we know what's sub-hired, or a rough idea what branches have sub-hire and the value and
forecast — we want a forecast for the business, using correct terminology with what we do"; "sub-hired by branch is,
example, the Event Portables portaloos are sub-hired from KINP; forklifts from NVAC, they are sub-hired". Applied after
v7.60 to v7.65 — one build, seven patches, on the live v7.59. No figure changes.

## The card — under Costs to job end

**Rehire** is gear hired in from another company and charged to the V8s at our rates, with the supplier paid for it.
**Rehire Revenue** is what we charge; **Rehire cost** is what we pay. Each is shown on the record today and carried to
job end. Every figure is the Forecast P&L's or the Costs to job end card's — a view across them, never a new total.

| Branch | What · supplier | Rehire Revenue on the record | still to come | to job end | Rehire cost on the record | still to come | to job end |
|---|---|---|---|---|---|---|---|
| KINP | Toilets — Event Portables · 132 lines · 251 units (+ servicing at the card) | $154,194 | — | $154,194 | $118,575 approved | — | $118,575 |
| KINP | Sub-hired — refrigerated container SUB-2131 · supplier code ROY002 | $1,428 | — | $1,428 | not on the record | — | — |
| MEAD | Sub-hired — forklift extension SUB-2527 · supplier code QUE011 | $9 | — | $9 | not on the record | — | — |
| NVAC | Forklifts and their attachments — sub-hired (Andrew, 1 Oct) · 9 lines | $35,276 | — | $35,276 | not on the record | — | — |
| STPS | Fencing — Advanced Temporary Fencing · 63 dockets | $120,913 | $248,810 | $369,723 | $75,022 (gear; installation $2,100 beside it) | $180,090 | $255,112 |
| | **Rehire — the business** | **$311,821** | **$248,810** | **$560,630** | **$193,597** | **$180,090** | **$373,687** |

Tiles: Rehire Revenue on the record $311,821 (56 % of the $556,076 revenue on the record) · to job end $560,630 (70 % of
the $804,885 revenue to job end) · Rehire cost on the record $193,597 · to job end $373,687, a floor until the three
suppliers' costs are on the record (the container, the forklift extension, the NVAC forklifts).

A contract line is rehire here when every toilet line is Event Portables gear (the toilets stream's rule), when its item
code starts with SUB, when the project manager marked the machine hired in, or — the NVAC forklifts — on Andrew's word of
1 Oct 2026. Contract rates are whole-event rates (forklifts by the day to the term date), so a line's Rehire Revenue on
the record is already its job figure; only the fencing programme has a "still to come".

What the card says that the record needs an answer to:

- **Toilets:** 101 lines on MISCITEM (220 units, $36,928) and 31 lines carrying a Coates plant number (31 units,
  $32,164), all counted as Event Portables rehire — Andrew, 1 Oct: "some of the toilets may not have MISC next to them".
- **NVAC forklifts:** 2 lines on MISCITEM ($12,248; the 5 t forklift with tynes marked hired in on 12 Sep) and 7 lines
  carrying a Coates plant number ($23,028) — counted on Andrew's word; confirm each one, the supplier and the Rehire cost.
- **The two SUB lines:** the supplier's name and the Rehire cost (a quote or invoice). The container's sales analysis
  code names STPS on a KINP contract.
- **Not counted as rehire** — a second table lists every other contract line with no Coates plant number (STPS VMS 5
  lines $17,959, barriers 15 lines $5,351, KINP buildings 3, furniture 17, accessories 10, containers 2, NVAC generators
  2, STPS trakmat 1), so Andrew can say if any of them is hired in.

The glance's flow list gains "Rehire by branch".

## Codex's review, 1 Oct 14:00 — two corrections

- **Every contract line lands in exactly one group.** A `take()` helper hands each line out once (SUB lines, then the
  toilets, then the NVAC forklifts, then other machines marked hired in, then the rest), so no line can be in two groups
  or fall between them; the toilets group follows whichever branch carries them. The model returns `coverage` and the
  test holds groups + not counted + Coates's own plant-numbered hire = every contract line.
- **Rehire cost is Advanced's gear, never their crew.** The fencing group's Rehire cost on the record is now
  `fencePaidSplit().gear` ($75,022), with Installation — external contractors ($2,100: their crew on the dockets $850 +
  the green book $1,250) shown beside it, never inside it; the P&L's fencing category ($77,122) is the two together, and
  the test holds gear + installation = the category. The fencing note reads the split's real keys (`gear`,
  `installation`, `docket_labour`, `green`).
- The fencing row's still-to-come follows v7.64's correction (ended weeks carried as behind the programme).

Codex's six offline synthetic checks (`../review_v764_v767/evidence/synthetic_regressions.js`) pass 6/6 on the corrected
patches.

## Files

- `patch_v766.py` — `rh766Model`, `rh766Card` before `cj764Model`; mounted after `cj764Card()`; the glance link;
  styles `.rh766…`.
- `evidence/practice_tests.js` — the card sits under Costs to job end; the toilets' Rehire Revenue = the By branch
  table's KINP rehire cell + the P&L's servicing; Rehire cost = the approved quotes; every NVAC forklift line counted at
  its contract charge; the SUB lines = the P&L's count; fencing on the record = the P&L's fencing revenue and its fencing
  category, to come = the programme; totals add; four branches; the others listed; Andrew's words, never "partners";
  read-only; no overflow; 0 errors. `practice_results*.json`, `shot766_rehire*.png`.

## Build and evidence

Built and tested within `build/GC500_v7.67d` (four patches on the live v7.63, 8,624,985 bytes, check_page PASS) — see
`../v7.67_priced_by_us_DRAFT/README.md` for the sweeps. Practice test desktop 17/17 and phone 17/17.
