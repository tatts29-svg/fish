Coates Industrial Solutions | GC500 2026

# Tools → Questions: evidence review and Claude handover

**Reviewed:** 28 September 2026, approximately 04:21–04:32 AEST.  
**Scope:** all 49 active questions: 2 By branch, 9 Fencing, 1 Transport, 3 Labour and 34 Schedule & plant.  
**Live source:** https://gc500-production.up.railway.app/v/Coates-GC500-2026#questions  
**State reviewed:** shared record version 2038. Read-only review; no live data changed. Monetary amounts below are AUD ex GST.

## Main finding

The active list is not a reliable count of unanswered business decisions. It combines current missing inputs with old workbook-import observations, superseded documents, permanent rules, repeated questions and expired planning warnings. Several answers already exist in the live operational records. Remove the obsolete questions from the active view, retain their source/history, and expose only the precise unresolved part.

This is not an instruction to mark everything complete. A verified supplied quantity, a planned collection date, a customer rate, a supplier cost and an approval are different facts. Populate the facts already supported; keep approvals or commercial figures only where genuinely missing.

## Start here — instruction for Claude

Review the current project against this handover and implement the Questions cleanup. Use the latest shared record and any later explicit Andrew instructions you hold. Begin with R01–R05, R07/R08/R18/R24, TX03/TX04, and the four fencing record-gap prompts. Replace old wording with the evidence-backed answers below. Archive/merge source observations; do not erase their audit history.

Repair the issue-generation and resolution model so a typed comment cannot falsely resolve a question. Link each remaining question to the exact affected records and fields. Separate operational unknowns, commercial inputs, future pricing setup and historical notes. Reconcile active counts from the same live data used by Today, Plant, Pricing, Costs and Fencing. Show a concise list of changes, remaining decisions, and test results. Do not deploy solely on this document: follow Andrew's existing deployment instructions for this project.

## Answers that should already be shown

| Topic | Supported current answer |
|---|---|
| WC05 | 1 toilet block 1097377 + 1 waste tank 1328978. |
| P09 | 1×6 m building 1268824, recorded delivered 16 Sep. |
| Seven blank building quantities | 1 building at each P13, P14, P15, P16, P41, P44 and P58; identities below. |
| GN20 replacement | Old 200 kVA row cancelled; requested 350 kVA, allocated 365 kVA asset 1276701, planned 30 Sep. |
| GN23 | Requested and allocated 150 kVA; current asset 1297157, planned 30 Sep. |
| VMS | 22 new-hire units; 5 relocations are movements of existing units. Remaining BOQ difference is 23 vs 22. |
| Towers | Schedule and rental both 7. Remaining BOQ/drawing mapping is the real question. |
| Internal office and lunchroom | Both 4.8×3 m; remaining collection-date conflict is 12 vs 13 Nov. |
| Fencing programme | 2026 construction/event programme received 11 Sep. Demob corrections remain. |
| External BOQ | Now represented by a comparison: 8 differences, 7 substantive. |
| Carrier links | All 22 loads have reference links; check repeated P20/P21 assignments rather than saying no links exist. |

These factual answers can close old missing-information premises. If a separate billable-quantity, revised scope or authorisation decision is still required, name it explicitly rather than re-asking the answered question.

## Disposition of all 15 generated questions

