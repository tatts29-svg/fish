# Fencing, water barriers and Trakmat quantity recheck

Author: Andrew Fisher · 14 Oct 2026 · Codex audit · native version 6075 · live v10.16

Read-only audit of actual public responses. No substituted page, no record writes, no quantities or map points changed. Source live HTML SHA256: `3cbfd0d5c9bd53f02d5a89b274e83ee0c2d2c8dc17b03da59b68cf3a3db8673c`. Private outputs are in `/workspace/private-gc500-recheck14Oct2026/fencing/`; they contain commercial trace data and must not be committed.

## Confirmed issue: repeat water-barrier placements presented as new supply

The inventory model and its Ordered drill show **375 TL2 ordered, 76 on site, 299 still to come** across 15 WB references. WB19 contributes 34 and WB20 contributes 30. Both have no relocation flag, so the physical inventory filter includes them. The existing water-barrier source explicitly says these references put back the equipment previously delivered for WB02 and WB03. The Ordered drill nevertheless says “WB19 34 ordered” and “WB20 30 ordered”. Printed inventory uses the same values.

This mixes repeat-placement quantities with physical supply. The 64 units still represent work that must happen, but must be identified as repeat placements in procurement/physical inventory. Do not delete either workfront, remove its schedule tasks, or change the 76 currently confirmed onsite. Do not replace 375 with the source-schedule peak 265: peak simultaneous deployment is a different measure. A correction should classify the known repeat operations and keep quantities, dates and workfront navigation connected to that classification.

Relevant live functions: `inventory()` (line 16273), `inv83Pages()` (line 16622), `invDrillHtml()` (line 16917), `barrierPeak()` (line 13202). `read_barrier_views.cjs` reproduces the model and rendered drill text. The independent check explicitly confirms this defect is reproduced; its passing status does not imply the defect was fixed.

## Static source-schedule limitation

`barrierPeak()`, `barrierNotice()` and `barriersCard()` use embedded `DATA.barriers.on_hire` / `totals`, not current quantity/date edits. That is valid as an explicitly dated source comparison, but wording such as “what the schedule actually puts on the ground” can be mistaken for the current operational projection. Keep the historical comparison labelled as source evidence, and calculate any current stock/forecast from current movements. No live quantity edit was made to test this; the dependency is established by source inspection.

## Current quantities checked

| Type | Recorded | Programme scope | Unit |
| --- | ---: | ---: | --- |
| Clean fence | 7,660 | 8,222.5 | work metres |
| Braced for scrim | 1,507.5 | 4,394.5 | work metres |
| Vehicle gates | 0 | 135 | programme openings |
| Pedestrian gates | 8 | 34 | each |
| Event CCB | 755 confirmed | 2,163 | metres |
| Demarcation CCB | 3,180 confirmed | 5,205 | metres |
| Relocation | 370 | 989 | work metres |
| Removal | 227.5 | 1,133 | work metres |
| Flat-feet CCB | 42 | 256 | metres |
| Fence blocks | 216 | No programme denominator | each |
| Red-book labour column | 0 | No programme denominator | hours |
| CCB awaiting Event/Demarcation classification | 10 | Allocation remains open | metres |
| Scrim applied to existing fence | 150 | Separate activity | metres |

These are work quantities, not a total of unique standing fence. Red-book labour zero is not the total labour performed: green-book service hours are separate. Vehicle-gate zero does not mean there are no wheels or gate work: **68 supplier units over 17 matched dockets** have no confirmed conversion into programme gate openings. A further 7 supplier units over two dockets differ from the signed wheel quantities. The app keeps these distinctions explicit.

The overview's 13,752 / 22,363 work metres = 61.4944% is a provisional mixed-work completion measure. It includes recorded relocation/removal activity because that is its stated scope; it must not be relabelled installed stock. The 10 unclassified CCB metres remain one shared quantity and are not added once to each CCB category. Reinstatement 24456 (32.5 m) and existing-fence scrim 24473 (150 m) are kept separate from new mesh hire.

Water barriers: WB01=12, WB02=34, WB03=30, WB04=14, WB05=13, WB06=154, WB07=17, WB13=10, WB14=2, WB15=4, WB16=13, WB17=6, WB18=2, WB19=34, WB20=30. WB01/02/03 are complete, 76 units combined. The other 12 workfronts are incomplete. T0025 Trakmat is complete, 20 mats. All 16 map-status quantities agree with their current charge-line quantity; none requires invented asset numbers.

## Components and known evidence gaps

Gross written component activity: 3,064 panels; 4,658 feet/blocks; 4,725 clamps; 802 braces; 145 wheels; 1,578 CCBs; 19 flat-feet CCBs. These are not a certified unique onsite stock balance. Six collection papers separately record 145 panels, 163 bases, 161 clamps and 5 braces. No unproved net-stock subtraction or new rental charge was inferred.

There are 96 red records; 94 have an eligible dated programme/compound scope. The undated workbook row remains separate; 36511 is off programme. Component arithmetic uses 93 numbered eligible papers; it also excludes the unnumbered dated scope record. No duplicate numbered red docket was found. The previously corrected 36592 remains 137.5 m clean / 55 panels, 53 bases and 53 clamps.

Existing component source gaps remain visible: six records lack an applicable base count, four lack clamps, two lack braces. This is not a zero quantity. In particular, 36568's brace reading remains unresolved; 36529's eight reused bases are not new stock. Dockets 36516 and 36550 retain their original wheel counts, not converted supplier billing units. These are existing source issues, not new software defects.

## P/O, programme and map chain

The prior private 33-paper P/O reconciliation was rechecked against current native identities, dates and locations: **33/33 unchanged matches**. Existing reviewed forecast-task associations remain **8/8 matched**. The earlier source review identifies another seven explicit task-scope associations, giving 15 source-supported scopes; 17 records still lack an unambiguous older-task/original-docket area chain, with one additional indirect reviewed-area link. These figures describe scope evidence, not missing matches to the new actual dated programme. All 33 papers already match that actual programme. This pass checked current identities against the prior matrix; it does not claim a fresh visual re-reading of all original pages.

Current fencing trace validates 66 record-to-area links and 32 area anchors. The map agent independently checked 127 accepted geometry objects (95 source drawings/annotations plus those 32 anchors), with no rejected geometry. They are source/area geometry, not verified exact installed runs. No completed-section geometry is proved by the current source set.

For WB references, 12 have representative master-plan area anchors; WB01/05/06 remain unplaced in the exact master point set and use described destinations. T0025 uses an area-level location and a report-point navigation fallback. These must not be promoted to surveyed drop points. Existing drawing/schedule disagreements (261/286/293 drawing totals, source schedule peak 265, WB04/13 quantities and unresolved zone ownership/classification) were preserved.

## Validation

`check_snapshot.py`: **60 checks pass**, covering independent dated-docket sums, green-note work metres, separate component/collection totals, percentage arithmetic, source-link states, WB/Trakmat map/reference consistency and the explicit repeat-placement defect reproduction. Two actual-public captures returned zero script errors and zero operational non-GET attempts; all browsers were closed. These tests verify current application consistency within the stated source scopes; they cannot certify undecided source facts.
