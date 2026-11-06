# Shared financial allocation — v10.13

Author: Andrew Fisher.

One current P65 and P66 building is charged once against its current Baseplan line. The superseded source lines for cancelled P47/P53 no longer add hire or leave a second forecast. The confirmed Royal Wolf container at T0266 joins existing contract 9974042 line 2 and its one-unit share of existing transport. No supplier cost or container transport is added.

Four confirmed T0265 fridges have no coverage in the latest original Baseplan. Their current card rate is 46.8350064 per unit once for the event: $187.34 for four, with transport Included. This shared supplemental hire follows recorded rate, receipt and branch changes and is absorbed by later matched contract quantities. Unknown aggregate coverage remains held. Collection affects current stock, not historical received charges.

The source adds one replacement P46 fridge on contract 9968862 line 132, $46.84. Existing fridge lines 96/102 receive the original source's physical numbers, allowing current recorded P51/P54 placements to resolve without an additional hire. Raw embedded DATA.rental_on_hire.rows and ONHIRE.rows are preserved. ONHIRE_ROWS is the effective derived projection: it includes that additional line and identity evidence. The startup projection invalidates shared reader caches and retains original source metadata; it does not write native records or import prebill.

The fixed native 6052 comparison changes recorded customer Revenue by -$1,191.89 and the whole-job forecast by -$2,617.96. These are -$1,426.07 / -$2,852.14 for the building reconciliation, plus $187.34 fridge card hire and $46.84 replacement fridge hire. Onsite priced coverage increases $2,428 by linking already-counted container hire and transport. Supplier Direct costs and global transport charges are unchanged.

T0266's applicable install, levelling, cleaning and demob rates remain for review: the supplied sources do not price them. No labour amount or Included status is invented. Existing unrelated unpriced allocations remain visible. These checks establish scoped arithmetic and data propagation; they do not certify missing inputs as complete prices.

Validation: `node test_finance1013.cjs`; paired `check_finance1013.cjs` and isolated `check_propagation1013.cjs` use frozen STATE/PAGE fixtures, the existing GET-only harness and `/tmp/gc500-browser.lock`. No calls to native Save or operational writes. Full private records are not included in the release evidence.