| Group | Question ID/topic | Treatment | Answer / required fix |
|---|---|---|---|
| By branch | br-norate-KINP | Keep, prefill exact exceptions | 10 contract lines lack rates: 9968955 lines 3, 49, 50, 54, 94, 95 (six tanks); 9968929 lines 1, 3 (4.8 m shells), 5 (container), 7 (FWF). Names/specs/candidate card rates can be filled now. Agreed contract rates still need the contract source. |
| By branch | br-norate-NVAC | Keep, prefill exact exceptions | 33 lines on 9961976:16 generators, 8 forklifts, 7 towers, 1 access line, 1 accessory. Group one branch action with 33 expandable rows. A card estimate must not silently become a contract rate. |
| Fencing | fe-quote | Keep precise commercial input | No accepted quote quantity baseline is recorded. Ask for accepted quote/reference, or record an agreed measured-work arrangement. Programme/BOQ quantities and PO numbers do not prove quotation coverage. |
| Fencing | fe-rate-removal | Keep focused decision | Separate removal sell/cost rates are missing. Service note 24455 already records 32.5 m stacked down and 0.75 supplier labour hour. Determine whether customer removal is included or separately charged, with rate/unit. Do not charge the same labour twice. |
| Fencing | fe-rate-v_gates | Keep real exposure | Three vehicle gates are recorded; supplier cost is $50 each, but customer sell rate is unknown. Ask for the sell rate per gate, ex GST. Do not use cost or pedestrian-gate price as the answer. |
| Fencing | fe-rate-team_leader | Move to pricing setup | No booked quantity currently appears. Keep the missing sell rate/unit as before-first-use setup, not urgent daily action. Existing supplier $200 does not establish a customer rate; older Week 5 evidence describes daily each and should be reconciled to the current source scope. |
| Fencing | fe-gap / scrim | Merge into one reconciliation | Recorded 215 m vs due-by-day 2094 m gives 1879 m unmatched in records. This is not proven physical delay. Check braces-only dockets, scrim instruction/timing, later upgrades and approved plan changes. Do not infer metres from brace counts. |
| Fencing | fe-gap / vehicle gates | Merge into one reconciliation | Recorded 3 vs plan 45 gives 42 unmatched. Wheels do not establish a gate count. Link actual gates to the exact planned work before asking for a recovery plan. |
| Fencing | fe-gap / pedestrian gates | Merge into one reconciliation | Recorded 4 vs plan 6 gives 2 unmatched. Dockets 36509 (two), 36514 (one), 36544 (one) supply the four known gates. Check remaining plan rows and subsequent records before asserting physical shortfall. |
| Fencing | fe-gap / CCB demarcation | Merge; classify before recovery | 2372.5 m is booked to event CCB and 0 m to demarcation, against 1404 m planned demarcation. Some docket notes explicitly leave category to the manager. Resolve locations/types first; do not automatically move all event metres or reprice them. |
| Fencing | fe-closure | Replace unconditional prompt | 2026 order/times were supplied 19 Sep on a 2019 printed base. Correct last year to 2019. Ask only unresolved current meanings: colour group, whether paired order marks act together, and whether time windows mean closed or clear-by; retain required 2026 location/authority evidence. |
| Transport | tr-miss / transport summary | Replace vague question with missing-load list | Known summary is 36 priced schedule loads totalling $21,721 ex GST and 23 Internal records. Some amounts carry a provisional “+” marker. Build the expected load/leg ledger then show exact missing invoices/final amounts. Internal excludes external carrier charge but does not prove zero truck operating cost. |
| Labour | lb-rates | Resolve reporting scope; do not guess wages | 2070.5 unpaid-break-adjusted hours include the future plan. Latest supplied workbook explicitly says HOURS, NOT PAYROLL; live app added pay prompts. Honour any later direct instruction Claude holds; otherwise remove this as an operational missing-input question and show labour costs excluded. Actual pay/buy rates are not supplied and cannot be derived from customer charges. |
| Labour | lb-nights | Keep genuine missing rate | Alfie has 39 scheduled nights across the job with no nightly price; distinguish reported stays from future plans. Andrew’s $223.63/night is confirmed only for Andrew and must not be copied. Keep one task for Alfie’s own ex-GST rate and split planned/actual nights. |
| Labour | lb-miss / event staff | Rewrite uncovered coverage only | Known event roles/headcount/customer rates exist. Match required shifts to named people or supplier coverage. Ask only for uncovered cost sources. Do not add six fence-team wages again if the same work is covered by Advanced invoices/green-book labour. |

## Disposition of all 34 historical questions

