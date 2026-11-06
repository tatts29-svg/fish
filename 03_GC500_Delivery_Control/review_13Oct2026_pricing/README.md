# Pricing source review and race-weekend fencing

Author: Andrew Fisher · 13 Oct 2026

Status: READ / COMPARED / VERIFIED. No app release, rate import or native record change.
v10.06 remains live. Source review does not establish acceptance of a supplier quotation.

## Andrew's instructions

- BOQ is secondary evidence; confirmed site records prevail. Review price differences without importing a damage waiver or BOQ rates.
- Compare our price and the BOQ price on the same row. Show daily rates where supported; do not invent a hire period or extract an unsupported hire-only amount from a package.
- Draft a polite request for agreed pricing and the missing hire-period/package breakdown. Draft only; not sent.
- “Our rates can ve edited so if we need to change later we can :)” — retain the ability to revise approved prices; no new numeric rates supplied by this statement.
- “Also race weekend ensure we calculate the fencing guys labour correctly we have 6 fencing people working”
- “We charge v8s $88.49 an hr per person for fencing guys.”

## Original sources read

1. `BOQ003-26003-02 BOQ by Facility - Coates 13.10.pdf`: 42 pages, 403 priced/source lines, 186 facility totals. SHA256 `0eb57ce572ea4a9d407bc75e38e118ab558c4a4e1cfb9cb2eee7b9fa675a413b`. Private original in `/tmp/codex-remote-attachments/01a0f19e-5476-770e-91a2-08c3158610ba/429c2db9-8867-4031-9568-b1e3365fc62e/1-BOQ003-26003-02-BOQ-by-Facility-Coates-13.10.pdf`. Extracts, source mappings and independent checks in `/workspace/private-gc500-boq13/`.
2. `Coates - GC500 Event 2026 - Hire Quotation 27172 - 04-06-2026.pdf`: readable replacement, four pages, issued by Advanced Temporary Fencing to Coates. SHA256 `92ec81f92a34dd0bc5245bb01f78b3737a6b0870ed06dc8f74a2beff6e7f1f07`. Private original in `/tmp/codex-remote-attachments/01a0f19e-5476-770e-91a2-08c3158610ba/f633b0c2-fefc-4cdc-b503-9af0b6e88f24/1-Coates-GC500-Event-2026-Hire-Quotation-27172-04-06-2026.pdf`. Earlier upload was encrypted and unreadable; do not describe it as reviewed. Extract and page renders in `/workspace/private-gc500-quote27172/`.
3. Approved Street Rate Card 2026 workbook and issued PDF, with the existing confirmed fencing overrides, were checked against both sources. Exact rate-card/source-cell evidence is in the private comparison mapping.

The BOQ separately lists some equipment labour but does not separately price installation or levelling for building/toilet package lines. The supplied card does. The supplier fencing quotation establishes a quoted Direct cost basis, not customer Revenue. Its exact hire dates are absent, final total is TBA, and event-specific freight/labour notes need reconciling with the general inclusion wording before applying costs. No 25% damage waiver is listed in either reviewed document. The supplier quote is dated June and states 30-day validity; current acceptance/PO evidence is needed before treating it as the October payable agreement. Detailed supplier prices and originals remain private.

## Deliverables

- `/workspace/output/GC500_Rate_Card_vs_BOQ_13Oct2026.xlsx`, SHA256 `6d9b56411492cf9e13b3f8ddc58f4140da8803f6aabf3efa6d351756d33a61ab`: 94 price entries, all 403 source rows, 21 valid daily comparisons. Both prices on the same row, visible units, missing package daily rates flagged, track-mat unit mismatch excluded from daily differences. Data and final render independently checked.
- `/workspace/output/GC500_Pricing_Confirmation_Email.txt`: draft requesting agreed pricing, hire dates/duration and separated hire/labour/transport. Not sent.

The Excel file is an editable standalone comparison, not a live connected rate editor.

## Fencing race-weekend verification

Fresh GET-only public check at 20:16 AEST, record version 5796, confirms existing event scope `fence` already matches Andrew's instruction: six people on 23, 24 and 25 Oct, exact customer rate $88.49/person/hour. No correction or duplicate charge row was needed.

| Day | Planned hours/person | People | Person-hours | Customer Revenue ex GST |
|---|---:|---:|---:|---:|
| Fri 23 Oct | 10 | 6 | 60 | $5,309.40 |
| Sat 24 Oct | 11 | 6 | 66 | $5,840.34 |
| Sun 25 Oct | 11.5 | 6 | 69 | $6,105.81 |
| Total | 32.5 | | 195 | $17,255.55 |

Hours derive from the existing provisional access-plan scope, with no native hour/time overrides. They are planned hours, not completed timesheets. Do not claim the race work has occurred. Keep these hours adjustable as confirmed work is recorded.

`scopeFigures()` feeds the existing event Revenue once through `moneySummary()` and P&L Installation (1047). `scopeBranchAllocation978()` allocates the fencing component to STPS; it does not add Revenue again. The supplier's Advanced crew costs stay separate. Public checks confirmed matching Costs/P&L Revenue, passing P&L reconciliations, unchanged native state, zero browser errors and zero writes. Independent source review confirmed the branch and non-duplication paths. Private evidence: `/workspace/private-gc500-fence-race13/live-check.json`; read-only checker retained alongside this README.

## Existing rate-editing scope

The fencing rate, daily people and hours are editable through Costs & P&L → Customer rates & charges → Event labour → Fence team (`setScope`). Other existing controls include item-type hire overrides and eligible unpriced contract-line overrides. Generator standby follows the applicable override; there is no independent standby-rate field. Install/level/clean/demob rates currently require a central card update, not a universal on-screen service-rate editor. The explicit delivery/pickup-rate editor introduced in v10.06 is limited to GN20. Do not promise every rate category has a global editable UI.

No current prices or records were changed. Future accepted changes must retain source attribution, correct units, shared financial calculations and the separation of Revenue from Direct costs.
