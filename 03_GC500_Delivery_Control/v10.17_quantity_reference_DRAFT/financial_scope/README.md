Author: Andrew Fisher

# Planned quantity and received hire

The quantity audit reproduced three related defects after an existing completed scope was enlarged:

- WC09's older FWF contract allocation followed the new planned quantity, charging units that had not arrived.
- Its received Event Portables hire moved into the Coates Hire ledger because ownership required the entire new plan to be physically identified.
- An inherited whole-location work tick expanded to new planned units in the central labour ledger. The drawer's charged quantity also retained the planned/source quantity beside a corrected actual charge.

The bounded correction applies only to explicit `Scope1017` quantity revisions. One unambiguous whole-event contract linked to one active reference/item is valued at the live existing rate: received quantity is actual; the unreceived remainder is forecast. Current values remain identical when no quantity revision exists. The shared forecast feeds Costs, P&L, branches and supplier summaries once. Physical installation, supplier Direct costs, original receipts and source rows remain separate.

The existing atomic quantity snapshot also retains the confirmed pre-edit supplier and the number of uniquely identified units supporting it. An explicit named contract supplier wins; partial/conflicting identity evidence cannot infer a new supplier for the whole received scope. It retains the actual manually selected stairs scope across later receipts and repeated planning; stairs are not automatically selected on new units. The rate itself is never snapshotted and remains editable.

Daily hire, generators and ambiguous source allocations are excluded from this whole-event extension. Their existing date-sensitive models and explicit allocation holds remain authoritative. A new generator quantity cannot use an old unit's arrival as a newly confirmed arrival.

Integration: `patch_financial_scope1017.apply(html)` after the quantity scope and sync components. No native migration or live-record write.

Validation in progress against the final combined candidate. The preceding focused run passed 53 checks and the independent source/formula review passed six fixtures. Final evidence and unchanged-record financial parity are required before release. Raw results and all monetary values remain in private audit storage.

```bash
NODE_PATH=/path/to/node_modules CHROMIUM_PATH=/usr/bin/chromium \
PAGE=/private/final-candidate.html OUT=/private/financial-scope-results.json \
node check_financial_scope1017.cjs
```