| ID | Treatment | Answer / remaining action |
|---|---|---|
| R01 | Answer; archive old warning | WC05 is one toilet block 1097377 plus one waste tank 1328978. Live unit records and rental 9968955 lines 1 and 3 agree. Preserve the original T as source history. Use distinct block/tank quantities; do not collapse them into two identical toilets. |
| R02 | Answer; merge TX04 | P09 is one 6 m building, asset 1268824, rental 9968862/28 and recorded delivered 16 Sep. The old 1097377 was an asset number, not a quantity. Retain raw cell history; populate the verified supply field. |
| R03 | Answer; archive seven-blank warning | One building at each: P13–1097346; P14–960599; P15–1097345; P16–415575; P41–1189412; P44–198481; P58–1273656. Use the latest shared identities, especially corrected P13/P15 and swapped P44/P58. Keep raw blanks; derive supplied quantity with evidence. |
| R04 | Answer substitution; retain history | Old 200 kVA row T0019 was cancelled by Andrew on 15 Sep. Replacement is GN20/T0075, requested 350 kVA, allocated asset 1276701 described as 365 kVA on rental 9961976/6, planned 30 Sep. Show requested and allocated ratings separately. It is pending, not delivered; never charge the cancelled row as extra supply. |
| R05 | Answer; archive superseded conflict | GN23 now requests 150 kVA and is allocated asset 1297157, also described as 150 kVA on rental 9961976/9. Old 1277449/250 kVA wording is superseded. Planned 30 Sep; pending delivery. |
| R06 | Keep one BOQ reconciliation; merge R18 | Both BOQ sources are now represented: 8 differing rows, 7 substantive. Show the actual differences and request the governing source/revision once. Rebuild summaries from that decision; do not keep an old pivot-count warning independently. |
| R07 | Supersede; merge residual into R23 | Current D022/D023/D024 are project 26003 rev 02. Archive the premise that only 2025 drawings exist. Formal current issue/applicability remains a separate question if not recorded. |
| R08 | Remove obsolete programme request | The 2026 construction/event fencing programme arrived 11 Sep. R28 already acknowledges this. Preserve only the current demob-baseline task under R28. |
| R09 | Rewrite; merge R17 | Planned rental end/pickup dates exist: P09 and WC21–13 Nov; GN20–26 Oct. Build one return reconciliation listing unmatched releases, transport bookings and conflicts. Planned dates are not actual collection or off-hire evidence. |
| R10 | Answer sizes; keep exact return-date conflict | Internal office T0021/960639 and lunchroom T0022/960634 are both 4.8×3 m on rental 9968929/1 and /3. Demob rows T0222/T0223 still say 6 m on 12 Nov; rental planned pickup is 13 Nov. Correct/link the known identities and resolve only the date discrepancy. |
| R11 | Keep narrow location question | Known: two synced 200 kVA units 1316182/1316183 planned 12 Oct. Ask only for the official location/reference and deployment confirmation still absent. Do not invent GN numbers. |
| R12 | Move to reference rules | Mapped equipment is not automatically Coates scope. Preserve supplier/scope flags. Raise a question only for an identified unresolved scope boundary. |
| R13 | Move to progress rules; update stale wording | Preparation notes do not prove completion, but live delivery, completion, levelling and steps records now exist. Use those named/time-stamped records. The claim that the app only has source dates and notes is obsolete. |
| R14 | Merge into current mapping exceptions | Keep alias validation as a rule. Generate only unresolved current links, together with R25. There are 63 GPS fix records, including both unit and parent records; they are not 63 unique assets or blanket map approval. |
| R15 | Merge into R27 tower scope check | Schedule and rental agree on 7 towers: 5 Molendinar delivered and 2 LT05/06 pending. BOQ 9 remains a scope difference. Do not claim two physical towers are missing. |
| R16 | Rewrite to one remaining scope decision | Schedule and rental 9961265 show 22 fresh VMS units; rental has 8 delivered and 14 pending. Five relocations make 27 movement quantities, not 27 unique hired units. Ask whether BOQ unit 23 is required or the BOQ should change. |
| R17 | Merge into R09 | Planned collections now exist: towers 26 Oct; VMS 13 Nov. Remove blanket not-traceable wording; retain unmatched units/bookings and eventual actual return evidence. |
| R18 | Supersede missing-source claim; merge R06 | Pricing now compares the external BOQ and internal BOQ: 8 differences/7 substantive. It is no longer accurate to say the external source has not been supplied. Do not blindly refresh the historic external pivot. |
| R19 | Move to engineering backlog | Heading-aware imports and raw-cell retention are implementation requirements. Andrew should not repeatedly answer them. If DD or an unlabelled transport value still affects a current row, ask that precise question once. |
| R20 | Move to planning guidance | Thirty schedule rows do not mean thirty trucks. Use actual tasks, crew, load and access-window records. Only a specific uncovered day/role belongs in the active queue. |
| R21 | Archive as historical-source metadata | 2021/2019 historical fencing material is background. Classify it accordingly; no ongoing business question is created merely by knowing its age. |
| R22 | Retire umbrella warning; preserve specific residuals | The app now has 58 fencing dockets, 10 service notes, 3 collection forms, 49 area-complete entries and 63 GPS fix records. Do not keep saying these records do not exist. Keep individual unresolved scope, demob, mapping or evidence-coverage tasks; their completeness is not automatically proven. |
| R23 | Keep one current document-control action | State that 2026 drawings are received. Ask only for any missing current issue/applicability confirmation. Merge R07/R14/R25 as linked evidence or individual exceptions; do not request another copy of already-held drawings. |
| R24 | Archive historical file; remove obsolete request | The old P006 file is 2025/2023 background. Its own text says 2026 build/event programme was received. Demob belongs under R28, not another obtain-the-programme question. |
| R25 | Merge; generate remaining mapping exceptions | Re-evaluate current links per asset using current source and recorded checks. Replace blanket none-verified wording. Phone GPS does not by itself approve every schedule-to-drawing alias. |
| R26 | Split answered substitution from remaining scope | GN22 portion is explained by the GN20 replacement in R04. Drawing callout 028 still has no matching Coates schedule row. Ask whether 028 belongs to Coates scope; do not create a new hire obligation from a drawing alone. |
| R27 | Keep one tower mapping/scope decision | There are 19 callouts across two numbering series, not 19 proven unique hired towers. Seven hired/scheduled towers are identified. Map them to approved locations and reconcile BOQ 9 once; merge R15. |
| R28 | Narrow to demob and remaining baseline changes | Construction/event dates exist. Correct the 2025/2027/2028 demob source dates using a current authorised programme, without inheriting old Complete marks. Keep only remaining scope/compound-payer differences. Quote quantities belong once under fe-quote. |
| R29 | Prefill current actuals; keep residual plan differences | PB 03 actual 20 m on 36508; Cypress 97.5 m on 36505 plus 97.5 m scrim upgrade on 36539; S05 BOH 35 m clean on 36518. Those facts answer parts of the old question. S04 extension 22.5 m on 36546 does not prove the old 41 m planned extension is settled. Separate measured actual, finish/type and approved revised scope. |
| TX01 | Expire historical warning; retain unresolved exception if any | The 14–17 Sep early-arrival planning window has passed. Archive the old prospective warning. Keep carrier/access rules available; only a documented unresolved historical access exception or future early booking should be active. Do not infer that early access was approved. |
| TX02 | Archive expired capacity warning | The 14/16 Sep four-early-load cap was a dated planning constraint, not a perpetual question. Apply the same limit to future bookings when relevant. |
| TX03 | Replace stale blanket statement with link audit | All 22 carrier loads now have Andrew-stamped reference links. P20 is linked to 16 Sep loads 10 and 14; P21 to loads 12 and 16. Review those duplicate assignments against load/docket identity; do not automatically delete either. The old cannot-be-paired statement is false for the current record. |
| TX04 | Merge into answered R02 | This is supporting evidence for the same P09 quantity-cell error. One 6 m building 1268824 is now recorded. Keep the carrier evidence in history; remove the duplicate active question. |
| TX05 | Rewrite as a historical load reconciliation | The original day-row/load mismatch is not proof of current undelivered buildings. Use all 22 current links, delivery dockets, extra/internal movements and the duplicate links in TX03 to identify exact remaining unmatched rows. Keep only those exceptions, not the whole old forecast warning. |

