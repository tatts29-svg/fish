# Onsite charge review — v10.06

Author: Andrew Fisher. Reviewed 13 October 2026.

Received equipment includes applicable customer Install, Level, Demob and Clean charges automatically from the existing card mapping. Future equipment remains forecast. Stairs remain manual, including partial quantities and previously removed stairs. Recorded manual charges and automatic inclusion are combined once. Included/absent card entries do not become new separate charges. Supplier Direct costs, physical completion and invoice state are unchanged.

The reference package, Costs labour detail, shared financial summary, P&L and branch rollups use the same charge quantities. Event-month Finance rows use those quantities and remain review items; including a charge does not record future demob or cleaning as completed. Missing rates or quantities remain visible holds.

GN20 retains its historical $166.56 installation charge. Under the latest instruction to include applicable demob for onsite equipment, demob is $166.56 using the existing equal allocation of the $333.12 315 kVA Labour basis. This does not assert that the original card explicitly described a combined installation/demob rate or that the earlier install-only instruction approved demob.

Validation: 13 pure calculation checks and 43 phone browser checks passed against a freshly read shared record; zero JavaScript errors, zero writes, native state restored unchanged after dynamic in-memory tests. Included labour on that record was $64,323.58 across 185 reference charge lines. Financial totals/branches reconciled. Dynamic receipt, stairs quantity/exclusion, no duplicate units, GN20 actual-to-forecast and physical-completion separation checks passed. Private browser snapshots remain outside Git. Root performs final integrated release checks with transport/profile modules.

No live deployment or operational-record writes were performed by this subtask.
