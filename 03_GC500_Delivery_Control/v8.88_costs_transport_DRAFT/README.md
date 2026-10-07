# v8.88 — Costs & P&L: everything talks, and a Transport view down to the branch (DRAFT, candidate)

Author: Andrew Fisher.

Andrew (7 Oct 2026 13:46 AEST): "then in costing we need to ensure verything oin here talks. we also need to have anotehr tab in costings to do with trasnport. and all info to do with trasbprotg ges in here. right down to the branch. its important we cover everything and everyothing must talk". Approved 8 Oct 2026 00:20 AEST: "Approved and get everything done".

Built on v8.85 (with v8.84), on live v8.83. Logic and presentation only: no DATA change, no record change, no live write. The footer step takes whichever of v8.85, v8.86 or v8.87 the page carries, so v8.86 and v8.87 can be chained ahead of this patch; nothing here depends on their code.

## 1. Everything talks

### What was found (read from the v8.85 build on the live record, 8 Oct 2026, evidence/model_diff_v885_v888.txt)

| # | Finding | Where | Cause |
|---|---------|-------|-------|
| F1 | **Transport by branch did not talk.** The Finance handover split the transport cost over KINP, NVAC and STPS in proportion to the loads it could put on a branch, but the schedule rows with no GC500 reference (the VMS batch, the towers, the hired-in forklifts, two buildings and a toilet block) and the eleven fencing semis to Phillip Park were outside those weights. About a third of the to-date figure was being spread by proportion even though the stand-in rows carry a branch on the record (Andrew's, or the hire contract's). | Finance handover — costs by branch | `fh866Model` worked out its own branch weights from referenced loads only. |
| F2 | **The handover's demob transport was not inside the P&L.** The demob table said "inside the costs above, not additional", but its transport row was the card's pickup leg for every reference with a demob row — a figure the P&L's transport to come does not carry at all (Costs to job end forecasts only references whose inbound load has no figure, and the no-reference rows at the average). | Finance handover — demob forecast | A second forecast rule, written in `fh866Model`, different from `cj764Model`'s. |
| F3 | **Three computations of "the loads".** The Forecast P&L (`moneySummary_`), Costs to job end (`cj764Model776Held`) and the Finance handover (`fh866Model`) each walked the schedule rows with their own loop. They agreed today, and nothing checked that they did. | the three models | — |
| F4 | A schedule row with no reference that also has a stand-in reference could be read twice (once as the stand-in's event, once as the row). Today no figure is doubled; nothing guarded it. | the loads | — |
| F5 | The demob legs on referenced plant (every reference comes off again) were not named anywhere as unpriced. | Costs to job end — Not priced yet | — |

### The fix: one model

`transport888Core()` reads every load once — every schedule row on a reference (the stand-in rows for rows with no GC500 reference among them), the fencing semis and the rows with no reference — with the P&L's own rules unchanged:

- **to date:** every row with a TPORT COST figure is a load Coates pays for, at the figure written (a plus is the figure and more); Internal is a Coates truck; a reference with our own typed transport line uses that line;
- **to come:** the card's transport cost once a reference where a load has no figure; the average of the loads with a figure for a load with no reference or card line;
- **branch:** the branch on the load's reference (`branchOf`: a person's record wins, then the hire contracts); a row with no reference carries the branch recorded on its stand-in; otherwise **branch unconfirmed**, never guessed.

The Forecast P&L, Costs to job end and the Finance handover now read that model (`patch_v888.py` steps 5–7). The P&L's figures are unchanged to the cent: 554 of 587 model values compared against the v8.85 build are identical, and the 33 that differ are the Finance handover's transport branch split, its demob transport row and one new "not priced yet" line (evidence/model_diff_v885_v888.txt). The Finance handover keeps its own rule for a load with no branch: it is spread over the branches in proportion, and its basis line now says so.

### "Everything reconciles"

One quiet line under At a glance on the P&L summary, folded: **17 tie-outs**, each one figure read where it is shown and where else it is shown, from the same model functions as the cards. A mismatch opens the fold, turns the line red and names the figure; nothing is hidden.

