Author: Andrew Fisher

Today previously counted only references in the native asset register. The shared
supplier delivery model also carries two explicit, one-unit toilet requests from
the reviewed source schedule that are not yet assigned native references. Build
and the supplier run sheets included them, but Today omitted them.

The adapter reads those unresolved source requests from the existing supplier
model and includes their known quantities in Today's requested scope. Actual
receipts and completion remain unchanged. The on-site plan uses the same proposed
delivery date as the current supplier run. No exact location or map pin is inferred.

The supplier model's existing request resolver remains authoritative. When a source
request is explicitly allocated to an existing reference, its source-only row drops
out and the adapter stops adding it. It is not counted twice.

Integration: call `patch_quantities1016.apply(html)` from the root release patch.
This module owns the Today metrics adapter and one known-request date fallback in
the summary's plan reader. The root patch owns exact-base and version guards.

Validation: 11 pure checks and 15 GET-only browser checks passed against the saved
native record, including quantity propagation from the shared supplier source and
explicit reference allocation without duplicate scope. Read-only fixtures restore
the original source, contracts and native state. Detailed results remain private;
root integration records the final candidate checks. No charges or native records
are changed by this patch.