## Keep the remaining questions small and specific

Recommended default: **Needs action**, with optional **Awaiting input**, **Resolved/history**, and **Pricing setup** filters. Group child records without losing their individual status. Do not hard-code a target count; the number must result from current evidence.

Each row should show: concise issue, affected reference/count, known answer, the one missing input, proposed owner, due date if known, and a direct action. The expanded view holds the source, maths, raw wording, answer history and attribution. Assign owners from the actual project contacts; do not invent acceptance or due dates.

Examples:

- **NVAC contract pricing — 33 lines:** Review contract 9961976; show missing rate lines and source date.
- **VMS scope — one-unit difference:** Contract/schedule 22; BOQ 23. Is the extra unit required?
- **Alfie accommodation:** 39 scheduled nights across the job; enter the agreed nightly rate ex GST.
- **Concert generators:** 2×200 kVA, 12 Oct, 1316182/1316183; assign official reference/location.
- **Demob reconciliation:** show known proposed dates first, then only unassigned/conflicting returns.
- **Fencing records:** one action with scrim, vehicle gates, pedestrian gates and CCB classification as subrows; physical recovery only after reconciliation.

Keep the CEO view focused on material current decisions. Business history and implementation rules remain accessible without filling the default page. Use short status transitions of about 150–200 ms, honour reduced motion, and avoid large animated headings or moving figures on this working page.

