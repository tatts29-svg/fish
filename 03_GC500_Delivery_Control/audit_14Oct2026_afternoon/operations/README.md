Author: Andrew Fisher

Operational audit of live v10.15, 14 Oct 2026, using GET-only browser reads.

54 focused checks covered current site entries, supplier day runs, typed quantities,
map completion, current asset search, duplicate identity and displayed percentages.
The baseline passed 51 checks and confirmed three faults:

1. The global finder omitted current numbered contents held as accessories.
2. A previously reviewed VMS move was reflected in the VMS board allocation but
   remained active at its original reference in general physical-unit readers.
3. Two known supplier requests were in Build and supplier runs but absent from
   Today's requested scope and completion denominator.

The search and Today-scope modules in the v10.16 draft address findings 1 and 3.
The shared VMS projection is assigned separately to the navigation owner; the root
release integrates and verifies all fixes together.

Verified recent records: the six reported Event Portables locations retain exactly
the 24 confirmed numbered units, supplier ownership, and item installation counts.
The daily Build receipts match the supplier receipts; remaining daily runs are
24, 24 and 4. A mixed reference correctly retains its outstanding accessible toilet
while showing the six delivered portaloos installed. The removed incorrect number
does not appear as an active unit or search match. The received fridge batch and
subhired refrigerated container remain complete. The fridge move and replacement
are saved at their correct current references; their search omission is finding 1.

Primary quantities agree between Inventory and the map after excluding explicitly
source-linked aliases. Unconfirmed generator numbers are deliberately excluded from
confirmed-asset search and were not treated as missing-search bugs. Percentages
match their included quantities; finding 3 corrects the missing scope, not rounding.

Exact fencing geometry and source-only toilet positions remain evidence gaps, not
permission to invent locations. No native record was changed by the audit. Private
runtime outputs are stored outside the repository.
