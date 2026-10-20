# Current supplier hire and cost completeness — DRAFT

Author: Andrew Fisher.

This draft applies established supplier hire rates to confirmed received quantities,
removes explicitly excluded quote-only scope from current supplier costs, and keeps the
original quotations available for comparison. Received hire is counted once; only an
uncovered required quantity remains forecast. Existing servicing quantities and supplier
service rates, customer charges, branches, operational records and invoice/payment
evidence remain unchanged.

Routine supplier cards show a concise rate-completion label, current cost and remaining
forecast. The existing More info component contains the source basis and exclusions.
Recorded rates do not establish a final invoice, payment or completed future service.

The release also integrates bounded, separately tested helpers for current team details
from an approved private build input and for quantity-only inventory becoming fully
identified. That identity helper retains the historical quantity record; partial,
duplicate, wrong-owner and wrong-type coverage retain their warnings. It does not write
unit records.

The exact verified predecessor must be v10.93. Its hash is not bound yet, so the main
patch intentionally refuses a normal build. The private practice page is a structural
test only and is not a verified predecessor or release candidate.

Source checks so far: hire projection and completeness synthetic suites pass; a
read-only private practice run produces the expected current supplier amount and all
ledger reconciliation checks pass. Independent review found and prompted regression
coverage for partial receipt, scoped additional-hire coverage, malformed source data
and documentary wording. Full frozen-record financial deltas, desktop/phone checks,
integrated helper checks, both standard sweeps, exact predecessor binding and guarded
publication/read-back remain required.

Private source documents, native snapshots, financial reconciliation and the current-team
input stay outside GitHub. Production publication and any separately authorised native
unit assignment remain with the coordinating release owner. This is not READY TO UPLOAD.

Run the pure suites:

```sh
node test_hire1094.cjs /private/verified-predecessor.html
node test_status1094.cjs
python test_quantity_identity1094.py /private/verified-predecessor.html
GC500_CURRENT_TEAM_INPUT1094=/private/approved-input.json \
  python test_current_team1094.py /private/verified-predecessor.html
```

Run `test_browser1094.cjs` against the exact predecessor and candidate with the shared
read-only harness, an external frozen fixture directory, and both screen sizes. The
result records expected supplier-only deltas and proves customer Revenue, original
quotes, native records and invoice/payment evidence are unchanged.