## Priority implementation defects

### 1. Answers are incorrectly treated as resolutions

`renderQuestions_held()` counts `!qAnswer(q.id)`. `setQAnswer()` saves text only. Typing “waiting for quote” therefore reduces the open count despite changing no business condition. Preserve answer/comment independently of status. Resolve only when the underlying field validates, a sourced superseding record settles it, or an authorised exception identifies exactly what is accepted.

### 2. Historical questions cannot follow current evidence

`questionsList()` appends `DATA.open_items` based on static status text. It ignores later quantities, cancellations, documents and operational records. Add explicit rule/entity dependencies and resolution/supersession metadata. Keep the raw import observation unchanged as history; generate the live residual issue separately.

The current regex `/closed|resolved/i` is unsafe: **unresolved** and **not resolved** both match. Use explicit status enums with exact comparisons.

### 3. Some prompts are unconditional

`fe-closure` is always appended. `moneySummary_()` always emits broad wage/transport descriptions, and the event-staff warning whenever scope exists, without enumerating actual uncovered entities. Do not create questions by searching prose for keywords. Use typed rules returning affected record IDs and reason codes.

### 4. Rate questions point to the wrong editing mechanism

Branch questions read `contractCharge()` / `contractFigures()` over `ONHIRE_ROWS.rate_1`, but their button opens Pricing, whose overrides write `S.rates`. A card-price override does not repair the contract rate. Provide contract-line exceptions/import or an explicitly authorised contract override with source, date and basis. Link directly to the relevant contract/line, not the top of a large tab.

Current 43 affected rows have missing rates. Future calculation failures may instead be missing dates or invalid periods; label the actual reason, not every failure as “no rate”.

### 5. Work due today is labelled late before the day starts

`plannedToDay()` includes `date <= today`. At 04:20 on 28 Sep this includes the whole day's fencing plan, before the recorded 07:00 site start. Split planned through previous completed workday, due today, recorded matched work and confirmed outstanding. Use explicit deadlines/cutoffs for overdue. A shortfall in the record is not automatically a physical delay.

Fencing classification also matters: 2372.5 m sits in event CCB, with notes leaving the split open; demarcation 0 m therefore does not prove no demarcation was installed.49 area-complete flags do not supply missing metre/gate counts either. Reconcile by location/work package and phase.

