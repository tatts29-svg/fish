# Current supplier hire and cost completeness — LIVE

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

Uploaded 21 Oct 2026 01:39:31 AEST (20 Oct 2026 15:39:31.332 UTC) using the guarded
release process, from source `c586e95cd3f9e752ceed817545ba131bfc1da9c0`.
The public view serves the exact tested page hash recorded below.

The release also integrates bounded, separately tested helpers for current team details
from an approved private build input and for quantity-only inventory becoming fully
identified. That identity helper retains the historical quantity record; partial,
duplicate, wrong-owner and wrong-type coverage retain their warnings. It does not write
unit records.

The exact verified predecessor is v10.93
`e07f45f9a9309e7cb5d20f59cb17b13222bbd9ed64285f163280457f8139e4b2`.
The shared toolchain produced the live page
`5f79b5f6c4ce953c3e69f7dfac939734f7176130808ec608715e8c23faf8cc79`
(18,619,329 bytes). All 148 inline scripts parse. Nine source/build checks prove exact
reproduction, predecessor guards, unchanged original DATA and unchanged servicing/tracker
script bytes. Earlier private practice pages are structural tests only.

Source checks: 32 hire, 17 completeness, 26 identity, 14 team and 9 exact-patch checks pass
on the verified predecessor. Focused financial checks pass on the final candidate and
frozen current record at both desktop and phone sizes, including the expected supplier-only
deltas and all ledger reconciliation checks. Both integrated team browser checks pass.
The native identity rehearsal passes all 11 invariants, including full financial-model
parity and no server writes; its verifier passes 12 mutation/guard checks. Phone supplier
and team screenshots were visually inspected. A second source review prompted regression
coverage for partial receipt, scoped additional-hire coverage, malformed source data and
documentary wording; its final review reports no remaining finding.

Both standard sweeps and one unchanged retry each reach all 25 tabs and 7 deep links with
zero page exceptions, no record writes and the expected navigation. Their console checks
are **not clean**: Google tile requests return intermittent HTTP 503 responses. The retry
has two such responses on desktop and one on phone. A prior focused phone attempt also
recorded resource 503s and passed unchanged on retry; the exact endpoint of that earlier
attempt was not captured. Raw failed attempts remain in private evidence. Native API
reads and the focused financial tests are healthy. `validation.json` records the exact
receipts and targeted predecessor comparison, without hiding the tile-service failures.
The exact verified v10.93 predecessor also returned a Google 3D tile HTTP 503 on its
satellite route, with zero page exceptions or native writes. The coordinating release
owner accepts this existing external map-loading limitation for the otherwise verified
supplier/team release; the next release owns map behavior. This is a documented
exception to the sweep console criterion, not a clean-sweep claim.

Private source documents, native snapshots, financial reconciliation and the current-team
input stay outside GitHub. The coordinating release owner completed the guarded upload
and separately authorised identifier operation: 18 successful record writes, version
10263 → 10281, with exact read-back and unchanged financial models.

An actual-public financial probe verifies the live page hash before and after reading
the current service record. Supplier costs, customer Revenue, source quotations and
ledger reconciliation match the tested candidate. It uses no local page or API fixture,
attempts no record writes and reports zero page exceptions. `validation.json` carries
the public-safe receipt; the existing tile-service exception above remains explicit.

Run the pure suites:

```sh
node test_hire1094.cjs /private/verified-predecessor.html
node test_status1094.cjs
python test_quantity_identity1094.py /private/verified-predecessor.html
python test_current_team1094.py /private/verified-predecessor.html \
  /private/approved-input.json /private/team-source-results
GC500_CURRENT_TEAM_INPUT1094=/private/approved-input.json \
  python test_patch_v1094.py /private/verified-predecessor.html /private/candidate.html
```

Run `test_browser1094.cjs` against the exact predecessor and candidate with the shared
read-only harness, an external frozen fixture directory, and both screen sizes. The
result records expected supplier-only deltas and proves customer Revenue, original
quotes, native records and invoice/payment evidence are unchanged.
