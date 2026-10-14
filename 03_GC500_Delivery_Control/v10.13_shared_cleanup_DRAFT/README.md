# Shared data, costs and page flow — v10.13

Author: Andrew Fisher

Status: **READY TO UPLOAD — candidate checks complete; actual-public verification follows publication**. Start from the exact live v10.12 page, SHA256 `cde0aae30d5e528e85c2b16189bf0c0828397b87a7b3d10c1695362b19a58105`.

Andrew's request is to clean up data, costs and information while keeping the existing presentation. Information entered onsite must drive every view. Explanatory text must be generated from the current records or clearly retained as dated source evidence under More info. The system should be suitable for future V8s work, with straightforward entry and reliable Save, scrolling, open/close, Back and tab navigation.

## Ownership

- Root: integration, original-source reconciliation, final checks, publication and shared handover.
- `finance/`: one source-backed hire allocation per confirmed building; verified refrigerated-container linkage; replacement-fridge source line and bounded card estimate for four received fridges; accurate included-transport treatment and visible unresolved allocations.
- `flows/`: preserve open sections, scroll and draft input through refreshes, photo changes and tab transitions.
- `information/`: generated partial-delivery status, truthful date-only arrival displays and concise current information with historical explanations folded away.
- `event_config/`: one validated event-date boundary for customer charges, supplier coverage, workforce dates and demob planning, with present-event parity and future-date fixtures.
- `review/`: independent evidence and regression coverage.

No test may write to the live operational record. Confirmed site quantities, asset numbers, locations, dates, photos, ownership and agreed rate values are preserved. Correcting a pricing projection is separate from adding supplier invoices or inventing missing inputs. Historical contract data remains traceable. A new event still needs its own approved source data, maps, rates and commercial terms; date configuration alone is not a complete new-event setup.

## Required release checks

Reproduce each fixed issue; test relevant native entry and Save flows without network writes; prove unchanged native/source records; reconcile changed financial totals against independently expected effects; exercise quantity, rate and event-date changes; run final desktop and phone route/deep-link/Back sweeps; inspect phone presentation; verify the actual public page after guarded upload. Record unresolved source or pricing inputs separately from software failures.

The final handover will name the exact source commit, built/public hashes, live time, checks and remaining work. The shared GitHub coordination thread records the active scope; STATUS.md remains the ownership board.

## Financial changes

The latest original Baseplan workbook and recorded physical identities establish the following corrections. This is a narrow reconciliation, not a wholesale import of the workbook's dates or locations.

- P65 and P66: current contract lines replace retired source lines for the same confirmed physical buildings. Old lines remain traceable; their duplicate charge is excluded.
- T0266: Royal Wolf container 920584 is linked to its existing contract line. Its hire and allocated delivery/pickup are displayed at the reference without adding a second charge. The supplier estimate stays separate from an actual supplier invoice.
- P46/P54/P51: source-backed fridge identities follow their confirmed current placements. Moving the existing fridge adds no charge. The verified replacement line is included once.
- T0265: four identified, received fridges have no coverage in the latest original contract lines. Their current card estimate enters the shared ledger once, at source precision; later matching contract quantities consume that estimate. Ambiguous coverage remains a visible hold. Furniture transport marked Included is not charged again.

Original embedded source data and operational records remain intact. Effective contract projections explicitly retain source provenance for the added line and identity corrections. Revenue, Direct costs, recorded arrivals and forecast amounts retain their separate meanings.


## Remaining source inputs

This release fixes proved allocation and interaction defects. It does not certify that every commercial input has been supplied. On the frozen native record 6052, the arrived-equipment model still reports 54 charge holds across 34 groups, including missing transport amounts, work rates and unresolved source allocation. Some workforce hours are also unrecorded. These counts are evidence for that snapshot, not a current operational dashboard; the page generates its current holds from the shared record.

T0266 has evidenced customer hire and transport, but no applicable evidenced work/labour rate. That scope remains explicitly unpriced. Do not fabricate a building labour rate, a supplier invoice, a hire period or future worked hours to clear a hold. The new event-date configuration covers the connected financial/workforce/demob consumers; a later reusable event setup must also supply approved maps, rates, source documents and the remaining event-specific presentation settings.

## Candidate verification — 14 Oct 2026

Production source commit `81cf4ce7`; exact candidate SHA256 `ab5fe3dc666b68b3b9ec27a731ff3edad06ba0fa3db4da3910ecbc11b9184143`, 15,197,894 bytes and 107 parsed inline scripts. The source manifest and combined evidence are in `evidence/`.

- Final combined financial reconciliation 24, propagation 32, interaction 22, information 15, loading Save 38 and drawer Save 80 checks pass.
- Desktop and phone each pass 22 routes, seven deep links and Back navigation with zero page/console errors. Phone presentation was inspected.
- Source preservation/wrong-base/repeat guards: 10. Independent final integration checks: 25. Component tests, current-event numeric parity, 182 active item quantities and 120 physical ownership groups are recorded in their folders.
- The initial drawer practice failure was a late view-level capability response in the test. Consistent permissions from first navigation resolve it; all original assertions remain and eight permission checks were added. Application source was unchanged; the read-only adapter did not falsely show Saved.
- No tests write to the operational service. Actual-public verification uses the served page and verifies its exact hash, without local page substitution.

Root implemented/integrated/released with scoped independent source, finance and interaction reviews. This is not an external Claude audit.