### 6. Preserve physical work versus billing components

Some clean-fence metres and scrim-upgrade metres describe the same fence. Do not add them as extra physical installation. Keep physical length and treatment state separately from customer bill items and supplier costs. Retain the current settled rates: scrim $25.53/m, CCB event $7.51/m, CCB demarcation $13.08/m, labour $142/h. Do not reactivate obsolete rates from old prose or the earlier 24 Sep review file.

### 7. Labour policy and actual/planned time need one basis

The latest supplied v3 workforce workbook explicitly says HOURS, NOT PAYROLL, excludes labour costs and has blank breaks with no deduction. Embedded source policy also says hours only. The newer Running Sheet applies 30-minute weekday deductions and pay bands, and asks for pay rates. Check later direct instructions in the Claude project before treating the change as intentional. Do not infer wages from sell rates or apply another shutdown's pay model.

`runTotals()` counts all today’s scheduled hours as worked-to-date via `date <= today`. At about 04:25 the screen already includes today's 42.5 scheduled hours, before 06:00/06:30 starts. Introduce planned/reported/approved shift states; do not promote a schedule to actual work at midnight. The 2070.5 h question is whole-job planned plus recorded hours, not 2070.5 h already worked.

If payroll costing is intentionally enabled, connect confirmed costs to `moneySummary_()` once; its current missing-wage text and known-cost calculation are disconnected from Running Sheet pay. If hours-only remains the scope, remove operational wage-price prompts and explicitly label costs as excluding labour. Do not call the residual difference profit.

### 8. Partial/zero values must be handled properly

Accommodation currently tests `x.nights && !x.accommodation`: pricing one night can hide other unpriced nights, and an authorised zero-cost stay may create a false question. Count unpriced individual stays with explicit null checks, source coverage and status. Similarly, a partly entered quote cannot settle unquoted categories.

The current Building 9.6 m override is explicitly 0. Preserve it as a value while separately checking its authority; do not convert it to blank or silently approve free hire.

### 9. IDs, history, reopening and failed checks

`qSlug()` removes numbers/punctuation and truncates text to 60 characters. Different issues can collide; copy changes can orphan answers; an old aggregate answer can hide newly missing lines. Use immutable rule+entity IDs and an evidence fingerprint. New missing children reopen their parent group. Store an archive; currently disappearing dynamic questions lose their visible answer/history.

Several evaluators swallow errors with empty catch blocks. A failed check must show “checks incomplete”, not reduce the count as if everything is settled. Show answer author and Brisbane timestamp; time is stored but currently only the author is rendered.

### 10. Transport needs a load-and-leg model

Transport summaries use different scopes: Questions/Costs reports 36 priced schedule loads/$21,721, while Pricing's current reference summary reports 23 references/$10,532. These may be different universes; label and reconcile them instead of implying the same total. Preserve quotation estimates, schedule allowances and actual invoices separately.

The phrase “each written with a plus” is generated from any plus-marked entry; report the actual count. A ref-only override can suppress another movement leg; use unique load/leg IDs. Internal means no external carrier charge, not free transport. Review the duplicate P20 and P21 load links without assuming a mistake where a separately evidenced second movement exists.

### 11. Planned return is not actual off-hire

Some helpers label populated expected-term/booked-pickup dates “off hire”, even though actual term/return evidence is absent. Keep planned collection, confirmed booking, actual collection and actual hire end distinct. This allows old R09/R17 questions to be narrowed without falsely closing returns.

### 12. Pricing labels and source authority conflict

The current Pricing page says street card in the banner but “Rate card—2026 circuit” on the table. Metadata also retains circuit/42 day wording while the newer matching basis says street/70 day. Use one current selected-card/basis record for calculations, labels and remaining questions, with previous decisions kept in history. Preserve contractual rates separately.

