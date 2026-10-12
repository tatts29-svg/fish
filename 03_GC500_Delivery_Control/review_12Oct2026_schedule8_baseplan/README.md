# Schedule 8 and Baseplan source review

Author: Andrew Fisher

Status: **READ AND COMPARED — not imported or published**. Review completed 12 Oct 2026. The live application remains v10.05. No operational records, rates, charges, maps or running sheets were changed by this review.

Andrew supplied both originals in the current chat and asked: “Also see attached updated baseplan and schedule. See if anything has been changed or updated to assist.” The review compares the complete workbooks with the last reviewed originals, then checks material changes against a fresh read-only live snapshot captured at 14:29:12 AEST on 12 Oct.

## Exact sources

Private attachment directory:
`/tmp/codex-remote-attachments/01a0f19e-5476-770e-91a2-08c3158610ba/a60922c4-c761-44fe-b9e9-14ccb8970fc1/`

| Source | Private filename / path | SHA256 |
|---|---|---|
| New Schedule 8 | `1-GC500-26-Schedule-8-.xlsx` in the attachment directory | `df43938f8a2de8fbcdfcd478ebdd4021ae512eca5787786f525498d322cb4bb0` |
| Prior Schedule 7 | `/tmp/codex-remote-attachments/01a0f19e-5476-770e-91a2-08c3158610ba/97e3ae1c-6e01-4dd1-b6c2-807968018afe/2-GC500-26-Schedule-7-.xlsx` | `485f5d885b88d836b63e85ad4062474a95a484022386efec7be62429f958edac` |
| New Baseplan | `2-Baseplan-SuperCars-1-.xlsx` in the attachment directory | `6f6a20a3567d99ff0f1e0e97c8387d5a94907a358711c7d52cf5b1043e54956d` |
| Prior reviewed Baseplan | `/workspace/private-workbooks09Oct2026/baseplan/source-workbook.xlsx` | `eb4a224fadbe1350d031adf8a1b12760d3dd748a2f0643119ea103d1df9b5b21` |

New workbook metadata: Schedule modified 12 Oct 2026 13:53:52 AEST; Baseplan modified 12 Oct 2026 13:52:35 AEST. These are workbook timestamps, not confirmation of physical movements.

Live basis: v10.05 public SHA256 `65bba5cb7477816d587cb72025ff256f2eb8c2dbc65eb4087dccc5ad49f4622a`; private snapshot `/workspace/private-gc500-source1006/live-snapshot.json`. The private directory's number is a working identifier, not a v10.06 claim or release.

## Scope and findings

- All 12 schedule sheets compared: 27 changed fields after aligning existing rows, three new business rows, no business-row deletions. Most physical cell differences were row shifts. All Demob business values remain unchanged, which leaves some Build/Demob inconsistencies.
- All 11 Baseplan sheets compared: 320 to 295 numbered contract lines, including Returned and Applied lines. 287 retained (73 changed; 214 unchanged), eight added and 33 absent. Source rows were matched by contract and line number, not worksheet position.
- Quantity consolidations and contract splits conserve the affected toilet and barrier totals. A lower source-row count is not an equipment decrease. Several new source delivery confirmations already match native records.
- Retained customer Rate 1, Price, branch sales-analysis codes and supplier codes are unchanged. Supplier cost notes are unchanged. Added lines, bundle relationships, changed dates and absent lines require individual reconciliation; no net financial adjustment is asserted by this review.
- Material follow-up includes a revised barrier install date, added equipment demand, differing generator/building size descriptions, loading times that conflict with existing departure instructions, a reused VMS fleet/serial on conflicting contract periods, and cable parent/child lines that must not be counted twice.
- New fleet numbers in planned source rows are not confirmed site identities. Existing actual arrivals, user placement instructions, native evidence, requested-size pricing and the 25 October generator commercial off-hire rule retain precedence.

The private comparison register supplies the exact references, dates, quantities, rates where relevant, cell citations, live evidence and proposed dispositions. No private original or commercial register is committed here.

## Handover and validation

Root owns the reconciliation review. Two independent scoped reviewers read the schedule and Baseplan originals. Root checked the combined implications against the fresh live snapshot; Baseplan reviewer independently checked material live/source conflicts. Receiving agents must read the originals before applying updates, as required by AGENTS.md.

Private artifacts:

- `/workspace/output/GC500_Schedule_and_Baseplan_Review_12Oct2026.xlsx` — nine-tab user comparison register.
- `/workspace/private-gc500-source1006/schedule-review.json` — full aligned schedule findings.
- `/workspace/private-gc500-source1006/baseplan-review.json` — full contract-line comparison and live reconciliation.
- `/workspace/private-gc500-source1006/create_review.py` — reproducible private register builder.
- `/workspace/private-gc500-source1006/artifact-validation.json` — file hash and checks.

Validation rechecks all four original file hashes; reconciles 320 + 8 - 33 = 295; verifies the conserved quantities, 27 schedule field changes, three new rows, eight added and 33 absent contract lines; reopens the deliverable; checks all nine sheets, source author, filters, frozen headings and absence of executable formulas. The workbook includes 197 permitted operational/contractual field differences across the 73 changed lines. Tests and review performed no service writes.

Any later source refresh must start from the latest live page, preserve native state, reconcile replacements and source joins, and verify shared schedule, inventory, generator, branch and financial projections. The prior importer is pinned to the old source hash and 320-line schema; do not bypass its guard and import this 295-line export blindly. This review is not a READY TO UPLOAD application release.
