# v8.94: the Lighting scope counts real towers once, against the map

Author: Andrew Fisher. DRAFT, built and tested on the full chain (v8.84 to v8.89) on live v8.83 `88a3584e`; not live.
It folds the v8.82 lighting audit into the release and answers Codex's two review points on PR #1
([6043837383](https://github.com/tatts29-svg/fish/pull/1#issuecomment-6043837383): an unconfirmed total is not a lower
bound, so no ≥; [6043918810](https://github.com/tatts29-svg/fish/pull/1#issuecomment-6043918810): a label does not
correct a misclassified or duplicated denominator, so the projection goes in).

## What was wrong, in plain words

The Lighting group counted **25 towers over 21 register rows, 5 of them complete, and read 20%**. Measured on the
current build (`build/GC500_v8.94chk`, `737c1966…`), 18 of those rows are not towers anyone has supplied:

| rows | what they are | asset number | hire | delivery |
|---|---|---|---|---|
| LTC01–LTC12, LTC14 (13) | the circuit "light-spread" fans on D024-26003-02. Each sits beside big-screen callout 001–014 with the same digits (both series run 01–12 and 14, both skip 13; 10 of the 13 fans have their same-digit screen as the nearest screen callout, the other three within 130–200 pt). The sheet is titled "Generator, Light Tower & Big Screen Locations" and its legend lists BIG SCREENS apart from LIGHTING TOWERS. | none | none | none |
| LT01–LT04 (4) | keyed callouts in D024's top-left key to the BSF storage yard, Molendinar | none | none | none |
| NVLT (1) | a row added on the page whose `source_row` is T0002 and whose one asset number is one of T0002's five | T0002's | none | on site, not complete |

The towers the job has on record are **T0002 ×5** (the schedule row "Light Tower × 5 · Delivery to Molendinar": five asset
numbers, on hire, on site and complete) and **LT05 and LT06** (keyed on D024 to the Seaway car park transporter compound: one
asset number each, on hire, not on site yet): **7 towers, 5 complete**. D024 keys 6 towers in all.

None of the 18 rows carries any money: no rate, no line total, no hire line.

## What Andrew settled (8 Oct 2026, in the lead builder's chat)

| asked | Andrew's words | what it means on the page |
|---|---|---|
| are the 13 circuit fans on D024 big screens rather than our towers? (~04:50 AEST) | "Yes they big screens not light's" | LTC01–LTC12 and LTC14 are big-screen symbols. They leave the Lighting count for good and their drawers say so. |
| how many lighting towers does the job need? 7 on record, D024 keys 6 (~04:55 AEST) | "What ever the map says. If its 6 its 6" | **The map is the scope: the 6 towers D024 keys**, 4 at the BSF storage yard, Molendinar, and 2 at the Seaway car park transporter compound. Each location credits the towers delivered to it, up to the number D024 keys there. |
| the fifth tower T0002 delivered to Molendinar, where D024 keys 4 (~04:55 AEST) | "Lets go by d024" | Surplus to the plan. It is said on the Lighting card, not counted. Whether it comes off hire or is redeployed is a site call outside the page; the page changes no hire line and no money. |

The page itself carries no personal attributions (the build scrubs them), so on the page these read "confirmed by the project
manager on 8 Oct 2026" and "(confirmed 8 Oct 2026)". The words themselves are quoted once, in the whole-job basis.

## What the page shows now

**Lighting = towers credited ÷ the map's 6.** On today's records that is **4 of 6 = 66.67%**:
- BSF storage yard, Molendinar: D024 keys 4; T0002's 5 are verified complete (complete on the record, a known quantity, no conflict), credited 4, 1 surplus to the plan.
- Seaway car park transporter compound: D024 keys 2; LT05 and LT06 are not on site, credited 0.

The reading is "Confirmed complete against the map's scope", kind `confirmed`, no ≥ and no range. The Lighting card's counts
read Done 4 · Left 2 · 6 total. The card carries one scope note (the 6 keyed towers by location, confirmed) and one surplus
note: "T0002 has 5 towers on record for the BSF storage yard, Molendinar; D024 needs 4, so 1 is surplus to the plan." The card's
fold has one "Lighting scope" note with the per-location workings and the 7 towers on record.

**The whole job is back** under v8.85's seven-group rule, with Lighting confirmed on the map's scope: today ≥60.53% (the ≥
comes from Toilets, as before), 3 lights. All five lights turn green only at a confirmed 100% in every group; a fixture at 100%
proves the rule still fires. The "How the whole-job figure is worked out" note says how Lighting is counted and cites Andrew's
words once.

**The Where we are chip** reads 66.67% with the tag "Counted against the map's 6 towers"; its screen-reader label and tooltip
say the scope and who confirmed it. Chip = card.

**Nothing is written.** The page changes no record, DATA, hire line or money. Evidence promotes a row: record an asset number,
hire or a delivery against LT01–LT04 or a circuit fan and it is a tower on the register again.

### The unconfirmed path (kept, not the default)

If the release is built without `scope_confirmed.json` (or with one whose group scopes do not add up), the page falls back to
the state the brief asked for first: Lighting reads **"Complete in recorded scope"** over unique recorded equipment (5 of 7 =
71.43%, kind `recorded-scope`), the chip and card say the scope is unconfirmed, and the **whole job is unavailable**: "—", the
caption "Whole job unavailable until the Lighting scope is confirmed", five unlit lights with that label, no ≥, no all-green.
Tested on a scratch build without the file (`tests/test_lighting894.cjs` with `UNCONFIRMED=1`, and the adapted
`tests/test_where885_894.cjs`).

## The projection (the v8.82 audit, rebased on the current chain)

- `buildAllAssets` is wrapped: D024 drawing-only lighting symbols (origin `drawing`, sheet D024-26003-02, series keyed or
  circuit, no events, no asset number, hire, delivery or units) and source-row copies (an added row whose asset numbers are all
  its source row's) leave the register. A drawing-only circuit fan becomes a big-screen symbol (`discipline` Big screens,
  `Big screen 01 · D024 drawing symbol`). A fan somebody records a tower against stays a tower (a change from v8.82, which
  renamed every fan).
- `assetOf` still finds the 18 rows, `chargeLines` returns nothing for them, and the drawer carries one notice: "D024 lighting
  callout — map context only …", "D024 big-screen symbol — map context only (confirmed 8 Oct 2026) …", or "NVLT is a copy of
  T0002 — counted with T0002 …". T0002's drawer names its copy (with a button to open it) and its surplus against D024.
- **Native reachability** (the handover's "native reference accessibility"): v8.82 left the rows reachable only through
  `assetOf`, but the drawer opener, the `#asset/` link route, the map's callout links and the finder all read `allAssets()`
  directly, so the rows would have vanished from the map and the search and their drawers could not open. Six one-line widenings
  in the page (each matched exactly once by `rep`) read the register plus the left-out rows: `openAsset_held`, `route()`'s
  `#asset/` case, the map's search hits, callout links and sheet list, and `finderIndex`. The D024 callouts keep their pins and
  lights, the master plan keeps its 13 LTC pins, "LT01" in the finder still goes to its callout, and `#asset/LT01` opens its
  drawer on the D024 sheet.
- **No recursion**: the wrapper calls the page's own build once and stashes the left-out rows; `assetOf` falls back to the
  stash and never rebuilds; the audit is memoised per day in the page's held memo; none of the helpers the projection reads
  (`deliveryOf`, `assetNumbersOf`, `rentalOf`, `unitsOf`, `movedAway`) re-enters the build (checked by reading them).
- The patch asserts each wrapped function is declared exactly once in the page and wrapped exactly once by this release, and
  the script does nothing (with one console line) if a function it needs is missing.

## scope_confirmed.json

`scope_confirmed.json` beside the patch is the confirmed scope: `towers` 6, Andrew's words, the date, and two groups (name,
D024 callouts, scope, the records counted against it). The build checks that the group scopes add up to `towers`, that every
callout is one of the six D024 keyed towers in `evidence/d024_keyed_towers.json` (read off the D024 labels extract) **and** a
D024 keyed-tower row on the page carrying that tag and location, that every keyed tower is in exactly one group, and that every
record is a row on the page. Only `towers`, `by`, `on`, `words`, `groups`, `basis` and the surplus words go on the page. The
page re-checks the sums at run time and falls back to the unconfirmed path, saying why, if they do not add up.

The Schedule (5) BOQ figure is embedded only when `V882_SCHEDULE` names the authorised workbook (exact hash, as v8.82 had it);
this build has no such figure, so the page says the Schedule (5) BOQ reconciliation is still to be done.

## Every other view that changes (base `737c1966…` against the candidate, measured in the browser)

| where | base | candidate | intended? |
|---|---|---|---|
| Equipment tab | Lighting towers 21 rows, 25 units | Lighting towers 3 rows (LT05, LT06, T0002), 7 units; the chip order follows the new counts; no "Big screens" group (the symbols are not on the register) | yes |
| Register tab, Pricing, Demob pick-up lists | 18 lighting rows listed and counted ("3 source-linked alias records", "21 to pick up", "Position to confirm · 8") | the 18 rows gone ("2 source-linked alias records", "20 to pick up", "Position to confirm · 7"); NVLT leaves NVAC's pick-up list | yes |
| Today banner counts (`lightTally`) | 194 live references, 87 red | 176 live references, 70 red (the 17 drawing-only rows read "not on site"); green 93 → 92 (NVLT) | yes |
| Timeline | 11 Sep 2026 shows T0002 and NVLT (5 due in) | NVLT gone (4 due in). LT01–LT04 and the fans never were loads (no dates), and still are not | yes |
| Daily runs and Drivers/Install prints | no lighting-symbol loads | unchanged | — |
| Transport legs (`transport888Core`) | 136 rows, T0002 inbound 11 Sep only | identical | — |
| Demob truck plan (Transport view text) | 95 truck movements, 86 branch loads | 91 movements, 82 branch loads (the four LT01–LT04 pick-ups were counted as branch loads) | yes |
| Map, D024 sheet (opened by its sheet link) | 57 markers, 19 lighting pills; trade filter "All 32 · Generators 13 · Lighting towers 19" | 57 markers, the same 19 pills; trade filter "All 32 · Big screens 13 · Generators 13 · Lighting towers 6"; the 13 LTC pills read "Big screen NN · D024 drawing symbol"; every pill still opens its drawer, now with the notice | yes |
| Map, master plan | 62 markers, no LT/LTC pills | identical; the master positions (MASTER_LOC) that the satellite pin board reads are not touched | — |
| Finder (search) | LT01, LTC01, NVLT found; "light tower" lists LTC01 among assets | the same rows found; "light tower" lists NVLT instead of LTC01 (LTC01 is a big screen now); a pick still goes to the callout | yes |
| `#asset/LT01` link | opens LT01's drawer on D024 | the same, with the notice first in the drawer | yes |
| Costs & P&L, Finance handover, Transport view | see financial preservation below | | |

## Financial preservation

Run on the base (`build/GC500_v8.94chk`, `737c1966…`) and on the candidate, one browser at a time: finance866, costs865,
transport888 (laptop, phone and 2560), v871, supplier870 and kinp869. Pass counts match (table below).

A fingerprint (the sha256 of the rendered Costs & P&L, Finance handover and Transport texts, hashed, never printed) is
**not identical**, and the drift check (the base run twice, minutes apart) shows the base's own texts identical except the
weather panel, so the differences are the projection's. Every difference is explained here without amounts, from the money
models compared key by key (values masked):

- **Unchanged**: Revenue charged to the V8s (`moneySummary().charge.total`, the contract lines, delivery and pickup charges),
  direct costs known so far, labour charged so far (the ticked per-piece labour and its tick count), every transport docket and
  carrier figure, every contract line and cost. All 17 Costs tie-outs still tie.
- **Forecasts and estimates that counted the 18 rows fall away**: (1) the card's hire and transport *estimates* for unrated
  lines (`charge.card_hire`, `charge.card_transport`, `cost.transport.card_cost`) — the 18 rows had a "Light Tower" line
  priced from the card as an estimate, never a contract rate; (2) per-piece labour still to tick — 36 install/demob slots, two
  per row, leave the forecast; (3) provisional transport to come — 36 delivery/pickup legs leave; T0002's own two legs, which
  the building-transport model *held* because "plan tower positions and delivered batch need physical-unit allocation", are
  now ordinary estimates (that hold existed to guard against exactly the double count the projection removes). Revenue to job
  end, the P&L's job-end gross margin, the Finance handover's job-end totals and its branch spread of accommodation and meals
  move with them: that spread is weighted by the labour per piece on each branch, and the 18 rows' install and demob labour sat
  on NVAC, so NVAC's share falls to a single-digit percentage and the branches reorder by share (KINP · STPS · NVAC). NVAC's
  demob labour still to tick also drops (NVLT's). The accommodation and meals totals themselves do not change, only their split.

So the recorded position is preserved to the cent; the job-end forecasts stop counting towers the job does not have.

## Correction after Codex's review (8 Oct 2026, adopted unchanged)

Codex reproduced three faults ([PR 6045955855](https://github.com/tatts29-svg/fish/pull/1#issuecomment-6045955855)) and supplied the fix (`lighting894.js.diff` and `patch_v894.py.diff`), adopted unchanged:
1. **A conflicted completion earned credit.** A Complete tick with a short delivery is held for review on Today and the Timeline, but Lighting still credited it. Lighting now takes completion only from the page's own verified work rows (complete, done and a known quantity, with no conflict). A held row gets no credit, and Lighting then reads as a minimum (≥), because the review can only add.
2. **A drawing callout that becomes a real tower.** If LT01 (say) gets real equipment and completion evidence, it rejoins the register, but the fixed records list could not credit it. Real keyed callouts now join the location the confirmed scope assigns them. A repeated asset number adds no second tower, and a partial overlap or two competing locations is held for review with no credit.
3. **The breakdowns did not add up.** The Done, Total and Left views now use the same scope allocation as the headline, so their rows add up to it. A reference shows its recorded quantity and any surplus separately, and map scope with no tower recorded yet is labelled as map scope, with no link and no record action.

The native work rows, equipment records, delivery history and money readers are untouched. Checked with Codex's `check_lighting894_proposal.cjs` on the combined candidate: **24/24** (projection, native work rows in a VM, native drawer HTML). The combined suite re-runs `test_lighting894.cjs`.

## Checks

Candidate: the full chain (v8.84 to v8.89) plus this patch on live v8.83 `88a3584e`: **`950b42b8691cac9b810d43c3b79465689da1786614f3a400db75c7c6bf24a704`**, 11,287,033 bytes.
Base for the comparisons: `build/GC500_v8.94chk` (`737c1966…`, the chain with the earlier label-only v8.94). Unconfirmed
scratch build (the same source without `scope_confirmed.json`): `f3728a5a…`, 11,286,508 bytes. One browser at a time; every run reads the
live record and attempts no write (`counts.blocked` 0 throughout).

| check | result |
|---|---|
| `tests/test_lighting894.cjs` on the release build (confirmed) | **35/35** laptop (1440 px) and **35/35** phone |
| `tests/test_lighting894.cjs` with `UNCONFIRMED=1` on the scratch build | **30/30** laptop and **30/30** phone |
| v8.85 `test_where885.cjs`, original expectations, on the release build | **24/24** at 2560, 1600 and 1440 px and on phone — unchanged, as the whole job is back |
| `tests/test_where885_894.cjs` (adapted copy) on the unconfirmed scratch build | 24/24 at 1440 px and on phone |
| v8.84 `test_wide884.cjs` | 21/21 at 1600 px and on phone |
| v8.76 `test_layout876.cjs` | 18/18 laptop and phone |
| sweeps (`toolchain/harness/sweep.js`) | laptop and phone: 21 tabs, 15 shown, 0 page errors, 0 console errors, 0 attempted writes |
| finance866 | base 24/24, candidate 24/24 (laptop and phone) |
| costs865 | base 33/33, candidate 33/33 (laptop and phone) |
| transport888 | base 29/29, candidate 29/29 (laptop, phone and 2560 px) |
| v871 · supplier870 · kinp869 | base 12 · 17 · 17, candidate 12 · 17 · 17 |
| text fingerprints (Costs & P&L, Finance handover, Transport) | differ; every difference is a forecast or estimate explained above, with the recorded figures identical and the 17 Costs tie-outs still tied; the base run twice is identical except its weather panel |
| views comparison (`evidence/views_compare894.json`) | counts only: the register, the readings, Equipment, Timeline, transport rows, finder results, the drawers' notices, the map's D024 and master markers |

Also measured: `progress881Model` costs about 114 ms a call on this record (unchanged by v8.94, which adds no second pass:
the card's own model and summary are reused for the words).

## Build

```
toolchain/build.sh v8.94 v8.84_today_wide_layout_DRAFT/patch_v884.py v8.85_where_we_are_DRAFT/patch_v885.py v8.86_event_portables_days_DRAFT/patch_v886.py v8.87_map_explorer_DRAFT/patch_v887.py v8.88_costs_transport_DRAFT/patch_v888.py v8.89_master_map_DRAFT/patch_v889.py v8.94_lighting_basis_DRAFT/patch_v894.py
```

The footer step accepts the single ` · v8.89` … ` · v8.93` marker, so v8.91, v8.92 and v8.93 may come before or after it.

## Files

`patch_v894.py`, `lighting894.js`, `lighting894.css`, `scope_confirmed.json`, `evidence/d024_keyed_towers.json` (the six
D024 keyed towers and the 13 fan-to-screen pairings, read off the labels extract), `tests/test_lighting894.cjs` (both states),
`tests/test_where885_894.cjs` (v8.85's test with four expectations adapted for the unconfirmed scratch build only; the v8.85
folder is untouched and its original test passes unchanged on the release build), `evidence/*.log` (dollar figures redacted,
scratch paths stripped) and `evidence/views_compare894.json` (the base-against-candidate counts). Screenshots that show
money stay local.