Additional visible mismatch: Fencing shows a top docket-cost subtotal $60,476.50 and broader known-cost total $61,426.50, the extra $950 being green-book labour. That is a scope distinction to label clearly, not a demonstrated arithmetic error. Its “1 lines with no rate” counter is a docket-exposure count, while Questions lists 3 missing rate types; label both measures so they do not look contradictory.

## Minimal data model and migration

An issue needs: immutable ID; rule; affected entity IDs; category; severity; known facts; precise missing field; source references/version; observation time; suggested owner; due date if known; status; answer/comment history; resolution evidence; resolved-by/time; superseded-by/merged-into; last evaluated fingerprint.

Use explicit states: Open, In progress, Awaiting external input, Resolved, Superseded, Not applicable. “Answer recorded” is not a resolution state. Do not mark a derived answer as approved by Andrew merely because his earlier records support its facts. Keep the original recorder's stamps and add separate review/derivation provenance.

Migrate R01–R29/TX01–TX05 into history plus current residual tasks using the table above. Migrate existing answer strings into comments; no text-only answer auto-closes an issue. Preserve source quantities, verified supplied quantities and approved billable quantities independently. A resolved source condition should close linked duplicate questions once and remain auditable. A changed condition should reopen only its affected entity.

## Focused acceptance checks for Claude

1. Every one of the 49 reviewed questions has a recorded disposition; no source observation is silently discarded.
2. WC05/P09/seven buildings show the current identities and quantities; raw workbook errors remain accessible. No blanket blank→1 rule.
3. GN20 shows requested 350/allocated 365 and cancellation; GN23 shows 150/current asset. Both remain pending unless current delivery evidence says otherwise.
4. R08/R24 stop requesting the construction/event programme; demob remains where incomplete. R18 stops saying the external BOQ is absent.
5. Typing “awaiting quote” leaves an issue open. An actual source fix closes it and records evidence. “Unresolved” stays open.
6. A card-rate edit cannot falsely settle a missing contract rate; a new missing contract line reopens the branch group.
7. At 04:20 on 28 Sep, today's planned fencing is due today, not automatically overdue; today's full shifts are not already worked.
8. One priced and one unpriced accommodation night still raises a gap; a sourced authorised zero is not missing. Partial quote entry does not close other categories.
9. CCB category reconciliation does not invent installed metres or silently change charges; clean and scrim upgrades do not double physical length.
10. The 22 load links reconcile; duplicate reference assignments have an evidence-backed explanation or correction, and inbound pricing does not hide outbound costs.
11. Expected return dates are labelled planned and do not prove collection/off-hire. Recorded actual returns remain intact.
12. A failed evaluator gives checks-incomplete state. Open/awaiting/resolved counts match the filtered records. History retains names, dates and sources.
13. Refresh/sync preserves results across two views; the supplied view-only URL remains read-only. Check focused desktop/mobile layout and reduced motion after the new list is rendered.

## Evidence and review limitations

Observed live: Tools→Questions 49 open/0 answered; Running Sheet; Pricing; Fencing; search result for WC05. Reviewed delivered HTML and embedded DATA, plus read-only shared state version 2038. Relevant implementation functions include `questionsList`, `renderQuestions_held`, `qAnswer`, `setQAnswer`, `qSlug`, `plannedToDay`, `runTotals`, `contractCharge`, `contractFigures`, `moneySummary_`.

Current supporting source fields include `DATA.open_items`, `assets`, `rental_on_hire`, `boq`, `fencing`, `ops.fencing`, `closures`, `workforce`, and shared collections `units`, `assetNumbers`, `loads`, `fenceDone`, `fixes`, `labour`, `rates`, `costs` and attribution stamps. Raw GPS coordinates and staff contact details are unnecessary for this handover and have been omitted.

Also read: Coates_GC500_Labour_Accommodation_Meals_Expenses_EX_GST_v3.xlsx, Summary/Setup; and GC500_Fencing_Buy_Sell_Check_24Sep2026.txt. The latter explicitly reviews older defaults and does not supersede current settled rates. This review did not establish unrecorded approvals, invoices, employment rates or actual collection outcomes, and did not edit production.
