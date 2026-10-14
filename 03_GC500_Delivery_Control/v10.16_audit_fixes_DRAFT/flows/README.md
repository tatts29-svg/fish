# Reference links and drawer history

Author: Andrew Fisher

The read-only v10.15 audit confirmed two navigation errors:

1. A fresh link to a reference held only in the shared record was rejected before the record arrived. The reference existed after synchronisation, but its requested address had already been replaced by Equipment.
2. Background map rendering could replace an open reference address with a sheet address and add history entries. A reload lost the requested reference, and later redraws added extra Back steps.

`patch_flows1016.apply(html)` adds a bounded route guard. Missing references retain their requested address until the complete shared record is available. The native route handler then opens the reference or rejects a genuinely unknown reference. Navigation elsewhere cancels the pending request. A slow or failed connection retains a small waiting status; recovery retries only the still-requested link.

Map rendering cannot replace the address owned by an open matching reference drawer. Closing the drawer and deliberate navigation continue through the native controls. No map layout, site records or pricing calculations change.

`check_routes1016.cjs` exercises current-record cold links, deliberately delayed and failed reads, recovery, cancellation by newer navigation, invalid links, embedded references, background map updates and browser Back. Its injected delay exists only in a private test copy; the shared read-only harness blocks every operational write.

Root owns the combined v10.16 source guard, final build, release checks and publication. This component is not a standalone release. Private current-record evidence and screenshots remain outside Git.

Component checks: 25/25 initial browser regressions and four exact-source/repeat/dependency guards pass. The combined v10.16 candidate passes 29/29 browser checks, including pending shared-only reference A followed by explicit reference B before the shared records arrive. No runtime errors or operational writes. Sanitized combined results are in `evidence/combined-routes.json`; the root release audit covers the remaining components. The phone reference drawer was visually inspected.