| Group | Tie-out | Read from |
|---|---|---|
| Revenue and direct costs | Revenue on the record | At a glance · Forecast P&L · In the business's lines · Finance handover (invoice by branch) |
| | Revenue to job end | At a glance / Costs to job end · In the business's lines · Finance handover |
| | Direct costs known today | Forecast P&L · Costs to job end · In the business's lines · the eight categories added |
| | Direct costs to job end | Costs to job end · In the business's lines |
| | Direct costs and wages priced, to job end | Costs to job end · Finance handover (costs by branch) |
| | Labour we charge, to job end (Installation) | At a glance · In the business's lines 1047 |
| | Labour ticked per piece, on the record | Forecast P&L · By branch (the ticks) |
| Transport | Transport (cartage) to date | Forecast P&L · Costs to job end · In the business's lines 2120 · 2140 · Finance handover · Transport, every load |
| | Transport still to come — forecast | Costs to job end · In the business's lines · Finance handover · Transport, every load |
| | Transport by branch — the handover's branches add to the loads | Finance handover · Transport (branches + unconfirmed) |
| | Transport Revenue on the record | Forecast P&L · In the business's lines 1030 · 1031 · By branch · Transport (the contracts' charge lines) |
| | Provisional transport revenue to come | Costs to job end · Additional transport forecast by branch · In the business's lines · Finance handover · Transport by branch |
| | No load is counted twice | Forecast P&L (loads with a figure) · Transport (each load once) |
| | Demob transport in the handover is a cut of the P&L | Finance handover (demob forecast) · Transport (demob legs) |
| Equipment, Timeline, Today | References with a transport fact | Equipment · Transport |
| | References with a load on the Timeline's days | Timeline (`programmeDays`) · Transport |
| | Carrier plan loads paired to a reference | Timeline (the record's pairings, `loadOf`) · Transport |

Today carries no money (the v8.62 rule) and reads the Timeline's programme days, so the operational tie-outs cover it.

## 2. The Transport view

A sixth button on Costs & P&L, **Transport**, drawn fresh from the record each time it is opened, in the Finance handover's housing. The five v8.57 sections keep their `data-finance857` attribute, so the Finance tests still count five.

1. **Four tiles:** Transport (cartage) to date (loads with a figure, written with a plus, Coates truck, no figure yet); still to come (card once a reference + the average loads); Transport Revenue on the contracts (+ provisional to come, 1030 · 1031); loads on the schedule (inbound, demob, carriers, and the movements still to book). A line under them says whether the seven transport tie-outs are tied.
2. **By branch:** KINP, NVAC, STPS, MEAD and **Branch unconfirmed** — loads, with a figure, Coates truck, no figure, to date, still to come, to job end, the Finance handover's split, Transport Revenue and provisional revenue to come. The branches and the unconfirmed loads add to the P&L; a note explains the handover's proportional spread.
3. **By carrier:** SFL, Irwins, Torrens, Readys, Teams, Kev, a shared truck, Coates truck and not stated — loads, with a figure, to date, written with a plus, Coates truck, no figure, first and last load, branches, the carrier's name as the schedule writes it.
4. **Every load:** one row per schedule row with a carrier, a docket, a load time or a transport figure, by day with a Timeline link per day. Load time (as written beside it), the reference (opens its drawer) or the stand-in row with its asset numbers, item × quantity, leg (inbound / demob / event · phase · sheet), carrier, dockets (and the DD column's words), branch or unconfirmed, flags (oversize transport planning from crew planning, the unloading method and door side recorded on the reference, crew planned for the day, DD departure order, loads before 06:00, taken off its day), the charge as written with the "and more" plus, and the forecast basis. Filters: all, with a figure, Coates truck, no figure yet, inbound, demob, branch unconfirmed, and each branch.
5. **Transport Revenue — the contracts' delivery and pickup lines:** contract · line, branch, what, quantity, charge, docket and the references the transport forecast reads the line as covering; the provisional revenue to come by branch, with a jump to the Additional transport forecast.
6. **Demob:** what is in the P&L (the demob loads with a transport fact), what is not (the demob legs with no carrier, docket or figure, with the card's pickup leg they would cost, by branch), and the Demob tab's truck plan in counts.
7. **The carrier plan of 7 Sep** (folded): the 22 loads, load times, what, the paired reference from the record and who recorded it, with the arrival rule.
8. **Rules, documents and purchase orders** (folded): load times at Kingston and the run to site, arrival after 07:00, the driver rules, oversize planning as a category only, the transport documents, any transport PO.
9. **Export transport CSV**: by branch, by carrier, every load and the charge lines.

Unknowns stay unconfirmed: a load with no branch says so; a carrier not written says "not stated"; the demob legs not forecast are named, not added.

## 3. Decisions for Andrew (the page holds these; nothing is changed on them)

1. **Demob legs in the forecast.** 51 demob legs on 29 references carry no carrier, docket or figure and are not in the P&L's transport to come. At the card's transport cost, once a reference, they would add the figure the handover's demob row used to show. Say yes and the forecast rule gains the pickup leg (one line in `transport888Core`); until then it is named on Costs to job end, the handover and the Transport view.
2. **The fencing semis' branch.** The eleven semis to Phillip Park carry no reference and no branch. The handover spreads their cost over the branches in proportion; if they belong on the fencing branch (STPS), say so and they move there.
3. **The remaining no-reference rows** (six November demob rows and the stand-ins the contracts have not placed on a branch) are branch unconfirmed for the same reason.
4. **Kev.** The schedule names "Kev" as a carrier on 13 loads, most of them Internal (a Coates truck). He is shown as the schedule writes him; say if he should read as Coates truck.

## 4. Build and candidate

```
toolchain/build.sh v8.88 v8.84_today_wide_layout_DRAFT/patch_v884.py v8.85_where_we_are_DRAFT/patch_v885.py v8.88_costs_transport_DRAFT/patch_v888.py
```

- Base live v8.83 `88a3584e919d8acd32ac3905099c1d606ec2fe5c1da2793363e8ff870f212457`.
- Candidate SHA-256 `bd4bcbcc7c43a49bf50d5e9ff911ed6a23f397b23107550ef9d3ee35f9279885`, 11,232,477 bytes.
- `check_page.py` PASS (13 inline scripts, no new key). DATA identical to live (`test_source875.py` PASS).
- Draw time, laptop (median of five redraws on the live record): the P&L summary 0.86 s against 0.70 s on v8.85 — the reconciliation line reads the Finance handover model and the programme days once per draw; the Transport view 0.44 s.
- Files: `patch_v888.py`, `transport888_model.js` (inserted into the page's main script just above `moneySummary_`, because the first draw calls it before the end-of-body scripts run), `transport888_view.js` and `transport888.css` (before the last `</body>` and the first `</head>`), `tests/test_transport888.cjs`, `evidence/`.

## 5. Checks (candidate `bd4bcbcc…`; every write aborted; fresh cache each run)

`tests/test_transport888.cjs` checks: the reconciliation line under At a glance, all 17 tie-outs tied; the Costs nav keeps five sections and adds Transport; the view mounts from the button; every reference with a transport fact, every fencing semi and every no-reference row is on it; every carrier and every branch in the source has a row, plus the unconfirmed loads; one row per load; the grand total to date equals the P&L, Costs to job end, the business's lines and the handover; the branches, the carriers and the loads each add to it; the forecast equals Costs to job end, the business's lines and the handover and adds by branch and by load; the handover column is the handover's split branch for branch; Transport Revenue equals the P&L and the by-branch table line for line; provisional revenue to come equals Costs to job end and the forecast by branch; the load counts agree; demob transport is the P&L's cut; the words; a reference link opens the drawer; a Timeline link opens the day; the filters; the phone layout stacks with no horizontal overflow; an injected mismatch is flagged on the exact tie-out and the line opens itself; a redraw changes no figure; no errors; no writes. No $ amount is printed.

RESULTS_TABLE

Screenshots (`evidence/shots/transport-1440-*.png`, `transport-2560-*.png`, `transport-phone-*.png`, `reconciles-*.png`) are kept out of the repository because they show the figures; they stay local for the lead to review. Every dollar figure in the evidence logs is replaced with `$—` before the folder is committed.

Not LIVE: this session has no edit key. If v8.85 goes live first, build with `patch_v888.py` alone; if v8.86 or v8.87 go ahead of it, chain them before this patch.
